import { Cloud, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';

export const metadata = { title: 'Cloud Accounts' };
export const dynamic = 'force-dynamic';

const providerMeta: Record<string, { label: string; color: string }> = {
  aws: { label: 'Amazon Web Services', color: 'bg-orange-500' },
  azure: { label: 'Microsoft Azure', color: 'bg-blue-500' },
  gcp: { label: 'Google Cloud Platform', color: 'bg-green-500' },
};

export default async function CloudAccountsPage() {
  const data = await getDashboardData();

  const hasAwsAccount = data.accountId && data.accountId !== 'not-connected';
  const lastSync = new Date().toISOString();

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cloud Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage connected cloud provider accounts and credentials.
          </p>
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Real AWS Account */}
        {hasAwsAccount && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
                  <Cloud className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">PFL Production AWS</h3>
                  <p className="text-xs text-muted-foreground">Amazon Web Services</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-xs">{data.accountId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region</span>
                <span className="font-mono text-xs">ap-south-1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services Tracked</span>
                <span>{data.topServices.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <RefreshCw className="h-3 w-3" />
                  Live (5-min cache)
                </span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-xs text-green-700 dark:text-green-300">
                Connected via AWS Cost Explorer API. Data refreshes every 5 minutes.
              </p>
            </div>
          </div>
        )}

        {/* Azure - Not Connected */}
        <div className="rounded-xl border bg-card p-6 shadow-sm opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Microsoft Azure</h3>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Connect your Azure subscription to get cost visibility across Azure services.
            </p>
            <button className="mt-3 inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent">
              Connect Azure
            </button>
          </div>
        </div>

        {/* GCP - Not Connected */}
        <div className="rounded-xl border bg-card p-6 shadow-sm opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Google Cloud Platform</h3>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Connect your GCP project to track BigQuery, Compute Engine, and other services.
            </p>
            <button className="mt-3 inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent">
              Connect GCP
            </button>
          </div>
        </div>

        {/* Add new account card */}
        <button className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 p-6 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
          <Plus className="h-8 w-8" />
          <p className="mt-2 text-sm font-medium">Add Cloud Account</p>
          <p className="mt-1 text-xs">Connect AWS, Azure, or GCP</p>
        </button>
      </div>

      {!hasAwsAccount && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No accounts connected</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {data.error || 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables to connect your AWS account.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
