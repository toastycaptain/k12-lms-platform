"use client";

import { CoordinatorOverview } from "@/features/ib/home/CoordinatorOverview";
import { TeacherActionConsole } from "@/features/ib/home/TeacherActionConsole";
import { useIbContext } from "@/features/ib/core/useIbContext";
import { isCoordinatorRole } from "@/features/ib/home/useIbHomePayload";
import { useCurriculumRuntime } from "@/features/curriculum/runtime/useCurriculumRuntime";

export default function IbHomePage() {
  const { currentWorkMode } = useIbContext();
  const { roles } = useCurriculumRuntime();
  const coordinator = isCoordinatorRole(roles);

  if (coordinator && currentWorkMode === "review") {
    return <CoordinatorOverview />;
  }

  if (coordinator && !roles.includes("teacher")) {
    return <CoordinatorOverview />;
  }

  return <TeacherActionConsole />;
}
