export function SpecialistAnalyticsPanel({
  overloadSignals,
  assignmentGaps,
}: {
  overloadSignals: Array<{ userId: number; assignedCount: number; severity: string }>;
  assignmentGaps: Array<{ documentId: number; title: string; href: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Coordinator visibility</h2>
      <p className="mt-1 text-sm text-slate-600">
        See overloads and missing specialist coverage without digging through class plans manually.
      </p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Overload signals</p>
          <ul className="mt-2 space-y-2">
            {overloadSignals.length > 0 ? (
              overloadSignals.map((signal) => (
                <li key={signal.userId}>
                  Specialist #{signal.userId}: {signal.assignedCount} assignments ({signal.severity}
                  )
                </li>
              ))
            ) : (
              <li>No overloads are currently detected.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Assignment gaps</p>
          <ul className="mt-2 space-y-2">
            {assignmentGaps.length > 0 ? (
              assignmentGaps.map((gap) => (
                <li key={gap.documentId}>
                  <a
                    href={gap.href}
                    className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                  >
                    {gap.title}
                  </a>
                </li>
              ))
            ) : (
              <li>All visible units have specialist coverage.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
