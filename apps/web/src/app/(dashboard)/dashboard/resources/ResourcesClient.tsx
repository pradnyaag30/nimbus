'use client';

import { useState, useMemo } from 'react';
import {
  Server, Search, Layers, Globe, AlertTriangle, Database,
  Zap, HardDrive, Shield, Cloud, Activity, Bell, Inbox,
  Container,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ServiceInventoryRow } from './components/ServiceInventoryRow';

// --- Types -------------------------------------------------------------------

interface CloudResource {
  arn: string;
  resourceType: string;
  service: string;
  region: string;
  owningAccountId?: string;
}

interface ResourcesClientProps {
  totalCount: number;
  capped: boolean;
  byService: { service: string; count: number }[];
  byRegion: { region: string; count: number }[];
  resources: CloudResource[];
  error?: string;
}

// --- Service icon mapping ---------------------------------------------------

const SERVICE_ICONS: Record<string, LucideIcon> = {
  EC2: Server,
  S3: HardDrive,
  RDS: Database,
  Lambda: Zap,
  IAM: Shield,
  CloudFront: Globe,
  ECS: Container,
  ElastiCache: Database,
  DynamoDB: Database,
  SNS: Bell,
  SQS: Inbox,
  CloudWatch: Activity,
};

function getServiceIcon(service: string): LucideIcon {
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (service.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return Cloud;
}

// --- Component ---------------------------------------------------------------

export function ResourcesClient({
  totalCount,
  capped,
  byService,
  byRegion,
  resources,
  error,
}: ResourcesClientProps) {
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const serviceCount = byService.length;
  const regionCount = byRegion.length;
  const topService = byService.length > 0 ? byService[0] : null;
  const maxServiceCount = byService.length > 0 ? byService[0].count : 1;

  // Group resources by service, applying filters
  const groupedData = useMemo(() => {
    let filtered = resources;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.service.toLowerCase().includes(q) ||
          r.resourceType.toLowerCase().includes(q) ||
          r.arn.toLowerCase().includes(q),
      );
    }
    if (serviceFilter) {
      filtered = filtered.filter((r) => r.service === serviceFilter);
    }
    if (regionFilter) {
      filtered = filtered.filter((r) => r.region === regionFilter);
    }

    // Group by service
    const groups = new Map<string, CloudResource[]>();
    for (const r of filtered) {
      const existing = groups.get(r.service) || [];
      existing.push(r);
      groups.set(r.service, existing);
    }

    return Array.from(groups.entries())
      .map(([service, items]) => {
        const regions = [...new Set(items.map((r) => r.region))];
        return { service, count: items.length, regions, resources: items };
      })
      .sort((a, b) => b.count - a.count);
  }, [resources, search, serviceFilter, regionFilter]);

  // --- Unavailable state ---
  if (error || totalCount === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cloud Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Resource inventory across your cloud accounts.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No resource data available</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {error || 'Connect a cloud account and enable Resource Explorer to view your inventory.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allServices = byService.map((s) => s.service);
  const allRegions = byRegion.map((r) => r.region);

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cloud Inventory</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} resources across {serviceCount} services and {regionCount} regions
          {capped && ' (resource count capped)'}
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Resources</p>
            <Server className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-3xl font-bold">{totalCount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Services</p>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-3xl font-bold">{serviceCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Regions</p>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-3xl font-bold">{regionCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Largest Service</p>
            {topService && (() => { const Icon = getServiceIcon(topService.service); return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
          </div>
          <p className="mt-1 text-xl font-bold">{topService?.service || '-'}</p>
          <p className="text-sm text-muted-foreground">{topService?.count.toLocaleString() || 0} resources</p>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Services Overview
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byService.slice(0, 8).map((svc) => {
            const Icon = getServiceIcon(svc.service);
            const barWidth = maxServiceCount > 0 ? (svc.count / maxServiceCount) * 100 : 0;
            return (
              <button
                key={svc.service}
                type="button"
                onClick={() => setServiceFilter(serviceFilter === svc.service ? null : svc.service)}
                className={`rounded-xl border bg-card p-4 shadow-sm text-left transition-all hover:shadow-md ${
                  serviceFilter === svc.service ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{svc.service}</p>
                    <p className="text-lg font-bold">{svc.count.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${barWidth}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services, resource types, or ARNs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={serviceFilter || ''}
          onChange={(e) => setServiceFilter(e.target.value || null)}
          className="h-9 rounded-lg border bg-background px-3 text-sm outline-none"
        >
          <option value="">All Services</option>
          {allServices.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={regionFilter || ''}
          onChange={(e) => setRegionFilter(e.target.value || null)}
          className="h-9 rounded-lg border bg-background px-3 text-sm outline-none"
        >
          <option value="">All Regions</option>
          {allRegions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {(search || serviceFilter || regionFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setServiceFilter(null); setRegionFilter(null); }}
            className="h-9 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Inventory Table (grouped by service, expandable) */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Resource Inventory</h3>
          <p className="text-sm text-muted-foreground">
            {groupedData.length} services — click a row to see individual resources
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Service</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Count</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Regions</th>
                <th className="px-6 py-3 font-medium text-muted-foreground min-w-[120px]">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((group) => (
                <ServiceInventoryRow
                  key={group.service}
                  service={group.service}
                  count={group.count}
                  maxCount={maxServiceCount}
                  regions={group.regions}
                  resources={group.resources}
                />
              ))}
              {groupedData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No resources match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
