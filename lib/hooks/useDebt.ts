import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDebtData } from "@/lib/actions/debt";
import { getDB } from "@/lib/db";
import { useEnqueue } from "@/lib/hooks/useSync";
import { DASHBOARD_KEY } from "./useDashboard";
import { NET_WORTH_KEY } from "./useNetWorth";

export const DEBT_KEY = ["debt"] as const;

// ─── IDB read helper ──────────────────────────────────────────────────────────

export async function getDebtFromIDB() {
  const db = getDB();
  const debts = await db.debts.orderBy("created_at").toArray();
  if (debts.length === 0) return null;

  return debts.map((d) => ({
    id: d.id,
    name: d.name,
    icon: d.icon,
    type: d.type,
    principal: Number(d.principal),
    interestRate: Number(d.interest_rate),
    monthlyMin: Number(d.monthly_minimum),
    totalPaid: Number(d.total_paid),
    expectedPayoffDate: d.expected_payoff_date,
    isClosed: d.is_closed,
  }));
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useDebtData() {
  return useQuery({
    queryKey: DEBT_KEY,
    queryFn: async () => {
      const local = await getDebtFromIDB();
      if (local) return local;
      return getDebtData();
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddDebt() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({
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
    }) => {
      const db = getDB();
      const tempId = `temp_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      await db.debts.add({
        id: tempId,
        user_id: "__pending__",
        name,
        icon: null,
        type,
        principal,
        interest_rate: interestRate,
        monthly_minimum: monthlyMin,
        total_paid: 0,
        is_closed: false,
        expected_payoff_date: expectedPayoffDate ?? null,
        created_at: now,
        updated_at: now,
      });

      await enqueue({
        table: "debts",
        operation: "INSERT",
        recordId: tempId,
        tempId,
        payload: { name, type, principal, interestRate, monthlyMin, expectedPayoffDate },
      });

      return { id: tempId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({
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
    }) => {
      const db = getDB();
      await db.debts.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await enqueue({
        table: "debts",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDB();
      await db.debts.delete(id);
      await enqueue({
        table: "debts",
        operation: "DELETE",
        recordId: id,
        payload: { id },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useMakePayment() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const db = getDB();
      const debt = await db.debts.get(id);
      if (debt) {
        const newTotalPaid = Number(debt.total_paid) + amount;
        const isClosed = newTotalPaid >= Number(debt.principal);
        await db.debts.update(id, {
          total_paid: newTotalPaid,
          is_closed: isClosed || debt.is_closed,
          updated_at: new Date().toISOString(),
        });
      }
      await enqueue({
        table: "debts",
        operation: "PAYMENT",
        recordId: id,
        payload: { id, amount },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateDebtIcon() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({ id, icon }: { id: string; icon: string }) => {
      const db = getDB();
      await db.debts.update(id, { icon, updated_at: new Date().toISOString() });
      await enqueue({
        table: "debts",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates: { icon } },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEBT_KEY });
    },
  });
}
