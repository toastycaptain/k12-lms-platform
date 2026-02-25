"use client";

interface StaleIndicatorProps {
  isValidating: boolean;
  error: Error | undefined;
  hasData: boolean;
}

export function StaleIndicator({ isValidating, error, hasData }: StaleIndicatorProps) {
  if (!error || !hasData) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 text-xs text-amber-700">
      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
      {isValidating ? "Refreshing..." : "Showing cached data while offline"}
    </div>
  );
}
