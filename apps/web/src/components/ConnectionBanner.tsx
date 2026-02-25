"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function ConnectionBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800"
      >
        You are offline. Changes will sync when your connection is restored.
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div
        role="status"
        className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800"
      >
        Connection restored. Refreshing data...
      </div>
    );
  }

  return null;
}
