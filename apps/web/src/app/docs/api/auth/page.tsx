export default function ApiAuthDocsPage() {
  return (
    <article className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Authentication Guide</h2>
        <p className="text-sm text-slate-600">
          Supported authentication modes for browser, server-to-server, and webhook verification
          flows.
        </p>
      </header>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Session-based Auth (Web)</h3>
        <p className="text-sm text-slate-600">
          Authenticate with OAuth and use the returned session cookie.
        </p>
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`POST /auth/google_oauth2
Set-Cookie: _k12_lms_session=...; HttpOnly; Secure`}
        </pre>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">API Token Auth (Server-to-Server)</h3>
        <p className="text-sm text-slate-600">Use bearer tokens for non-browser integrations.</p>
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`Authorization: Bearer <token>
X-Tenant-Slug: district-slug`}
        </pre>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Webhook Signature Verification</h3>
        <p className="text-sm text-slate-600">
          Validate `X-K12-Signature` (`sha256=`) using HMAC-SHA256 on `${"{timestamp}.{payload}"}`.
        </p>
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`const expected = "sha256=" + createHmac("sha256", secret)
  .update(timestamp + "." + payload)
  .digest("hex");`}
        </pre>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">CORS and Scopes</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Only approved origins can call browser-accessible endpoints.</li>
          <li>Admin-level operations require administrator role permissions.</li>
          <li>Webhook delivery endpoints are signed and must be verified on receipt.</li>
        </ul>
      </section>
    </article>
  );
}
