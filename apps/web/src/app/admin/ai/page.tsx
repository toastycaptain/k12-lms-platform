"use client";

import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AiSettingsPage() {
  const { user } = useAuth();
  const canAccess = user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators and curriculum leads.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-sm text-gray-600">
            AI provider and policy controls are managed through the API-backed M6 configuration surfaces.
          </p>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
