"use client";

import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentProgressView from "@/components/StudentProgressView";

const GUARDIAN_ROLES = ["guardian", "admin"];

export default function GuardianStudentProgressPage() {
  const params = useParams();
  const studentId = Number(params.studentId);

  if (!Number.isFinite(studentId) || studentId <= 0) {
    return (
      <ProtectedRoute requiredRoles={GUARDIAN_ROLES}>
        <AppShell>
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            Invalid student id.
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={GUARDIAN_ROLES}>
      <AppShell>
        <StudentProgressView
          studentId={studentId}
          heading="Student Progress"
          description="Read-only student progress summary for guardian review."
        />
      </AppShell>
    </ProtectedRoute>
  );
}
