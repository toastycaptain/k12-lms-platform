"use client";

import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  primary?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  caption?: string;
  onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const primaryCol = columns.find((column) => column.primary) || columns[0];

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold text-gray-700" scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`border-b last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                role={onRowClick ? "button" : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-gray-700">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden" role="list">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className={`rounded-lg border border-gray-200 bg-white p-4 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            role={onRowClick ? "button" : "listitem"}
          >
            <div className="font-medium text-gray-900">{primaryCol.render(row)}</div>
            <dl className="mt-2 space-y-1">
              {columns
                .filter((column) => column !== primaryCol)
                .map((column) => (
                  <div key={column.key} className="flex justify-between text-sm">
                    <dt className="font-medium text-gray-500">{column.header}</dt>
                    <dd className="text-gray-700">{column.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
