export function PeerFeedbackPanel({
  enabled,
  guidelines,
  feedback,
}: {
  enabled: boolean;
  guidelines: string[];
  feedback: Array<{ id: number; title: string; detail: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Peer feedback</h2>
      <p className="mt-1 text-sm text-slate-600">
        {enabled
          ? "Structured and moderated when enabled."
          : "Disabled in this context for calmer, age-appropriate use."}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {guidelines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {feedback.length > 0 ? (
        <div className="mt-4 space-y-2">
          {feedback.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
