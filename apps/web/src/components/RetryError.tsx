"use client";

interface RetryErrorProps {
  error: Error;
  onRetry: () => void;
  isRetrying?: boolean;
}

function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("offline")
  );
}

export function RetryError({ error, onRetry, isRetrying = false }: RetryErrorProps) {
  const networkError = isNetworkError(error);

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
      <h3 className="text-base font-semibold text-red-900">
        {networkError ? "Connection Error" : "Unable to load data"}
      </h3>
      <p className="mt-2 text-sm text-red-700">
        {networkError
          ? "Unable to reach the server. Check your connection and retry."
          : error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-4 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
      >
        {isRetrying ? "Retrying..." : "Try Again"}
      </button>
    </div>
  );
}
