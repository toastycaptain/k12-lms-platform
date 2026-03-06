import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  position?: "right" | "left";
  widthClassName?: string;
}

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  position = "right",
  widthClassName = "w-full max-w-xl",
}: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/45">
      <button
        type="button"
        aria-label="Close drawer"
        className="flex-1"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`${widthClassName} ${position === "left" ? "order-first" : ""} flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
