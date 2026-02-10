import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { Server, Cloud, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Resources' };
export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const data = await getDashboardData();
  const hasAccount = data.accountId && data.accountId !== 'not-connected';

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Inventory of all discovered cloud resources with cost attribution.
        </p>
      </div>

      {hasAccount ? (
        <>
          {/* Show services we know about from Cost Explorer */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-6 pb-3">
              <h3 className="font-semibold">Active Services (from Cost Explorer)</h3>
              <p className="text-sm text-muted-foreground">
                AWS Account {data.accountId} — {data.topServices.length} services with active spend
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-6 py-3 font-medium text-muted-foreground">Service</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Provider</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Region</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">Monthly Cost (MTD)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topServices.map((service) => (
                    <tr key={service.name} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          {service.provider}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">us-east-1</td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          active
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        ${service.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Individual resource inventory:</strong> Detailed per-resource tracking (EC2 instances, S3 buckets, RDS databases)
              requires AWS Config or Resource Explorer integration. Currently showing service-level cost data from Cost Explorer.
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No accounts connected</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Connect a cloud account to discover and track resources.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
