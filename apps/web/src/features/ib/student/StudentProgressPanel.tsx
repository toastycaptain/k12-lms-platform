import { VirtualDataGrid } from "@k12/ui";

export function StudentProgressPanel({
  rows = [],
}: {
  rows?: Array<{ area: string; signal: string; next: string }>;
}) {
  return (
    <VirtualDataGrid
      columns={[
        { key: "area", header: "Progress signal" },
        { key: "signal", header: "Current picture" },
        { key: "next", header: "What to do next" },
      ]}
      rows={rows}
    />
  );
}
