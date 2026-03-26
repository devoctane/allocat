"use server";

import { createClient } from "@/lib/supabase/server";
import type { FinanceTopic } from "@/lib/ai-utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// ── Budget: categories + every item inside each category ─────────────────────

export async function getBudgetContext(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleString("en-IN", { month: "long" });

  const { data: budget } = await supabase
    .from("budgets")
    .select("*, categories(*, budget_items(*))")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (!budget) return `Budget (${monthName} ${year}): Not set yet.`;

  const total = Number(budget.total_budget || 0);
  let totalSpent = 0;
  const categoryBlocks: string[] = [];

  for (const cat of budget.categories ?? []) {
    const items = cat.budget_items ?? [];

    const catAllocated = items.reduce(
      (s: number, i: { planned_amount: number }) => s + Number(i.planned_amount || 0), 0
    );
    const catSpent = items.reduce(
      (s: number, i: { actual_amount: number }) => s + Number(i.actual_amount || 0), 0
    );
    totalSpent += catSpent;

    const overFlag = catSpent > catAllocated ? " [OVER BUDGET]" : "";
    const header = `  [${cat.type.toUpperCase()}] ${cat.name}: ${fmt(catAllocated)} allocated, ${fmt(catSpent)} spent${overFlag}`;

    // Individual items inside this category
    const itemLines = items.length === 0
      ? ["    - (no items)"]
      : items.map((i: { name: string; planned_amount: number; actual_amount: number; is_completed: boolean }) => {
          const remaining = Number(i.planned_amount) - Number(i.actual_amount);
          const status = i.is_completed ? " ✓" : remaining < 0 ? " [OVER]" : "";
          return `    - ${i.name}: planned ${fmt(Number(i.planned_amount))}, spent ${fmt(Number(i.actual_amount))}, remaining ${fmt(remaining)}${status}`;
        });

    categoryBlocks.push([header, ...itemLines].join("\n"));
  }

  const remaining = total - totalSpent;

  return [
    `=== BUDGET — ${monthName} ${year} ===`,
    `Total Budget: ${fmt(total)}`,
    `Total Spent:  ${fmt(totalSpent)}`,
    `Remaining:    ${fmt(remaining)}${remaining < 0 ? " [OVERSPENT]" : ""}`,
    `Budget Locked: ${budget.is_locked ? "Yes" : "No"}`,
    "",
    "Categories & Items:",
    ...categoryBlocks,
  ].join("\n");
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoalsContext(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  if (!goals || goals.length === 0) return "=== GOALS ===\nNone set yet.";

  const lines = goals.map((g) => {
    const current = Number(g.current_amount);
    const target = Number(g.target_amount);
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    const gap = target - current;
    return `  - ${g.name}: ${fmt(current)} saved of ${fmt(target)} (${pct}% complete, ${fmt(gap)} remaining)`;
  });

  return ["=== GOALS ===", ...lines].join("\n");
}

// ── Net Worth: assets + net worth history ─────────────────────────────────────

export async function getNetWorthContext(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const [{ data: assets }, { data: snapshots }] = await Promise.all([
    supabase.from("assets").select("*").eq("user_id", user.id).order("category"),
    supabase
      .from("net_worth_snapshots")
      .select("net_worth, total_assets, total_liabilities, snapshot_date")
      .eq("user_id", user.id)
      .order("snapshot_date", { ascending: false })
      .limit(6),
  ]);

  const totalAssets = (assets ?? []).reduce((s, a) => s + Number(a.value || 0), 0);

  const assetLines = (assets ?? []).length === 0
    ? ["  (no assets recorded)"]
    : (assets ?? []).map((a) => `  - ${a.name} [${a.category}]: ${fmt(Number(a.value))}`);

  const historyLines = (snapshots ?? []).length === 0
    ? ["  (no history yet)"]
    : (snapshots ?? []).map(
        (s) =>
          `  - ${s.snapshot_date}: Net Worth ${fmt(Number(s.net_worth))} (Assets ${fmt(Number(s.total_assets))}, Liabilities ${fmt(Number(s.total_liabilities))})`
      );

  const currentNetWorth = snapshots?.[0]
    ? Number(snapshots[0].net_worth)
    : totalAssets;

  return [
    "=== NET WORTH ===",
    `Current Net Worth: ${fmt(currentNetWorth)}`,
    `Total Assets: ${fmt(totalAssets)}`,
    "",
    "Assets:",
    ...assetLines,
    "",
    "Net Worth History (last 6 snapshots):",
    ...historyLines,
  ].join("\n");
}

// ── Debts: active + closed ────────────────────────────────────────────────────

export async function getDebtsContext(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("is_closed")
    .order("created_at");

  const active = (debts ?? []).filter((d) => !d.is_closed);
  const closed = (debts ?? []).filter((d) => d.is_closed);

  const fmtDebt = (d: {
    name: string; type: string; principal: number; total_paid: number;
    interest_rate: number; monthly_minimum: number; expected_payoff_date: string | null;
  }) => {
    const remaining = Number(d.principal) - Number(d.total_paid);
    const pct = Number(d.principal) > 0
      ? Math.round((Number(d.total_paid) / Number(d.principal)) * 100)
      : 0;
    return [
      `  - ${d.name} [${d.type}]`,
      `    Principal: ${fmt(Number(d.principal))} | Paid: ${fmt(Number(d.total_paid))} | Remaining: ${fmt(remaining)} (${pct}% paid)`,
      `    Interest: ${d.interest_rate}% | Monthly minimum: ${fmt(Number(d.monthly_minimum))}`,
      d.expected_payoff_date ? `    Expected payoff: ${d.expected_payoff_date}` : "",
    ].filter(Boolean).join("\n");
  };

  const activeLines = active.length === 0 ? ["  (none)"] : active.map(fmtDebt);
  const closedLines = closed.length === 0 ? ["  (none)"] : closed.map(fmtDebt);

  return [
    "=== DEBTS ===",
    "Active Debts:",
    ...activeLines,
    "",
    "Closed/Paid Debts:",
    ...closedLines,
  ].join("\n");
}

// ── Reports: locked monthly summaries ────────────────────────────────────────

export async function getReportsContext(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: reports } = await supabase
    .from("reports")
    .select("month, year, notes, summary_data")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(3);

  if (!reports || reports.length === 0) return "=== PAST REPORTS ===\nNo locked months yet.";

  const lines = reports.map((r) => {
    const label = `${r.year}-${String(r.month).padStart(2, "0")}`;
    return `  - ${label}: ${r.notes ? `Notes: "${r.notes}"` : "(no notes)"}`;
  });

  return ["=== PAST REPORTS (last 3 locked months) ===", ...lines].join("\n");
}

// ── Assemble only the requested sections ──────────────────────────────────────

export async function buildFinancialContext(topics: FinanceTopic[]): Promise<string> {
  const all = topics.includes("all");
  const inc = (t: FinanceTopic) => all || topics.includes(t);

  const [budget, goals, networth, debts, reports] = await Promise.all([
    inc("budget")   ? getBudgetContext()   : Promise.resolve(null),
    inc("goals")    ? getGoalsContext()    : Promise.resolve(null),
    inc("networth") ? getNetWorthContext() : Promise.resolve(null),
    inc("debts")    ? getDebtsContext()    : Promise.resolve(null),
    all             ? getReportsContext()  : Promise.resolve(null),
  ]);

  return [budget, goals, networth, debts, reports]
    .filter(Boolean)
    .join("\n\n");
}
