// Pure utility — no "use server" needed, safe to import from both client and server

export type FinanceTopic = "budget" | "goals" | "networth" | "debts" | "all";

export function detectTopic(message: string): FinanceTopic[] {
  const m = message.toLowerCase();
  const topics: FinanceTopic[] = [];

  if (/budget|spend|spent|categor|allocat|item|expense|left|remaining|month/.test(m))
    topics.push("budget");
  if (/goal|saving|target|progress|emergency|vacation/.test(m))
    topics.push("goals");
  if (/net worth|asset|wealth|property|investment|liquid/.test(m))
    topics.push("networth");
  if (/debt|loan|owe|borrow|interest|payoff|liability|repay/.test(m))
    topics.push("debts");

  if (topics.length === 0) topics.push("all");

  return topics;
}
