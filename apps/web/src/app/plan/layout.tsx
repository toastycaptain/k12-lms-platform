"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SchoolRequired from "@/components/SchoolRequired";
import { ErrorBoundary } from "@k12/ui";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "curriculum_lead", "teacher"]}>
      <ErrorBoundary>
        <SchoolRequired>{children}</SchoolRequired>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
