"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SchoolRequired from "@/components/SchoolRequired";
import { ErrorBoundary } from "@k12/ui";

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "teacher"]}>
      <ErrorBoundary>
        <SchoolRequired>{children}</SchoolRequired>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
