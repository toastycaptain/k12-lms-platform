"use client";

import { useEffect, useState } from "react";

const RECOVERY_BANNER_MS = 3000;

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

function initialOnlineStatus(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: initialOnlineStatus(),
    wasOffline: false,
    lastOnlineAt: null,
  });

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setStatus((previous) => {
        const recovered = previous.isOnline === false || previous.wasOffline;
        return {
          isOnline: true,
          wasOffline: recovered,
          lastOnlineAt: new Date(),
        };
      });

      if (resetTimer) {
        clearTimeout(resetTimer);
      }

      resetTimer = setTimeout(() => {
        setStatus((previous) => ({ ...previous, wasOffline: false }));
      }, RECOVERY_BANNER_MS);
    };

    const handleOffline = () => {
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }

      setStatus((previous) => ({
        ...previous,
        isOnline: false,
        wasOffline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, []);

  return status;
}
