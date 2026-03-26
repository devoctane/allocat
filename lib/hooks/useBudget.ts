import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgetForPeriod,
  addBudgetCategory,
  updateBudgetTotal,
  updateCategoryAllocation,
  updateCategoryIcon,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from "@/lib/actions/budget";
import { DASHBOARD_KEY } from "./useDashboard";

export function budgetKey(month: number, year: number) {
  return ["budget", month, year] as const;
}

export function useBudgetData(month: number, year: number) {
  return useQuery({
    queryKey: budgetKey(month, year),
    queryFn: () => getBudgetForPeriod(month, year),
  });
}

export function useUpdateBudgetTotal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      budgetId: string;
      totalAmount: number;
      month: number;
      year: number;
    }) => updateBudgetTotal(vars.budgetId, vars.totalAmount),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useAddBudgetCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetId,
      name,
      type = "misc",
    }: {
      budgetId: string;
      name: string;
      type?: "needs" | "wants" | "investments" | "misc";
      month: number;
      year: number;
    }) => addBudgetCategory(budgetId, name, type),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateCategoryAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      allocatedAmount,
    }: {
      categoryId: string;
      allocatedAmount: number;
      month: number;
      year: number;
    }) => updateCategoryAllocation(categoryId, allocatedAmount),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
    },
  });
}

export function useUpdateCategoryIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      icon,
    }: {
      categoryId: string;
      icon: string;
      month: number;
      year: number;
    }) => updateCategoryIcon(categoryId, icon),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
    },
  });
}

export function useAddBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      name,
      planned,
    }: {
      categoryId: string;
      name: string;
      planned?: number;
      month: number;
      year: number;
    }) => addBudgetItem(categoryId, name, planned),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
    },
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: {
        name?: string;
        planned_amount?: number;
        actual_amount?: number;
        is_completed?: boolean;
      };
      month: number;
      year: number;
    }) => updateBudgetItem(itemId, updates),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
    }: {
      itemId: string;
      month: number;
      year: number;
    }) => deleteBudgetItem(itemId),
    onSuccess: (_data, { month, year }) => {
      qc.invalidateQueries({ queryKey: budgetKey(month, year) });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
