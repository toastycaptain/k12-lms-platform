"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { announce } from "@k12/ui";
import { useToast } from "@k12/ui";

export default function SetupPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const rolesLabel = useMemo(() => (user?.roles || []).join(", ") || "member", [user?.roles]);
  const isAdmin = user?.roles?.includes("admin") || false;

  useEffect(() => {
    if (user?.onboarding_complete) {
      router.replace("/dashboard");
    }
  }, [router, user?.onboarding_complete]);

  async function completeOnboarding() {
    setSaving(true);

    try {
      await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          onboarding_complete: true,
        }),
      });
      await refresh();
      announce("Setup complete");
      router.push("/dashboard");
    } catch {
      announce("Unable to save setup progress");
      addToast("error", "Unable to save setup progress.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">First-Time Setup</h1>
            <p className="mt-1 text-sm text-gray-600">Step {step} of 3</p>
          </header>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">Welcome!</h2>
                <p className="text-sm text-gray-700">
                  Welcome to your K-12 LMS workspace. We will get your account ready in a few quick
                  steps.
                </p>
                <p className="text-sm text-gray-600">Your role: {rolesLabel}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">Quick Tour</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    <span className="font-semibold">Plan:</span> Build units, lessons, and standards
                    alignment.
                  </li>
                  <li>
                    <span className="font-semibold">Plan Context:</span> Pick grade level and
                    subject when starting new material in Plan.
                  </li>
                  {isAdmin ? (
                    <li>
                      <span className="font-semibold">Curriculum Profiles:</span> Set tenant
                      defaults and school overrides in{" "}
                      <Link
                        href="/admin/curriculum-profiles"
                        className="text-blue-700 underline hover:text-blue-800"
                      >
                        Admin &gt; Curriculum Profiles
                      </Link>
                      .
                    </li>
                  ) : (
                    <li>
                      <span className="font-semibold">Curriculum Context:</span> Your planner and
                      course experience will reflect your admin&apos;s configured curriculum
                      profile.
                    </li>
                  )}
                  <li>
                    <span className="font-semibold">Teach:</span> Organize courses, modules, and
                    assignments.
                  </li>
                  <li>
                    <span className="font-semibold">Assess:</span> Create quizzes and review
                    performance.
                  </li>
                </ul>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">You are all set</h2>
                <p className="text-sm text-gray-700">
                  Your workspace is ready. Choose what you want to do next.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/plan/units/new"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Create Your First Unit
                  </Link>
                  <Link
                    href="/plan/templates"
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Browse Templates
                  </Link>
                </div>
              </div>
            )}
          </section>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => void completeOnboarding()}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={saving}
            >
              Skip Setup
            </button>
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((previous) => Math.max(1, previous - 1))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((previous) => Math.min(3, previous + 1))}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void completeOnboarding()}
                  disabled={saving}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Finishing..." : "Finish Setup"}
                </button>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
