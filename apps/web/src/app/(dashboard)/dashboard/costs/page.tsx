export const metadata = { title: 'Cost Explorer' };

export default function CostExplorerPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Analyze and break down your cloud costs by service, account, region, and tags.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Provider</label>
          <select className="h-8 rounded-md border bg-transparent px-2 text-sm">
            <option value="all">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group By</label>
          <select className="h-8 rounded-md border bg-transparent px-2 text-sm">
            <option value="service">Service</option>
            <option value="account">Account</option>
            <option value="region">Region</option>
            <option value="tag">Tag</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Period</label>
          <select className="h-8 rounded-md border bg-transparent px-2 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Placeholder for cost data */}
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          Connect a cloud account to start exploring costs.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Go to Cloud Accounts to add your first provider.
        </p>
      </div>
    </div>
  );
}
