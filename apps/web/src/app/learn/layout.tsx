"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@k12/ui";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "teacher", "student"]}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ProtectedRoute>
  );
}
