"use server";

import { createClient } from "@/lib/supabase/server";

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
  return data;
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
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
  return data;
}
