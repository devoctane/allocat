import { useQuery } from "@tanstack/react-query";
import { getDB } from "@/lib/db";
import { getCategoryData } from "@/lib/actions/budget";

export function categoryDataKey(categoryId: string) {
  return ["categoryData", categoryId] as const;
}

async function getCategoryFromIDB(categoryId: string) {
  const db = getDB();

  const category = await db.categories.get(categoryId);
  if (!category) return null;

  const budget = await db.budgets.get(category.budget_id);
  if (!budget) return null;

  const allCategories = await db.categories
    .where("budget_id")
    .equals(category.budget_id)
    .toArray();

  const items = await db.budget_items
    .where("category_id")
    .equals(categoryId)
    .toArray();

  // Compute otherAllocated: sum of planned_amount from all OTHER categories
  let otherAllocated = 0;
  for (const cat of allCategories) {
    if (cat.id === categoryId) continue;
    const catItems = await db.budget_items
      .where("category_id")
      .equals(cat.id)
      .toArray();
    otherAllocated += catItems.reduce((s, i) => s + Number(i.planned_amount), 0);
  }

  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    allocated: items.reduce((s, i) => s + Number(i.planned_amount), 0),
    totalBudget: Number(budget.total_budget),
    otherAllocated,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      planned: Number(item.planned_amount),
      actual: Number(item.actual_amount),
    })),
  };
}

export function useCategoryData(categoryId: string) {
  return useQuery({
    queryKey: categoryDataKey(categoryId),
    queryFn: async () => {
      const local = await getCategoryFromIDB(categoryId);
      if (local) return local;
      // IDB miss — fall back to server (only on first ever load or cache clear)
      return getCategoryData(categoryId);
    },
    enabled: !!categoryId,
  });
}
