import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";

export function ExceptionStack({ items }: { items: HomeLinkItem[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
        >
          <p className="text-lg font-semibold text-slate-950">{item.label}</p>
          <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
        </a>
      ))}
    </div>
  );
}
