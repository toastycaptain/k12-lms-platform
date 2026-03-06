import { readStoredSchoolId, writeStoredSchoolId } from "@/lib/school-storage";

const BASE_STORAGE_KEY = "k12.selectedPlanningContextId";

function contextStorageKey(schoolId: string | null): string {
  return schoolId ? `${BASE_STORAGE_KEY}.${schoolId}` : BASE_STORAGE_KEY;
}

export function readStoredPlanningContextId(schoolId: string | null): string | null {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return null;
  }

  return window.localStorage.getItem(contextStorageKey(schoolId));
}

export function writeStoredPlanningContextId(schoolId: string | null, contextId: string): void {
  if (typeof window === "undefined" || typeof window.localStorage?.setItem !== "function") {
    return;
  }

  if (schoolId) {
    writeStoredSchoolId(schoolId);
  } else if (!readStoredSchoolId()) {
    return;
  }

  window.localStorage.setItem(contextStorageKey(schoolId), contextId);
}
