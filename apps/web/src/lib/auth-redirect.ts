const AUTH_REDIRECT_STORAGE_KEY = "k12.auth.redirect";

export function sanitizeRedirectPath(redirect: string | null): string | null {
  if (!redirect) {
    return null;
  }

  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }

  return redirect;
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
