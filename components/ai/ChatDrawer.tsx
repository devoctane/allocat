"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Drawer } from "vaul";
import PawLogo from "./PawLogo";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setIsStreaming(true);

      const assistantIdx = nextMessages.length;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to AlloCat AI.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[assistantIdx] = { role: "assistant", content: accumulated };
                  return updated;
                });
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = {
            role: "assistant",
            content: "Oops, something went wrong. Try again in a sec! 🙈",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  return (
    <Drawer.Root open={open} onClose={handleClose} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background outline-none"
          style={{ height: "92dvh" }}
          aria-label="AlloCat AI Chat"
        >
          {/* Drag handle */}
          <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-border" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <PawLogo size={32} className="h-8 w-8" />
              <div>
                <Drawer.Title className="text-sm font-semibold text-foreground">
                  AlloCat AI
                </Drawer.Title>
                <p className="text-xs text-(--muted-foreground,#888)">
                  {isStreaming ? "Typing…" : "Your finance buddy"}
                </p>
              </div>
            </div>
            <button
              id="ai-chat-close"
              onClick={handleClose}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card active:bg-border"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 no-scrollbar">
            {messages.length === 0 ? (
              <SuggestedPrompts onSelect={(p) => sendMessage(p)} />
            ) : (
              messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={
                    isStreaming && i === messages.length - 1 && msg.role === "assistant"
                  }
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            disabled={isStreaming}
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
