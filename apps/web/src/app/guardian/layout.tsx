"use client";

import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

const GUARDIAN_ROLES = ["guardian"];

export default function GuardianLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={GUARDIAN_ROLES}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
