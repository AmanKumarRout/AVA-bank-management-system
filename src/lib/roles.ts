import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "user";

export async function getUserRole(userId: string): Promise<UserRole> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error) return (data?.role as UserRole) ?? "user";

    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("Could not load user role");
}