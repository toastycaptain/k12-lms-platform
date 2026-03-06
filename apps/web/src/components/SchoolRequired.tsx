"use client";

import { EmptyState } from "@k12/ui";
import { useSchool } from "@/lib/school-context";

export default function SchoolRequired({ children }: { children: React.ReactNode }) {
  const { loading, schoolId, schools } = useSchool();

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading school...</div>;
  }

  if (schools.length === 0 || !schoolId) {
    return (
      <div className="p-6">
        <EmptyState
          title="No schools available"
          description="You do not currently have access to any schools in this tenant."
        />
      </div>
    );
  }

  return <>{children}</>;
}
