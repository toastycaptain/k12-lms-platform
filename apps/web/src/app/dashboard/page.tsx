"use client";

import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AppShell>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.first_name} {user?.last_name}
        </h1>
        <p className="mt-2 text-gray-600">Dashboard content coming soon.</p>
      </AppShell>
    </ProtectedRoute>
  );
}
