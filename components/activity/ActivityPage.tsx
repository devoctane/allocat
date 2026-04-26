"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/MaterialSymbol";
import ActivityLogItem from "./ActivityLogItem";
import ActivityDetailSheet from "./ActivityDetailSheet";
import {
  useActivityLogs,
  groupLogsByDate,
  type ActivityFilter,
  type SelectedMonth,
} from "@/lib/hooks/useActivityLogs";
import type { ActivityLogRow } from "@/lib/db";

type CategoryChip = ActivityFilter["category"];

const CATEGORY_CHIPS: { label: string; value: CategoryChip }[] = [
  { label: "All", value: "all" },
  { label: "Budget", value: "budget" },
  { label: "Net Worth", value: "net_worth" },
  { label: "Goals", value: "goals" },
  { label: "Debts", value: "debts" },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(m: SelectedMonth) {
  return `${MONTH_NAMES[m.month]} ${m.year}`;
}

function monthKey(m: SelectedMonth) {
  return `${m.year}-${m.month}`;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

interface ActivityPageProps {
  overrideLogs?: ActivityLogRow[];
}

export default function ActivityPage({ overrideLogs }: ActivityPageProps) {
  const [filter, setFilter] = useState<ActivityFilter>({
    category: "all",
    selectedMonth: null,
  });
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);

  const { data: fetchedLogs, isLoading, availableMonths } = useActivityLogs(filter);
  const logs = overrideLogs ?? fetchedLogs;
  const groups = groupLogsByDate(logs);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-4">
        <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
          <MaterialSymbol icon="arrow_back" size={24} />
        </Link>
        <div>
          <h1 className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
            Activity
          </h1>
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground mt-0.5">
            Action History
          </p>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-2">
        <div id="activity-category-chips" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              active={filter.category === chip.value}
              onClick={() =>
                setFilter((f) => ({ ...f, category: chip.value }))
              }
            />
          ))}
        </div>

        {availableMonths.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Chip
              label="All Time"
              active={filter.selectedMonth === null}
              onClick={() => setFilter((f) => ({ ...f, selectedMonth: null }))}
            />
            {availableMonths.map((m) => (
              <Chip
                key={monthKey(m)}
                label={monthLabel(m)}
                active={
                  filter.selectedMonth !== null &&
                  monthKey(filter.selectedMonth) === monthKey(m)
                }
                onClick={() =>
                  setFilter((f) => ({ ...f, selectedMonth: m }))
                }
              />
            ))}
          </div>
        )}
      </div>

      <div id="activity-log-list" className="px-5 pt-6 pb-32 space-y-6">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[68px] bg-muted/50 animate-pulse rounded"
              />
            ))}
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MaterialSymbol
              icon="history"
              size={48}
              className="text-muted-foreground mb-4"
            />
            <p className="font-bold text-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Actions you take will appear here
            </p>
          </div>
        )}

        {groups.map(({ label, items }, gi) => (
          <div key={label} id={gi === 0 ? "activity-first-group" : undefined}>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {label}
            </p>
            <div className="space-y-1">
              {items.map((log, li) => (
                <div key={log.id} id={gi === 0 && li === 0 ? "activity-first-item" : undefined}>
                  <ActivityLogItem
                    log={log}
                    onClick={() => setSelectedLog(log)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ActivityDetailSheet
        log={selectedLog}
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
