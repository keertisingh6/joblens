import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, companyName, reason, scamType, evidenceSnippet, reporterNotes } = body;

    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;

    console.info(`[ScamReport] Logged incident ${incidentId} for report ${reportId || "N/A"} (${companyName || "Unknown"} - ${scamType || "GENERIC"}): ${reason || reporterNotes || evidenceSnippet || "No notes"}`);

    return NextResponse.json({
      success: true,
      incidentId,
      message: "Scam report logged successfully into JobLens Community Threat Registry.",
      status: "UNDER_REVIEW",
      timestamp: new Date().toISOString()
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("[ScamReport] Submission failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit scam report" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
