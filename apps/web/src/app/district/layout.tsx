"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DistrictLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["district_admin"]}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
