"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { api } from "@/lib/client";
import { QuickAdd } from "@/components/QuickAdd";
import { NotificationScheduler } from "@/components/NotificationScheduler";

type NavItem = { href: string; label: string; icon: ReactNode };

const PRIMARY: NavItem[] = [
  { href: "/heute", label: "Heute", icon: <IconToday /> },
  { href: "/kalender", label: "Kalender", icon: <IconCalendar /> },
  { href: "/aufgaben", label: "Aufgaben", icon: <IconCheck /> },
  { href: "/fitness", label: "Fitness", icon: <IconDumbbell /> },
];

const SECONDARY: NavItem[] = [
  { href: "/ernaehrung", label: "Ernährung", icon: <IconMeal /> },
  { href: "/ziele", label: "Ziele", icon: <IconTarget /> },
  { href: "/statistiken", label: "Statistiken", icon: <IconChart /> },
  { href: "/einstellungen", label: "Einstellungen", icon: <IconGear /> },
];

const ALL = [...PRIMARY, ...SECONDARY];

export function AppShell({
  user,
  theme,
  timezone,
  children,
}: {
  user: { id: string; email: string; name: string };
  theme: string;
  /** The user's configured timezone decides which day "heute" is. */
  timezone: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // Keep the stored theme in sync with the server-side setting.
  useEffect(() => {
    try {
      if (theme === "light" || theme === "dark") {
        localStorage.setItem("lj-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
      } else {
        localStorage.removeItem("lj-theme");
        document.documentElement.removeAttribute("data-theme");
      }
    } catch {
      /* private mode — ignore */
    }
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await api.post("/api/auth/logout");
    router.push("/anmelden");
    router.refresh();
  }

  const isSecondary = SECONDARY.some((i) => pathname.startsWith(i.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-5 md:flex"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            ◐
          </span>
          <span className="text-[15px] font-semibold">Life Journal</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {ALL.map((entry) => (
            <SidebarLink key={entry.href} item={entry} active={pathname.startsWith(entry.href)} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="btn btn-primary mt-4"
        >
          <span className="text-lg leading-none">+</span> Schnell erfassen
        </button>

        <div className="mt-auto px-2 pt-4">
          <p className="truncate text-[13px] font-medium">{user.name || "Angemeldet"}</p>
          <p className="truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
            {user.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-[13px]"
            style={{ color: "var(--ink-3)" }}
          >
            Abmelden
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:pb-10 md:pt-7">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--surface) 92%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="grid grid-cols-5">
          {PRIMARY.map((entry) => (
            <TabLink key={entry.href} item={entry} active={pathname.startsWith(entry.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium"
            style={{ color: isSecondary ? "var(--accent)" : "var(--ink-3)" }}
          >
            <IconMore />
            Mehr
          </button>
        </div>
      </nav>

      {/* Mobile quick-add button */}
      <button
        type="button"
        onClick={() => setQuickOpen(true)}
        aria-label="Schnell erfassen"
        className="fixed bottom-[74px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-[26px] shadow-lg md:hidden"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        +
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fade-in absolute inset-0"
            style={{ background: "rgba(10,10,14,0.45)" }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="sheet-panel safe-bottom absolute inset-x-0 bottom-0 rounded-t-[20px] px-3 pb-3 pt-2"
            style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full"
              style={{ background: "var(--surface-3)" }}
            />
            {SECONDARY.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px]"
                style={{ color: pathname.startsWith(entry.href) ? "var(--accent)" : "var(--ink)" }}
              >
                {entry.icon}
                {entry.label}
              </Link>
            ))}
            <div className="my-2 h-px" style={{ background: "var(--line)" }} />
            <div className="px-3 py-2">
              <p className="truncate text-[13px] font-medium">{user.name || "Angemeldet"}</p>
              <p className="truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px]"
              style={{ color: "var(--danger)" }}
            >
              <IconLogout />
              Abmelden
            </button>
          </div>
        </div>
      )}

      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} timezone={timezone} />
      <NotificationScheduler />
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium")}
      style={{
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink-2)",
      }}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium"
      style={{ color: active ? "var(--accent)" : "var(--ink-3)" }}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

/* ------------------------------- icons ---------------------------------- */

const iconProps = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconToday() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h10M4 12h7M4 17h5" />
      <path d="m15 16 2 2 4-4" />
    </svg>
  );
}
function IconDumbbell() {
  return (
    <svg {...iconProps}>
      <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />
    </svg>
  );
}
function IconMeal() {
  return (
    <svg {...iconProps}>
      <path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 3c-1.5 2-2 3.5-2 6 0 1.5.5 2 2 2s2-.5 2-2c0-2.5-.5-4-2-6ZM17 11v10" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg {...iconProps}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
