export function ReflectionHistoryPanel({
  history,
}: {
  history: Array<{
    id: number;
    prompt: string;
    status: string;
    responseExcerpt?: string | null;
    evidenceTitle?: string | null;
  }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Reflection history</h2>
      <div className="mt-4 space-y-2">
        {history.map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{entry.prompt}</p>
            <p className="mt-1">{entry.responseExcerpt || entry.evidenceTitle || entry.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
