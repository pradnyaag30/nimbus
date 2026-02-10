import { z } from 'zod';

/**
 * FOCUS (FinOps Open Cost & Usage Specification) Schema
 * Based on FinOps Foundation FOCUS spec v1.0
 * Provides vendor-neutral cost data normalization.
 */

export const FocusChargeCategorySchema = z.enum([
  'USAGE',
  'PURCHASE',
  'TAX',
  'CREDIT',
  'ADJUSTMENT',
  'SUPPORT',
]);

export const FocusLineItemSchema = z.object({
  // Core billing columns
  billingPeriodStart: z.coerce.date(),
  billingPeriodEnd: z.coerce.date(),
  chargeCategory: FocusChargeCategorySchema,
  chargeType: z.string(),
  billedCost: z.number(),
  effectiveCost: z.number(),
  listCost: z.number().optional(),
  billingCurrency: z.string().default('USD'),

  // Resource identification
  serviceCategory: z.string().optional(),
  serviceName: z.string().optional(),
  regionId: z.string().optional(),
  regionName: z.string().optional(),
  availabilityZone: z.string().optional(),
  resourceId: z.string().optional(),
  resourceName: z.string().optional(),
  resourceType: z.string().optional(),

  // Pricing & usage
  pricingCategory: z.string().optional(),
  pricingQuantity: z.number().optional(),
  pricingUnit: z.string().optional(),
  usageQuantity: z.number().optional(),
  usageUnit: z.string().optional(),

  // Commitment discounts (RI, Savings Plans, CUDs)
  commitmentDiscountId: z.string().optional(),
  commitmentDiscountName: z.string().optional(),
  commitmentDiscountType: z.string().optional(),

  // Provider info
  providerName: z.string(),
  publisherName: z.string().optional(),
  invoiceSectionId: z.string().optional(),
  subAccountId: z.string().optional(),
  subAccountName: z.string().optional(),

  // Tags
  tags: z.record(z.string()).default({}),
});

export type FocusLineItem = z.infer<typeof FocusLineItemSchema>;

/**
 * Service category mapping for standardizing across providers
 */
export const SERVICE_CATEGORIES: Record<string, string> = {
  // AWS
  'Amazon EC2': 'Compute',
  'Amazon S3': 'Storage',
  'Amazon RDS': 'Database',
  'Amazon Lambda': 'Compute',
  'Amazon EKS': 'Containers',
  'Amazon CloudFront': 'Networking',
  'Amazon DynamoDB': 'Database',
  'Amazon ElastiCache': 'Database',

  // Azure
  'Virtual Machines': 'Compute',
  'Storage Accounts': 'Storage',
  'SQL Database': 'Database',
  'Functions': 'Compute',
  'Kubernetes Service': 'Containers',
  'CDN': 'Networking',
  'Cosmos DB': 'Database',

  // GCP
  'Compute Engine': 'Compute',
  'Cloud Storage': 'Storage',
  'Cloud SQL': 'Database',
  'Cloud Functions': 'Compute',
  'Kubernetes Engine': 'Containers',
  'Cloud CDN': 'Networking',
  BigQuery: 'Analytics',
};

export function getServiceCategory(serviceName: string): string {
  return SERVICE_CATEGORIES[serviceName] || 'Other';
}
