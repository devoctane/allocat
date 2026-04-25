import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ActivityCategory = "budget" | "net_worth" | "goals" | "debts";

export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    action_type: string;
    category: ActivityCategory;
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action_type: payload.action_type,
    category: payload.category,
    title: payload.title,
    description: payload.description,
    metadata: payload.metadata ?? {},
  });
}

export function fmt(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
