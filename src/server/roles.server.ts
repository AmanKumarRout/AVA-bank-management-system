import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type UserRole = "admin" | "user";

export async function getVerifiedRoleFromToken(accessToken: string): Promise<UserRole> {
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new Error("Invalid login session");
  }

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;

  return data?.role === "admin" ? "admin" : "user";
}