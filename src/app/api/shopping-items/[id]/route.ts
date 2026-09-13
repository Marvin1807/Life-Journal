import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shoppingListItems } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { shoppingItemUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, shoppingItemUpdateSchema);
  const [row] = await db
    .update(shoppingListItems)
    .set(input)
    .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Eintrag nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(shoppingListItems)
    .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Eintrag nicht gefunden", 404);
  return ok({ id });
});
