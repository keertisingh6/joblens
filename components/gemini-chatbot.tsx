"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  ShieldAlert,
  Scale,
  Zap,
  Loader2,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

type PersonaType = "investigator" | "legal_advocate" | "fast_screener";
type ComplexityType = "standard" | "complex" | "fast";

const PERSONAS: {
  id: PersonaType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  modelBadge: string;
  complexity: ComplexityType;
  description: string;
  tagline: string;
}[] = [
  {
    id: "investigator",
    name: "Lead Forensics Investigator",
    icon: ShieldAlert,
    modelBadge: "gemini-3.5-flash",
    complexity: "standard",
    description: "General deep forensic review of suspicious recruiter messages, URLs, and offers.",
    tagline: "Comprehensive Scam Breakdown",
  },
  {
    id: "legal_advocate",
    name: "Jobseeker Legal & Rights Advisor",
    icon: Scale,
    modelBadge: "gemini-3.1-pro-preview",
    complexity: "complex",
    description: "Complex reasoning on fraudulent contracts, unpaid assignment exploitation, and extortion.",
    tagline: "Advanced Rights Analysis",
  },
  {
    id: "fast_screener",
    name: "Rapid Threat Screener",
    icon: Zap,
    modelBadge: "gemini-3.1-flash-lite",
    complexity: "fast",
    description: "Ultra-fast triage to identify advance-fee red flags and dangerous links in seconds.",
    tagline: "Instant Heuristic Check",
  },
];

const PROMPT_SUGGESTIONS = [
  "Is it normal for a recruiter to ask for a ₹4,500 laptop insurance deposit?",
  "A recruiter texted me on WhatsApp offering $400/day for liking YouTube videos. Is this real?",
  "I received an offer letter with no interview, asking for my bank details for 'payroll pre-setup'. What should I do?",
  "How can I tell if an email from 'talent-amazon@recruitment-desk.net' is an imposter?",
];

export function GeminiChatbot() {
  const { user } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("investigator");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Sync with Firestore thread if authenticated
  useEffect(() => {
    if (!user) {
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: "welcome-init",
            role: "model",
            content: `Hello! I am your JobLens AI Forensics Assistant. 
            
You can paste suspicious job emails, WhatsApp/Telegram recruiter transcripts, offer letter clauses, or domain names here. I will evaluate them for advance-fee scams, recruiter impersonation, phishing domains, and high-pressure social engineering tactics.

Choose an investigative role above to tailor the depth and speed of the forensic breakdown.`,
            timestamp: new Date().toISOString(),
            modelUsed: "gemini-3.5-flash",
          },
        ];
      });
      return;
    }

    const threadRef = collection(db, "chatThreads");
    const q = query(
      threadRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            loaded.push({
              id: doc.id,
              role: d.role,
              content: d.content,
              timestamp: d.timestamp || new Date().toISOString(),
              modelUsed: d.modelUsed,
            });
          });
          setMessages(loaded);
        } else {
          setMessages((prev) => {
            if (prev.length > 0) return prev;
            return [
              {
                id: "welcome-init-auth",
                role: "model",
                content: `Welcome back, ${user.displayName || "Jobseeker"}! 

Your conversation history is securely synced with your profile. Paste any suspicious recruiter communication or offer letter clause to start a forensic breakdown.`,
                timestamp: new Date().toISOString(),
                modelUsed: "gemini-3.5-flash",
              },
            ];
          });
        }
      },
      (err) => {
        console.warn("Firestore chat subscription note:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    // Save to Firestore if user logged in
    if (user) {
      try {
        await addDoc(collection(db, "chatThreads"), {
          userId: user.uid,
          role: "user",
          content: text,
          persona: selectedPersona,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Firestore message save warning:", err);
      }
    }

    try {
      // Build API request
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: selectedPersona,
          complexity: currentPersona.complexity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to contact Gemini chat engine");
      }

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.text,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (user) {
        try {
          await addDoc(collection(db, "chatThreads"), {
            userId: user.uid,
            role: "model",
            content: data.text,
            persona: selectedPersona,
            modelUsed: data.modelUsed,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn("Firestore model message save warning:", err);
        }
      }
    } catch (err: unknown) {
      console.error("Chat sending error:", err);
      const errText = err instanceof Error ? err.message : "Error connecting to AI service.";
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        content: `⚠️ Forensic Assistant Note: Unable to complete query (${errText}). Please verify your network and try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: "model",
        content: `Thread cleared. Select a role above and submit any job posting or recruiter message for analysis.`,
        timestamp: new Date().toISOString(),
        modelUsed: currentPersona.modelBadge,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[640px] w-full bg-[#0a0f1d] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header with Persona Selection */}
      <div className="p-4 border-b border-slate-800/80 bg-[#070b16]/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Forensic Gemini Chat</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-400">
                  {currentPersona.modelBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentPersona.tagline}</p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Thread</span>
          </button>
        </div>

        {/* Role / Persona Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                  isSelected
                    ? "bg-sky-500/10 border-sky-500/40 text-white shadow-sm"
                    : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.modelBadge}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-none shadow-md shadow-sky-950/40"
                    : "bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-bl-none shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10 text-[10px] opacity-70">
                  <span>
                    {isUser ? "Candidate" : msg.modelUsed || currentPersona.modelBadge}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:opacity-100 transition-opacity p-0.5"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl rounded-bl-none p-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Analyzing against cyberthreat heuristics with {currentPersona.modelBadge}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries (Shown when fewer messages) */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 bg-[#080d1a] border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Suggested Forensic Inquiries</span>
          </div>
          <div className="flex gap-2 pb-1">
            {PROMPT_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-[11px] text-slate-300 hover:text-white transition-colors flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer Box */}
      <div className="p-3 bg-[#070b16] border-t border-slate-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask ${currentPersona.name} or paste suspicious text... (Enter to send)`}
            rows={2}
            className="flex-1 resize-none bg-slate-900/90 border border-slate-800 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-950/30"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
