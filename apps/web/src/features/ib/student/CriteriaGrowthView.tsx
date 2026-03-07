import { GrowthSparkline } from "@/features/ib/student/GrowthSparkline";

export function CriteriaGrowthView({
  points,
}: {
  points: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Criteria growth</h2>
      <div className="mt-4">
        <GrowthSparkline points={points} />
      </div>
    </div>
  );
}
