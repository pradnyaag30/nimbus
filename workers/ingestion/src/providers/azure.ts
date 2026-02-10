import type { CloudAdapter, CostQueryParams, RawCostData, FocusCostItem } from './types';

/**
 * Azure Cloud Adapter
 * Fetches billing data from Azure Cost Management API and normalizes to FOCUS schema.
 *
 * TODO: Integrate with @azure/arm-costmanagement
 */
export class AzureAdapter implements CloudAdapter {
  async getCosts(params: CostQueryParams): Promise<RawCostData[]> {
    // TODO: Implement Azure Cost Management API call
    // const client = new CostManagementClient(credentials);
    // const result = await client.query.usage(scope, {
    //   type: 'ActualCost',
    //   timeframe: 'Custom',
    //   timePeriod: { from: params.startDate, to: params.endDate },
    //   dataset: { granularity: params.granularity || 'Monthly', aggregation: { totalCost: { name: 'Cost', function: 'Sum' } } }
    // });
    console.log(`[Azure] Fetching costs from ${params.startDate.toISOString()} to ${params.endDate.toISOString()}`);
    return [];
  }

  async normalizeToFocus(rawData: RawCostData[]): Promise<FocusCostItem[]> {
    return rawData.map((item) => {
      const data = item.data as Record<string, string>;
      return {
        billingPeriodStart: new Date(data['BillingPeriodStartDate'] || new Date()),
        billingPeriodEnd: new Date(data['BillingPeriodEndDate'] || new Date()),
        chargeCategory: this.mapChargeCategory(data['ChargeType']),
        chargeType: data['ChargeType'] || 'Usage',
        billedCost: parseFloat(data['CostInBillingCurrency'] || '0'),
        effectiveCost: parseFloat(data['EffectivePrice'] || '0') * parseFloat(data['Quantity'] || '0'),
        billingCurrency: data['BillingCurrency'] || 'USD',
        serviceCategory: data['MeterCategory'],
        serviceName: data['MeterSubCategory'] || data['MeterCategory'],
        regionId: data['ResourceLocation'],
        regionName: data['ResourceLocationNormalized'],
        resourceId: data['ResourceId'],
        resourceName: data['ResourceName'],
        resourceType: data['ResourceType'],
        pricingCategory: data['PricingModel'],
        usageQuantity: parseFloat(data['Quantity'] || '0') || undefined,
        usageUnit: data['UnitOfMeasure'],
        commitmentDiscountId: data['ReservationId'],
        commitmentDiscountName: data['ReservationName'],
        providerName: 'AZURE',
        publisherName: data['PublisherName'],
        invoiceSectionId: data['InvoiceSectionId'],
        subAccountId: data['SubscriptionId'],
        subAccountName: data['SubscriptionName'],
        tags: data['Tags'] ? JSON.parse(data['Tags']) : {},
      };
    });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    return !!(credentials['clientId'] && credentials['clientSecret'] && credentials['tenantId']);
  }

  private mapChargeCategory(chargeType?: string): FocusCostItem['chargeCategory'] {
    const mapping: Record<string, FocusCostItem['chargeCategory']> = {
      Usage: 'USAGE',
      Purchase: 'PURCHASE',
      Tax: 'TAX',
      Credit: 'CREDIT',
      Adjustment: 'ADJUSTMENT',
    };
    return mapping[chargeType || ''] || 'USAGE';
  }
}
