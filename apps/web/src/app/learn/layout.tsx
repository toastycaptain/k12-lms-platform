"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["admin", "teacher", "student"]}>{children}</ProtectedRoute>
  );
}
