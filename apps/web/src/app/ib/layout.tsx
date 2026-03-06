"use client";

import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { IbShell } from "@/features/ib/layout/IbShell";

const IB_ROLES = ["admin", "curriculum_lead", "teacher", "student", "guardian", "district_admin"];

export default function IbLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={IB_ROLES}>
      <AppShell>
        <IbShell>{children}</IbShell>
      </AppShell>
    </ProtectedRoute>
  );
}
