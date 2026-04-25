import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDB } from "@/lib/db";
import { useEnqueue } from "@/lib/hooks/useSync";
import { getGoalsData } from "@/lib/actions/goals";

export const GOALS_KEY = ["goals"] as const;
const DASHBOARD_KEY = ["dashboard"] as const;

async function getGoalsFromIDB() {
  const db = getDB();
  const goals = await db.goals.orderBy("created_at").toArray();
  return goals.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

export function useGoalsData() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: async () => {
      const local = await getGoalsFromIDB();
      if (local.length > 0) return local;
      return getGoalsData();
    },
  });
}

export function useAddGoal() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({
      name,
      targetAmount,
      notes,
      priority,
    }: {
      name: string;
      targetAmount: number;
      notes?: string | null;
      priority?: number;
    }) => {
      const db = getDB();
      const tempId = `temp_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      await db.goals.add({
        id: tempId,
        user_id: "__pending__",
        name,
        icon: null,
        target_amount: targetAmount,
        current_amount: 0,
        notes: notes ?? null,
        priority: priority ?? 0,
        created_at: now,
        updated_at: now,
      });

      await enqueue({
        table: "goals",
        operation: "INSERT",
        recordId: tempId,
        tempId,
        payload: { name, targetAmount, notes, priority },
      });

      return { id: tempId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateGoal() {
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
        current_amount?: number;
        target_amount?: number;
        notes?: string | null;
        priority?: number;
      };
    }) => {
      const db = getDB();
      await db.goals.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await enqueue({
        table: "goals",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDB();
      await db.goals.delete(id);
      await enqueue({
        table: "goals",
        operation: "DELETE",
        recordId: id,
        payload: { id },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateGoalIcon() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({ id, icon }: { id: string; icon: string }) => {
      const db = getDB();
      await db.goals.update(id, { icon, updated_at: new Date().toISOString() });
      await enqueue({
        table: "goals",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates: { icon } },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
