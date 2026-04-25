"use client";

import Link from "next/link";
import { useState } from "react";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import QuickSpendInput from "@/components/dashboard/QuickSpendInput";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";
import {
  useAddGoal,
  useUpdateGoal,
  useDeleteGoal,
  useUpdateGoalIcon,
  useUpdateBudgetTotal,
} from "@/lib/hooks/useDashboard";

interface DashboardProps {
  data: {
    budget: { id: string; totalBudget: number; spent: number; remaining: number } | null;
    categories: { id: string; name: string; icon?: string | null }[];
    goals: { id: string; name: string; icon?: string | null; current_amount: number | string; target_amount: number | string }[];
    netWorthHistory: { net_worth: number | string; snapshot_date: string }[];
  };
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtFull(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function NetWorthChart({ data }: { data: { net_worth: number | string; snapshot_date: string }[] }) {
  if (data.length < 2) return null;

  const values = data.map((d) => Number(d.net_worth));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 400;
  const H = 120;
  const pad = 8;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (Number(d.net_worth) - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M ${points.join(" L ")} L ${W - pad},${H} L ${pad},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage({ data }: DashboardProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "" });
  const [pickerGoalId, setPickerGoalId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const haptic = useHaptic();

  const addGoalMutation = useAddGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const updateGoalIconMutation = useUpdateGoalIcon();
  const updateBudgetMutation = useUpdateBudgetTotal();
  const budgetError =
    updateBudgetMutation.error instanceof Error
      ? updateBudgetMutation.error.message
      : "Couldn't update the total budget right now.";

  const currentNetWorth =
    data.netWorthHistory.length > 0
      ? Number(data.netWorthHistory[data.netWorthHistory.length - 1].net_worth)
      : 0;

  let netWorthChange = 0;
  if (data.netWorthHistory.length > 1) {
    const previous = Number(data.netWorthHistory[data.netWorthHistory.length - 2].net_worth);
    if (previous > 0) {
      netWorthChange = Math.round(((currentNetWorth - previous) / previous) * 100);
    }
  }

  const chartLabels = data.netWorthHistory.map((d) => {
    const date = new Date(d.snapshot_date);
    return date.toLocaleString("default", { month: "short" }).toUpperCase();
  });

  function handleAddGoal() {
    const target = parseFloat(newGoal.targetAmount);
    if (!newGoal.name.trim() || isNaN(target) || target <= 0) return;
    haptic.success();
    addGoalMutation.mutate(
      { name: newGoal.name.trim(), targetAmount: target },
      {
        onSuccess: () => {
          setNewGoal({ name: "", targetAmount: "" });
          setShowAddGoal(false);
        },
      }
    );
  }

  function handleUpdateGoal(
    id: string,
    updates: { name?: string; current_amount?: number; target_amount?: number }
  ) {
    updateGoalMutation.mutate({ id, updates });
  }

  function handleUpdateBudget(totalAmount: number) {
    if (data.budget) {
      updateBudgetMutation.mutate({ budgetId: data.budget.id, totalAmount });
    }
  }

  function handleUpdateGoalIcon(id: string, icon: string) {
    updateGoalIconMutation.mutate({ id, icon });
  }

  const budgetSpentPct =
    data.budget && data.budget.totalBudget > 0
      ? Math.min(100, Math.round((data.budget.spent / data.budget.totalBudget) * 100))
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="px-7 pt-14 pb-[18px] flex items-end justify-between">
        <div>
          <div className="font-display text-[32px] leading-none tracking-[-0.02em] text-foreground">
            Dashboard
          </div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mt-2">
            Financial Overview
          </div>
        </div>
        <div className="md:hidden">
          <Link
            href="/profile"
            className="size-[34px] rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
          </Link>
        </div>
      </div>

      {/* Hairline */}
      <div className="h-px bg-border mx-7" />

      <div className="md:grid md:grid-cols-[1fr_1.5fr] md:gap-x-0">
        {/* Left column */}
        <div className="md:border-r border-border">
          {/* Budget Summary */}
          <div className="px-7 py-6 border-b border-border">
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mb-3">
              Monthly Budget
            </div>
            <div className="font-display text-[48px] leading-[0.95] tracking-[-0.025em] text-foreground tabular-nums">
              {data.budget ? (
                <InlineEditableNumber
                  value={data.budget.totalBudget}
                  onSave={handleUpdateBudget}
                  className="font-display"
                />
              ) : (
                fmt(0)
              )}
            </div>
            {data.budget && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
                  <span>{fmt(data.budget.spent)} spent</span>
                  <span>{fmt(data.budget.remaining)} left</span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 30 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex-1"
                      style={{
                        height: 3,
                        background:
                          j / 30 < budgetSpentPct / 100
                            ? data.budget!.spent > data.budget!.totalBudget
                              ? "#ef4444"
                              : "var(--foreground)"
                            : "var(--progress-empty)",
                      }}
                    />
                  ))}
                </div>
                {updateBudgetMutation.isError && (
                  <p className="font-mono text-[10px] text-red-400">{budgetError}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Log */}
          {data.budget && (
            <div className="px-7 py-6 border-b border-border md:border-b-0">
              <QuickSpendInput categories={data.categories} />
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Net Worth */}
          <div className="px-7 py-6 border-b border-border">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mb-2">
                  Net Worth
                </div>
                <div className="font-display text-[36px] leading-none tracking-[-0.02em] text-foreground tabular-nums">
                  {fmtFull(currentNetWorth)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-mono text-[12px] tabular-nums"
                  style={{ color: netWorthChange >= 0 ? "var(--foreground)" : "#ef4444" }}
                >
                  {netWorthChange > 0 ? "+" : ""}{netWorthChange}%
                </div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground mt-0.5">
                  Last 6 mo
                </div>
              </div>
            </div>
            <div className="h-[80px] w-full">
              {data.netWorthHistory.length > 1 ? (
                <NetWorthChart data={data.netWorthHistory} />
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground">
                  Needs more data
                </div>
              )}
            </div>
            {chartLabels.length > 0 && (
              <div className="flex justify-between mt-1">
                {chartLabels.slice(0, 6).map((m, idx) => (
                  <span key={idx} className="font-mono text-[8px] text-muted-foreground">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Financial Goals */}
          <div className="px-7 py-6">
            <div className="flex items-baseline justify-between mb-5">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                Goals
              </div>
              <button
                onClick={() => { haptic.light(); setShowAddGoal(true); }}
                className="font-mono text-[10px] tracking-[0.14em] uppercase text-foreground underline underline-offset-4"
              >
                + new
              </button>
            </div>

            <div className="space-y-0">
              {data.goals.length === 0 && !showAddGoal ? (
                <div className="border border-border py-6 text-center font-mono text-[9px] tracking-[0.1em] uppercase text-muted-foreground">
                  No active goals
                </div>
              ) : (
                data.goals.map((goal, i) => {
                  const current = Number(goal.current_amount);
                  const target = Number(goal.target_amount);
                  const pct = target > 0 ? Math.min(1, current / target) : 0;
                  return (
                    <div
                      key={goal.id}
                      className="group py-4"
                      style={{
                        borderTop: i === 0 ? "1px solid var(--border)" : "none",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex justify-between items-baseline mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPickerGoalId(goal.id)}
                            className="text-lg grayscale shrink-0"
                          >
                            {goal.icon || "🎯"}
                          </button>
                          <span className="text-[15px] font-medium text-foreground truncate max-w-[160px]">
                            <InlineEditableText
                              value={goal.name}
                              onSave={(val) => handleUpdateGoal(goal.id, { name: val })}
                            />
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-foreground shrink-0 ml-2">
                          <InlineEditableNumber
                            value={current}
                            onSave={(val) => handleUpdateGoal(goal.id, { current_amount: val })}
                            className="font-mono"
                          />
                          <span style={{ color: "var(--dimmer)" }}>/</span>
                          <InlineEditableNumber
                            value={target}
                            onSave={(val) => handleUpdateGoal(goal.id, { target_amount: val })}
                            className="font-mono"
                          />
                          <button
                            onClick={() => { haptic.light(); setGoalToDelete(goal.id); }}
                            className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-[2px]">
                        {Array.from({ length: 20 }).map((_, j) => (
                          <div
                            key={j}
                            className="flex-1"
                            style={{
                              height: 2,
                              background: j / 20 < pct ? "var(--foreground)" : "var(--progress-empty)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {showAddGoal && (
                <div
                  className="py-4 space-y-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-foreground">
                    New Goal
                  </div>
                  <input
                    type="text"
                    placeholder="Goal name…"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Target amount (₹)"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full bg-background border border-border px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddGoal}
                      className="flex-1 py-2.5 border border-foreground font-mono text-[10px] tracking-[0.14em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-[0.98]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowAddGoal(false)}
                      className="flex-1 py-2.5 border border-border font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-28 md:h-8" />

      <EmojiPickerModal
        isOpen={pickerGoalId !== null}
        onClose={() => setPickerGoalId(null)}
        onSelect={(emoji) => {
          if (pickerGoalId) handleUpdateGoalIcon(pickerGoalId, emoji);
        }}
      />

      <ConfirmDrawer
        isOpen={goalToDelete !== null}
        onClose={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoalMutation.mutate(goalToDelete);
            setGoalToDelete(null);
          }
        }}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
