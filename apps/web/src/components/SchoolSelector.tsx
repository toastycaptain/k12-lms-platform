"use client";

import { useSchool } from "@/lib/school-context";

export default function SchoolSelector() {
  const { schools, schoolId, setSchoolId, loading } = useSchool();

  if (loading) {
    return (
      <span className="rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-500 shadow-sm">
        Loading school...
      </span>
    );
  }

  if (schools.length === 0 || !schoolId) {
    return (
      <label
        htmlFor="school-selector-empty"
        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-500 shadow-sm"
      >
        <span>School</span>
        <select
          id="school-selector-empty"
          value=""
          disabled
          className="bg-transparent text-sm font-medium text-slate-500 outline-none"
        >
          <option value="">No school</option>
        </select>
      </label>
    );
  }

  if (schools.length === 1) {
    return (
      <span className="rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
        {schools[0].name}
      </span>
    );
  }

  return (
    <label
      htmlFor="school-selector"
      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-600 shadow-sm"
    >
      <span>School</span>
      <select
        id="school-selector"
        value={schoolId}
        onChange={(event) => setSchoolId(event.target.value)}
        className="bg-transparent text-sm font-medium text-slate-900 outline-none"
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
