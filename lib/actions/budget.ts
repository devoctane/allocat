"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type BudgetItemRow = Database["public"]["Tables"]["budget_items"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type CategoryWithItems = CategoryRow & {
  budget_items: BudgetItemRow[] | null;
};
type PlannedBudgetItem = Pick<BudgetItemRow, "planned_amount">;
type CategoryItemsSnapshot = {
  budget_items: PlannedBudgetItem[] | null;
};
type CategoryAllocationSnapshot = Pick<CategoryRow, "id" | "budget_id"> & {
  budget_items: PlannedBudgetItem[] | null;
};

function getPlannedAllocation(items: PlannedBudgetItem[] | null | undefined) {
  return (items || []).reduce((sum, item) => sum + Number(item.planned_amount || 0), 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

async function getBudgetAllocationContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string
) {
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, budget_id, budget_items(planned_amount)")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (categoryError) throw new Error(categoryError.message);

  const categorySnapshot = category as CategoryAllocationSnapshot;

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("total_budget")
    .eq("id", categorySnapshot.budget_id)
    .eq("user_id", userId)
    .single();

  if (budgetError) throw new Error(budgetError.message);

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, budget_items(planned_amount)")
    .eq("budget_id", categorySnapshot.budget_id)
    .eq("user_id", userId);

  if (categoriesError) throw new Error(categoriesError.message);

  const currentCategoryAllocated = getPlannedAllocation(categorySnapshot.budget_items);
  const otherAllocated = ((categories || []) as CategoryAllocationSnapshot[]).reduce((sum, currentCategory) => {
    if (currentCategory.id === categoryId) return sum;
    return sum + getPlannedAllocation(currentCategory.budget_items);
  }, 0);

  return {
    budgetId: categorySnapshot.budget_id,
    totalBudget: Number(budget.total_budget || 0),
    currentCategoryAllocated,
    otherAllocated,
    totalAllocated: otherAllocated + currentCategoryAllocated,
  };
}

function validateBudgetAllocationChange(
  context: Awaited<ReturnType<typeof getBudgetAllocationContext>>,
  nextCategoryAllocated: number
) {
  const nextTotalAllocated = context.otherAllocated + nextCategoryAllocated;
  const isIncreasingPastBudget =
    nextTotalAllocated > context.totalBudget &&
    nextTotalAllocated > context.totalAllocated;

  if (!isIncreasingPastBudget) return;

  if (context.totalBudget <= 0) {
    throw new Error("Set the Total Budget before allocating more items.");
  }

  const overBy = nextTotalAllocated - context.totalBudget;
  throw new Error(
    `This change exceeds the total budget by ${formatCurrency(overBy)}. Reduce another category or increase the total budget first.`
  );
}

async function syncCategoryAllocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string
) {
  const { data: items, error: itemsError } = await supabase
    .from("budget_items")
    .select("planned_amount")
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (itemsError) throw new Error(itemsError.message);

  const allocatedAmount = getPlannedAllocation(items as PlannedBudgetItem[]);

  const { error: updateError } = await supabase
    .from("categories")
    .update({ allocated_amount: allocatedAmount })
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);
}

export async function getBudgetForPeriod(month: number, year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get or create budget
  let { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (!budget) {
    const { data: newBudget } = await supabase
      .from("budgets")
      .insert({ user_id: user.id, month, year, total_budget: 0 })
      .select()
      .single();
    budget = newBudget;
  }

  // Fetch categories and items
  const { data: categories } = await supabase
    .from("categories")
    .select("*, budget_items(*)")
    .eq("budget_id", budget!.id)
    .order("created_at");

  const formattedCategories = ((categories || []) as CategoryWithItems[]).map((cat) => {
    let spent = 0;
    cat.budget_items?.forEach((item) => {
      spent += Number(item.actual_amount || 0);
    });

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      allocated: getPlannedAllocation(cat.budget_items),
      spent,
      subtitle: `${cat.budget_items?.length || 0} items`,
    };
  });

  return {
    id: budget!.id,
    month: budget!.month,
    year: budget!.year,
    totalBudget: Number(budget!.total_budget || 0),
    categories: formattedCategories,
  };
}

export async function addBudgetCategory(
  budgetId: string,
  name: string,
  type: Database["public"]["Tables"]["categories"]["Insert"]["type"] = "misc"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Category name is required");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      budget_id: budgetId,
      user_id: user.id,
      name: trimmedName,
      type,
      allocated_amount: 0,
      icon: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBudgetTotal(budgetId: string, totalAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (totalAmount < 0) {
    throw new Error("Total budget must be 0 or more.");
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("budget_items(planned_amount)")
    .eq("budget_id", budgetId)
    .eq("user_id", user.id);

  if (categoriesError) throw new Error(categoriesError.message);

  const totalAllocated = ((categories || []) as CategoryItemsSnapshot[]).reduce((sum, category) => {
    return sum + getPlannedAllocation(category.budget_items);
  }, 0);

  if (totalAmount < totalAllocated) {
    throw new Error(
      `Total budget can't be lower than the allocated amount of ${formatCurrency(totalAllocated)}. Reduce item allocations first.`
    );
  }

  const { data, error } = await supabase
    .from("budgets")
    .update({ total_budget: totalAmount })
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategoryAllocation(categoryId: string, allocatedAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("categories")
    .update({ allocated_amount: allocatedAmount })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategoryIcon(categoryId: string, icon: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("categories")
    .update({ icon })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategoryName(categoryId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return true;
}

export async function addBudgetItem(categoryId: string, name: string, planned: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Item name is required");
  if (planned < 0) throw new Error("Allocation must be 0 or more.");

  const allocationContext = await getBudgetAllocationContext(supabase, user.id, categoryId);
  validateBudgetAllocationChange(
    allocationContext,
    allocationContext.currentCategoryAllocated + Number(planned || 0)
  );

  const { data, error } = await supabase
    .from("budget_items")
    .insert({
      category_id: categoryId,
      user_id: user.id,
      name: trimmedName,
      planned_amount: planned,
      actual_amount: 0,
      is_completed: false
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await syncCategoryAllocation(supabase, user.id, categoryId);
  return data;
}

export async function updateBudgetItem(itemId: string, updates: { name?: string, planned_amount?: number, actual_amount?: number, is_completed?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existingItem, error: existingItemError } = await supabase
    .from("budget_items")
    .select("id, category_id, planned_amount")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (existingItemError) throw new Error(existingItemError.message);

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error("Item name is required");
  }

  if (updates.planned_amount !== undefined) {
    if (updates.planned_amount < 0) {
      throw new Error("Allocation must be 0 or more.");
    }

    const allocationContext = await getBudgetAllocationContext(
      supabase,
      user.id,
      existingItem.category_id
    );

    const nextCategoryAllocated =
      allocationContext.currentCategoryAllocated -
      Number(existingItem.planned_amount || 0) +
      Number(updates.planned_amount || 0);

    validateBudgetAllocationChange(allocationContext, nextCategoryAllocated);
  }

  const { data, error } = await supabase
    .from("budget_items")
    .update({
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (updates.planned_amount !== undefined) {
    await syncCategoryAllocation(supabase, user.id, existingItem.category_id);
  }
  return data;
}

export async function deleteBudgetItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existingItem, error: existingItemError } = await supabase
    .from("budget_items")
    .select("category_id")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (existingItemError) throw new Error(existingItemError.message);

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  await syncCategoryAllocation(supabase, user.id, existingItem.category_id);
  return true;
}

export async function getCategoryItems(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .order("created_at");

  if (error) throw new Error(error.message);

  return data.map(item => ({
    ...item,
    planned: item.planned_amount,
    remaining: item.planned_amount - item.actual_amount,
  }));
}

export async function quickLogSpend(itemId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: item } = await supabase
    .from("budget_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) throw new Error("Item not found");

  const newActual = Number(item.actual_amount) + Number(amount);

  const { data: updatedItem, error } = await supabase
    .from("budget_items")
    .update({ actual_amount: newActual })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    itemName: updatedItem.name,
    remaining: updatedItem.planned_amount - updatedItem.actual_amount,
    planned: updatedItem.planned_amount,
    actual: updatedItem.actual_amount,
  };
}

export async function getCategoryData(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: category } = await supabase
    .from("categories")
    .select("*, budget_items(*)")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!category) return null;

  const categoryWithItems = category as CategoryWithItems;
  const allocationContext = await getBudgetAllocationContext(supabase, user.id, categoryId);

  return {
    id: categoryWithItems.id,
    name: categoryWithItems.name,
    icon: categoryWithItems.icon,
    allocated: getPlannedAllocation(categoryWithItems.budget_items),
    totalBudget: allocationContext.totalBudget,
    otherAllocated: allocationContext.otherAllocated,
    items: (categoryWithItems.budget_items || []).map((item) => ({
      id: item.id,
      name: item.name,
      planned: Number(item.planned_amount || 0),
      actual: Number(item.actual_amount || 0),
    })),
  };
}
