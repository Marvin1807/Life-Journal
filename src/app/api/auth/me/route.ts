import { getCurrentUser } from "@/lib/auth";
import { ok, publicRoute } from "@/lib/api";

export const GET = publicRoute(async () => {
  const user = await getCurrentUser();
  return ok({ user });
});
