import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shoppingLists } from "@/db/schema";
import { ApiError, ok, withUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(shoppingLists)
    .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Liste nicht gefunden", 404);
  return ok({ id });
});
