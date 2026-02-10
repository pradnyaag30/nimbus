import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { BudgetsClient } from './BudgetsClient';

export const metadata = { title: 'Budgets' };
export const dynamic = 'force-dynamic';

export default async function BudgetsPage() {
  const data = await getDashboardData();

  return (
    <BudgetsClient
      totalSpendMTD={data.totalSpendMTD}
      forecastedSpend={data.forecastedSpend}
      topServices={data.topServices}
      accountId={data.accountId}
      error={data.error}
    />
  );
}
