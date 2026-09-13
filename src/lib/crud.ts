import "server-only";
import { and, asc, eq, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { ZodType } from "zod";
import { db } from "@/db";
import { ApiError, ok, readJson, withUser } from "@/lib/api";

type AnyTable = PgTable & {
  id: PgColumn;
  userId: PgColumn;
};

type CrudOptions<TCreate, TUpdate> = {
  table: AnyTable;
  createSchema: ZodType<TCreate>;
  updateSchema: ZodType<TUpdate>;
  orderBy?: PgColumn[];
  /** Extra filter applied to list queries. */
  filter?: (request: Request) => SQL | undefined;
  /** Runs after a row is created/updated/deleted (e.g. cascade cleanup). */
  afterWrite?: (userId: string, row: Record<string, unknown>) => Promise<void>;
  /** Transforms validated input before it hits the database. */
  transform?: (input: Record<string, unknown>, userId: string) => Record<string, unknown>;
};

/** GET (list) + POST (create) handlers for a user-scoped table. */
export function collection<TCreate, TUpdate>(opts: CrudOptions<TCreate, TUpdate>) {
  const GET = withUser(async ({ user }, request: Request) => {
    const extra = opts.filter?.(request);
    const where = extra ? and(eq(opts.table.userId, user.id), extra) : eq(opts.table.userId, user.id);
    const query = db.select().from(opts.table).where(where);
    const rows = opts.orderBy?.length
      ? await query.orderBy(...opts.orderBy.map((c) => asc(c)))
      : await query;
    return ok(rows);
  });

  const POST = withUser(async ({ user }, request: Request) => {
    const input = (await readJson(request, opts.createSchema)) as Record<string, unknown>;
    const values = opts.transform ? opts.transform(input, user.id) : input;
    const [row] = await db
      .insert(opts.table)
      .values({ ...values, userId: user.id } as never)
      .returning();
    await opts.afterWrite?.(user.id, row as Record<string, unknown>);
    return ok(row, 201);
  });

  return { GET, POST };
}

/** PATCH (update) + DELETE handlers for a single user-scoped row. */
export function item<TCreate, TUpdate>(opts: CrudOptions<TCreate, TUpdate>) {
  type Params = { params: Promise<{ id: string }> };

  const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
    const { id } = await ctx.params;
    const input = (await readJson(request, opts.updateSchema)) as Record<string, unknown>;
    const values = opts.transform ? opts.transform(input, user.id) : input;
    if (Object.keys(values).length === 0) throw new ApiError("Keine Änderungen übergeben", 400);

    const hasUpdatedAt = "updatedAt" in opts.table;
    const [row] = await db
      .update(opts.table)
      .set({ ...values, ...(hasUpdatedAt ? { updatedAt: new Date() } : {}) } as never)
      .where(and(eq(opts.table.id, id), eq(opts.table.userId, user.id)))
      .returning();

    if (!row) throw new ApiError("Nicht gefunden", 404);
    await opts.afterWrite?.(user.id, row as Record<string, unknown>);
    return ok(row);
  });

  const DELETE = withUser(async ({ user }, _request: Request, ctx: Params) => {
    const { id } = await ctx.params;
    const [row] = await db
      .delete(opts.table)
      .where(and(eq(opts.table.id, id), eq(opts.table.userId, user.id)))
      .returning();
    if (!row) throw new ApiError("Nicht gefunden", 404);
    return ok({ id });
  });

  const GET = withUser(async ({ user }, _request: Request, ctx: Params) => {
    const { id } = await ctx.params;
    const [row] = await db
      .select()
      .from(opts.table)
      .where(and(eq(opts.table.id, id), eq(opts.table.userId, user.id)))
      .limit(1);
    if (!row) throw new ApiError("Nicht gefunden", 404);
    return ok(row);
  });

  return { GET, PATCH, DELETE };
}
