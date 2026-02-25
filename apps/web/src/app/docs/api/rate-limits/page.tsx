const LIMITS = [
  ["Authentication", "5 req", "1 min", "429"],
  ["General API", "60 req", "1 min", "429"],
  ["AI generation", "10 req", "1 min", "429"],
  ["Analytics", "30 req", "1 min", "429"],
  ["File uploads", "10 req", "1 min", "429"],
  ["Webhooks admin", "20 req", "1 min", "429"],
  ["Data compliance", "10 req", "1 min", "429"],
];

export default function ApiRateLimitDocsPage() {
  return (
    <article className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Rate Limits</h2>
        <p className="text-sm text-slate-600">Current enforcement windows and response behavior.</p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              <th className="px-3 py-2">Endpoint Category</th>
              <th className="px-3 py-2">Limit</th>
              <th className="px-3 py-2">Window</th>
              <th className="px-3 py-2">Response</th>
            </tr>
          </thead>
          <tbody>
            {LIMITS.map((row) => (
              <tr key={row[0]} className="border-t border-slate-200">
                {row.map((cell) => (
                  <td key={cell} className="px-3 py-2 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Rate Limit Headers</p>
        <p className="mt-2 font-mono text-xs">
          X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After
        </p>
      </section>
    </article>
  );
}
