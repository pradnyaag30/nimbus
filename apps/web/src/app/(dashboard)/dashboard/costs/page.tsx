import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { CostExplorerClient } from './CostExplorerClient';

export const metadata = { title: 'Cost Explorer' };
export const dynamic = 'force-dynamic';

export default async function CostExplorerPage() {
  const data = await getDashboardData();

  // Extract available filter options from existing data
  const availableServices = data.topServices.map((s) => s.name);
  const availableRegions = ['ap-south-1', 'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1'];

  return (
    <CostExplorerClient
      monthlyCosts={data.monthlyCosts}
      topServices={data.topServices}
      totalSpendMTD={data.totalSpendMTD}
      forecastedSpend={data.forecastedSpend}
      changePercentage={data.changePercentage}
      accountId={data.accountId}
      error={data.error}
      availableServices={availableServices}
      availableRegions={availableRegions}
    />
  );
}
