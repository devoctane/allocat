import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNetWorthData,
  addAsset,
  updateAsset,
  updateAssetIcon,
  deleteAsset,
} from "@/lib/actions/net-worth";
import { DASHBOARD_KEY } from "./useDashboard";

export const NET_WORTH_KEY = ["net-worth"] as const;

export function useNetWorthData() {
  return useQuery({
    queryKey: NET_WORTH_KEY,
    queryFn: () => getNetWorthData(),
  });
}

export function useAddAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      category,
      value,
    }: {
      name: string;
      category: string;
      value: number;
    }) => addAsset(name, category, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; value?: number; icon?: string };
    }) => updateAsset(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateAssetIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, icon }: { id: string; icon: string }) =>
      updateAssetIcon(id, icon),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NET_WORTH_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
