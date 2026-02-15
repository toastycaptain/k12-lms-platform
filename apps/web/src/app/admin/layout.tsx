"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={["admin"]}>{children}</ProtectedRoute>;
}
