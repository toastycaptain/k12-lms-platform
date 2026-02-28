"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@k12/ui";
import { swrConfig } from "@/lib/swr";

interface Goal {
  id: number;
  student_id: number;
  title: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  target_date: string | null;
  progress_percent: number;
}

const GOAL_STATUSES: Array<Goal["status"]> = ["active", "completed", "archived"];

export default function LearnGoalsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [status, setStatus] = useState<Goal["status"]>("active");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: goals,
    error,
    mutate,
    isLoading,
  } = useSWR<Goal[]>(
    user ? `learn-goals-${user.id}` : null,
    () => apiFetch<Goal[]>("/api/v1/goals"),
    swrConfig,
  );

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await apiFetch<Goal>("/api/v1/goals", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          target_date: targetDate || null,
          progress_percent: progressPercent,
        }),
      });

      setTitle("");
      setDescription("");
      setTargetDate("");
      setProgressPercent(0);
      setStatus("active");
      await mutate();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markCompleted(goal: Goal) {
    setErrorMessage(null);
    try {
      await apiFetch<Goal>(`/api/v1/goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: goal.status === "completed" ? "active" : "completed",
          progress_percent: goal.status === "completed" ? goal.progress_percent : 100,
        }),
      });
      await mutate();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update goal.");
    }
  }

  const activeGoals = (goals || []).filter((goal) => goal.status !== "archived");

  return (
    <ProtectedRoute requiredRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
            <p className="mt-1 text-sm text-gray-500">Create and track your learning goals.</p>
          </header>

          {(error || errorMessage) && (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMessage || "Unable to load goals."}
            </div>
          )}

          <form
            onSubmit={handleCreateGoal}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <h2 className="text-base font-semibold text-gray-900">Add Goal</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-700">
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Improve multiplication fluency"
                  required
                />
              </label>

              <label className="text-sm text-gray-700">
                Target date
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm text-gray-700 md:col-span-2">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Read 20 minutes each day and finish weekly summaries."
                />
              </label>

              <label className="text-sm text-gray-700">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as Goal["status"])}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {GOAL_STATUSES.map((goalStatus) => (
                    <option key={goalStatus} value={goalStatus}>
                      {goalStatus}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Progress ({progressPercent}%)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(event) => setProgressPercent(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? "Saving..." : "Create Goal"}
            </button>
          </form>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">My Goals</h2>
            {isLoading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Loading goals...
              </div>
            ) : activeGoals.length === 0 ? (
              <EmptyState title="No goals yet" description="Add your first goal to get started." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeGoals.map((goal) => (
                  <article key={goal.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">{goal.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          goal.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {goal.status}
                      </span>
                    </div>

                    {goal.description ? (
                      <p className="mt-2 text-sm text-gray-600">{goal.description}</p>
                    ) : null}

                    <p className="mt-2 text-xs text-gray-500">
                      Progress: {goal.progress_percent}%
                      {goal.target_date
                        ? ` • Target: ${new Date(goal.target_date).toLocaleDateString()}`
                        : ""}
                    </p>

                    <button
                      type="button"
                      onClick={() => markCompleted(goal)}
                      className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {goal.status === "completed" ? "Mark Active" : "Mark Completed"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
