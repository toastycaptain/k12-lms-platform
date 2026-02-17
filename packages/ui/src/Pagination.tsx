"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  perPageOptions = [10, 25, 50],
  onPerPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages: Array<number | "ellipsis"> = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          Previous
        </button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-gray-400"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      {perPage && onPerPageChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="per-page-select" className="text-sm text-gray-600">
            Per page:
          </label>
          <select
            id="per-page-select"
            value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
