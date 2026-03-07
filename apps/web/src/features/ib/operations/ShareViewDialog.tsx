"use client";

export function ShareViewDialog({
  open,
  token,
  onClose,
}: {
  open: boolean;
  token: string | null;
  onClose: () => void;
}) {
  if (!open || !token) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-950">Shareable coordinator view</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use this temporary token for leadership-friendly summaries. It should still respect
          server-side permissions and expiry.
        </p>
        <code className="mt-4 block rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900">
          {token}
        </code>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
