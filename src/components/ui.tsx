"use client";

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";
import { formatTime, parseTime } from "@/lib/time";

/* --------------------------------- button -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  busy?: boolean;
};

export function Button({
  variant = "secondary",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || busy}
      className={clsx("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}
    >
      {busy ? <Spinner /> : children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-block h-4 w-4 animate-spin rounded-full border-2", className)}
      style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
      aria-label="Lädt"
    />
  );
}

/* --------------------------------- fields -------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
          {label}
        </span>
      )}
      {children}
      {hint && !error && (
        <span className="mt-1 block text-[12px]" style={{ color: "var(--ink-3)" }}>
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-[12px]" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("field", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("field resize-y", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx("field appearance-none pr-9", props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238e8e98' stroke-width='2.5' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 11px center",
        ...props.style,
      }}
    />
  );
}

/** Time picker working with minutes-since-midnight. */
export function TimeInput({
  value,
  onChange,
  className,
  ...rest
}: {
  value: number;
  onChange: (minutes: number) => void;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      type="time"
      value={formatTime(value)}
      onChange={(e) => onChange(parseTime(e.target.value))}
      className={clsx("field", className)}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={clsx("relative", className)}>
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(Number.isFinite(next) ? next : 0);
        }}
        className="field"
        style={suffix ? { paddingRight: `${suffix.length * 8 + 18}px` } : undefined}
      />
      {suffix && (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px]"
          style={{ color: "var(--ink-3)" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[12px]" style={{ color: "var(--ink-3)" }}>
            {hint}
          </span>
        )}
      </span>
      <span
        className="relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--surface-3)" }}
      >
        <span
          className="absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(23px)" : "translateX(3px)" }}
        />
      </span>
    </button>
  );
}

/** Weekday picker (ISO 1..7). */
export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return (
    <div className="flex gap-1.5">
      {labels.map((label, i) => {
        const day = i + 1;
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b))
            }
            className="h-10 flex-1 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: active ? "var(--accent)" : "var(--surface-2)",
              color: active ? "var(--accent-ink)" : "var(--ink-2)",
              border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------- sheet / dialog ----------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="fade-in absolute inset-0"
        style={{ background: "rgba(10,10,14,0.45)" }}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-[20px] sm:max-w-lg sm:rounded-[20px]"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3.5"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div
            className="safe-bottom flex gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--line)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- misc ---------------------------------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={clsx("card", padded && "p-4", className)}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-5 py-9 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {hint && (
        <p className="max-w-xs text-[13px]" style={{ color: "var(--ink-3)" }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      className="rounded-xl px-3 py-2.5 text-[13px]"
      style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
      role="alert"
    >
      {children}
    </p>
  );
}

export function Pill({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", className)}
      style={{
        background: color ? `color-mix(in srgb, ${color} 16%, transparent)` : "var(--surface-2)",
        color: color ?? "var(--ink-2)",
      }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped}%`, background: color ?? "var(--accent)" }}
      />
    </div>
  );
}

/**
 * Destructive actions need a deliberate second tap. A full dialog on top of an
 * open sheet is awkward on a phone, so the button confirms itself in place.
 */
export function DangerButton({
  label = "Löschen",
  confirmLabel = "Wirklich löschen?",
  onConfirm,
  busy,
  className,
}: {
  label?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <Button
      variant="danger"
      size="sm"
      busy={busy}
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}
