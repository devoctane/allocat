import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDebtData,
  addDebt,
  updateDebt,
  deleteDebt,
  makePayment,
  updateDebtIcon,
} from "@/lib/actions/debt";
import { DASHBOARD_KEY } from "./useDashboard";
import { NET_WORTH_KEY } from "./useNetWorth";

export const DEBT_KEY = ["debt"] as const;

export function useDebtData() {
  return useQuery({
    queryKey: DEBT_KEY,
    queryFn: () => getDebtData(),
  });
}

export function useAddDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      type,
      principal,
      interestRate,
      monthlyMin,
      expectedPayoffDate,
    }: {
      name: string;
      type: "internal" | "external" | "lent";
      principal: number;
      interestRate: number;
      monthlyMin: number;
      expectedPayoffDate?: string | null;
    }) => addDebt(name, type, principal, interestRate, monthlyMin, expectedPayoffDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        type?: "internal" | "external" | "lent";
        principal?: number;
        interest_rate?: number;
        monthly_minimum?: number;
        expected_payoff_date?: string | null;
        is_closed?: boolean;
      };
    }) => updateDebt(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDebt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useMakePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      makePayment(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateDebtIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, icon }: { id: string; icon: string }) =>
      updateDebtIcon(id, icon),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
    },
  });
}
