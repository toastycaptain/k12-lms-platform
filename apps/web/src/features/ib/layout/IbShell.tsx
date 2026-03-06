"use client";

import type { ReactNode } from "react";

export function IbShell({ children }: { children: ReactNode }) {
  return (
    <div data-ib-shell="true" className="space-y-6">
      {children}
    </div>
  );
}
