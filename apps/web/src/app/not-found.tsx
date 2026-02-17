import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
        404
      </p>
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-600">
        The page you requested does not exist or may have moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
