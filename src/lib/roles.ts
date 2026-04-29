import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "user";

export async function getUserRole(session: Pick<Session, "access_token" | "user">): Promise<UserRole> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role === "admin" ? "admin" : "user";
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }

  console.warn("Could not load user role, defaulting to user access:", lastError);
  return "user";
}
