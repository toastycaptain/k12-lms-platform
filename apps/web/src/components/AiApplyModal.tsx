import { DiffViewer } from "@k12/ui";

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
  selectedFields?: string[];
  onSelectionChange?: (fields: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AiApplyModal({
  open,
  title = "Apply AI changes",
  changes,
  applying = false,
  selectedFields,
  onSelectionChange,
  onCancel,
  onConfirm,
}: AiApplyModalProps) {
  if (!open) return null;

  const activeSelection = selectedFields ?? changes.map((change) => change.field);

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
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                <span>{change.field}</span>
                {onSelectionChange ? (
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                    <input
                      type="checkbox"
                      checked={activeSelection.includes(change.field)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...activeSelection, change.field]
                          : activeSelection.filter((field) => field !== change.field);
                        onSelectionChange(Array.from(new Set(next)));
                      }}
                    />
                    Apply
                  </label>
                ) : null}
              </div>
              <div className="p-3">
                <DiffViewer previous={change.previous} next={change.next} />
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
            disabled={applying || activeSelection.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {applying
              ? "Applying..."
              : onSelectionChange
                ? "Apply Selected Changes"
                : "Confirm Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
