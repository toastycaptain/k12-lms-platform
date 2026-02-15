"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface SchoolRow {
  id: number;
  name: string;
  address: string | null;
  timezone: string | null;
}

interface AcademicYearRow {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

interface TermRow {
  id: number;
  name: string;
  academic_year_id: number;
  start_date: string;
  end_date: string;
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function SchoolSetupPage() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [schoolForm, setSchoolForm] = useState({
    id: "",
    name: "",
    address: "",
    timezone: "America/New_York",
  });

  const [yearForm, setYearForm] = useState({
    id: "",
    name: "",
    start_date: "",
    end_date: "",
    current: false,
  });

  const [termForm, setTermForm] = useState({
    id: "",
    academic_year_id: "",
    name: "",
    start_date: "",
    end_date: "",
  });

  const isAdmin = user?.roles?.includes("admin") || false;
  const canAccess = isAdmin || user?.roles?.includes("curriculum_lead");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [schoolRows, yearRows, termRows] = await Promise.all([
          apiFetch<SchoolRow[]>("/api/v1/schools"),
          apiFetch<AcademicYearRow[]>("/api/v1/academic_years"),
          apiFetch<TermRow[]>("/api/v1/terms"),
        ]);
        setSchools(schoolRows);
        setAcademicYears(yearRows);
        setTerms(termRows);

        if (schoolRows[0]) {
          setSchoolForm({
            id: String(schoolRows[0].id),
            name: schoolRows[0].name,
            address: schoolRows[0].address || "",
            timezone: schoolRows[0].timezone || "America/New_York",
          });
        }
      } catch {
        setError("Failed to load school setup data.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  const yearsById = useMemo(() => {
    const result = new Map<number, AcademicYearRow>();
    academicYears.forEach((row) => result.set(row.id, row));
    return result;
  }, [academicYears]);

  async function refreshAll() {
    const [schoolRows, yearRows, termRows] = await Promise.all([
      apiFetch<SchoolRow[]>("/api/v1/schools"),
      apiFetch<AcademicYearRow[]>("/api/v1/academic_years"),
      apiFetch<TermRow[]>("/api/v1/terms"),
    ]);
    setSchools(schoolRows);
    setAcademicYears(yearRows);
    setTerms(termRows);
  }

  async function saveSchool() {
    if (!schoolForm.name.trim()) return;
    setError(null);
    setSuccess(null);

    try {
      if (schoolForm.id) {
        await apiFetch(`/api/v1/schools/${schoolForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            school: {
              name: schoolForm.name.trim(),
              address: schoolForm.address.trim() || null,
              timezone: schoolForm.timezone.trim(),
            },
          }),
        });
        setSuccess("School updated.");
      } else {
        await apiFetch("/api/v1/schools", {
          method: "POST",
          body: JSON.stringify({
            school: {
              name: schoolForm.name.trim(),
              address: schoolForm.address.trim() || null,
              timezone: schoolForm.timezone.trim(),
            },
          }),
        });
        setSuccess("School created.");
      }

      await refreshAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save school.");
    }
  }

  async function saveAcademicYear() {
    if (!yearForm.name.trim() || !yearForm.start_date || !yearForm.end_date) return;
    setError(null);
    setSuccess(null);

    try {
      if (yearForm.id) {
        await apiFetch(`/api/v1/academic_years/${yearForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            academic_year: {
              name: yearForm.name.trim(),
              start_date: yearForm.start_date,
              end_date: yearForm.end_date,
              current: yearForm.current,
            },
          }),
        });
        setSuccess("Academic year updated.");
      } else {
        await apiFetch("/api/v1/academic_years", {
          method: "POST",
          body: JSON.stringify({
            academic_year: {
              name: yearForm.name.trim(),
              start_date: yearForm.start_date,
              end_date: yearForm.end_date,
              current: yearForm.current,
            },
          }),
        });
        setSuccess("Academic year created.");
      }
      await refreshAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save academic year.");
    }
  }

  async function saveTerm() {
    if (!termForm.academic_year_id || !termForm.name.trim() || !termForm.start_date || !termForm.end_date) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      if (termForm.id) {
        await apiFetch(`/api/v1/terms/${termForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            term: {
              academic_year_id: Number(termForm.academic_year_id),
              name: termForm.name.trim(),
              start_date: termForm.start_date,
              end_date: termForm.end_date,
            },
          }),
        });
        setSuccess("Term updated.");
      } else {
        await apiFetch("/api/v1/terms", {
          method: "POST",
          body: JSON.stringify({
            term: {
              academic_year_id: Number(termForm.academic_year_id),
              name: termForm.name.trim(),
              start_date: termForm.start_date,
              end_date: termForm.end_date,
            },
          }),
        });
        setSuccess("Term created.");
      }
      await refreshAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save term.");
    }
  }

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators and curriculum leads.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">School Setup</h1>

          {!isAdmin && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              Read-only mode: only administrators can save changes.
            </div>
          )}
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {loading ? (
            <p className="text-sm text-gray-500">Loading school data...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Schools</h2>
                  <button
                    onClick={() =>
                      setSchoolForm({ id: "", name: "", address: "", timezone: "America/New_York" })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    New School
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    {schools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() =>
                          setSchoolForm({
                            id: String(school.id),
                            name: school.name,
                            address: school.address || "",
                            timezone: school.timezone || "America/New_York",
                          })
                        }
                        className="block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.timezone || "No timezone"}</p>
                      </button>
                    ))}
                    {schools.length === 0 && <p className="text-sm text-gray-500">No schools configured.</p>}
                  </div>

                  <div className="space-y-2 rounded border border-gray-200 p-3">
                    <input
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="School name"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={schoolForm.address}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Address"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={schoolForm.timezone}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, timezone: e.target.value }))}
                      placeholder="Timezone"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => void saveSchool()}
                      disabled={!isAdmin}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {schoolForm.id ? "Update School" : "Create School"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Academic Years</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    {academicYears.map((year) => (
                      <button
                        key={year.id}
                        onClick={() =>
                          setYearForm({
                            id: String(year.id),
                            name: year.name,
                            start_date: toDateInput(year.start_date),
                            end_date: toDateInput(year.end_date),
                            current: year.current,
                          })
                        }
                        className="block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <p className="font-medium text-gray-900">{year.name}</p>
                        <p className="text-xs text-gray-500">
                          {toDateInput(year.start_date)} - {toDateInput(year.end_date)}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 rounded border border-gray-200 p-3">
                    <input
                      value={yearForm.name}
                      onChange={(e) => setYearForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Academic year name"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={yearForm.start_date}
                      onChange={(e) => setYearForm((prev) => ({ ...prev, start_date: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={yearForm.end_date}
                      onChange={(e) => setYearForm((prev) => ({ ...prev, end_date: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={yearForm.current}
                        onChange={(e) => setYearForm((prev) => ({ ...prev, current: e.target.checked }))}
                      />
                      Current year
                    </label>
                    <button
                      onClick={() => void saveAcademicYear()}
                      disabled={!isAdmin}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {yearForm.id ? "Update Academic Year" : "Create Academic Year"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Terms</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    {terms.map((term) => (
                      <button
                        key={term.id}
                        onClick={() =>
                          setTermForm({
                            id: String(term.id),
                            academic_year_id: String(term.academic_year_id),
                            name: term.name,
                            start_date: toDateInput(term.start_date),
                            end_date: toDateInput(term.end_date),
                          })
                        }
                        className="block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        <p className="font-medium text-gray-900">{term.name}</p>
                        <p className="text-xs text-gray-500">
                          {yearsById.get(term.academic_year_id)?.name || "Unknown year"}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 rounded border border-gray-200 p-3">
                    <select
                      value={termForm.academic_year_id}
                      onChange={(e) => setTermForm((prev) => ({ ...prev, academic_year_id: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select academic year</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={termForm.name}
                      onChange={(e) => setTermForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Term name"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={termForm.start_date}
                      onChange={(e) => setTermForm((prev) => ({ ...prev, start_date: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={termForm.end_date}
                      onChange={(e) => setTermForm((prev) => ({ ...prev, end_date: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => void saveTerm()}
                      disabled={!isAdmin}
                      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {termForm.id ? "Update Term" : "Create Term"}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
