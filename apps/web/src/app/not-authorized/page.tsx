"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NotAuthorizedPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-amber-900">Not Authorized</h1>
          <p className="mt-2 text-sm text-amber-800">
            Your account does not have access to this section.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Return to dashboard
          </Link>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
