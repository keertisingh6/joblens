"use client";

import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const replies = [
  "I compared your cover, claims history, and renewal windows. The highest confidence action is bundling motor before August 1.",
  "Your health cover is already optimized. Savings should come from motor behaviour and travel timing, not reduced medical limits.",
  "I can prepare a claim packet checklist with the exact documents most likely to speed up approval."
];

export function AssistantPanel() {
  const messages = useAppStore((state) => state.assistantMessages);
  const addAssistantMessage = useAppStore((state) => state.addAssistantMessage);
  const addAssistantReply = useAppStore((state) => state.addAssistantReply);
  const [value, setValue] = useState("");

  function submit() {
    if (!value.trim()) return;
    addAssistantMessage(value.trim());
    const reply = replies[Math.floor(Math.random() * replies.length)];
    window.setTimeout(() => addAssistantReply(reply), 350);
    setValue("");
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Aurora AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {["Lower my premium", "Track a claim", "Find cover gaps"].map((prompt) => (
            <Button key={prompt} variant="secondary" size="sm" onClick={() => setValue(prompt)}>
              <Sparkles className="h-4 w-4" />
              {prompt}
            </Button>
          ))}
        </div>
        <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-lg p-3 text-sm", message.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted")}
            >
              <p>{message.content}</p>
              <p className={cn("mt-2 text-xs", message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>{message.createdAt}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ask about claims, coverage, renewals, or savings..."
            className="min-h-12"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <Button className="h-12 w-12 shrink-0" size="icon" onClick={submit} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
