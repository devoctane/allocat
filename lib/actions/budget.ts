"use server";

import { createClient } from "@/lib/supabase/server";

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

    // Create default categories for new budget
    if (budget) {
      const defaultCategories = [
        { name: "Housing", type: "needs", allocated_amount: 0 },
        { name: "Food", type: "needs", allocated_amount: 0 },
        { name: "Transportation", type: "needs", allocated_amount: 0 },
        { name: "Entertainment", type: "wants", allocated_amount: 0 },
        { name: "Savings", type: "investments", allocated_amount: 0 },
      ] as const;

      await supabase.from("categories").insert(
        defaultCategories.map((c) => ({
          ...c,
          budget_id: budget.id,
          user_id: user.id,
        }))
      );
    }
  }

  // Fetch categories and items
  const { data: categories } = await supabase
    .from("categories")
    .select("*, budget_items(*)")
    .eq("budget_id", budget!.id)
    .order("created_at");

  const formattedCategories = (categories || []).map((cat: any) => {
    let spent = 0;
    cat.budget_items?.forEach((item: any) => {
      spent += Number(item.actual_amount || 0);
    });

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      allocated: Number(cat.allocated_amount || 0),
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

export async function updateBudgetTotal(budgetId: string, totalAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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

  const { data, error } = await supabase
    .from("budget_items")
    .insert({
      category_id: categoryId,
      user_id: user.id,
      name,
      planned_amount: planned,
      actual_amount: 0,
      is_completed: false
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBudgetItem(itemId: string, updates: { name?: string, planned_amount?: number, actual_amount?: number, is_completed?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("budget_items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBudgetItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
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

  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    allocated: Number(category.allocated_amount || 0),
    items: (category.budget_items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      planned: Number(item.planned_amount || 0),
      actual: Number(item.actual_amount || 0),
    })),
  };
}
