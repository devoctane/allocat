"use client";

import { useState } from "react";
import { BottomSheetSelect } from "@/components/ui/BottomSheetSelect";
import { useCategoryItems, useQuickLogSpend } from "@/lib/hooks/useDashboard";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface QuickSpendInputProps {
  categories: Category[];
}

interface SpendResult {
  itemName: string;
  remaining: number;
  planned: number;
  actual: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function AllocationStatus({ result }: { result: SpendResult }) {
  const { remaining, planned, itemName } = result;
  const pct = planned > 0 ? (remaining / planned) * 100 : 0;
  const isOver = remaining < 0;
  const isCritical = !isOver && pct <= 10;
  const isWarning = !isOver && pct > 10 && pct <= 30;

  const statusColor = isOver || isCritical
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : "text-foreground";

  const barColor = isOver || isCritical
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-400"
    : "bg-primary";

  const barPct = planned > 0 ? Math.min(100, Math.max(0, (remaining / planned) * 100)) : 0;

  return (
    <div className="mt-3 p-3 bg-background border border-border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {isOver ? "⚠ Over Budget" : isCritical ? "⚠ Almost Empty" : isWarning ? "⚠ Running Low" : "✓ Logged"}
        </span>
        <span className={`text-xs font-bold tabular-nums ${statusColor}`}>
          {isOver
            ? `Over by ${formatCurrency(Math.abs(remaining))}`
            : `${formatCurrency(remaining)} left`}
        </span>
      </div>

      <p className="text-xs text-muted-foreground truncate">
        <span className="text-foreground font-semibold">{itemName}</span>
        {" "}— {formatCurrency(result.actual)} of {formatCurrency(planned)} used
      </p>

      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${isOver ? 100 : barPct}%` }}
        />
      </div>
    </div>
  );
}

export default function QuickSpendInput({ categories }: QuickSpendInputProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [lastResult, setLastResult] = useState<SpendResult | null>(null);

  const haptic = useHaptic();
  const { data: items = [], isFetching: itemsLoading } = useCategoryItems(
    selectedCategoryId || null
  );
  const spendMutation = useQuickLogSpend();

  function handleCategoryChange(catId: string) {
    setSelectedCategoryId(catId);
    setSelectedItemId("");
    setLastResult(null);
    setValidationError("");
  }

  function validate(): boolean {
    if (!selectedCategoryId) {
      setValidationError("Please select a category.");
      return false;
    }
    if (!selectedItemId) {
      setValidationError("Please select an item.");
      return false;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setValidationError("Enter a valid amount greater than 0.");
      return false;
    }
    setValidationError("");
    return true;
  }

  async function handleSubmit() {
    if (!validate()) {
      haptic.light();
      return;
    }

    spendMutation.mutate(
      { itemId: selectedItemId, amount: parseFloat(amount) },
      {
        onSuccess: (result) => {
          if (!result) return;
          haptic.success();
          setLastResult({
            itemName: result.itemName,
            remaining: result.remaining,
            planned: result.planned,
            actual: result.actual,
          });
          setAmount("");
        },
        onError: () => {
          haptic.heavy();
          setValidationError("Failed to log spend. Please try again.");
        },
      }
    );
  }

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon ?? undefined,
  }));

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: item.name,
    description: item.planned > 0
      ? `${formatCurrency(item.remaining)} of ${formatCurrency(item.planned)} remaining`
      : "No allocation set",
  }));

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <section>
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Quick Log Spend
        </p>

        <div className="space-y-3">
          {/* Row 1: Category + Item */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Category
              </label>
              <BottomSheetSelect
                title="Select Category"
                placeholder="Category…"
                options={categoryOptions}
                value={selectedCategoryId}
                onChange={handleCategoryChange}
              />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Item
              </label>
              <BottomSheetSelect
                title="Select Item"
                placeholder={
                  itemsLoading ? "Loading…" :
                  !selectedCategoryId ? "Pick category first" :
                  items.length === 0 ? "No items" : "Item…"
                }
                options={itemOptions}
                value={selectedItemId}
                onChange={(val) => {
                  setSelectedItemId(val);
                  setLastResult(null);
                  setValidationError("");
                }}
                disabled={!selectedCategoryId || itemsLoading || items.length === 0}
              />
            </div>
          </div>

          {/* Remaining hint */}
          {selectedItem && !lastResult && (
            <p className="text-[11px] tabular-nums text-muted-foreground -mt-1">
              {selectedItem.remaining > 0
                ? `${formatCurrency(selectedItem.remaining)} remaining of ${formatCurrency(selectedItem.planned)}`
                : selectedItem.planned === 0
                ? "No allocation set for this item"
                : `Over budget by ${formatCurrency(Math.abs(selectedItem.remaining))}`}
            </p>
          )}

          {/* Amount input */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Amount (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setValidationError("");
                setLastResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-xs text-red-400">{validationError}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={spendMutation.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spendMutation.isPending ? "Logging…" : "Log Spend →"}
          </button>

          {/* Post-save allocation status */}
          {lastResult && <AllocationStatus result={lastResult} />}
        </div>
      </div>
    </section>
  );
}
