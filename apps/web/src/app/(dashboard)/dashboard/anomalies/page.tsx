import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { AnomaliesClient } from './AnomaliesClient';

export const metadata = { title: 'Cost Anomalies' };
export const dynamic = 'force-dynamic';

export default async function AnomaliesPage() {
  const data = await getDashboardData();

  return (
    <AnomaliesClient
      topServices={data.topServices}
      totalSpendMTD={data.totalSpendMTD}
      accountId={data.accountId}
      error={data.error}
    />
  );
}
