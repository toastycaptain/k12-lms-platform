"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@k12/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ProtectedRoute>
  );
}
