import type { QueryClient } from "@tanstack/react-query";
import { getDashboardFromIDB } from "@/lib/hooks/useDashboard";
import { getBudgetFromIDB, budgetKey } from "@/lib/hooks/useBudget";
import { getNetWorthFromIDB } from "@/lib/hooks/useNetWorth";
import { getDebtFromIDB } from "@/lib/hooks/useDebt";
import { getDashboardData } from "@/lib/actions/dashboard";
import { getBudgetForPeriod } from "@/lib/actions/budget";
import { getNetWorthData } from "@/lib/actions/net-worth";
import { getDebtData } from "@/lib/actions/debt";
import { DASHBOARD_KEY } from "@/lib/hooks/useDashboard";
import { NET_WORTH_KEY } from "@/lib/hooks/useNetWorth";
import { DEBT_KEY } from "@/lib/hooks/useDebt";

/**
 * Warms the React Query in-memory cache for all main page queries
 * immediately after IDB hydration is complete.
 *
 * Each queryFn mirrors the hook's queryFn exactly — reads from IDB first,
 * falls back to the server only if IDB is empty (e.g. truly first launch).
 *
 * Since staleTime is Infinity globally, these cached results will be served
 * instantly when the user navigates to each tab — no skeleton loaders.
 */
export async function prefetchAllQueries(qc: QueryClient): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await Promise.all([
    // Dashboard
    qc.prefetchQuery({
      queryKey: DASHBOARD_KEY,
      queryFn: async () => {
        const local = await getDashboardFromIDB();
        if (local.budget !== null || local.goals.length > 0) return local;
        return getDashboardData();
      },
    }),

    // Budget (current month)
    qc.prefetchQuery({
      queryKey: budgetKey(month, year),
      queryFn: async () => {
        const local = await getBudgetFromIDB(month, year);
        if (local) return local;
        return getBudgetForPeriod(month, year);
      },
    }),

    // Net Worth
    qc.prefetchQuery({
      queryKey: NET_WORTH_KEY,
      queryFn: async () => {
        const local = await getNetWorthFromIDB();
        if (local) return local;
        return getNetWorthData();
      },
    }),

    // Debt
    qc.prefetchQuery({
      queryKey: DEBT_KEY,
      queryFn: async () => {
        const local = await getDebtFromIDB();
        if (local) return local;
        return getDebtData();
      },
    }),
  ]);
}
