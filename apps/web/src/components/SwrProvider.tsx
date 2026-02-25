"use client";

import { type ReactNode, useEffect } from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { swrConfig } from "@/lib/swr";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { flushQueuedMutations } from "@/lib/offlineMutationQueue";

interface SwrProviderProps {
  children: ReactNode;
}

function RevalidateOnReconnect() {
  const { mutate } = useSWRConfig();
  const { wasOffline } = useNetworkStatus();

  useEffect(() => {
    if (!wasOffline) {
      return;
    }

    void mutate(() => true, undefined, { revalidate: true });
    void flushQueuedMutations();
  }, [mutate, wasOffline]);

  return null;
}

export default function SwrProvider({ children }: SwrProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      <RevalidateOnReconnect />
      {children}
    </SWRConfig>
  );
}
