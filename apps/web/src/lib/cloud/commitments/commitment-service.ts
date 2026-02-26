import { listAllAwsCommitments } from './aws-commitments';
import { listAllAzureCommitments } from './azure-commitments';
import { listAllGcpCommitments } from './gcp-commitments';
import type {
  CommitmentItemData,
  CommitmentPortfolio,
  ExpirationAlert,
} from './types';

// --- Aggregate All Providers ------------------------------------------------

export async function getCommitmentPortfolio(): Promise<CommitmentPortfolio> {
  const [awsItems, azureItems, gcpItems] = await Promise.all([
    listAllAwsCommitments(),
    listAllAzureCommitments(),
    listAllGcpCommitments(),
  ]);

  const items = [...awsItems, ...azureItems, ...gcpItems];
  const activeItems = items.filter((i) => i.status === 'ACTIVE');

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const utilizationValues = activeItems
    .map((i) => i.utilizationPercent)
    .filter((v): v is number => v !== null);

  return {
    items,
    summary: {
      totalActive: activeItems.length,
      totalCommittedHourly: activeItems.reduce(
        (sum, i) => sum + i.hourlyCommitment,
        0
      ),
      totalUpfrontCost: activeItems.reduce(
        (sum, i) => sum + i.upfrontCost,
        0
      ),
      averageUtilization:
        utilizationValues.length > 0
          ? utilizationValues.reduce((sum, v) => sum + v, 0) /
            utilizationValues.length
          : 0,
      expiringIn30Days: activeItems.filter(
        (i) => i.endDate <= in30Days && i.endDate > now
      ).length,
      expiringIn60Days: activeItems.filter(
        (i) => i.endDate <= in60Days && i.endDate > now
      ).length,
      expiringIn90Days: activeItems.filter(
        (i) => i.endDate <= in90Days && i.endDate > now
      ).length,
    },
  };
}

// --- Expiration Alerts ------------------------------------------------------

export function computeExpirationAlerts(
  items: CommitmentItemData[]
): ExpirationAlert[] {
  const now = new Date();
  const alerts: ExpirationAlert[] = [];

  for (const item of items) {
    if (item.status !== 'ACTIVE') continue;

    const daysRemaining = Math.ceil(
      (item.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0) continue;

    const alertWindow =
      daysRemaining <= 30 ? '30' : daysRemaining <= 60 ? '60' : daysRemaining <= 90 ? '90' : null;

    if (alertWindow) {
      alerts.push({
        commitmentId: item.commitmentId,
        commitmentName: item.commitmentName,
        provider: item.provider,
        commitmentType: item.commitmentType,
        endDate: item.endDate,
        daysRemaining,
        alertWindow,
      });
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
