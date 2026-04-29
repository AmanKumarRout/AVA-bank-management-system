import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getVerifiedRoleFromToken } from "./roles.server";

export const getCurrentUserRole = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ accessToken: z.string().min(10) }).parse(data),
  )
  .handler(async ({ data }) => {
    const role = await getVerifiedRoleFromToken(data.accessToken);
    return { role };
  });