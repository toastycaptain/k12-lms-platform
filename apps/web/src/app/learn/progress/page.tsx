"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useCurriculumRuntime } from "@/features/curriculum/runtime/useCurriculumRuntime";
import { StudentExperience } from "@/features/ib/student/StudentExperience";
import StudentProgressView from "@/components/StudentProgressView";
import { useAuth } from "@/lib/auth-context";

const LEARN_PROGRESS_ROLES = ["student"];

export default function LearnProgressPage() {
  const { user } = useAuth();
  const { isIb } = useCurriculumRuntime();

  if (isIb) {
    return (
      <ProtectedRoute requiredRoles={LEARN_PROGRESS_ROLES}>
        <AppShell>
          <StudentExperience variant="progress" />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={LEARN_PROGRESS_ROLES}>
      <AppShell>
        {user ? (
          <StudentProgressView
            studentId={user.id}
            heading="Progress"
            description="Track course performance, standards mastery, and recent grade trends."
          />
        ) : null}
      </AppShell>
    </ProtectedRoute>
  );
}
