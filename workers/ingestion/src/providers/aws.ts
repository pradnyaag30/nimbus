import type { CloudAdapter, CostQueryParams, RawCostData, FocusCostItem } from './types';

/**
 * AWS Cloud Adapter
 * Fetches billing data from AWS Cost Explorer API and normalizes to FOCUS schema.
 * Uses AWS CUR (Cost & Usage Report) data format.
 *
 * TODO: Integrate with @aws-sdk/client-cost-explorer
 */
export class AwsAdapter implements CloudAdapter {
  async getCosts(params: CostQueryParams): Promise<RawCostData[]> {
    // TODO: Implement AWS Cost Explorer API call
    // const client = new CostExplorerClient({ region: 'us-east-1', credentials });
    // const command = new GetCostAndUsageCommand({
    //   TimePeriod: { Start: params.startDate.toISOString().split('T')[0], End: params.endDate.toISOString().split('T')[0] },
    //   Granularity: params.granularity || 'MONTHLY',
    //   Metrics: ['BlendedCost', 'UnblendedCost', 'UsageQuantity'],
    //   GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    // });
    console.log(`[AWS] Fetching costs from ${params.startDate.toISOString()} to ${params.endDate.toISOString()}`);
    return [];
  }

  async normalizeToFocus(rawData: RawCostData[]): Promise<FocusCostItem[]> {
    // Map AWS CUR fields to FOCUS schema
    return rawData.map((item) => {
      const data = item.data as Record<string, string>;
      return {
        billingPeriodStart: new Date(data['bill/BillingPeriodStartDate'] || new Date()),
        billingPeriodEnd: new Date(data['bill/BillingPeriodEndDate'] || new Date()),
        chargeCategory: this.mapChargeCategory(data['lineItem/LineItemType']),
        chargeType: data['lineItem/LineItemType'] || 'Usage',
        billedCost: parseFloat(data['lineItem/BlendedCost'] || '0'),
        effectiveCost: parseFloat(data['lineItem/UnblendedCost'] || '0'),
        listCost: parseFloat(data['lineItem/ListCost'] || '0') || undefined,
        billingCurrency: data['lineItem/CurrencyCode'] || 'USD',
        serviceCategory: data['product/productFamily'],
        serviceName: data['lineItem/ProductCode'],
        regionId: data['product/region'],
        regionName: data['product/regionDescription'],
        availabilityZone: data['lineItem/AvailabilityZone'],
        resourceId: data['lineItem/ResourceId'],
        resourceType: data['product/instanceType'],
        pricingCategory: data['pricing/term'],
        usageQuantity: parseFloat(data['lineItem/UsageAmount'] || '0') || undefined,
        usageUnit: data['pricing/unit'],
        commitmentDiscountId: data['reservation/ReservationARN'],
        providerName: 'AWS',
        publisherName: data['bill/BillingEntity'],
        subAccountId: data['lineItem/UsageAccountId'],
        subAccountName: data['lineItem/UsageAccountName'] || undefined,
        tags: this.extractTags(data),
      };
    });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    // TODO: Call AWS STS GetCallerIdentity to validate
    return !!(credentials['accessKeyId'] && credentials['secretAccessKey']);
  }

  private mapChargeCategory(lineItemType?: string): FocusCostItem['chargeCategory'] {
    const mapping: Record<string, FocusCostItem['chargeCategory']> = {
      Usage: 'USAGE',
      Tax: 'TAX',
      Credit: 'CREDIT',
      Fee: 'PURCHASE',
      Refund: 'ADJUSTMENT',
      RIFee: 'PURCHASE',
      SavingsPlanCoveredUsage: 'USAGE',
      SavingsPlanNegation: 'CREDIT',
    };
    return mapping[lineItemType || ''] || 'USAGE';
  }

  private extractTags(data: Record<string, string>): Record<string, string> {
    const tags: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('resourceTags/user:') && value) {
        tags[key.replace('resourceTags/user:', '')] = value;
      }
    }
    return tags;
  }
}
