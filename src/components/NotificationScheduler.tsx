"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/client";
import { formatTime, minutesNowInTimezone, todayInTimezone } from "@/lib/time";
import type { DayPayload } from "@/lib/types";

const CATEGORY_TOGGLE: Record<string, keyof DayPayload["settings"]> = {
  meal: "notifyMeals",
  fitness: "notifyWorkout",
  development: "notifyGoals",
};

/**
 * Reminders for the current day (spec §37).
 *
 * The browser can only deliver these while the app is open — there is no push
 * server — so the settings page says exactly that. Each category can be turned
 * on and off separately, and every block is announced at most once.
 */
export function NotificationScheduler() {
  const notified = useRef<Set<string>>(new Set());
  const payload = useRef<DayPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await api.get<DayPayload>("/api/plan");
        if (!cancelled) payload.current = data;
      } catch {
        /* offline or logged out — try again on the next tick */
      }
    }

    function tick() {
      const data = payload.current;
      if (!data) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const s = data.settings;
      const today = todayInTimezone(s.timezone);
      if (data.day !== today) return;

      const nowMinute = minutesNowInTimezone(s.timezone);
      const lead = s.notifyLeadMinutes;

      for (const block of data.blocks) {
        if (block.status === "done" || block.status === "skipped") continue;
        if (block.category === "sleep") continue;

        const toggle = CATEGORY_TOGGLE[block.category];
        const enabled = toggle ? Boolean(s[toggle]) : s.notifyUpcoming;
        if (!enabled) continue;

        const delta = block.startMinute - nowMinute;
        if (delta > lead || delta < 0) continue;

        const key = `${data.day}:${block.id}`;
        if (notified.current.has(key)) continue;
        notified.current.add(key);

        const body =
          delta <= 0
            ? `Beginnt jetzt · ${formatTime(block.startMinute)}`
            : `Beginnt in ${delta} Minuten · ${formatTime(block.startMinute)}`;

        try {
          new Notification(block.title, { body, tag: key, icon: "/icons/icon-192.png" });
        } catch {
          /* some browsers only allow notifications from a service worker */
        }
      }
    }

    void refresh();
    const refreshId = setInterval(refresh, 5 * 60_000);
    const tickId = setInterval(tick, 30_000);

    return () => {
      cancelled = true;
      clearInterval(refreshId);
      clearInterval(tickId);
    };
  }, []);

  return null;
}
