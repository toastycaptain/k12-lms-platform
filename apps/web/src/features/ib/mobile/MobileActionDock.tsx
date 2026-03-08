"use client";

import Link from "next/link";

export interface MobileActionDockItem {
  id: string;
  label: string;
  href: string;
  detail?: string;
  onSelect?: () => void;
}

export function MobileActionDock({
  items,
  title = "Quick actions",
}: {
  items: MobileActionDockItem[];
  title?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.slice(0, 4).map((item) =>
          item.onSelect ? (
            <button
              key={item.id}
              type="button"
              onClick={item.onSelect}
              className="flex min-h-12 flex-col justify-center rounded-[1.2rem] border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-900"
            >
              <span className="font-semibold leading-tight">{item.label}</span>
              {item.detail ? (
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {item.detail}
                </span>
              ) : null}
            </button>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className="flex min-h-12 flex-col justify-center rounded-[1.2rem] border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-900"
            >
              <span className="font-semibold leading-tight">{item.label}</span>
              {item.detail ? (
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {item.detail}
                </span>
              ) : null}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
