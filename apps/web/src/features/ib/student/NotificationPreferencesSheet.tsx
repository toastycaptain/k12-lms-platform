export function NotificationPreferencesSheet({
  preferences,
}: {
  preferences: Record<string, { in_app?: boolean; email?: boolean; email_frequency: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:hidden">
      <h2 className="text-lg font-semibold text-slate-950">Notification preferences</h2>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-3">
            {key.replace(/_/g, " ")} • {value.email_frequency}
          </div>
        ))}
      </div>
    </div>
  );
}
