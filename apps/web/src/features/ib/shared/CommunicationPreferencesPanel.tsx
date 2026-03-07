"use client";

import { useEffect, useState } from "react";
import { Button } from "@k12/ui";
import {
  type IbCommunicationPreferencePayload,
  updateIbCommunicationPreference,
  useIbCommunicationPreference,
} from "@/features/ib/data";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

type PreferenceSeed = Pick<
  IbCommunicationPreferencePayload,
  | "locale"
  | "digestCadence"
  | "quietHoursStart"
  | "quietHoursEnd"
  | "quietHoursTimezone"
  | "deliveryRules"
>;

function formFrom(seed: PreferenceSeed) {
  return {
    locale: seed.locale,
    digestCadence: seed.digestCadence,
    quietHoursStart: seed.quietHoursStart,
    quietHoursEnd: seed.quietHoursEnd,
    quietHoursTimezone: seed.quietHoursTimezone,
  };
}

export function CommunicationPreferencesPanel({
  audience,
  fallback,
  title,
  description,
  onSaved,
}: {
  audience: "guardian" | "student";
  fallback: PreferenceSeed;
  title: string;
  description: string;
  onSaved?: () => Promise<unknown> | void;
}) {
  const { data, mutate } = useIbCommunicationPreference(audience);
  const seed = data || fallback;
  const [form, setForm] = useState(() => formFrom(seed));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      locale: seed.locale,
      digestCadence: seed.digestCadence,
      quietHoursStart: seed.quietHoursStart,
      quietHoursEnd: seed.quietHoursEnd,
      quietHoursTimezone: seed.quietHoursTimezone,
    });
  }, [
    seed.digestCadence,
    seed.locale,
    seed.quietHoursEnd,
    seed.quietHoursStart,
    seed.quietHoursTimezone,
  ]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateIbCommunicationPreference(audience, {
        locale: form.locale,
        digest_cadence: form.digestCadence,
        quiet_hours_start: form.quietHoursStart,
        quiet_hours_end: form.quietHoursEnd,
        quiet_hours_timezone: form.quietHoursTimezone,
        delivery_rules: seed.deliveryRules,
      });
      await mutate();
      await Promise.resolve(onSaved?.());
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspacePanel title={title} description={description}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium text-slate-900">Digest cadence</span>
          <select
            value={form.digestCadence}
            onChange={(event) =>
              setForm((current) => ({ ...current, digestCadence: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
          >
            <option value="immediate">Immediate</option>
            <option value="weekly_digest">Weekly digest</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium text-slate-900">Locale</span>
          <input
            value={form.locale}
            onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium text-slate-900">Quiet hours start</span>
          <input
            type="time"
            value={form.quietHoursStart}
            onChange={(event) =>
              setForm((current) => ({ ...current, quietHoursStart: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium text-slate-900">Quiet hours end</span>
          <input
            type="time"
            value={form.quietHoursEnd}
            onChange={(event) =>
              setForm((current) => ({ ...current, quietHoursEnd: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-400"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
          Timezone {form.quietHoursTimezone}
        </p>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </WorkspacePanel>
  );
}
