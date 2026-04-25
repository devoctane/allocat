"use client";

import { useEffect, useState } from "react";
import NetWorthEmptyState from "./NetWorthEmptyState";
import { AddAssetSheet } from "./AddAssetSheet";
import { AssetDetailSheet, type AssetDetail } from "./AssetDetailSheet";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { computeMonthlyGrowth } from "@/lib/hooks/useAssetHistory";

interface Asset {
  id: string;
  name: string;
  icon?: string | null;
  category_id: string | null;
  category_name: string;
  category_icon: string;
  value: number;
}

interface NetWorthData {
  assets: Asset[];
  totalLiabilities: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyFull(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function PieChart({ assets, totalAssets }: { assets: Asset[]; totalAssets: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const gap = totalAssets > 0 && assets.filter((a) => a.value > 0).length > 1 ? 1.5 : 0;
  const sorted = [...assets].filter((a) => a.value > 0).sort((a, b) => b.value - a.value);

  const STYLES = [
    { stroke: "stroke-foreground opacity-100", bg: "bg-foreground opacity-100" },
    { stroke: "stroke-foreground opacity-80", bg: "bg-foreground opacity-80" },
    { stroke: "stroke-foreground opacity-60", bg: "bg-foreground opacity-60" },
    { stroke: "stroke-foreground opacity-40", bg: "bg-foreground opacity-40" },
    { stroke: "stroke-foreground opacity-20", bg: "bg-foreground opacity-20" },
  ];

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={r} fill="none" className="stroke-muted/20" strokeWidth="80" />
          {totalAssets > 0 &&
            sorted.map((asset, i) => {
              const pct = asset.value / totalAssets;
              const dash = Math.max(pct * circ - gap, 0);
              const offset = -currentOffset;
              currentOffset += pct * circ;
              const style = STYLES[i % STYLES.length];
              return (
                <circle
                  key={asset.id}
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  className={style.stroke}
                  strokeWidth="80"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
      </div>
      {sorted.length > 0 && (
        <div className="w-full mt-5 space-y-2 px-1">
          {sorted.map((asset, i) => {
            const pct = totalAssets > 0 ? ((asset.value / totalAssets) * 100).toFixed(1).replace(/\.0$/, "") : "0";
            const style = STYLES[i % STYLES.length];
            return (
              <div key={asset.id} className="flex items-center justify-between text-xs w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-3">
                  <div className={`w-3 h-3 shrink-0 rounded-[3px] ${style.bg}`} />
                  <span className="text-muted-foreground truncate uppercase tracking-wider text-[10px] font-medium">
                    {asset.name}
                  </span>
                </div>
                <span className="font-semibold tabular-nums text-foreground shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NetWorthPage({ data }: { data: NetWorthData }) {
  const haptic = useHaptic();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addDefaultCategoryId, setAddDefaultCategoryId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);
  const [growth, setGrowth] = useState<{ amount: number; percent: number } | null>(null);

  const assets = data.assets;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const netWorth = totalAssets - data.totalLiabilities;

  // Group assets by category
  const categoryGroups = assets.reduce<Map<string, { name: string; icon: string; id: string | null; assets: Asset[] }>>(
    (map, asset) => {
      const key = asset.category_id ?? "__uncategorized__";
      if (!map.has(key)) {
        map.set(key, {
          id: asset.category_id,
          name: asset.category_name,
          icon: asset.category_icon,
          assets: [],
        });
      }
      map.get(key)!.assets.push(asset);
      return map;
    },
    new Map()
  );

  // Compute monthly growth from IDB history
  useEffect(() => {
    if (totalAssets === 0) return;
    computeMonthlyGrowth(totalAssets).then(setGrowth);
  }, [totalAssets]);

  function openAssetDetail(asset: Asset) {
    haptic.light();
    setSelectedAsset({
      id: asset.id,
      name: asset.name,
      icon: asset.icon ?? null,
      category_id: asset.category_id,
      category_name: asset.category_name,
      category_icon: asset.category_icon,
      value: asset.value,
    });
  }

  function openAddSheet(categoryId?: string | null) {
    haptic.light();
    setAddDefaultCategoryId(categoryId ?? null);
    setAddSheetOpen(true);
  }

  if (assets.length === 0) {
    return (
      <>
        <header className="px-7 pt-14 pb-[18px] border-b border-border">
          <div className="font-display text-[32px] leading-none tracking-[-0.02em] text-foreground">Net Worth</div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mt-2">Asset Tracker</div>
        </header>
        <main className="p-4">
          <NetWorthEmptyState onAddAsset={() => openAddSheet()} />
        </main>
        <AddAssetSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="px-7 pt-14 pb-[18px] border-b border-border">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-[32px] leading-none tracking-[-0.02em] text-foreground">Net Worth</div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mt-2">Asset Tracker</div>
          </div>
          <button
            onClick={() => openAddSheet()}
            className="border border-foreground px-4 py-2 font-mono text-[9px] tracking-[0.14em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-95"
          >
            + Add
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="md:grid md:grid-cols-[1fr_1.5fr] md:gap-x-8">
          {/* Left column: summary + chart */}
          <div className="space-y-6 mb-6 md:mb-0">
            {/* Summary Card */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Net Worth</p>
              <h2 className="text-4xl font-bold tabular-nums tracking-tighter mb-1 text-foreground">
                {formatCurrencyFull(netWorth)}
              </h2>
              {growth && (
                <div className={`flex items-center gap-1 mb-4 ${growth.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {growth.amount >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {growth.amount >= 0 ? "+" : ""}{formatCurrency(growth.amount)} ({growth.percent >= 0 ? "+" : ""}{growth.percent}%)
                  </span>
                  <span className="text-xs text-muted-foreground">vs 30 days ago</span>
                </div>
              )}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Assets</span>
                  <span className="font-semibold tabular-nums text-sm text-foreground">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Liabilities</span>
                  <span className="font-semibold tabular-nums text-sm text-foreground">-{formatCurrency(data.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Asset Distribution */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Asset Distribution
              </h3>
              <div className="bg-card p-6 rounded-xl border border-border flex justify-center">
                <PieChart assets={assets} totalAssets={totalAssets} />
              </div>
            </section>
          </div>

          {/* Right column: assets grouped by category */}
          <div className="space-y-5">
            {Array.from(categoryGroups.values()).map((group) => {
              const groupTotal = group.assets.reduce((s, a) => s + a.value, 0);
              return (
                <section key={group.id ?? "uncategorized"}>
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-none">{group.icon}</span>
                      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.name}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatCurrency(groupTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => openAssetDetail(asset)}
                        className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:bg-muted active:scale-[0.99] transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {asset.icon ? (
                              <span className="text-xl">{asset.icon}</span>
                            ) : (
                              <span className="text-lg leading-none">{asset.category_icon}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{asset.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{asset.category_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <p className="font-semibold tabular-nums text-sm text-foreground">
                            {formatCurrency(asset.value)}
                          </p>
                          <span className="material-symbols-outlined text-muted-foreground text-[18px]">chevron_right</span>
                        </div>
                      </button>
                    ))}

                    {/* Quick add within category */}
                    <button
                      onClick={() => openAddSheet(group.id)}
                      className="w-full flex items-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span className="text-xs font-medium">Add to {group.name}</span>
                    </button>
                  </div>
                </section>
              );
            })}

            {/* General add button */}
            <button
              onClick={() => openAddSheet()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-xl font-bold text-sm tracking-tight active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              ADD ASSET
            </button>
          </div>
        </div>
      </main>

      <AddAssetSheet
        open={addSheetOpen}
        defaultCategoryId={addDefaultCategoryId}
        onClose={() => setAddSheetOpen(false)}
      />

      <AssetDetailSheet
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </>
  );
}
