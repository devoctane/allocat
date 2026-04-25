"use client";

import { MaterialSymbol } from "@/components/ui/MaterialSymbol";
import type { ActivityLogRow } from "@/lib/db";

function categoryIcon(category: ActivityLogRow["category"]) {
  switch (category) {
    case "budget":
      return "receipt_long";
    case "net_worth":
      return "account_balance";
    case "goals":
      return "flag";
    case "debts":
      return "credit_card";
  }
}

function categoryLabel(category: ActivityLogRow["category"]) {
  switch (category) {
    case "budget":
      return "Budget";
    case "net_worth":
      return "Net Worth";
    case "goals":
      return "Goals";
    case "debts":
      return "Debts";
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface ActivityLogItemProps {
  log: ActivityLogRow;
  onClick: () => void;
}

export default function ActivityLogItem({ log, onClick }: ActivityLogItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card/50 border border-border hover:bg-muted transition-colors active:scale-[0.99] text-left"
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <MaterialSymbol
          icon={categoryIcon(log.category)}
          size={20}
          className="text-muted-foreground"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug truncate">
          {log.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {categoryLabel(log.category)} · {formatTime(log.created_at)}
        </p>
      </div>

      <MaterialSymbol
        icon="chevron_right"
        size={20}
        className="shrink-0 text-muted-foreground"
      />
    </button>
  );
}
