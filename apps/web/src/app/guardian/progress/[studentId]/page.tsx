"use client";

import { useParams } from "next/navigation";
import { useCurriculumRuntime } from "@/features/curriculum/runtime/useCurriculumRuntime";
import { GuardianExperience } from "@/features/ib/guardian/GuardianExperience";
import StudentProgressView from "@/components/StudentProgressView";

export default function GuardianStudentProgressPage() {
  const params = useParams();
  const studentId = Number(params.studentId);
  const { isIb } = useCurriculumRuntime();

  if (isIb) {
    return <GuardianExperience />;
  }

  if (!Number.isFinite(studentId) || studentId <= 0) {
    return (
      <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        Invalid student id.
      </div>
    );
  }

  return (
    <StudentProgressView
      studentId={studentId}
      heading="Student Progress"
      description="Read-only student progress summary for guardian review."
    />
  );
}
