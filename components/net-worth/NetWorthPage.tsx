"use client";

import { useState } from "react";
import NetWorthEmptyState from "./NetWorthEmptyState";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import { BottomSheetSelect } from "@/components/ui/BottomSheetSelect";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useAddAsset, useUpdateAsset, useUpdateAssetIcon, useDeleteAsset } from "@/lib/hooks/useNetWorth";

const ASSET_ICONS: Record<string, string> = {
  liquid_cash: "account_balance",
  investments: "show_chart",
  real_estate: "home",
  other: "account_balance_wallet",
};

const ASSET_CATEGORY_OPTIONS = [
  { value: "liquid_cash", label: "Liquid Cash" },
  { value: "investments", label: "Investments" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

interface Asset {
  id: string;
  name: string;
  icon?: string | null;
  category: string;
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
    minimumFractionDigits: 2,
  }).format(value);
}

function PieChart({ assets, totalAssets }: { assets: Asset[], totalAssets: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const gap = totalAssets > 0 && assets.filter(a => a.value > 0).length > 1 ? 1.5 : 0;

  const sortedAssets = [...assets].filter(a => a.value > 0).sort((a, b) => b.value - a.value);

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
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={r} fill="none" className="stroke-muted/20" strokeWidth="80" />
          {totalAssets > 0 && sortedAssets.map((asset, i) => {
            const pct = asset.value / totalAssets;
            const dash = Math.max((pct * circ) - gap, 0);
            const strokeDasharray = `${dash} ${circ}`;
            const strokeDashoffset = -currentOffset;
            
            currentOffset += (pct * circ);
            
            const style = STYLES[i % STYLES.length];

            return (
              <circle
                key={asset.id}
                cx="80" cy="80" r={r}
                fill="none"
                className={style.stroke}
                strokeWidth="80"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
      </div>

      {sortedAssets.length > 0 && (
        <div className="w-full mt-6 space-y-2.5 px-2">
          {sortedAssets.map((asset, i) => {
            const pct = totalAssets > 0 ? ((asset.value / totalAssets) * 100).toFixed(1).replace(/\.0$/, '') : "0";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", category: "liquid_cash", value: "" });
  const [pickerAssetId, setPickerAssetId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const haptic = useHaptic();

  const addAssetMutation = useAddAsset();
  const updateAssetMutation = useUpdateAsset();
  const updateAssetIconMutation = useUpdateAssetIcon();
  const deleteAssetMutation = useDeleteAsset();

  const assets = data.assets;
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const netWorth = totalAssets - data.totalLiabilities;

  function handleAddAsset() {
    const val = parseFloat(newAsset.value);
    if (!newAsset.name.trim() || isNaN(val) || val < 0) return;
    
    haptic.success();
    addAssetMutation.mutate(
      { name: newAsset.name.trim(), category: newAsset.category, value: val },
      {
        onSuccess: () => {
          setNewAsset({ name: "", category: "liquid_cash", value: "" });
          setShowAddForm(false);
        },
      }
    );
  }

  function handleDeleteAsset(id: string) {
    haptic.light();
    setAssetToDelete(id);
  }

  function handleUpdateAsset(id: string, updates: { name?: string; value?: number }) {
    updateAssetMutation.mutate({ id, updates });
  }

  function handleUpdateAssetIcon(id: string, icon: string) {
    updateAssetIconMutation.mutate({ id, icon });
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 pt-10 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Net Worth</h1>
          <button id="net-worth-more" className="p-2 hover:bg-muted rounded-full">
            <span className="material-symbols-outlined text-foreground">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 transition-opacity">
        {assets.length === 0 ? (
          <>
            {showAddForm ? (
              <div className="mt-6 p-4 bg-card rounded-xl border border-border space-y-3">
                <input
                  id="new-asset-name"
                  type="text"
                  placeholder="Asset name"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <BottomSheetSelect
                  id="new-asset-category"
                  title="Asset Category"
                  options={ASSET_CATEGORY_OPTIONS}
                  value={newAsset.category}
                  onChange={(val) => setNewAsset((p) => ({ ...p, category: val }))}
                />
                <input
                  id="new-asset-value"
                  type="number"
                  min="0"
                  placeholder="Value (e.g. 10000)"
                  value={newAsset.value}
                  onChange={(e) => setNewAsset((p) => ({ ...p, value: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    id="save-new-asset"
                    onClick={handleAddAsset}
                    className="flex-1 py-2.5 bg-foreground text-background text-sm font-bold rounded-lg active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                  <button
                    id="cancel-new-asset"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 bg-background text-foreground text-sm font-medium rounded-lg border border-border transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <NetWorthEmptyState onAddAsset={() => setShowAddForm(true)} />
            )}
          </>
        ) : (
          <>
            <div className="md:grid md:grid-cols-[1fr_1.5fr] md:gap-x-8">
              <div className="space-y-6 mb-6 md:mb-0">
                {/* Summary Card */}
                <div className="bg-card p-6 rounded-xl border border-border">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Total Net Worth</p>
                  <h2 className="text-4xl font-bold tabular-nums tracking-tighter mb-5 text-foreground">
                    {formatCurrency(netWorth)}
                  </h2>
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
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Asset Distribution</h3>
                  <div className="bg-card p-6 rounded-xl border border-border flex justify-center">
                    <PieChart assets={assets} totalAssets={totalAssets} />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Assets List */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assets</h3>
                    <button className="text-[11px] font-bold text-primary hover:text-foreground transition-colors">SEE ALL</button>
                  </div>

                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPickerAssetId(asset.id)}
                            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shrink-0 transition-colors"
                            title="Set Emoji"
                          >
                            {asset.icon ? (
                              <span className="text-xl grayscale">{asset.icon}</span>
                            ) : (
                              <span className="material-symbols-outlined text-foreground text-[18px]">
                                {ASSET_ICONS[asset.category] ?? "account_balance_wallet"}
                              </span>
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              <InlineEditableText
                                value={asset.name}
                                onSave={(val) => handleUpdateAsset(asset.id, { name: val })}
                              />
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{asset.category.replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold tabular-nums text-sm text-foreground">
                            <InlineEditableNumber
                              value={asset.value}
                              onSave={(val) => handleUpdateAsset(asset.id, { value: val })}
                              formatAsCurrency={true}
                            />
                          </p>
                          <button
                            id={`delete-asset-${asset.id}`}
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                            title="Delete asset"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Asset Form */}
                  {showAddForm && (
                    <div className="p-4 bg-card rounded-xl border border-border space-y-3">
                      <input
                        id="new-asset-name"
                        type="text"
                        placeholder="Asset name"
                        value={newAsset.name}
                        onChange={(e) => setNewAsset((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <BottomSheetSelect
                        id="new-asset-category"
                        title="Asset Category"
                        options={ASSET_CATEGORY_OPTIONS}
                        value={newAsset.category}
                        onChange={(val) => setNewAsset((p) => ({ ...p, category: val }))}
                      />
                      <input
                        id="new-asset-value"
                        type="number"
                        min="0"
                        placeholder="Value (e.g. 10000)"
                        value={newAsset.value}
                        onChange={(e) => setNewAsset((p) => ({ ...p, value: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          id="save-new-asset"
                          onClick={handleAddAsset}
                          className="flex-1 py-2.5 bg-foreground text-background text-sm font-bold rounded-lg active:scale-95 transition-transform"
                        >
                          Save
                        </button>
                        <button
                          id="cancel-new-asset"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 py-2.5 bg-background text-foreground text-sm font-medium rounded-lg border border-border transition-colors hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!showAddForm && (
                    <button
                      id="add-asset-button"
                      onClick={() => {
                        haptic.light();
                        setShowAddForm(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-xl font-bold text-sm tracking-tight active:scale-[0.98] transition-transform"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      ADD ASSET
                    </button>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      <EmojiPickerModal
        isOpen={pickerAssetId !== null}
        onClose={() => setPickerAssetId(null)}
        onSelect={(emoji) => {
          if (pickerAssetId) handleUpdateAssetIcon(pickerAssetId, emoji);
        }}
      />

      <ConfirmDrawer
        isOpen={assetToDelete !== null}
        onClose={() => setAssetToDelete(null)}
        onConfirm={() => {
          if (assetToDelete) {
            deleteAssetMutation.mutate(assetToDelete);
            setAssetToDelete(null);
          }
        }}
        title="Delete Asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
}
