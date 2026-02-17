export interface AiApplyChange {
  field: string;
  previous: string;
  next: string;
}

interface AiApplyModalProps {
  open: boolean;
  title?: string;
  changes: AiApplyChange[];
  applying?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AiApplyModal({
  open,
  title = "Apply AI changes",
  changes,
  applying = false,
  onCancel,
  onConfirm,
}: AiApplyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Review the field-level diff before applying these edits.
          </p>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
          {changes.map((change) => (
            <div key={change.field} className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                {change.field}
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Current
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">
                    {change.previous || "(empty)"}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    AI Proposal
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-emerald-50 p-2 text-xs text-emerald-800">
                    {change.next || "(empty)"}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={applying}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={applying}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {applying ? "Applying..." : "Confirm Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
