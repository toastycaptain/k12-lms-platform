"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@k12/ui";

type EmailFrequency = "immediate" | "daily" | "weekly" | "never";

interface NotificationPreferenceRow {
  event_type: string;
  event_name: string;
  in_app: boolean;
  email: boolean;
  email_frequency: EmailFrequency;
}

export default function NotificationSettingsPage() {
  const { addToast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferenceRow[]>([]);
  const [baseline, setBaseline] = useState<Map<string, NotificationPreferenceRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    if (preferences.length !== baseline.size) return true;

    return preferences.some((row) => {
      const original = baseline.get(row.event_type);
      if (!original) return true;
      return (
        original.in_app !== row.in_app ||
        original.email !== row.email ||
        original.email_frequency !== row.email_frequency
      );
    });
  }, [baseline, preferences]);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<NotificationPreferenceRow[]>(
        "/api/v1/notification_preferences",
      );
      setPreferences(response);
      setBaseline(new Map(response.map((entry) => [entry.event_type, entry])));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to load notification preferences.";
      addToast("error", message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  async function saveChanges() {
    setSaving(true);
    try {
      const changedRows = preferences.filter((row) => {
        const original = baseline.get(row.event_type);
        if (!original) return true;
        return (
          original.in_app !== row.in_app ||
          original.email !== row.email ||
          original.email_frequency !== row.email_frequency
        );
      });

      await Promise.all(
        changedRows.map((row) =>
          apiFetch(`/api/v1/notification_preferences/${row.event_type}`, {
            method: "PATCH",
            body: JSON.stringify({
              in_app: row.in_app,
              email: row.email,
              email_frequency: row.email ? row.email_frequency : "never",
            }),
          }),
        ),
      );

      addToast("success", "Notification preferences saved.");
      await loadPreferences();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not save preferences.";
      addToast("error", message);
    } finally {
      setSaving(false);
    }
  }

  function updateRow(eventType: string, patch: Partial<NotificationPreferenceRow>) {
    setPreferences((previous) =>
      previous.map((row) => {
        if (row.event_type !== eventType) return row;

        const next = { ...row, ...patch };
        if (!next.email && next.email_frequency !== "never") {
          next.email_frequency = "never";
        }
        if (next.email && next.email_frequency === "never") {
          next.email_frequency = "immediate";
        }
        return next;
      }),
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose where each notification type should be delivered.
            </p>
          </header>

          {loading ? (
            <p className="text-sm text-gray-500">Loading preferences...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      In-App
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Frequency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preferences.map((row) => (
                    <tr key={row.event_type}>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.event_name}</td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={row.in_app}
                            onChange={(event) =>
                              updateRow(row.event_type, { in_app: event.currentTarget.checked })
                            }
                          />
                          Enabled
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={row.email}
                            onChange={(event) =>
                              updateRow(row.event_type, { email: event.currentTarget.checked })
                            }
                          />
                          Enabled
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.email_frequency}
                          disabled={!row.email}
                          onChange={(event) =>
                            updateRow(row.event_type, {
                              email_frequency: event.currentTarget.value as EmailFrequency,
                            })
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                          <option value="never">Never</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Notifications
            </Link>
            <button
              type="button"
              disabled={saving || loading || !hasChanges}
              onClick={() => void saveChanges()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
