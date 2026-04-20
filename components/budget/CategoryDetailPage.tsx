"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useCategoryData, categoryDataKey } from "@/lib/hooks/useCategoryData";
import { budgetKey } from "@/lib/hooks/useBudget";
import { DASHBOARD_KEY } from "@/lib/hooks/useDashboard";
import { useEnqueue } from "@/lib/hooks/useSync";
import { getDB } from "@/lib/db";

interface BudgetItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

function formatNum(value: number) {
  return `₹${value.toFixed(2)}`;
}

function getAllocatedAmount(items: BudgetItem[]) {
  return items.reduce((sum, item) => sum + item.planned, 0);
}

// ─── Entry point — reads from IDB via hook ────────────────────────────────────

export default function CategoryDetailPage({
  categoryId,
}: {
  categoryId: string;
}) {
  const { data, isLoading } = useCategoryData(categoryId);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full animate-pulse px-6 pt-10 gap-6">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-4 bg-muted rounded w-full" />
        <div className="flex flex-col gap-4 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <CategoryDetailContent categoryId={categoryId} data={data} />;
}

// ─── Content with full interaction logic ──────────────────────────────────────

interface CategoryData {
  id: string;
  name: string;
  icon?: string | null;
  allocated: number;
  totalBudget: number;
  otherAllocated: number;
  items: BudgetItem[];
}

function CategoryDetailContent({
  categoryId,
  data,
}: {
  categoryId: string;
  data: CategoryData;
}) {
  const router = useRouter();
  const haptic = useHaptic();
  const qc = useQueryClient();
  const enqueue = useEnqueue();

  const [items, setItems] = useState<BudgetItem[]>(data.items);
  const [icon, setIcon] = useState(data.icon || null);
  const [name, setName] = useState(data.name);
  const [newItemName, setNewItemName] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const allocated = getAllocatedAmount(items);
  const totalAllocated = data.otherAllocated + allocated;
  const used = items.reduce((s, i) => s + i.actual, 0);
  const left = allocated - used;
  const pct =
    allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
  const categoryBudgetCap = Math.max(0, data.totalBudget - data.otherAllocated);
  const remainingBudgetCapacity = data.totalBudget - totalAllocated;

  function getAllocationValidationMessage(nextAllocated: number) {
    const nextTotalAllocated = data.otherAllocated + nextAllocated;
    const currentTotalAllocated = data.otherAllocated + allocated;

    if (
      nextTotalAllocated <= data.totalBudget ||
      nextTotalAllocated <= currentTotalAllocated
    ) {
      return "";
    }

    if (data.totalBudget <= 0) {
      return "Set the Total Budget before allocating more items.";
    }

    return `This change exceeds the total budget by ${formatNum(
      nextTotalAllocated - data.totalBudget
    )}. Reduce another category or increase the total budget first.`;
  }

  function invalidateBudgetCaches() {
    // Best-effort: find the parent budget's month/year from IDB and invalidate
    // We don't wait for this — it's a background cache refresh
    getDB()
      .categories.get(categoryId)
      .then((cat) => {
        if (!cat) return;
        return getDB()
          .budgets.get(cat.budget_id)
          .then((budget) => {
            if (!budget) return;
            qc.invalidateQueries({
              queryKey: budgetKey(budget.month, budget.year),
            });
          });
      })
      .catch(() => {});
    qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    qc.invalidateQueries({ queryKey: categoryDataKey(categoryId) });
  }

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    const trimmedName = newItemName.trim();
    haptic.success();

    const tempId = `temp_${crypto.randomUUID()}`;
    setItems((prev) => [
      ...prev,
      { id: tempId, name: trimmedName, planned: 0, actual: 0 },
    ]);
    setNewItemName("");
    setValidationError("");

    try {
      const db = getDB();
      const now = new Date().toISOString();

      await db.budget_items.add({
        id: tempId,
        category_id: categoryId,
        user_id: "__pending__",
        name: trimmedName,
        planned_amount: 0,
        actual_amount: 0,
        is_completed: false,
        created_at: now,
        updated_at: now,
      });

      await enqueue({
        table: "budget_items",
        operation: "INSERT",
        recordId: tempId,
        tempId,
        payload: { categoryId, name: trimmedName, planned: 0 },
      });

      invalidateBudgetCaches();
    } catch {
      haptic.error();
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      setNewItemName(trimmedName);
      setValidationError("Couldn't add the item right now.");
    }
  }

  async function handleUpdateItem(id: string, updates: Partial<BudgetItem>) {
    const previousItems = items;
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );

    if (updates.planned !== undefined) {
      const validationMessage = getAllocationValidationMessage(
        getAllocatedAmount(nextItems)
      );
      if (validationMessage) {
        haptic.error();
        setValidationError(validationMessage);
        return;
      }
    }

    setValidationError("");
    setItems(nextItems);

    const idbUpdates: Record<string, string | number | boolean> = {};
    if (updates.name !== undefined) idbUpdates.name = updates.name;
    if (updates.planned !== undefined)
      idbUpdates.planned_amount = updates.planned;
    if (updates.actual !== undefined) idbUpdates.actual_amount = updates.actual;
    idbUpdates.updated_at = new Date().toISOString();

    try {
      const db = getDB();
      await db.budget_items.update(id, idbUpdates);

      const serverUpdates: Record<string, string | number | boolean> = {};
      if (updates.name !== undefined) serverUpdates.name = updates.name;
      if (updates.planned !== undefined)
        serverUpdates.planned_amount = updates.planned;
      if (updates.actual !== undefined)
        serverUpdates.actual_amount = updates.actual;

      await enqueue({
        table: "budget_items",
        operation: "UPDATE",
        recordId: id,
        payload: { itemId: id, updates: serverUpdates },
      });

      invalidateBudgetCaches();
    } catch {
      haptic.error();
      setItems(previousItems);
      setValidationError("Couldn't update the item right now.");
    }
  }

  async function handleUpdateIcon(newIcon: string) {
    setIcon(newIcon);
    try {
      const db = getDB();
      await db.categories.update(categoryId, {
        icon: newIcon,
        updated_at: new Date().toISOString(),
      });
      await enqueue({
        table: "categories",
        operation: "UPDATE",
        recordId: categoryId,
        payload: { categoryId, updates: { icon: newIcon } },
      });
      invalidateBudgetCaches();
    } catch {
      setIcon(data.icon || null);
    }
  }

  async function handleUpdateCategoryName(newName: string) {
    if (!newName.trim()) return;
    const trimmed = newName.trim();
    setName(trimmed);
    try {
      const db = getDB();
      await db.categories.update(categoryId, {
        name: trimmed,
        updated_at: new Date().toISOString(),
      });
      await enqueue({
        table: "categories",
        operation: "UPDATE",
        recordId: categoryId,
        payload: { categoryId, updates: { name: trimmed } },
      });
      invalidateBudgetCaches();
    } catch {
      setName(data.name);
    }
  }

  async function handleDeleteCategory() {
    setIsConfirmDeleteOpen(false);
    try {
      const db = getDB();
      // Delete all items in this category from IDB first
      const itemIds = (
        await db.budget_items.where("category_id").equals(categoryId).toArray()
      ).map((i) => i.id);
      await db.budget_items.bulkDelete(itemIds);
      await db.categories.delete(categoryId);

      await enqueue({
        table: "categories",
        operation: "DELETE",
        recordId: categoryId,
        payload: { categoryId },
      });

      invalidateBudgetCaches();
      router.replace("/budget");
    } catch {
      setIsConfirmDeleteOpen(false);
    }
  }

  async function handleDeleteItem(id: string) {
    haptic.heavy();
    const previousItems = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    setValidationError("");

    try {
      const db = getDB();
      await db.budget_items.delete(id);
      await enqueue({
        table: "budget_items",
        operation: "DELETE",
        recordId: id,
        payload: { itemId: id },
      });
      invalidateBudgetCaches();
    } catch {
      haptic.error();
      setItems(previousItems);
      setValidationError("Couldn't delete the item right now.");
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-5">
        <button
          id="category-back"
          onClick={() => {
            haptic.light();
            router.back();
          }}
          className="flex items-center justify-center size-10 rounded-full border border-border active:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.light();
              setIsPickerOpen(true);
            }}
            className="flex items-center justify-center size-8 rounded-full bg-muted hover:bg-muted/80 transition-colors grayscale text-xl"
            title="Choose Icon"
          >
            {icon || (
              <span className="material-symbols-outlined text-sm text-muted-foreground">
                add_reaction
              </span>
            )}
          </button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            <InlineEditableText
              value={name}
              onSave={handleUpdateCategoryName}
              className="font-bold text-foreground max-w-50"
            />
          </h1>
        </div>
        <button
          id="category-delete"
          onClick={() => {
            haptic.heavy();
            setIsConfirmDeleteOpen(true);
          }}
          className="flex items-center justify-center size-10 text-muted-foreground hover:text-red-500 transition-colors"
          title="Delete Category"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </header>

      <div className="md:grid md:grid-cols-[1fr_1.5fr] md:gap-x-8 flex-1">
        <div className="mb-6 md:mb-0 space-y-6">
          {/* Summary Badges */}
          <div className="px-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 p-4 border border-border rounded-lg bg-card text-foreground">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Allocated
              </span>
              <span className="text-base font-bold tabular-nums">
                {formatNum(allocated)}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Auto from items
              </span>
            </div>

            {[
              { label: "Used", value: used, highlight: false },
              { label: "Left", value: left, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={`flex flex-col gap-1 p-4 border border-border rounded-lg ${
                  highlight ? "bg-muted" : "bg-card"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {label}
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {formatNum(value)}
                </span>
              </div>
            ))}
          </div>

          <div className="px-4 space-y-1">
            <p className="text-[11px] tabular-nums text-muted-foreground">
              Total budget {formatNum(data.totalBudget)} • Total allocated{" "}
              {formatNum(totalAllocated)}
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              Category cap {formatNum(categoryBudgetCap)} • Other categories{" "}
              {formatNum(data.otherAllocated)}
            </p>
            {data.totalBudget <= 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Set the Total Budget on the budget page before allocating item
                  amounts here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    router.back();
                  }}
                  className="inline-flex text-xs font-semibold text-primary underline underline-offset-4 decoration-primary/40"
                >
                  Go back and set it
                </button>
              </>
            ) : remainingBudgetCapacity < 0 ? (
              <p className="text-xs text-red-400">
                This budget is {formatNum(Math.abs(remainingBudgetCapacity))} over
                the total budget cap.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {formatNum(remainingBudgetCapacity)} still available before this
                budget hits the top limit.
              </p>
            )}
            {validationError ? (
              <p className="text-xs text-red-400">{validationError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col flex-1">
          {/* Items Section Label */}
          <div className="px-6 pb-2 flex justify-between items-end">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Items
            </h2>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {items.length} total
            </span>
          </div>

          {/* Item List */}
          <div className="flex-1 px-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex gap-3 items-center justify-between py-4 border-b border-border"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate w-full">
                    <InlineEditableText
                      value={item.name}
                      onSave={(val) => handleUpdateItem(item.id, { name: val })}
                      className="max-w-full text-foreground"
                    />
                  </span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                    <span className="flex items-center gap-1">
                      Allocated:{" "}
                      <InlineEditableNumber
                        value={item.planned}
                        onSave={(val) =>
                          handleUpdateItem(item.id, { planned: val })
                        }
                        className="text-xs text-foreground"
                      />
                    </span>
                    <span className="flex items-center gap-1">
                      Used:{" "}
                      <InlineEditableNumber
                        value={item.actual}
                        onSave={(val) => handleUpdateItem(item.id, { actual: val })}
                        className="text-xs text-foreground"
                      />
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    id={`delete-item-${item.id}`}
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-100 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete Item"
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}

            {/* Inline Add New Item */}
            <div className="flex items-center justify-between py-4 border-b border-border">
              <input
                id="add-item-input"
                type="text"
                placeholder="Add new item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
                className="flex-1 bg-transparent border-none p-0 text-sm font-normal placeholder:text-muted-foreground text-foreground focus:outline-none focus:ring-0"
              />
              <button
                id="add-item-confirm"
                onClick={handleAddItem}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Footer */}
      <div className="px-4 py-5 mt-auto">
        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            {pct}% spent
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatNum(used)} / {formatNum(allocated)}
          </span>
        </div>
      </div>

      <EmojiPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleUpdateIcon}
      />

      <ConfirmDrawer
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category?"
        description="All items within this category will be deleted. This cannot be undone."
        confirmText="Delete Category"
        cancelText="Keep Category"
      />
    </div>
  );
}
