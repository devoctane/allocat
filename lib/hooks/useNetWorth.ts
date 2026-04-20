import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNetWorthData } from "@/lib/actions/net-worth";
import { getDB } from "@/lib/db";
import { useEnqueue } from "@/lib/hooks/useSync";
import { DASHBOARD_KEY } from "./useDashboard";

export const NET_WORTH_KEY = ["net-worth"] as const;

// ─── IDB read helper ──────────────────────────────────────────────────────────

export async function getNetWorthFromIDB() {
  const db = getDB();
  const assets = await db.assets.orderBy("created_at").toArray();
  // Return null if no data to force server fallback on first load
  if (assets.length === 0) {
    const debtCount = await db.debts.count();
    if (debtCount === 0) return null;
  }

  const debts = await db.debts.toArray();
  const totalLiabilities = debts
    .filter((d) => !d.is_closed && d.type !== "lent")
    .reduce(
      (sum, d) => sum + (Number(d.principal) - Number(d.total_paid)),
      0
    );

  return { assets, totalLiabilities };
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useNetWorthData() {
  return useQuery({
    queryKey: NET_WORTH_KEY,
    queryFn: async () => {
      const local = await getNetWorthFromIDB();
      if (local) return local;
      return getNetWorthData();
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddAsset() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({
      name,
      category,
      value,
    }: {
      name: string;
      category: string;
      value: number;
    }) => {
      const db = getDB();
      const tempId = `temp_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      await db.assets.add({
        id: tempId,
        user_id: "__pending__",
        name,
        icon: null,
        category: category as
          | "liquid_cash"
          | "investments"
          | "real_estate"
          | "other",
        value,
        created_at: now,
        updated_at: now,
      });

      await enqueue({
        table: "assets",
        operation: "INSERT",
        recordId: tempId,
        tempId,
        payload: { name, category, value },
      });

      return { id: tempId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; value?: number; icon?: string };
    }) => {
      const db = getDB();
      await db.assets.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await enqueue({
        table: "assets",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateAssetIcon() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async ({ id, icon }: { id: string; icon: string }) => {
      const db = getDB();
      await db.assets.update(id, { icon, updated_at: new Date().toISOString() });
      await enqueue({
        table: "assets",
        operation: "UPDATE",
        recordId: id,
        payload: { id, updates: { icon } },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDB();
      await db.assets.delete(id);
      await enqueue({
        table: "assets",
        operation: "DELETE",
        recordId: id,
        payload: { id },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
