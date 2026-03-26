"use client";

import ReactMarkdown from "react-markdown";
import LoadingQuote from "./LoadingQuote";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold self-end mb-0.5">
          AC
        </div>
      )}
      <div
        className={[
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-foreground text-background"
            : "rounded-bl-sm bg-card text-foreground border border-border",
        ].join(" ")}
        style={{ wordBreak: "break-word" }}
      >
        {isUser ? (
          content
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
            [&_p]:my-1
            [&_ul]:my-1 [&_ul]:pl-4 [&_ul]:list-disc
            [&_ol]:my-1 [&_ol]:pl-4 [&_ol]:list-decimal
            [&_li]:my-0.5
            [&_strong]:font-semibold
            [&_code]:rounded [&_code]:bg-border [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono
            [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2
            [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2
            [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && !content && <LoadingQuote />}
      </div>
    </div>
  );
}
