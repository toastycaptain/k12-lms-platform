"use client";

export function ConflictResolutionDialog({
  open,
  onClose,
  onKeepLocal,
}: {
  open: boolean;
  onClose: () => void;
  onKeepLocal: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-950">Resolve autosave conflict</h2>
        <p className="mt-2 text-sm text-slate-600">
          The live document changed while you were editing. Keep your local draft or close this
          dialog and reload the latest version first.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            Reload latest
          </button>
          <button
            type="button"
            onClick={onKeepLocal}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Keep local draft
          </button>
        </div>
      </div>
    </div>
  );
}
