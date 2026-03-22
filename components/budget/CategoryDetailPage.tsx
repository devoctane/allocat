"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { addBudgetItem, updateBudgetItem, deleteBudgetItem, updateCategoryAllocation, updateCategoryIcon, updateCategoryName, deleteCategory } from "@/lib/actions/budget";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface BudgetItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

interface CategoryData {
  id: string;
  name: string;
  icon?: string | null;
  allocated: number;
  items: BudgetItem[];
}

function formatNum(value: number) {
  return `₹${value.toFixed(2)}`;
}

export default function CategoryDetailPage({ data }: { data: CategoryData }) {
  const router = useRouter();
  const haptic = useHaptic();

  const [items, setItems] = useState<BudgetItem[]>(data.items);
  const [allocated, setAllocated] = useState(data.allocated);
  const [icon, setIcon] = useState(data.icon || null);
  const [name, setName] = useState(data.name);
  const [newItemName, setNewItemName] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Sync state when server data changes (only on mount or data.id change)
  useEffect(() => {
    // Sync after server mutation with router.refresh()
    const timer = setTimeout(() => {
      setItems(data.items);
      setIcon(data.icon || null);
      setName(data.name);
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const used = items.reduce((s, i) => s + i.actual, 0);
  const left = allocated - used;
  const pct = allocated > 0
    ? Math.min(100, Math.round((used / allocated) * 100))
    : 0;

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    
    // Performance: Haptic feedback
    haptic.success();

    // Optimistic
    const tempId = Date.now().toString();
    setItems((prev) => [
      ...prev,
      { id: tempId, name, planned: 0, actual: 0 },
    ]);
    setNewItemName("");

    // Server Action
    const inserted = await addBudgetItem(data.id, name, 0);
    if (inserted) {
      setItems((prev) => prev.map(i => i.id === tempId ? { ...i, id: inserted.id } : i));
      router.refresh();
    }
  }

  async function handleUpdateItem(id: string, updates: Partial<BudgetItem>) {
    // Optimistic
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    // Server Action
    const serverUpdates: Record<string, string | number | boolean> = {};
    if (updates.name !== undefined) serverUpdates.name = updates.name;
    if (updates.planned !== undefined) serverUpdates.planned_amount = updates.planned;
    if (updates.actual !== undefined) serverUpdates.actual_amount = updates.actual;

    await updateBudgetItem(id, serverUpdates);
    router.refresh();
  }

  async function handleUpdateAllocation(val: number) {
    if (val < 0) return;
    setAllocated(val);
    await updateCategoryAllocation(data.id, val);
    router.refresh();
  }

  async function handleUpdateIcon(newIcon: string) {
    setIcon(newIcon);
    await updateCategoryIcon(data.id, newIcon);
    router.refresh();
  }

  async function handleUpdateCategoryName(newName: string) {
    if (!newName.trim()) return;
    setName(newName.trim());
    await updateCategoryName(data.id, newName.trim());
    router.refresh();
  }

  async function handleDeleteCategory() {
    setIsConfirmDeleteOpen(false);
    await deleteCategory(data.id);
    router.replace('/budget');
  }

  async function handleDeleteItem(id: string) {
    // Performance: Haptic feedback
    haptic.heavy();

    // Optimistic
    setItems((prev) => prev.filter((item) => item.id !== id));
    
    // Server Action
    await deleteBudgetItem(id);
    router.refresh();
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
            {icon || <span className="material-symbols-outlined text-sm text-muted-foreground">add_reaction</span>}
          </button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            <InlineEditableText
              value={name}
              onSave={handleUpdateCategoryName}
              className="font-bold text-foreground max-w-[200px]"
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

      {/* Summary Badges */}
      <div className="px-4 mb-6 grid grid-cols-3 gap-3">
        {/* Special case for Allocated since it's editable */}
        <div className="flex flex-col gap-1 p-4 border border-border rounded-lg bg-card text-foreground">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Allocated</span>
          <span className="text-base font-bold tabular-nums">
            <InlineEditableNumber value={allocated} onSave={handleUpdateAllocation} />
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

      {/* Items Section Label */}
      <div className="px-6 pb-2 flex justify-between items-end">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</h2>
        <span className="text-[10px] text-muted-foreground tabular-nums">{items.length} total</span>
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
                  Allocated: <InlineEditableNumber value={item.planned} onSave={(val) => handleUpdateItem(item.id, { planned: val })} className="text-xs text-foreground" />
                </span>
                <span className="flex items-center gap-1">
                  Used: <InlineEditableNumber value={item.actual} onSave={(val) => handleUpdateItem(item.id, { actual: val })} className="text-xs text-foreground" />
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
                <span className="material-symbols-outlined text-base">delete</span>
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
            <span className="material-symbols-outlined text-lg">add_circle</span>
          </button>
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
          <span className="text-[10px] text-muted-foreground font-medium">{pct}% spent</span>
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
