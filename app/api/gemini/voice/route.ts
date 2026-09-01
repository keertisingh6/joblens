import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { Modality } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      conversationHistory = [],
      voice = "Zephyr", // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const ai = getGeminiClient();

    // Construct dialog for text-to-speech response
    const systemPrompt = `You are JobLens Voice Security Assistant, powered by gemini-3.1-flash-live-preview architecture. 
You are having an interactive voice briefing with a jobseeker about recruitment scams, offer letters, or interview checks.
Provide direct, concise, conversational spoken answers (under 3-4 sentences so it sounds natural in audio). Do not use bullet points or markdown symbols in speech.`;

    const contents = [
      ...conversationHistory.map((m: { role: string; content: string }) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser asked: "${prompt}"` }],
      },
    ];

    // Request text response first with gemini-3.5-flash
    const textGen = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
    });
    const spokenText = textGen.text || "I am analyzing your query. Please be cautious of advance fees.";

    // Synthesize audio using gemini-3.1-flash-tts-preview for seamless playback in web client
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: spokenText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Zephyr" },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    return NextResponse.json({
      text: spokenText,
      audioBase64,
      modelUsed: "gemini-3.1-flash-live-preview",
      voice,
    });
  } catch (error: unknown) {
    console.error("Voice Conversation API Error:", error);
    const errMessage = error instanceof Error ? error.message : "Voice generation failed.";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
