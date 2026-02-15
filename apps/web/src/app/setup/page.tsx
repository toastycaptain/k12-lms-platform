"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SUBJECT_OPTIONS = ["Math", "Science", "ELA", "Social Studies", "Arts", "PE"];
const GRADE_OPTIONS = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function SetupPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rolesLabel = useMemo(() => (user?.roles || []).join(", ") || "member", [user?.roles]);
  const isTeacherLike = useMemo(
    () =>
      (user?.roles || []).some(
        (role) => role === "teacher" || role === "admin" || role === "curriculum_lead",
      ),
    [user?.roles],
  );

  useEffect(() => {
    if (user?.onboarding_complete) {
      router.replace("/dashboard");
    }
  }, [router, user?.onboarding_complete]);

  useEffect(() => {
    if (!user) return;
    const preferences = user.preferences || {};
    const subjects = Array.isArray(preferences.subjects) ? (preferences.subjects as string[]) : [];
    const gradeLevels = Array.isArray(preferences.grade_levels)
      ? (preferences.grade_levels as string[])
      : [];
    setSelectedSubjects(subjects);
    setSelectedGrades(gradeLevels);
  }, [user]);

  async function completeOnboarding() {
    setSaving(true);
    setError(null);

    try {
      await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          onboarding_complete: true,
          preferences: {
            ...(user?.preferences || {}),
            subjects: selectedSubjects,
            grade_levels: selectedGrades,
          },
        }),
      });
      await refresh();
      router.push("/dashboard");
    } catch {
      setError("Unable to save setup progress.");
    } finally {
      setSaving(false);
    }
  }

  function toggleValue(values: string[], value: string, setValues: (next: string[]) => void) {
    if (values.includes(value)) {
      setValues(values.filter((entry) => entry !== value));
    } else {
      setValues([...values, value]);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">First-Time Setup</h1>
            <p className="mt-1 text-sm text-gray-600">Step {step} of 4</p>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
                {isTeacherLike ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Subjects</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() =>
                              toggleValue(selectedSubjects, subject, setSelectedSubjects)
                            }
                            className={`rounded-full px-3 py-1 text-xs ${
                              selectedSubjects.includes(subject)
                                ? "bg-blue-100 text-blue-800"
                                : "border border-gray-300 text-gray-700"
                            }`}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Grade Levels</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {GRADE_OPTIONS.map((grade) => (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => toggleValue(selectedGrades, grade, setSelectedGrades)}
                            className={`rounded-full px-3 py-1 text-xs ${
                              selectedGrades.includes(grade)
                                ? "bg-blue-100 text-blue-800"
                                : "border border-gray-300 text-gray-700"
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-700">
                    No extra preferences are required for your role. You can adjust profile settings
                    later.
                  </p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">Quick Tour</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    <span className="font-semibold">Plan:</span> Build units, lessons, and standards
                    alignment.
                  </li>
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

            {step === 4 && (
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
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((previous) => Math.min(4, previous + 1))}
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
