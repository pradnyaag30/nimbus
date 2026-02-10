/**
 * Unified cloud adapter interface.
 * Each provider implements this to normalize their billing data to FOCUS schema.
 * Inspired by OptScale adapters + Komiser provider pattern + OpenCost allocation model.
 */
export interface CloudAdapter {
  /** Fetch raw cost/billing data from the provider API */
  getCosts(params: CostQueryParams): Promise<RawCostData[]>;

  /** Normalize raw provider data to FOCUS schema */
  normalizeToFocus(rawData: RawCostData[]): Promise<FocusCostItem[]>;

  /** List cloud resources for inventory */
  listResources?(params: ResourceQueryParams): Promise<CloudResourceItem[]>;

  /** Fetch provider-native optimization recommendations */
  getRecommendations?(): Promise<ProviderRecommendation[]>;

  /** Validate credentials */
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
}

export interface CostQueryParams {
  startDate: Date;
  endDate: Date;
  granularity?: 'DAILY' | 'MONTHLY';
  filters?: Record<string, string[]>;
}

export interface ResourceQueryParams {
  regions?: string[];
  resourceTypes?: string[];
}

/** Raw cost data from provider (provider-specific shape) */
export interface RawCostData {
  provider: string;
  data: Record<string, unknown>;
}

/**
 * FOCUS-aligned cost line item.
 * Maps to FinOps Foundation FOCUS specification.
 */
export interface FocusCostItem {
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  chargeCategory: 'USAGE' | 'PURCHASE' | 'TAX' | 'CREDIT' | 'ADJUSTMENT' | 'SUPPORT';
  chargeType: string;
  billedCost: number;
  effectiveCost: number;
  listCost?: number;
  billingCurrency: string;
  serviceCategory?: string;
  serviceName?: string;
  regionId?: string;
  regionName?: string;
  availabilityZone?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  pricingCategory?: string;
  pricingQuantity?: number;
  pricingUnit?: string;
  usageQuantity?: number;
  usageUnit?: string;
  commitmentDiscountId?: string;
  commitmentDiscountName?: string;
  commitmentDiscountType?: string;
  providerName: string;
  publisherName?: string;
  invoiceSectionId?: string;
  subAccountId?: string;
  subAccountName?: string;
  tags: Record<string, string>;
}

export interface CloudResourceItem {
  resourceId: string;
  resourceName?: string;
  resourceType: string;
  region?: string;
  status?: string;
  monthlyCost?: number;
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface ProviderRecommendation {
  title: string;
  description: string;
  category: string;
  estimatedSavings: number;
  currency: string;
  resourceIds: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
}
