export function NotificationPreferencesPanel({ urgentCount }: { urgentCount: number }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Specialist notification strategy</h2>
      <p className="mt-1 text-sm text-slate-600">
        Urgent items stay immediate. Everything else should respect the school week and avoid noise.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        <li>Urgent handoffs today: {urgentCount}</li>
        <li>Routine contributions: bundled into digest windows.</li>
        <li>Cross-grade reuse updates: weekly summary only.</li>
      </ul>
    </div>
  );
}
