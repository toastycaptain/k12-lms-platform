"use client";

import { useEffect, useState } from "react";
import { readOfflineStore, writeOfflineStore } from "@/features/ib/offline/offlineStore";

export function useMobilePreference(key: string, defaultValue = false) {
  const [value, setValue] = useState<boolean>(() => readOfflineStore<boolean>(key, defaultValue));

  useEffect(() => {
    setValue(readOfflineStore<boolean>(key, defaultValue));
  }, [defaultValue, key]);

  function update(nextValue: boolean) {
    setValue(nextValue);
    writeOfflineStore(key, nextValue);
  }

  return {
    value,
    setValue: update,
    toggle: () => update(!value),
  };
}
