"use client";

import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            ◐
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--ink-2)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="card p-5">{children}</div>
        {footer && (
          <div className="mt-5 text-center text-[14px]" style={{ color: "var(--ink-2)" }}>
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
