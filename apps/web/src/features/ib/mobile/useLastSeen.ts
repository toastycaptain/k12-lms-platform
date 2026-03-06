"use client";

import { useEffect, useMemo, useState } from "react";

function readLastSeen(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  return typeof window.localStorage?.getItem === "function"
    ? window.localStorage.getItem(storageKey)
    : null;
}

function writeLastSeen(storageKey: string, value: string) {
  if (typeof window === "undefined") return;
  if (typeof window.localStorage?.setItem === "function") {
    window.localStorage.setItem(storageKey, value);
  }
}

export function useChangedSinceLastSeen<T extends { updatedAt?: string | null }>(
  storageKey: string,
  items: T[],
) {
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    setLastSeen(readLastSeen(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (items.length === 0) return;
    const value = new Date().toISOString();
    writeLastSeen(storageKey, value);
  }, [items.length, storageKey]);

  return useMemo(
    () => ({
      lastSeen,
      changedCount: items.filter((item) => {
        if (!lastSeen || !item.updatedAt) return false;
        return new Date(item.updatedAt).getTime() > new Date(lastSeen).getTime();
      }).length,
    }),
    [items, lastSeen],
  );
}
