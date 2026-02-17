"use client";

import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr";

interface SwrProviderProps {
  children: ReactNode;
}

export default function SwrProvider({ children }: SwrProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
