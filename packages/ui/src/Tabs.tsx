import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: string;
  content?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  panelClassName?: string;
}

export function Tabs({
  tabs,
  value,
  onValueChange,
  label = "Tabs",
  className = "",
  panelClassName = "",
}: TabsProps) {
  const activeTab = tabs.find((tab) => tab.id === value) ?? tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex w-full flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onValueChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    active ? "bg-white/15 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {activeTab?.content ? (
        <div role="tabpanel" className={panelClassName}>
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
