"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface School {
  id: number;
  name: string;
}

const STORAGE_KEY = "k12.selectedSchoolId";

export default function SchoolSelector() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const initializeSchools = useCallback(async () => {
    setLoading(true);
    try {
      const schoolList = await apiFetch<School[]>("/api/v1/schools");
      setSchools(schoolList);

      if (schoolList.length === 0) {
        setSelectedSchoolId("");
        return;
      }

      const storedSchoolId =
        typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const defaultSchoolId = schoolList.some((school) => String(school.id) === storedSchoolId)
        ? String(storedSchoolId)
        : String(schoolList[0].id);

      setSelectedSchoolId(defaultSchoolId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, defaultSchoolId);
      }
    } catch {
      setSchools([]);
      setSelectedSchoolId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initializeSchools();
  }, [initializeSchools]);

  if (loading) {
    return <span className="text-sm text-gray-500">Loading school...</span>;
  }

  if (schools.length === 0) {
    return <span className="text-sm text-gray-500">No school</span>;
  }

  if (schools.length === 1) {
    return <span className="text-sm font-medium text-gray-700">{schools[0].name}</span>;
  }

  return (
    <label htmlFor="school-selector" className="flex items-center gap-2 text-sm text-gray-600">
      <span>School</span>
      <select
        id="school-selector"
        value={selectedSchoolId}
        onChange={(event) => {
          const nextSchoolId = event.target.value;
          setSelectedSchoolId(nextSchoolId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, nextSchoolId);
          }
        }}
        className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {schools.map((school) => (
          <option key={school.id} value={String(school.id)}>
            {school.name}
          </option>
        ))}
      </select>
    </label>
  );
}
