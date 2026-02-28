"use client";

import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@k12/ui";
import { swrConfig } from "@/lib/swr";

interface TodoItem {
  id: string;
  source_type: "assignment" | "quiz" | "goal";
  source_id: number;
  title: string;
  due_at: string | null;
  status: string;
  course_id: number | null;
  priority: "overdue" | "high" | "medium" | "low";
}

const PRIORITY_STYLES: Record<TodoItem["priority"], string> = {
  overdue: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-700",
};

export default function LearnTodosPage() {
  const { user } = useAuth();
  const {
    data: todos,
    error,
    isLoading,
  } = useSWR<TodoItem[]>(
    user ? `learn-todos-${user.id}` : null,
    () => apiFetch<TodoItem[]>(`/api/v1/students/${user?.id}/todos`),
    swrConfig,
  );

  return (
    <ProtectedRoute requiredRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">To-dos</h1>
            <p className="mt-1 text-sm text-gray-500">
              A unified list of pending assignments, quizzes, and active goals.
            </p>
          </header>

          {error ? (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Unable to load to-dos.
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Loading to-dos...
            </div>
          ) : !todos || todos.length === 0 ? (
            <EmptyState title="No to-dos" description="You're caught up for now." />
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <article key={todo.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{todo.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {todo.source_type.toUpperCase()} • Status: {todo.status}
                        {todo.due_at ? ` • Due ${new Date(todo.due_at).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[todo.priority]}`}
                    >
                      {todo.priority}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
