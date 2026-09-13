import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { shoppingListItems, shoppingLists } from "@/db/schema";
import { ok, withUser } from "@/lib/api";

export const GET = withUser(async ({ user }) => {
  const lists = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, user.id))
    .orderBy(desc(shoppingLists.createdAt))
    .limit(20);

  const items = lists.length
    ? await db
        .select()
        .from(shoppingListItems)
        .where(
          inArray(
            shoppingListItems.listId,
            lists.map((l) => l.id),
          ),
        )
        .orderBy(asc(shoppingListItems.category), asc(shoppingListItems.name))
    : [];

  return ok(lists.map((l) => ({ ...l, items: items.filter((i) => i.listId === l.id) })));
});
