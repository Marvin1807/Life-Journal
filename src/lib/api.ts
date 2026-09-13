import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UnauthorizedError, requireUser, type SessionUser } from "@/lib/auth";

export type ApiContext = { user: SessionUser };

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Wraps a route handler with authentication and uniform error handling. */
export function withUser<TArgs extends unknown[]>(
  handler: (ctx: ApiContext, ...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      const user = await requireUser();
      return await handler({ user }, ...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Same as withUser but for public routes (login, register, ...). */
export function publicRoute<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) return fail("Nicht angemeldet", 401);
  if (err instanceof ZodError) {
    return fail("Ungültige Eingabe", 422, {
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof ApiError) return fail(err.message, err.status);
  console.error("[api]", err);
  return fail("Unerwarteter Serverfehler", 500);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Ungültiger Request-Body", 400);
  }
  return schema.parse(body);
}

export function searchParam(request: Request, key: string): string | null {
  return new URL(request.url).searchParams.get(key);
}
