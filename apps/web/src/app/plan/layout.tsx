"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@k12/ui";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "curriculum_lead", "teacher"]}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ProtectedRoute>
  );
}
