import { useMemo, useState } from "react";

export interface CommandPaletteItem {
  id: string;
  label: string;
  keywords?: string[];
  group?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  title?: string;
  items: CommandPaletteItem[];
  onClose: () => void;
}

export function CommandPalette({
  open,
  title = "Jump to a workspace or action",
  items,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      const haystack = [item.label, ...(item.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/50 px-4 pt-[10vh]">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspaces, pages, or actions"
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-400"
          />
        </div>
        <div className="max-h-[24rem] overflow-y-auto px-3 py-3">
          {filteredItems.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No matching commands.
            </p>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-slate-100"
              >
                <span className="text-sm font-medium text-slate-900">{item.label}</span>
                {item.group ? <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.group}</span> : null}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
