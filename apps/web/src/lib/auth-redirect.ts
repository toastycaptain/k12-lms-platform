const AUTH_REDIRECT_STORAGE_KEY = "k12.auth.redirect";

export function sanitizeRedirectPath(redirect: string | null): string | null {
  if (!redirect) {
    return null;
  }

  if (
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(redirect)
  ) {
    return null;
  }

  try {
    const parsed = new URL(redirect, "https://k12.local");
    if (parsed.origin !== "https://k12.local") {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function buildAuthUrlWithRedirect(url: string, redirectPath: string | null): string {
  if (!redirectPath) {
    return url;
  }

  const nextUrl = new URL(url);
  nextUrl.searchParams.set("redirect", redirectPath);
  return nextUrl.toString();
}

export function persistAuthRedirect(redirectPath: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!redirectPath) {
    window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectPath);
}

export function readPersistedAuthRedirect(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sanitizeRedirectPath(window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY));
}

export function clearPersistedAuthRedirect(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
}
