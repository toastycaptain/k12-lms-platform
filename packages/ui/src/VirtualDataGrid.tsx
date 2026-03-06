import type { ReactNode } from "react";

interface DataGridColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface VirtualDataGridProps<T extends Record<string, unknown>> {
  columns: Array<DataGridColumn<T>>;
  rows: T[];
}

export function VirtualDataGrid<T extends Record<string, unknown>>({
  columns,
  rows,
}: VirtualDataGridProps<T>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[28rem] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-600">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 last:border-b-0">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
