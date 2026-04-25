export interface HistoryEntry {
  asset_id: string;
  running_total: number | string;
  entry_date: string;
  created_at: string;
}

export interface MonthlySnapshot {
  snapshot_date: string;
  net_worth: number;
}

/**
 * Computes monthly net worth snapshots from raw asset_value_history entries.
 * For each past month: last running_total per asset on/before month-end date.
 * For current month: uses today's date.
 * Subtracts currentLiabilities (constant) from each month's total assets.
 */
export function computeMonthlyHistory(
  history: HistoryEntry[],
  currentLiabilities: number,
  months = 12
): MonthlySnapshot[] {
  if (history.length === 0) return [];

  const byAsset = new Map<string, HistoryEntry[]>();
  for (const e of history) {
    const arr = byAsset.get(e.asset_id) ?? [];
    arr.push(e);
    byAsset.set(e.asset_id, arr);
  }
  for (const [, arr] of byAsset) {
    arr.sort(
      (a, b) =>
        a.entry_date.localeCompare(b.entry_date) ||
        a.created_at.localeCompare(b.created_at)
    );
  }

  const assetIds = [...byAsset.keys()];
  const now = new Date();
  const result: MonthlySnapshot[] = [];

  for (let i = months - 1; i >= 0; i--) {
    let cutoff: string;
    if (i === 0) {
      cutoff = now.toISOString().split("T")[0];
    } else {
      const lastDay = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      cutoff = lastDay.toISOString().split("T")[0];
    }

    let totalAssets = 0;
    let hasData = false;

    for (const assetId of assetIds) {
      const entries = byAsset.get(assetId)!;
      let last: HistoryEntry | null = null;
      for (const e of entries) {
        if (e.entry_date <= cutoff) last = e;
        else break;
      }
      if (last) {
        totalAssets += Number(last.running_total);
        hasData = true;
      }
    }

    if (hasData) {
      result.push({ snapshot_date: cutoff, net_worth: totalAssets - currentLiabilities });
    }
  }

  return result;
}
