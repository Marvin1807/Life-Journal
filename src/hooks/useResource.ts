"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/client";

export type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Refetches from the server. */
  reload: () => Promise<void>;
  /** Replaces the local copy without a round-trip. */
  set: (updater: T | ((current: T) => T)) => void;
};

/** Minimal data hook: fetch on mount, refetch on demand, optimistic updates. */
export function useResource<T>(url: string | null): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.get<T>(url);
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof ApiClientError ? err.message : "Verbindung fehlgeschlagen");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = useCallback((updater: T | ((current: T) => T)) => {
    setData((current) =>
      typeof updater === "function"
        ? current === null
          ? current
          : (updater as (c: T) => T)(current)
        : updater,
    );
  }, []);

  return { data, error, loading, reload: load, set };
}
