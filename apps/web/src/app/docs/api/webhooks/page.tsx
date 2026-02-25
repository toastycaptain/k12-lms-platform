const EVENT_TYPES = [
  "assignment.created",
  "assignment.updated",
  "submission.created",
  "submission.graded",
  "quiz.published",
  "course.synced",
  "user.provisioned",
  "tenant.created",
  "guardian.linked",
  "compliance.export.ready",
  "compliance.delete.completed",
  "ai.invocation.created",
  "ai.invocation.completed",
  "approval.requested",
  "approval.completed",
  "discussion.posted",
  "message.sent",
  "integration.sync.started",
  "integration.sync.completed",
  "integration.sync.failed",
];

export default function ApiWebhookDocsPage() {
  return (
    <article className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Webhook Integration Guide</h2>
        <p className="text-sm text-slate-600">
          Configure endpoint delivery, verify signatures, and handle retries safely.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Available Event Types</h3>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 md:grid-cols-2">
          {EVENT_TYPES.map((eventType) => (
            <li key={eventType} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
              {eventType}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Payload Shape</h3>
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`{
  "event_type": "submission.graded",
  "timestamp": "2026-02-25T18:10:00Z",
  "tenant_id": 42,
  "data": { ... }
}`}
        </pre>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Signature Verification (Node.js)</h3>
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {`const expected = "sha256=" + crypto
  .createHmac("sha256", secret)
  .update(timestamp + "." + payload)
  .digest("hex");
const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));`}
        </pre>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Delivery Behavior</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Retry policy: 5 attempts with exponential backoff.</li>
          <li>Endpoints auto-disable after 10 consecutive failures.</li>
          <li>Use test ping tools before enabling production subscriptions.</li>
        </ul>
      </section>
    </article>
  );
}
