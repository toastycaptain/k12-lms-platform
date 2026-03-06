"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mutate } from "swr";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { clearStoredSchoolId, readStoredSchoolId, writeStoredSchoolId } from "@/lib/school-storage";

export interface SchoolOption {
  id: number;
  name: string;
}

interface SchoolContextValue {
  schools: SchoolOption[];
  schoolId: string | null;
  setSchoolId: (schoolId: string) => void;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextValue>({
  schools: [],
  schoolId: null,
  setSchoolId: () => {},
  loading: false,
});

function resolveInitialSchoolId(schools: SchoolOption[]): string | null {
  if (schools.length === 0) {
    clearStoredSchoolId();
    return null;
  }

  const storedSchoolId = readStoredSchoolId();
  const selectedSchoolId = schools.some((school) => String(school.id) === storedSchoolId)
    ? storedSchoolId
    : String(schools[0].id);

  if (selectedSchoolId) {
    writeStoredSchoolId(selectedSchoolId);
  }
  return selectedSchoolId;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { refresh } = useAuth();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSchools = useCallback(async () => {
    setLoading(true);

    try {
      const nextSchools = await apiFetch<SchoolOption[]>("/api/v1/schools");
      setSchools(nextSchools);
      setSchoolIdState(resolveInitialSchoolId(nextSchools));
    } catch {
      setSchools([]);
      setSchoolIdState(null);
      clearStoredSchoolId();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  const setSchoolId = useCallback(
    (nextSchoolId: string) => {
      const nextSchool = schools.find((school) => String(school.id) === nextSchoolId);
      if (!nextSchool) {
        return;
      }

      writeStoredSchoolId(nextSchoolId);
      setSchoolIdState(nextSchoolId);
      void refresh();
      void mutate(() => true, undefined, { revalidate: true });
    },
    [refresh, schools],
  );

  const value = useMemo(
    () => ({ schools, schoolId, setSchoolId, loading }),
    [loading, schoolId, schools, setSchoolId],
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool(): SchoolContextValue {
  return useContext(SchoolContext);
}
