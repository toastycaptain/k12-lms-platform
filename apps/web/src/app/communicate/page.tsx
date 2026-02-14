"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CommunicatePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Communicate</h1>
          <p className="text-sm text-gray-600">
            Messaging and communication workflows are queued for a follow-up milestone.
          </p>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
            <p className="text-sm text-gray-500">
              This route is intentionally present so primary navigation does not dead-end.
            </p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
