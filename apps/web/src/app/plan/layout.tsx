"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "curriculum_lead", "teacher"]}>
      {children}
    </ProtectedRoute>
  );
}
