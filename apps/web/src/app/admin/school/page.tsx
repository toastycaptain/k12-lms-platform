"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@k12/ui";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { Checkbox, FormActions, FormField, Select, TextInput } from "@k12/ui/forms";

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
  const { addToast } = useToast();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        addToast("success", "School updated.");
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
        addToast("success", "School created.");
      }

      await refreshAll();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save school.");
    }
  }

  async function saveAcademicYear() {
    if (!yearForm.name.trim() || !yearForm.start_date || !yearForm.end_date) return;

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
        addToast("success", "Academic year updated.");
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
        addToast("success", "Academic year created.");
      }
      await refreshAll();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save academic year.");
    }
  }

  async function saveTerm() {
    if (
      !termForm.academic_year_id ||
      !termForm.name.trim() ||
      !termForm.start_date ||
      !termForm.end_date
    ) {
      return;
    }

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
        addToast("success", "Term updated.");
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
        addToast("success", "Term created.");
      }
      await refreshAll();
    } catch (e) {
      addToast("error", e instanceof ApiError ? e.message : "Failed to save term.");
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

          {loading ? (
            <ListSkeleton />
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
                    {schools.length === 0 && (
                      <p className="text-sm text-gray-500">No schools configured.</p>
                    )}
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveSchool();
                    }}
                    className="space-y-3 rounded border border-gray-200 p-3"
                  >
                    <FormField label="School Name" htmlFor="school-name" required>
                      <TextInput
                        id="school-name"
                        value={schoolForm.name}
                        onChange={(event) =>
                          setSchoolForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="School name"
                        required
                      />
                    </FormField>
                    <FormField label="Address" htmlFor="school-address">
                      <TextInput
                        id="school-address"
                        value={schoolForm.address}
                        onChange={(event) =>
                          setSchoolForm((previous) => ({
                            ...previous,
                            address: event.target.value,
                          }))
                        }
                        placeholder="Address"
                      />
                    </FormField>
                    <FormField label="Timezone" htmlFor="school-timezone" required>
                      <TextInput
                        id="school-timezone"
                        value={schoolForm.timezone}
                        onChange={(event) =>
                          setSchoolForm((previous) => ({
                            ...previous,
                            timezone: event.target.value,
                          }))
                        }
                        placeholder="Timezone"
                        required
                      />
                    </FormField>
                    <FormActions
                      submitLabel={schoolForm.id ? "Update School" : "Create School"}
                      submitDisabled={!isAdmin || !schoolForm.name.trim()}
                    />
                  </form>
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
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveAcademicYear();
                    }}
                    className="space-y-3 rounded border border-gray-200 p-3"
                  >
                    <FormField label="Academic Year Name" htmlFor="academic-year-name" required>
                      <TextInput
                        id="academic-year-name"
                        value={yearForm.name}
                        onChange={(event) =>
                          setYearForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="Academic year name"
                        required
                      />
                    </FormField>
                    <FormField label="Start Date" htmlFor="academic-year-start-date" required>
                      <TextInput
                        id="academic-year-start-date"
                        type="date"
                        value={yearForm.start_date}
                        onChange={(event) =>
                          setYearForm((previous) => ({
                            ...previous,
                            start_date: event.target.value,
                          }))
                        }
                        required
                      />
                    </FormField>
                    <FormField label="End Date" htmlFor="academic-year-end-date" required>
                      <TextInput
                        id="academic-year-end-date"
                        type="date"
                        value={yearForm.end_date}
                        onChange={(event) =>
                          setYearForm((previous) => ({ ...previous, end_date: event.target.value }))
                        }
                        required
                      />
                    </FormField>
                    <Checkbox
                      id="academic-year-current"
                      label="Current year"
                      checked={yearForm.current}
                      onChange={(event) =>
                        setYearForm((previous) => ({ ...previous, current: event.target.checked }))
                      }
                    />
                    <FormActions
                      submitLabel={yearForm.id ? "Update Academic Year" : "Create Academic Year"}
                      submitDisabled={
                        !isAdmin ||
                        !yearForm.name.trim() ||
                        !yearForm.start_date ||
                        !yearForm.end_date
                      }
                    />
                  </form>
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

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveTerm();
                    }}
                    className="space-y-3 rounded border border-gray-200 p-3"
                  >
                    <FormField label="Academic Year" htmlFor="term-academic-year" required>
                      <Select
                        id="term-academic-year"
                        value={termForm.academic_year_id}
                        onChange={(event) =>
                          setTermForm((previous) => ({
                            ...previous,
                            academic_year_id: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select academic year</option>
                        {academicYears.map((year) => (
                          <option key={year.id} value={year.id}>
                            {year.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Term Name" htmlFor="term-name" required>
                      <TextInput
                        id="term-name"
                        value={termForm.name}
                        onChange={(event) =>
                          setTermForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="Term name"
                        required
                      />
                    </FormField>
                    <FormField label="Start Date" htmlFor="term-start-date" required>
                      <TextInput
                        id="term-start-date"
                        type="date"
                        value={termForm.start_date}
                        onChange={(event) =>
                          setTermForm((previous) => ({
                            ...previous,
                            start_date: event.target.value,
                          }))
                        }
                        required
                      />
                    </FormField>
                    <FormField label="End Date" htmlFor="term-end-date" required>
                      <TextInput
                        id="term-end-date"
                        type="date"
                        value={termForm.end_date}
                        onChange={(event) =>
                          setTermForm((previous) => ({ ...previous, end_date: event.target.value }))
                        }
                        required
                      />
                    </FormField>
                    <FormActions
                      submitLabel={termForm.id ? "Update Term" : "Create Term"}
                      submitDisabled={
                        !isAdmin ||
                        !termForm.academic_year_id ||
                        !termForm.name.trim() ||
                        !termForm.start_date ||
                        !termForm.end_date
                      }
                    />
                  </form>
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
