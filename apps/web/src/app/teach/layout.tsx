"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={["admin", "teacher"]}>{children}</ProtectedRoute>;
}
