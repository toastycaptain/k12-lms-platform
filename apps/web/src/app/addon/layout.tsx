"use client";

import type { ReactNode } from "react";

export default function AddonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[350px] p-3">{children}</div>
    </div>
  );
}
