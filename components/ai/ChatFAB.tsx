"use client";

interface ChatFABProps {
  onClick: () => void;
}

export default function ChatFAB({ onClick }: ChatFABProps) {
  return (
    <button
      id="allocat-ai-fab"
      onClick={onClick}
      aria-label="Open AlloCat AI"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95 hover:scale-105"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
    >
      <span className="text-base font-bold tracking-tight select-none" style={{ fontFamily: "Inter, sans-serif" }}>
        AC
      </span>
      <span className="absolute inset-0 rounded-full animate-ping bg-foreground opacity-20 pointer-events-none" />
    </button>
  );
}
