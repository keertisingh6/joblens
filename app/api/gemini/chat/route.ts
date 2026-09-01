import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { GenerateContentParameters } from "@google/genai";

interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
}

const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  investigator: `You are the Lead Cybersecurity Forensics Investigator at JobLens.
Your role is to deeply analyze recruitment correspondence, job offers, recruiter domains, communication logs, and suspicious interview messages.
You provide objective, evidence-based threat analyses, expose advance-fee schemes, identify phishing lookalikes, calculate risk factors, and recommend immediate defensive steps.
Tone: Professional, calm, authoritative, forensic, and empathetic to jobseekers.`,

  legal_advocate: `You are the Jobseeker Legal & Compliance Advisor at JobLens.
Your role is to guide jobseekers on employment rights, fake employment agreement clauses, cyber extortion threats, intellectual property theft during 'unpaid assignments', and data privacy violations.
Tone: Clear, protective, informative, structured, and actionable.`,

  fast_screener: `You are the JobLens Quick Threat Screener.
Your role is to instantly flag high-risk scam triggers, spoofed emails, and upfront deposit demands in 2-3 concise bullet points.
Tone: Ultra-fast, sharp, direct, no-nonsense.`,
};

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      persona = "investigator",
      complexity = "standard", // "fast" | "standard" | "complex"
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "A non-empty messages array is required." },
        { status: 400 }
      );
    }

    // Model selection based on user requirements:
    // gemini-3.1-pro-preview for complex tasks
    // gemini-3.5-flash for general tasks
    // gemini-3.1-flash-lite for tasks that should happen fast
    let selectedModel = "gemini-3.5-flash";
    if (complexity === "complex" || persona === "legal_advocate") {
      selectedModel = "gemini-3.1-pro-preview";
    } else if (complexity === "fast" || persona === "fast_screener") {
      selectedModel = "gemini-3.1-flash-lite";
    }

    const ai = getGeminiClient();
    const systemInstruction = SYSTEM_INSTRUCTIONS[persona] || SYSTEM_INSTRUCTIONS.investigator;

    // Convert multi-turn history to Gemini SDK format
    const contents = messages.map((m: ChatMessage) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const config: GenerateContentParameters["config"] = {
      systemInstruction,
      temperature: 0.7,
    };

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = response.text || "No response generated from security engine.";

    return NextResponse.json({
      text: replyText,
      modelUsed: selectedModel,
      persona,
    });
  } catch (error: unknown) {
    console.error("Gemini Chat API Error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal AI processing error";
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
