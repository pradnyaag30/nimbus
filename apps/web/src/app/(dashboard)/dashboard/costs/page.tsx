import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { CostExplorerClient } from './CostExplorerClient';

export const metadata = { title: 'Cost Explorer' };
export const dynamic = 'force-dynamic';

export default async function CostExplorerPage() {
  const data = await getDashboardData();

  return (
    <CostExplorerClient
      monthlyCosts={data.monthlyCosts}
      topServices={data.topServices}
      totalSpendMTD={data.totalSpendMTD}
      forecastedSpend={data.forecastedSpend}
      changePercentage={data.changePercentage}
      accountId={data.accountId}
      error={data.error}
    />
  );
}
