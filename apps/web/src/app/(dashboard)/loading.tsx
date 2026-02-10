export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="h-[350px] animate-pulse rounded-xl border bg-muted lg:col-span-4" />
        <div className="h-[350px] animate-pulse rounded-xl border bg-muted lg:col-span-3" />
      </div>
    </div>
  );
}
