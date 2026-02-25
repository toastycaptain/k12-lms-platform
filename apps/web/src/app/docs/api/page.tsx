import ApiReferenceClient from "./reference-client";

export default function ApiDocsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Interactive API Reference</h2>
        <p className="text-sm text-slate-600">
          Explore endpoints, schemas, and example payloads from the current v1 OpenAPI contract.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
        <ApiReferenceClient />
      </div>
    </section>
  );
}
