import { NextRequest, NextResponse } from "next/server";
import { runThreatAnalysis } from "@/lib/security/rule-engine";
import type { JobInputForm } from "@/lib/security/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Support various formats sent from extension or web client
    const formData: JobInputForm = {
      jobTitle: body.jobTitle || body.title || "",
      companyName: body.companyName || body.company || "Unspecified Entity",
      recruiterEmail: body.recruiterEmail || body.email || "",
      applicationUrl: body.applicationUrl || body.url || "",
      jobDescription: body.jobDescription || body.description || body.content || body.selectedText || "",
      emailHeaders: body.emailHeaders || body.headers || ""
    };

    // If description is empty but other fields exist, assemble a readable context
    if (!formData.jobDescription.trim()) {
      formData.jobDescription = [
        formData.jobTitle ? `Job Title: ${formData.jobTitle}` : "",
        formData.companyName ? `Company: ${formData.companyName}` : "",
        formData.recruiterEmail ? `Contact Email: ${formData.recruiterEmail}` : "",
        formData.applicationUrl ? `Link: ${formData.applicationUrl}` : ""
      ].filter(Boolean).join("\n");
    }

    const report = runThreatAnalysis(formData);

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
      version: "2.0.0-extension"
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  } catch (error) {
    console.error("Threat analysis API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform recruitment threat analysis",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
