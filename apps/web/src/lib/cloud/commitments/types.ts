import { z } from 'zod';

// --- Commitment Item (Provider-Agnostic) ------------------------------------

export const CommitmentTypeSchema = z.enum([
  'RESERVED_INSTANCE',
  'SAVINGS_PLAN',
  'COMMITTED_USE_DISCOUNT',
]);
export type CommitmentTypeValue = z.infer<typeof CommitmentTypeSchema>;

export const CommitmentStatusSchema = z.enum([
  'ACTIVE',
  'EXPIRED',
  'PENDING',
  'CANCELLED',
]);
export type CommitmentStatusValue = z.infer<typeof CommitmentStatusSchema>;

export interface CommitmentItemData {
  provider: 'AWS' | 'AZURE' | 'GCP' | 'OCI';
  commitmentType: CommitmentTypeValue;
  commitmentId: string;
  commitmentName: string;
  serviceType: string;
  instanceFamily: string | null;
  region: string;
  term: string;
  paymentOption: string;
  status: CommitmentStatusValue;
  startDate: Date;
  endDate: Date;
  hourlyCommitment: number;
  upfrontCost: number;
  utilizationPercent: number | null;
  metadata: Record<string, unknown>;
}

// --- Portfolio Summary ------------------------------------------------------

export interface CommitmentPortfolio {
  items: CommitmentItemData[];
  summary: {
    totalActive: number;
    totalCommittedHourly: number;
    totalUpfrontCost: number;
    averageUtilization: number;
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
}

// --- Expiration Alert -------------------------------------------------------

export interface ExpirationAlert {
  commitmentId: string;
  commitmentName: string;
  provider: string;
  commitmentType: CommitmentTypeValue;
  endDate: Date;
  daysRemaining: number;
  alertWindow: '30' | '60' | '90';
}

// --- Tunable Recommendation Parameters --------------------------------------

export const TunableRecommendationParamsSchema = z.object({
  termInYears: z.enum(['ONE_YEAR', 'THREE_YEARS']).default('ONE_YEAR'),
  paymentOption: z.enum(['NO_UPFRONT', 'ALL_UPFRONT', 'PARTIAL_UPFRONT']).default('NO_UPFRONT'),
  lookbackPeriod: z.enum(['SEVEN_DAYS', 'THIRTY_DAYS', 'SIXTY_DAYS']).default('SIXTY_DAYS'),
});

export type TunableRecommendationParams = z.infer<typeof TunableRecommendationParamsSchema>;
