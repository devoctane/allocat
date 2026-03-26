"use client";

const SUGGESTED_PROMPTS = [
  "How is my budget looking this month? 📊",
  "Which category am I overspending in?",
  "How close am I to my savings goals? 🎯",
  "What's my current net worth?",
  "Summarise my debts and suggest a payoff priority.",
  "Where can I cut spending this month?",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="px-4 pb-2">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold">
          AC
        </div>
        <p className="text-base font-semibold text-foreground">Hey! I&apos;m AlloCat 👋</p>
        <p className="mt-1 text-sm text-(--muted-foreground,#666)">
          Your personal finance buddy. Ask me anything about your money!
        </p>
      </div>

      <p className="mb-2 text-xs font-medium text-(--muted-foreground,#888) uppercase tracking-wide">
        Suggested questions
      </p>
      <div className="flex flex-col gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors active:bg-border hover:bg-border"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
