export function MultiAttachSummary({ count }: { count: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
      {count} units will receive this contribution.
    </div>
  );
}
