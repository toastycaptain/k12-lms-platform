"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

const PORTFOLIO_LIVE_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_LIVE_ENABLED === "true";

function trackPortfolioEvent(eventName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portfolio-analytics", { detail: { event: eventName } }));
  }
}

export default function LearnPortfolioPage() {
  const [showNotifyConfirmation, setShowNotifyConfirmation] = useState(false);

  const statusMessage = useMemo(() => {
    if (PORTFOLIO_LIVE_ENABLED) {
      return "Portfolio live mode is flagged on, but this route is still using the placeholder in this release.";
    }
    return "Portfolio is coming soon. You will be able to publish your work in a future update.";
  }, []);

  return (
    <ProtectedRoute requiredRoles={["student"]}>
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
            <p className="mt-1 text-sm text-gray-500">Portfolio is coming soon.</p>
          </header>

          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              P
            </div>
            <p className="mt-4 text-sm text-gray-700">{statusMessage}</p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
              >
                Add Portfolio Entry
              </button>

              <button
                type="button"
                onClick={() => {
                  trackPortfolioEvent("portfolio_notify_clicked");
                  setShowNotifyConfirmation(true);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Notify me when available
              </button>
            </div>

            {showNotifyConfirmation ? (
              <p className="mt-4 text-sm text-green-700">
                Thanks. We&apos;ll notify you when portfolio publishing is available.
              </p>
            ) : null}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
