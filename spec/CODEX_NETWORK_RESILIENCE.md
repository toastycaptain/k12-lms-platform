# CODEX_NETWORK_RESILIENCE — Offline Detection, Retry Logic, and Network Error UI

**Priority:** P1
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-23 (Reliability), PRD-8 (Performance — responsive UI), UX-3.1 (Clear CTAs and statuses)
**Assessment Ref:** CODEX_FULL_ASSESSMENT_2026_02_16.md — Known Issue #6 (network resilience gaps)
**Depends on:** CODEX_SWR_DATA_FETCHING (completed)

---

## Problem

The platform has no handling for network failures. In K-12 school environments, WiFi connectivity is often unreliable (teachers moving between classrooms, shared bandwidth during testing periods). Currently:

1. **No offline detection** — users see no warning when network drops; requests silently fail
2. **No retry UI** — failed API calls show a generic error; no "Retry" button or automatic retry
3. **SWR error states underutilized** — SWR provides `error` and `isValidating` states but pages only show "Error loading data" with no recovery path
4. **No stale data indicator** — when SWR serves cached data during revalidation failure, users don't know data may be outdated
5. **Form submissions lost** — if a user submits a form (grade, assignment, message) while offline, the data is lost with no recovery
6. **No connection status banner** — no global indicator of network health

---

## Tasks

### 1. Create Network Status Hook

Create `apps/web/src/hooks/useNetworkStatus.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // true if connection was recently restored
  lastOnlineAt: Date | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: new Date(),
      }));
      // Clear "wasOffline" after 5 seconds
      setTimeout(() => setStatus((prev) => ({ ...prev, wasOffline: false })), 5000);
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false, wasOffline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}
```

### 2. Create Connection Status Banner

Create `apps/web/src/components/ConnectionBanner.tsx`:

```typescript
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function ConnectionBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  if (!isOnline) {
    return (
      <div role="alert" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        You are offline. Changes will not be saved until your connection is restored.
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div role="status" className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-sm text-green-800">
        Connection restored. Refreshing data...
      </div>
    );
  }

  return null;
}
```

### 3. Add ConnectionBanner to AppShell

Update `apps/web/src/components/AppShell.tsx`:
- Render `<ConnectionBanner />` above the main content area
- Position it as a fixed banner below the top bar

### 4. Create Retry Error Component

Create `apps/web/src/components/RetryError.tsx`:

```typescript
interface RetryErrorProps {
  error: Error;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function RetryError({ error, onRetry, isRetrying }: RetryErrorProps) {
  const isNetworkError = error.message === "Failed to fetch" ||
    error.message.includes("NetworkError") ||
    error.message.includes("network");

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-800">
        {isNetworkError ? "Connection Error" : "Something went wrong"}
      </h3>
      <p className="mt-2 text-sm text-red-600">
        {isNetworkError
          ? "Unable to reach the server. Check your internet connection and try again."
          : error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isRetrying ? "Retrying..." : "Try Again"}
      </button>
    </div>
  );
}
```

### 5. Configure SWR Global Error Retry

Update `apps/web/src/lib/swr.ts` to add intelligent retry behavior:

```typescript
import { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 4xx errors (client errors)
    if (error.status >= 400 && error.status < 500) return;
    // Don't retry on auth errors
    if (error.status === 401 || error.status === 403) return;
    // Retry with exponential backoff
    const delay = Math.min(1000 * 2 ** retryCount, 30000);
    setTimeout(() => revalidate({ retryCount }), delay);
  },
};
```

### 6. Add SWR Revalidation on Reconnect

Update the SWR config provider in `apps/web/src/app/layout.tsx`:
- When `wasOffline` transitions to `true` (connection restored), trigger global SWR revalidation
- This ensures all cached data is refreshed when the user comes back online

```typescript
import { useSWRConfig } from "swr";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function RevalidateOnReconnect() {
  const { mutate } = useSWRConfig();
  const { wasOffline } = useNetworkStatus();

  useEffect(() => {
    if (wasOffline) {
      // Revalidate all SWR keys
      mutate(() => true, undefined, { revalidate: true });
    }
  }, [wasOffline, mutate]);

  return null;
}
```

### 7. Create Stale Data Indicator

Create `apps/web/src/components/StaleIndicator.tsx`:

```typescript
interface StaleIndicatorProps {
  isValidating: boolean;
  error: Error | undefined;
  hasData: boolean;
}

export function StaleIndicator({ isValidating, error, hasData }: StaleIndicatorProps) {
  if (!error || !hasData) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-amber-600">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
      {isValidating ? "Refreshing..." : "Showing cached data — unable to reach server"}
    </div>
  );
}
```

### 8. Protect Form Submissions

Update `apps/web/src/lib/swr.ts` mutation helper to handle offline:

```typescript
export async function safeMutate<T>(
  url: string,
  options: RequestInit,
  listKey?: string
): Promise<T> {
  if (!navigator.onLine) {
    throw new Error("You are offline. Please check your connection and try again.");
  }

  try {
    const res = await apiFetch(url, options);
    if (listKey) mutate(listKey);
    return res as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Unable to save. Please check your connection and try again.");
    }
    throw error;
  }
}
```

### 9. Add Tests

- `apps/web/src/hooks/__tests__/useNetworkStatus.test.ts`
  - Returns online by default
  - Updates to offline on offline event
  - Updates to online + wasOffline on online event
  - Clears wasOffline after timeout

- `apps/web/src/components/__tests__/ConnectionBanner.test.tsx`
  - Renders nothing when online
  - Shows offline warning when offline
  - Shows restored message when wasOffline

- `apps/web/src/components/__tests__/RetryError.test.tsx`
  - Renders network error message for fetch failures
  - Renders generic error for other errors
  - Calls onRetry when button clicked
  - Disables button when retrying

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/useNetworkStatus.ts` | Browser online/offline detection |
| `apps/web/src/components/ConnectionBanner.tsx` | Global offline/reconnect banner |
| `apps/web/src/components/RetryError.tsx` | Retry-enabled error display |
| `apps/web/src/components/StaleIndicator.tsx` | Stale cache warning |
| `apps/web/src/hooks/__tests__/useNetworkStatus.test.ts` | Hook tests |
| `apps/web/src/components/__tests__/ConnectionBanner.test.tsx` | Banner tests |
| `apps/web/src/components/__tests__/RetryError.test.tsx` | Error component tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/components/AppShell.tsx` | Add ConnectionBanner |
| `apps/web/src/lib/swr.ts` | Add error retry config + safeMutate |
| `apps/web/src/app/layout.tsx` | Add RevalidateOnReconnect component |

---

## Definition of Done

- [ ] `useNetworkStatus` hook detects online/offline transitions
- [ ] ConnectionBanner shows offline warning and reconnect confirmation
- [ ] RetryError component provides retry button for failed loads
- [ ] SWR configured with exponential backoff retry (skip 4xx errors)
- [ ] Global SWR revalidation triggers on network reconnect
- [ ] StaleIndicator warns when serving cached data during errors
- [ ] Form submissions fail gracefully with user-friendly error when offline
- [ ] All 3 test files pass
- [ ] No TypeScript errors
- [ ] Accessibility: all banners use appropriate ARIA roles
