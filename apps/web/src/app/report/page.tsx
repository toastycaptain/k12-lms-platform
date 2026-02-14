"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-sm text-gray-600">
            Reporting dashboards are planned for a follow-up milestone.
          </p>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
            <p className="text-sm text-gray-500">
              This route exists to preserve navigation parity while reporting views are completed.
            </p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
