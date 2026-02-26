export const dynamic = 'force-dynamic';

import { getCommitmentPortfolio, computeExpirationAlerts } from '@/lib/cloud/commitments/commitment-service';
import { getCommitmentCoverage, getRIPurchaseRecommendations, getSPPurchaseRecommendations } from '@/lib/cloud/aws-costs';
import { CommitmentsClient } from './CommitmentsClient';

export default async function CommitmentsPage() {
  const [portfolio, coverage, riRecs, spRecs] = await Promise.all([
    getCommitmentPortfolio(),
    getCommitmentCoverage(),
    getRIPurchaseRecommendations(),
    getSPPurchaseRecommendations(),
  ]);

  const alerts = computeExpirationAlerts(portfolio.items);

  return (
    <CommitmentsClient
      portfolio={portfolio}
      coverage={coverage}
      alerts={alerts}
      riRecommendations={riRecs}
      spRecommendations={spRecs}
    />
  );
}
