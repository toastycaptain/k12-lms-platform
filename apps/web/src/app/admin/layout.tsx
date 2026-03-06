"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SchoolRequired from "@/components/SchoolRequired";
import { ErrorBoundary } from "@k12/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <ErrorBoundary>
        <SchoolRequired>{children}</SchoolRequired>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
