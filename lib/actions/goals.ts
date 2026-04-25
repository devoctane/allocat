"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity, fmt } from "@/lib/server/activity-logger";

export async function getGoalsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("priority")
    .order("created_at");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addGoal(name: string, targetAmount: number, notes?: string | null, priority?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      name,
      target_amount: targetAmount,
      current_amount: 0,
      notes: notes ?? null,
      priority: priority ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, user.id, {
    action_type: "goal_added",
    category: "goals",
    title: `Created goal "${name}"`,
    description: `New savings goal "${name}" with target ${fmt(targetAmount)}`,
    metadata: { goalId: data.id, name, target_amount: targetAmount },
  });

  return data;
}

export async function updateGoal(id: string, updates: { name?: string; current_amount?: number; target_amount?: number; notes?: string | null; priority?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const goalName = data.name;
  let title: string;
  let action_type: string;
  if (updates.current_amount !== undefined) {
    action_type = "goal_progress_updated";
    title = `Updated "${goalName}" progress to ${fmt(updates.current_amount)}`;
  } else if (updates.target_amount !== undefined) {
    action_type = "goal_target_updated";
    title = `Set "${goalName}" target to ${fmt(updates.target_amount)}`;
  } else if (updates.name !== undefined) {
    action_type = "goal_renamed";
    title = `Renamed goal to "${updates.name}"`;
  } else {
    action_type = "goal_updated";
    title = `Updated goal "${goalName}"`;
  }

  await logActivity(supabase, user.id, {
    action_type,
    category: "goals",
    title,
    description: title,
    metadata: {
      goalId: id,
      name: goalName,
      ...(updates.current_amount !== undefined ? { current_amount: updates.current_amount } : {}),
      ...(updates.target_amount !== undefined ? { target_amount: updates.target_amount } : {}),
    },
  });

  return data;
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: goal } = await supabase
    .from("goals")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, user.id, {
    action_type: "goal_deleted",
    category: "goals",
    title: `Deleted goal "${goal?.name ?? id}"`,
    description: `Savings goal "${goal?.name ?? id}" was deleted`,
    metadata: { goalId: id, name: goal?.name ?? null },
  });

  return true;
}

export async function updateGoalIcon(id: string, icon: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("goals")
    .update({ icon })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
