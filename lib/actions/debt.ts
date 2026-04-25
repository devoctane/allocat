"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity, fmt } from "@/lib/server/activity-logger";

export async function getDebtData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: debts, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (debts || []).map(d => ({
    id: d.id,
    name: d.name,
    icon: d.icon,
    type: d.type,
    principal: Number(d.principal),
    interestRate: Number(d.interest_rate),
    monthlyMin: Number(d.monthly_minimum),
    totalPaid: Number(d.total_paid),
    expectedPayoffDate: d.expected_payoff_date,
    isClosed: d.is_closed,
  }));
}

export async function addDebt(
  name: string,
  type: "internal" | "external" | "lent",
  principal: number,
  interestRate: number,
  monthlyMin: number,
  expectedPayoffDate?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: user.id,
      name,
      type,
      principal,
      interest_rate: interestRate,
      monthly_minimum: monthlyMin,
      total_paid: 0,
      expected_payoff_date: expectedPayoffDate || null,
      is_closed: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, user.id, {
    action_type: "debt_added",
    category: "debts",
    title: `Added debt "${name}"`,
    description: `New ${type} debt "${name}" with principal ${fmt(principal)}`,
    metadata: { debtId: data.id, name, type, principal },
  });

  return data;
}

export async function updateDebt(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("debts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const debtName = data.name;
  let title: string;
  let action_type: string;
  if (updates.is_closed !== undefined) {
    action_type = updates.is_closed ? "debt_closed" : "debt_reopened";
    title = updates.is_closed ? `Closed debt "${debtName}"` : `Reopened debt "${debtName}"`;
  } else if (updates.principal !== undefined) {
    action_type = "debt_principal_updated";
    title = `Updated "${debtName}" principal to ${fmt(updates.principal)}`;
  } else if (updates.name !== undefined) {
    action_type = "debt_renamed";
    title = `Renamed debt to "${updates.name}"`;
  } else {
    action_type = "debt_updated";
    title = `Updated debt "${debtName}"`;
  }

  await logActivity(supabase, user.id, {
    action_type,
    category: "debts",
    title,
    description: title,
    metadata: {
      debtId: id,
      name: debtName,
      ...(updates.principal !== undefined ? { principal: updates.principal } : {}),
    },
  });

  return data;
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: debt } = await supabase
    .from("debts")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, user.id, {
    action_type: "debt_deleted",
    category: "debts",
    title: `Deleted debt "${debt?.name ?? id}"`,
    description: `Debt "${debt?.name ?? id}" was removed`,
    metadata: { debtId: id, name: debt?.name ?? null },
  });

  return true;
}

export async function updateDebtIcon(id: string, icon: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("debts")
    .update({ icon })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function makePayment(id: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: debt } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!debt) throw new Error("Debt not found");

  const newTotalPaid = Number(debt.total_paid) + Number(amount);
  const isClosed = newTotalPaid >= Number(debt.principal);

  const { data, error } = await supabase
    .from("debts")
    .update({
      total_paid: newTotalPaid,
      is_closed: isClosed || debt.is_closed
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(supabase, user.id, {
    action_type: "debt_payment_made",
    category: "debts",
    title: `Paid ${fmt(amount)} toward "${debt.name}"`,
    description: `Payment of ${fmt(amount)} made on "${debt.name}"`,
    metadata: { debtId: id, debtName: debt.name, amount, totalPaid: newTotalPaid },
  });

  return data;
}
