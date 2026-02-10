import { z } from 'zod';

export const CloudProviderSchema = z.enum(['AWS', 'AZURE', 'GCP', 'KUBERNETES']);
export type CloudProviderType = z.infer<typeof CloudProviderSchema>;

export const CloudCredentialsSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('AWS'),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    roleArn: z.string().optional(),
    externalId: z.string().optional(),
  }),
  z.object({
    provider: z.literal('AZURE'),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    tenantId: z.string().min(1),
    subscriptionId: z.string().min(1),
  }),
  z.object({
    provider: z.literal('GCP'),
    projectId: z.string().min(1),
    serviceAccountKey: z.string().min(1),
  }),
  z.object({
    provider: z.literal('KUBERNETES'),
    clusterEndpoint: z.string().url(),
    token: z.string().min(1),
  }),
]);

export type CloudCredentials = z.infer<typeof CloudCredentialsSchema>;

export interface CostSummary {
  totalCost: number;
  previousPeriodCost: number;
  changePercentage: number;
  currency: string;
  byProvider: { provider: string; cost: number; percentage: number }[];
  byService: { service: string; provider: string; cost: number; change: number }[];
  dailyTrend: { date: string; cost: number }[];
}

export interface ResourceSummary {
  totalResources: number;
  byProvider: { provider: string; count: number }[];
  byType: { type: string; count: number; cost: number }[];
}
