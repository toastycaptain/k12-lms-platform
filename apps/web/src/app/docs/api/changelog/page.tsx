export default function ApiChangelogPage() {
  return (
    <article className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">API Changelog</h2>
        <p className="text-sm text-slate-600">
          Version history and deprecation policy for integrators.
        </p>
      </header>

      <section>
        <h3 className="font-semibold text-slate-900">v1 (Current)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>2026-02-17: Webhook events system (20 event types)</li>
          <li>2026-02-17: Portfolio endpoints</li>
          <li>2026-02-17: Resource library endpoints</li>
          <li>2026-02-17: Data compliance endpoints (FERPA export/delete)</li>
          <li>2026-02-17: Version diff endpoints</li>
          <li>2026-02-17: Analytics and progress endpoints</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900">Deprecation Policy</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Deprecated endpoints return `Deprecation: true` response header.</li>
          <li>Deprecated endpoints are supported for at least 6 months.</li>
          <li>Breaking changes ship only in major versions (for example, v2).</li>
        </ul>
      </section>
    </article>
  );
}
