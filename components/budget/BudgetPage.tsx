"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useAddBudgetCategory, useUpdateBudgetTotal } from "@/lib/hooks/useBudget";
import { BottomSheetSelect } from "@/components/ui/BottomSheetSelect";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CategoryData {
  id: string;
  name: string;
  icon?: string | null;
  type: string;
  allocated: number;
  spent: number;
  subtitle: string;
}

interface BudgetData {
  id: string;
  month: number;
  year: number;
  totalBudget: number;
  categories: CategoryData[];
}

interface BudgetPageProps {
  data: BudgetData;
  defaultMonth: number;
  defaultYear: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BudgetPage({ data, defaultMonth, defaultYear }: BudgetPageProps) {
  const router = useRouter();
  const haptic = useHaptic();
  const addCategoryMutation = useAddBudgetCategory();
  const updateBudgetTotalMutation = useUpdateBudgetTotal();
  const addCategoryInputRef = useRef<HTMLInputElement>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const totalAllocated = data.categories.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = data.categories.reduce((s, c) => s + c.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const unallocatedBudget = data.totalBudget - totalAllocated;

  const isCurrentMonth = defaultMonth === (new Date().getMonth() + 1) && defaultYear === new Date().getFullYear();

  function handleMonthChange(newMonthIndex: number) {
    const monthNumber = newMonthIndex + 1; // 1-12
    router.push(`?month=${monthNumber}&year=${defaultYear}`);
  }

  useEffect(() => {
    if (!isAddCategoryOpen) return;

    const timer = window.setTimeout(() => {
      addCategoryInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isAddCategoryOpen]);

  function openAddCategory() {
    addCategoryMutation.reset();
    haptic.light();
    setIsAddCategoryOpen(true);
  }

  function handleUpdateBudget(totalAmount: number) {
    updateBudgetTotalMutation.mutate({
      budgetId: data.id,
      totalAmount,
      month: defaultMonth,
      year: defaultYear,
    });
  }

  async function handleCreateCategory(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const name = newCategoryName.trim();
    if (!name || addCategoryMutation.isPending) return;

    try {
      const category = await addCategoryMutation.mutateAsync({
        budgetId: data.id,
        name,
        month: defaultMonth,
        year: defaultYear,
      });

      haptic.success();
      setIsAddCategoryOpen(false);
      setNewCategoryName("");
      router.push(`/budget/${category.id}`);
    } catch {
      haptic.error();
    }
  }

  const addCategoryError = addCategoryMutation.isError
    ? addCategoryMutation.error instanceof Error
      ? addCategoryMutation.error.message
      : "Couldn't create the category right now."
    : null;
  const budgetTotalError = updateBudgetTotalMutation.isError
    ? updateBudgetTotalMutation.error instanceof Error
      ? updateBudgetTotalMutation.error.message
      : "Couldn't update the total budget right now."
    : null;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-4 md:pt-12 md:pb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">AlloCat</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
            Financial Overview
          </p>
        </div>
        <div className="md:hidden">
          <Link
            href="/profile"
            className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
          </Link>
        </div>
      </header>

      <div className="md:grid md:grid-cols-2 lg:grid-cols-[1fr_1.5fr] md:gap-x-8 px-4 md:px-6">
        <div className="space-y-6 mb-6 md:mb-0">
          {/* Month Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Period</span>
              {isCurrentMonth && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Current</span>
              )}
            </div>
            <BottomSheetSelect
              title="Select Month"
              placeholder="Select month…"
              options={MONTHS.map((m, i) => ({ value: String(i), label: `${m} ${defaultYear}` }))}
              value={String(defaultMonth - 1)}
              onChange={(val) => handleMonthChange(Number(val))}
            />
          </div>

          {/* Total Budget */}
          <div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Total Budget
                  </p>
                  <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    <InlineEditableNumber
                      value={data.totalBudget}
                      onSave={handleUpdateBudget}
                      className="text-3xl font-bold tracking-tight"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tap the amount to set the top budget for all category allocations.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    Total Allocated
                  </p>
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(totalAllocated)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    Allocated vs Total
                  </p>
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(totalAllocated)} / {formatCurrency(data.totalBudget)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    {unallocatedBudget < 0 ? "Over Allocated" : "Left to Allocate"}
                  </p>
                  <p className={`text-sm font-bold tabular-nums ${unallocatedBudget < 0 ? "text-red-400" : "text-primary"}`}>
                    {formatCurrency(Math.abs(unallocatedBudget))}
                  </p>
                </div>
              </div>

              {budgetTotalError ? (
                <p className="mt-3 text-xs text-red-400">{budgetTotalError}</p>
              ) : null}
            </div>
          </div>

          {/* Budget Overview Grid */}
          <div>
            <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden bg-card">
              <div className="flex flex-col p-4 border-r border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Allocated</p>
                <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(totalAllocated)}</p>
              </div>
              <div className="flex flex-col p-4 border-r border-border bg-muted/20">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Spent</p>
                <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="flex flex-col p-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Remaining</p>
                <p className={`text-sm font-bold tabular-nums ${totalRemaining < 0 ? 'text-red-400' : 'text-primary'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categories</h3>
            <button
              id="add-category-inline"
              type="button"
              onClick={openAddCategory}
              className="text-[11px] font-bold text-primary underline underline-offset-4 decoration-primary/40 hover:text-foreground"
            >
              ADD CATEGORY
            </button>
          </div>

          <div className="space-y-6">
            {data.categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  No categories yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first category to start planning this budget.
                </p>
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="mt-5 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/15 active:scale-95 transition-transform"
                >
                  Add First Category
                </button>
              </div>
            ) : data.categories.map((cat) => {
              const pct = cat.allocated > 0 ? Math.min(100, Math.round((cat.spent / cat.allocated) * 100)) : 0;
              const isOver = cat.spent > cat.allocated;
              return (
                <Link 
                  key={cat.id} 
                  href={`/budget/${cat.id}`} 
                  className="block"
                  onClick={() => haptic.selection()}
                >
                  <div className="flex flex-col gap-2 group">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        {cat.icon ? (
                          <span className="text-lg leading-none grayscale">{cat.icon}</span>
                        ) : null}
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                          <span className="text-[11px] text-muted-foreground">{cat.subtitle}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold tabular-nums ${isOver ? "text-red-400" : "text-foreground"}`}>
                          {formatCurrency(cat.spent)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          / {formatCurrency(cat.allocated)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAB - Will probably be handled outside or trigger a modal */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          id="add-budget-category"
          type="button"
          onClick={openAddCategory}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      </div>

      <Drawer.Root
        open={isAddCategoryOpen}
        onOpenChange={(open) => {
          setIsAddCategoryOpen(open);
          if (!open) {
            addCategoryMutation.reset();
            setNewCategoryName("");
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Drawer.Content
            aria-describedby="add-category-description"
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-card border-t border-border focus:outline-none"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>

            <div className="px-5 py-4 border-b border-border">
              <Drawer.Title className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Add Category
              </Drawer.Title>
              <p id="add-category-description" className="mt-2 text-sm text-foreground">
                Start with a name. You can set the icon, allocation, and items after it&apos;s created.
              </p>
            </div>

            <form onSubmit={handleCreateCategory} className="px-5 py-5 space-y-4 pb-8">
              <div className="space-y-2">
                <label htmlFor="new-category-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Category Name
                </label>
                <input
                  ref={addCategoryInputRef}
                  id="new-category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Groceries"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>

              {addCategoryMutation.isError ? (
                <p className="text-sm text-red-500">{addCategoryError}</p>
              ) : null}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="w-full rounded-xl bg-muted px-4 py-3.5 text-sm font-medium text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
