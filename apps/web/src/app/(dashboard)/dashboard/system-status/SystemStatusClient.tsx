'use client';

import {
  Activity,
  Cloud,
  Server,
  Cpu,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  MonitorCheck,
  Clock,
} from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface CloudAccountStatus {
  provider: 'AWS' | 'Azure' | 'GCP';
  connected: boolean;
  accountId?: string;
  region?: string;
  lastSync?: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'fallback' | 'not_configured';
  detail?: string;
}

interface PlatformInfo {
  version: string;
  uptimeSeconds: number;
  nodeVersion: string;
  environment: string;
}

interface SystemStatusClientProps {
  cloudAccounts: CloudAccountStatus[];
  services: ServiceStatus[];
  platform: PlatformInfo;
  overallStatus: 'all_healthy' | 'degraded' | 'critical';
  healthyCount: number;
  totalServices: number;
}

// --- Styling Maps ------------------------------------------------------------

const providerConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  AWS: {
    label: 'Amazon Web Services',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  Azure: {
    label: 'Microsoft Azure',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  GCP: {
    label: 'Google Cloud Platform',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

const serviceStatusConfig = {
  healthy: {
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
    label: 'Healthy',
    icon: CheckCircle,
  },
  fallback: {
    bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'Fallback',
    icon: AlertTriangle,
  },
  not_configured: {
    bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    dot: 'bg-gray-400',
    label: 'Not Configured',
    icon: MinusCircle,
  },
};

const overallStatusConfig = {
  all_healthy: {
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    label: 'All Systems Operational',
    icon: CheckCircle,
  },
  degraded: {
    bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    label: 'Partially Degraded',
    icon: AlertTriangle,
  },
  critical: {
    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Critical Issues',
    icon: AlertTriangle,
  },
};

// --- Helpers -----------------------------------------------------------------

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

function formatSyncTime(isoString?: string): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Component ---------------------------------------------------------------

export function SystemStatusClient({
  cloudAccounts,
  services,
  platform,
  overallStatus,
  healthyCount,
  totalServices,
}: SystemStatusClientProps) {
  const overall = overallStatusConfig[overallStatus];
  const OverallIcon = overall.icon;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
            <p className="text-sm text-muted-foreground">
              Monitor platform health, cloud connections, and service dependencies.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${overall.bg}`}
        >
          <OverallIcon className="h-4 w-4" />
          {overall.label}
        </span>
      </div>

      {/* Cloud Accounts */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Cloud Accounts
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {cloudAccounts.map((account) => {
            const config = providerConfig[account.provider];
            return (
              <div
                key={account.provider}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}
                    >
                      <Cloud className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.provider}</h3>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      account.connected ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    title={account.connected ? 'Connected' : 'Not configured'}
                  />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={
                        account.connected
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : 'text-muted-foreground'
                      }
                    >
                      {account.connected ? 'Connected' : 'Not configured'}
                    </span>
                  </div>
                  {account.accountId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account</span>
                      <span className="font-mono text-xs">{account.accountId}</span>
                    </div>
                  )}
                  {account.region && account.connected && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region</span>
                      <span className="font-mono text-xs">{account.region}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatSyncTime(account.lastSync)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Services ({healthyCount}/{totalServices} healthy)
          </h2>
        </div>
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="divide-y">
            {services.map((service) => {
              const config = serviceStatusConfig[service.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      {service.detail && (
                        <p className="text-xs text-muted-foreground">{service.detail}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Version</p>
              <MonitorCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-2xl font-bold">v{platform.version}</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">{formatUptime(platform.uptimeSeconds)}</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Node.js</p>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-bold">{platform.nodeVersion}</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Environment</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-bold capitalize">{platform.environment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
