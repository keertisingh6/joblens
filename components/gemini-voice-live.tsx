"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Radio,
  Loader2,
  PhoneCall,
  PhoneOff,
  Activity,
} from "lucide-react";

interface VoiceTurn {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

const VOICES = [
  { id: "Zephyr", label: "Zephyr (Balanced Analyst)" },
  { id: "Puck", label: "Puck (Energetic Investigator)" },
  { id: "Charon", label: "Charon (Calm & Authoritative)" },
  { id: "Kore", label: "Kore (Protective & Empathetic)" },
  { id: "Fenrir", label: "Fenrir (Sharp & Direct)" },
];

export function GeminiVoiceLive() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [transcript, setTranscript] = useState<VoiceTurn[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Ready to start real-time briefing session.");

  const recognitionRef = useRef<unknown>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBase64Audio = async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM little-endian or standard audio buffer
      try {
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsSpeaking(false);
          setStatusText("Live briefing ready for next question.");
        };
        source.start();
      } catch {
        // Direct PCM reconstruction fallback
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }

        const buffer = audioCtx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsSpeaking(false);
          setStatusText("Live briefing ready for next question.");
        };
        source.start();
      }
    } catch (e) {
      console.warn("Audio playback error:", e);
      setIsSpeaking(false);
    }
  };

  const handleProcessSpokenInput = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    setStatusText("Analyzing voice transcript with Live API...");

    const userTurn: VoiceTurn = {
      role: "user",
      text: userInput,
      timestamp: new Date().toISOString(),
    };

    setTranscript((prev) => [...prev, userTurn]);
    setInputText("");

    try {
      const res = await fetch("/api/gemini/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userInput,
          conversationHistory: transcript.slice(-6),
          voice: selectedVoice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Voice generation failed.");
      }

      const modelTurn: VoiceTurn = {
        role: "model",
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      setTranscript((prev) => [...prev, modelTurn]);

      if (data.audioBase64) {
        setStatusText(`Playing live response (${selectedVoice} voice)...`);
        await playBase64Audio(data.audioBase64);
      } else {
        setStatusText("Response received (audio unavailable in this browser session).");
      }
    } catch (err: unknown) {
      console.error("Live API voice interaction error:", err);
      const errMsg = err instanceof Error ? err.message : "Error processing voice request";
      setStatusText(`Voice error: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, selectedVoice]);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition;

      if (SpeechRecognition) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognition as any)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          if (spoken) {
            handleProcessSpokenInput(spoken);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (err: any) => {
          console.warn("Speech recognition note:", err);
          setIsListening(false);
          setStatusText("Microphone input ended. Tap mic or type to speak.");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any).abort?.();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [handleProcessSpokenInput]);

  const handleStartSession = () => {
    setIsSessionActive(true);
    setStatusText("Session connected to Live API (gemini-3.1-flash-live-preview). Tap mic or speak.");
    if (transcript.length === 0) {
      setTranscript([
        {
          role: "model",
          text: `Hello! I am your JobLens live voice security assistant. Ask me anything about job offers, recruiter verification, or salary red flags.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop?.();
    }
    setStatusText("Live briefing session ended.");
  };

  const toggleMic = () => {
    if (!isSessionActive) {
      handleStartSession();
    }

    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any)?.stop?.();
      setIsListening(false);
      setStatusText("Listening paused.");
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any)?.start?.();
        setIsListening(true);
        setStatusText("Listening for your voice inquiry...");
      } catch (err) {
        console.warn("Mic start error:", err);
        setStatusText("Mic permissions required. You can also type your question below.");
      }
    }
  };

  return (
    <div className="bg-[#0a0f1d] border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Top Bar / Model Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              isSessionActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Live Voice Security Briefing</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                gemini-3.1-flash-live-preview
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive voice conversation powered by the Gemini Live API architecture.
            </p>
          </div>
        </div>

        {/* Voice Selector & Call Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={isSessionActive && isSpeaking}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>

          {isSessionActive ? (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all shadow-md shadow-emerald-950/40"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Start Live Briefing</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Wave / Status Stage */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#070b16] to-[#040812] border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[160px] text-center overflow-hidden">
        {/* Animated Rings when active */}
        {isSessionActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className={`w-32 h-32 rounded-full border border-sky-500 ${isSpeaking ? "animate-ping" : ""}`} />
            <div className={`w-48 h-48 rounded-full border border-emerald-500 ${isListening ? "animate-pulse" : ""}`} />
          </div>
        )}

        {/* Central Interaction Button */}
        <button
          onClick={toggleMic}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            !isSessionActive
              ? "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
              : isSpeaking
              ? "bg-sky-500 border-2 border-sky-300 text-slate-950 shadow-sky-500/50 scale-105"
              : isListening
              ? "bg-emerald-500 border-2 border-emerald-300 text-slate-950 shadow-emerald-500/50 scale-105 animate-bounce"
              : "bg-slate-900 border border-sky-500/40 text-sky-400 hover:bg-sky-950"
          }`}
          title={isListening ? "Mute Microphone" : "Speak to Gemini"}
        >
          {isProcessing ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-7 h-7 animate-pulse" />
          ) : isListening ? (
            <Mic className="w-7 h-7" />
          ) : (
            <MicOff className="w-7 h-7" />
          )}
        </button>

        <div className="mt-3 relative z-10">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white">
            {isSpeaking && <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />}
            <span>
              {isSpeaking
                ? `Gemini is speaking with ${selectedVoice} voice...`
                : isListening
                ? "Listening... Speak your question now"
                : isProcessing
                ? "Analyzing with Gemini Live API..."
                : isSessionActive
                ? "Tap mic to speak or enter question below"
                : "Tap 'Start Live Briefing' or the Mic to connect"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{statusText}</p>
        </div>
      </div>

      {/* Transcript Log Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-medium">Live Dialogue Transcript</span>
          <span>{transcript.length} turns</span>
        </div>

        <div className="max-h-[160px] overflow-y-auto space-y-2 p-3 bg-[#070b16] rounded-xl border border-slate-800/80 text-xs">
          {transcript.length === 0 ? (
            <p className="text-slate-400 text-center py-4 italic text-[11px]">
              No voice dialogue yet. Start the session and ask about any recruitment fraud scenario.
            </p>
          ) : (
            transcript.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg ${
                  t.role === "user"
                    ? "bg-slate-900 border border-slate-800 text-sky-300 ml-4"
                    : "bg-sky-950/40 border border-sky-500/20 text-slate-200 mr-4"
                }`}
              >
                <div className="text-[10px] font-mono opacity-60 mb-0.5">
                  {t.role === "user" ? "Candidate" : `Gemini Live (${selectedVoice})`}
                </div>
                <div>{t.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fallback Text Submission if no mic available */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputText.trim()) {
            if (!isSessionActive) setIsSessionActive(true);
            handleProcessSpokenInput(inputText);
          }
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Or type a spoken inquiry (e.g. 'Is an upfront laptop deposit ever legitimate?')..."
          className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors border border-slate-700"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
