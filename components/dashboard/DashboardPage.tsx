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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

// Simple SVG line chart built from path data
function NetWorthChart({ data }: { data: { net_worth: number | string; snapshot_date: string }[] }) {
  if (data.length === 0) return null;
  
  const values = data.map((d) => Number(d.net_worth));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 400;
  const H = 150;
  const pad = 10;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (Number(d.net_worth) - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M ${points.join(" L ")} L ${W - pad},${H} L ${pad},${H} Z`;

  return (
    <div className="w-full aspect-video overflow-hidden rounded-lg p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" className="text-foreground" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" className="text-foreground" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} stroke="currentColor" className="text-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
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

  const currentNetWorth = data.netWorthHistory.length > 0 
    ? Number(data.netWorthHistory[data.netWorthHistory.length - 1].net_worth) 
    : 0;

  let netWorthChange = 0;
  if (data.netWorthHistory.length > 1) {
    const previous = Number(data.netWorthHistory[data.netWorthHistory.length - 2].net_worth);
    if (previous > 0) {
      netWorthChange = Math.round(((currentNetWorth - previous) / previous) * 100);
    }
  }

  const chartLabels = data.netWorthHistory.map(d => {
    const date = new Date(d.snapshot_date);
    return date.toLocaleString('default', { month: 'short' }).toUpperCase();
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

  function handleDeleteGoal(id: string) {
    haptic.light();
    setGoalToDelete(id);
  }

  function handleUpdateGoal(id: string, updates: { name?: string; current_amount?: number; target_amount?: number }) {
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

  return (
    <div className="transition-opacity">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">AlloCat</h1>
        <Link
          href="/profile"
          className="flex items-center justify-center size-10 rounded-full bg-muted text-foreground"
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
        </Link>
      </header>

      {/* Budget Card */}
      <section className="px-4 mb-6">
        <div className="bg-card rounded-xl p-6 border border-border relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Total Budget
          </p>
          <div className="flex gap-2 mb-4">
            <h2 className="text-4xl font-bold tabular-nums tracking-tight text-foreground inline-flex">
              {data.budget ? (
                <InlineEditableNumber
                  value={data.budget.totalBudget}
                  onSave={handleUpdateBudget}
                  formatAsCurrency={true}
                />
              ) : (
                formatCurrency(0)
              )}
            </h2>
          </div>
          {data.budget && (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {formatCurrency(data.budget.spent)} spent
                </span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {formatCurrency(data.budget.remaining)} left
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${data.budget.spent > data.budget.totalBudget && data.budget.totalBudget > 0 ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${data.budget.totalBudget > 0 ? Math.min(100, Math.round((data.budget.spent / data.budget.totalBudget) * 100)) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {data.budget.totalBudget > 0 ? Math.round((data.budget.spent / data.budget.totalBudget) * 100) : 0}%
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Log Spend */}
      {data.budget && (
        <QuickSpendInput categories={data.categories} />
      )}

      {/* Net Worth Growth */}
      <section className="px-4 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Net Worth Growth
            </h3>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatCurrency(currentNetWorth)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold tabular-nums ${netWorthChange >= 0 ? 'text-foreground' : 'text-red-400'}`}>
              {netWorthChange > 0 ? '+' : ''}{netWorthChange}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Last 6 Months</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl border border-border">
          {data.netWorthHistory.length > 1 ? (
            <NetWorthChart data={data.netWorthHistory} />
          ) : (
             <div className="w-full aspect-video flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
               Needs more data
             </div>
          )}
        </div>
        {/* X labels */}
        <div className="flex justify-between px-2 mt-2">
          {chartLabels.slice(0, 5).map((m, idx) => (
            <span key={idx} className="text-[10px] text-muted-foreground font-medium">{m}</span>
          ))}
        </div>
      </section>

      {/* Financial Goals */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Financial Goals
          </h3>
          <button
            onClick={() => {
              haptic.light();
              setShowAddGoal(true);
            }}
            className="text-[11px] font-bold text-foreground flex items-center gap-1 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            NEW GOAL
          </button>
        </div>

        <div className="space-y-3">
          {data.goals.length === 0 && !showAddGoal ? (
            <div className="p-4 border border-border rounded-xl bg-card text-center text-xs tracking-widest uppercase text-muted-foreground">
              No active goals
            </div>
          ) : data.goals.map((goal) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            return (
              <div
                key={goal.id}
                className="group p-4 border border-border rounded-xl bg-card relative"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPickerGoalId(goal.id)}
                      className="text-xl grayscale shrink-0 hover:scale-110 transition-transform"
                      title="Set Goal Icon"
                    >
                      {goal.icon || '🎯'}
                    </button>
                    <span className="text-sm font-semibold text-foreground truncate">
                      <InlineEditableText 
                        value={goal.name} 
                        onSave={(val) => handleUpdateGoal(goal.id, { name: val })} 
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-foreground bg-muted px-2 py-0.5 rounded flex gap-1">
                      <InlineEditableNumber 
                        value={current} 
                        onSave={(val) => handleUpdateGoal(goal.id, { current_amount: val })} 
                        className="text-foreground"
                      />
                      <span className="opacity-50 text-muted-foreground">/</span>
                      <InlineEditableNumber 
                        value={target} 
                        onSave={(val) => handleUpdateGoal(goal.id, { target_amount: val })} 
                      />
                    </span>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity translate-x-1"
                      title="Delete Goal"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {showAddGoal && (
            <div className="p-4 bg-card border border-border rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-foreground">New Tracking Goal</h4>
              <input
                type="text"
                placeholder="Goal Name (e.g. Vacation Fund)"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                min="0"
                placeholder="Target Amount (₹)"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95"
                >
                  Save Goal
                </button>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2 bg-muted text-foreground text-xs font-medium uppercase tracking-widest rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

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
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
