"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@k12/ui";

export default function AssessLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "teacher"]}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ProtectedRoute>
  );
}
