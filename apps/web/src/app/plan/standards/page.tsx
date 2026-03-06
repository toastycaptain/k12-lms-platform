"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import FrameworkBrowser from "@/curriculum/frameworks/FrameworkBrowser";

export default function StandardsBrowserPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Framework Browser</h1>
          <FrameworkBrowser />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
