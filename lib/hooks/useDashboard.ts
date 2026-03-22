import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/actions/dashboard";
import {
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalIcon,
} from "@/lib/actions/goals";
import { updateBudgetTotal, getCategoryItems, quickLogSpend } from "@/lib/actions/budget";

export const DASHBOARD_KEY = ["dashboard"] as const;

export function useDashboardData() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => getDashboardData(),
  });
}

export function useUpdateBudgetTotal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, totalAmount }: { budgetId: string; totalAmount: number }) =>
      updateBudgetTotal(budgetId, totalAmount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, targetAmount }: { name: string; targetAmount: number }) =>
      addGoal(name, targetAmount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; current_amount?: number; target_amount?: number };
    }) => updateGoal(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateGoalIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, icon }: { id: string; icon: string }) =>
      updateGoalIcon(id, icon),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Fetches budget items for a given category — used by the Quick Spend item dropdown.
 * Only runs when categoryId is provided.
 */
export function useCategoryItems(categoryId: string | null) {
  return useQuery({
    queryKey: ["categoryItems", categoryId],
    queryFn: () => getCategoryItems(categoryId!),
    enabled: !!categoryId,
    staleTime: 30_000,
  });
}

/**
 * Mutation to log a quick spend against an existing budget item.
 * Invalidates dashboard and budget caches on success.
 */
export function useQuickLogSpend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, amount }: { itemId: string; amount: number }) =>
      quickLogSpend(itemId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["categoryItems"] });
    },
  });
}
