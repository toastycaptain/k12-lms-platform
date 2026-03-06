export const SCHOOL_STORAGE_KEY = "k12.selectedSchoolId";

export function readStoredSchoolId(): string | null {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return null;
  }

  return window.localStorage.getItem(SCHOOL_STORAGE_KEY);
}

export function writeStoredSchoolId(schoolId: string): void {
  if (typeof window === "undefined" || typeof window.localStorage?.setItem !== "function") {
    return;
  }

  window.localStorage.setItem(SCHOOL_STORAGE_KEY, schoolId);
}

export function clearStoredSchoolId(): void {
  if (typeof window === "undefined" || typeof window.localStorage?.removeItem !== "function") {
    return;
  }

  window.localStorage.removeItem(SCHOOL_STORAGE_KEY);
}
