const ERROR_ROWS = [
  ["400", "bad_request", "Request body invalid"],
  ["401", "unauthorized", "Authentication required"],
  ["403", "forbidden", "Insufficient permissions"],
  ["404", "not_found", "Resource not found"],
  ["409", "conflict", "Resource state conflict"],
  ["422", "unprocessable_entity", "Validation failed"],
  ["429", "rate_limited", "Too many requests"],
  ["500", "internal_error", "Server error"],
];

export default function ApiErrorDocsPage() {
  return (
    <article className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Error Reference</h2>
        <p className="text-sm text-slate-600">
          Standard status codes and error payload conventions.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {ERROR_ROWS.map((row) => (
              <tr key={row[1]} className="border-t border-slate-200">
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

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Error Payload Shape</h3>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`{
  "error": "validation_failed",
  "message": "One or more fields are invalid",
  "details": {
    "field": ["must be present"]
  }
}`}
        </pre>
      </section>
    </article>
  );
}
