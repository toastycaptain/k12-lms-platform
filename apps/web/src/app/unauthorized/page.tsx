"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UnauthorizedPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-900">Access Denied</h1>
          <p className="mt-2 text-sm text-red-800">
            You do not have permission to access this page.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
