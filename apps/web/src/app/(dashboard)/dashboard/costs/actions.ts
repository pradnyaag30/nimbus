'use server';

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  type Expression,
} from '@aws-sdk/client-cost-explorer';

// --- Types -------------------------------------------------------------------

export interface CostExplorerFilters {
  granularity: 'DAILY' | 'MONTHLY';
  datePreset: string;
  startDate?: string;
  endDate?: string;
  services: string[];
  regions: string[];
  providers: string[];
  accounts: string[];
  chargeTypes: string[];
}

export interface FilteredCostResult {
  costData: { date: string; cost: number }[];
  serviceBreakdown: { service: string; cost: number; percentOfTotal: number }[];
  totalSpend: number;
}

// --- Helpers -----------------------------------------------------------------

function createClient() {
  return new CostExplorerClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getDateRange(filters: CostExplorerFilters): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let start: Date;

  if (filters.datePreset === 'custom' && filters.startDate && filters.endDate) {
    return { start: filters.startDate, end: filters.endDate };
  }

  switch (filters.datePreset) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6m':
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case '12m':
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      break;
  }

  // Enforce DAILY 14-day cap
  if (filters.granularity === 'DAILY') {
    const maxDaily = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    if (start < maxDaily) start = maxDaily;
  }

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function buildAwsFilter(filters: CostExplorerFilters): Expression | undefined {
  const conditions: Expression[] = [];

  if (filters.services.length) {
    conditions.push({ Dimensions: { Key: 'SERVICE', Values: filters.services } });
  }
  if (filters.regions.length) {
    conditions.push({ Dimensions: { Key: 'REGION', Values: filters.regions } });
  }
  if (filters.accounts.length) {
    conditions.push({ Dimensions: { Key: 'LINKED_ACCOUNT', Values: filters.accounts } });
  }
  if (filters.chargeTypes.length) {
    conditions.push({ Dimensions: { Key: 'RECORD_TYPE', Values: filters.chargeTypes } });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { And: conditions };
}

// --- Server Action -----------------------------------------------------------

export async function getFilteredCosts(
  filters: CostExplorerFilters,
): Promise<FilteredCostResult> {
  const client = createClient();
  const { start, end } = getDateRange(filters);
  const awsFilter = buildAwsFilter(filters);

  try {
    // Fetch cost trend
    const trendCmd = new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: filters.granularity,
      Metrics: ['UnblendedCost'],
      ...(awsFilter ? { Filter: awsFilter } : {}),
    });

    // Fetch service breakdown
    const serviceCmd = new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
      ...(awsFilter ? { Filter: awsFilter } : {}),
    });

    const [trendRes, serviceRes] = await Promise.all([
      client.send(trendCmd),
      client.send(serviceCmd),
    ]);

    // Parse trend data
    const costData =
      trendRes.ResultsByTime?.map((r) => ({
        date: r.TimePeriod?.Start || '',
        cost: parseFloat(r.Total?.UnblendedCost?.Amount || '0'),
      })) || [];

    // Parse service breakdown (aggregate across all time periods)
    const serviceMap = new Map<string, number>();
    for (const period of serviceRes.ResultsByTime || []) {
      for (const group of period.Groups || []) {
        const name = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        serviceMap.set(name, (serviceMap.get(name) || 0) + cost);
      }
    }

    const totalSpend = costData.reduce((sum, d) => sum + d.cost, 0);
    const serviceBreakdown = Array.from(serviceMap.entries())
      .map(([service, cost]) => ({
        service,
        cost,
        percentOfTotal: totalSpend > 0 ? (cost / totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 15);

    return { costData, serviceBreakdown, totalSpend };
  } catch (error) {
    console.error('[CostExplorer] Filtered query failed:', error);
    return { costData: [], serviceBreakdown: [], totalSpend: 0 };
  }
}
