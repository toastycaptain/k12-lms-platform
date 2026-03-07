export function RecommendationPanel({
  recommendations,
}: {
  recommendations: Array<{ id: string; title: string; detail: string; href: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Recommendations</h2>
      <p className="mt-1 text-sm text-slate-600">
        Low-noise nudges that explain why action is worth taking.
      </p>
      <div className="mt-4 space-y-3">
        {recommendations.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
          >
            <p className="font-semibold text-slate-950">{item.title}</p>
            <p className="mt-1">{item.detail}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
