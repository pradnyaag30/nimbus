import { getNormalizedRegions } from '@/lib/cloud/pricing/pricing-service';
import { WorkloadPlannerClient } from './WorkloadPlannerClient';

export const metadata = { title: 'Workload Planner' };
export const dynamic = 'force-dynamic';

export default async function WorkloadPlannerPage() {
  const regions = getNormalizedRegions();
  return <WorkloadPlannerClient regions={regions} />;
}
