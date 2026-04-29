import type { Session } from "@supabase/supabase-js";
import { getCurrentUserRole } from "@/server/roles.functions";

type UserRole = "admin" | "user";

export async function getUserRole(session: Pick<Session, "access_token">): Promise<UserRole> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await getCurrentUserRole({ data: { accessToken: session.access_token } });
      return result.role as UserRole;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("Could not load user role");
}
