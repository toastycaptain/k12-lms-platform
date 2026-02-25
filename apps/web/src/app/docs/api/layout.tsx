import Link from "next/link";

const LINKS = [
  { href: "/docs/api", label: "API Reference" },
  { href: "/docs/api/auth", label: "Authentication" },
  { href: "/docs/api/webhooks", label: "Webhooks" },
  { href: "/docs/api/rate-limits", label: "Rate Limits" },
  { href: "/docs/api/errors", label: "Errors" },
  { href: "/docs/api/changelog", label: "Changelog" },
];

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900">K-12 LMS API Documentation</h1>
        <p className="mt-1 text-sm text-slate-600">
          REST API reference and integration guides for platform developers.
        </p>
        <nav className="mt-4 flex flex-wrap gap-4" aria-label="API documentation navigation">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
