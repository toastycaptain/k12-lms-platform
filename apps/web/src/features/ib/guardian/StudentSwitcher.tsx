"use client";

export function StudentSwitcher({
  students,
  activeId,
  onChange,
}: {
  students: Array<{ id: number; label: string; relationship: string }>;
  activeId: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {students.map((student) => (
        <button
          key={student.id}
          type="button"
          onClick={() => onChange(student.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${activeId === student.id ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-700"}`}
        >
          {student.label}
        </button>
      ))}
    </div>
  );
}
