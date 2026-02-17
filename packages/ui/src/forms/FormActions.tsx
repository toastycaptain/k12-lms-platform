"use client";

interface FormActionsProps {
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

export default function FormActions({
  submitLabel,
  submittingLabel = "Saving...",
  submitting = false,
  submitDisabled = false,
  onCancel,
  cancelLabel = "Cancel",
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={submitting || submitDisabled}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
}
