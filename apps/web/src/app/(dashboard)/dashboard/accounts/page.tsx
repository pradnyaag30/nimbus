import { Cloud, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export const metadata = { title: 'Cloud Accounts' };

// TODO: Replace with real data
const accounts = [
  {
    id: '1',
    name: 'Production AWS',
    provider: 'aws',
    accountId: '123456789012',
    status: 'connected',
    lastSync: '2026-02-10T12:00:00Z',
    resourceCount: 142,
  },
  {
    id: '2',
    name: 'Azure Enterprise',
    provider: 'azure',
    accountId: 'sub-abc-def-123',
    status: 'connected',
    lastSync: '2026-02-10T11:30:00Z',
    resourceCount: 87,
  },
  {
    id: '3',
    name: 'GCP Analytics',
    provider: 'gcp',
    accountId: 'nimbus-analytics-prod',
    status: 'error',
    lastSync: '2026-02-09T08:00:00Z',
    resourceCount: 34,
  },
];

const providerMeta: Record<string, { label: string; color: string }> = {
  aws: { label: 'Amazon Web Services', color: 'bg-orange-500' },
  azure: { label: 'Microsoft Azure', color: 'bg-blue-500' },
  gcp: { label: 'Google Cloud Platform', color: 'bg-green-500' },
};

export default function CloudAccountsPage() {
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
        {accounts.map((account) => {
          const meta = providerMeta[account.provider];
          return (
            <div key={account.id} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.color}`}>
                    <Cloud className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{account.name}</h3>
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                </div>
                {account.status === 'connected' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">{account.accountId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resources</span>
                  <span>{account.resourceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{formatRelativeTime(account.lastSync)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new account card */}
        <button className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card/50 p-6 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
          <Plus className="h-8 w-8" />
          <p className="mt-2 text-sm font-medium">Add Cloud Account</p>
          <p className="mt-1 text-xs">Connect AWS, Azure, or GCP</p>
        </button>
      </div>
    </div>
  );
}
