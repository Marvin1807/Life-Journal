import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shoppingListItems, shoppingLists } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { shoppingItemCreateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, shoppingItemCreateSchema);
  const [list] = await db
    .select({ id: shoppingLists.id })
    .from(shoppingLists)
    .where(and(eq(shoppingLists.id, input.listId), eq(shoppingLists.userId, user.id)))
    .limit(1);
  if (!list) throw new ApiError("Liste nicht gefunden", 404);

  const [row] = await db
    .insert(shoppingListItems)
    .values({ ...input, userId: user.id, manual: true })
    .returning();
  return ok(row, 201);
});
