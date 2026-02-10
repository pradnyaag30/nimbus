import type { CloudAdapter, CostQueryParams, RawCostData, FocusCostItem } from './types';

/**
 * GCP Cloud Adapter
 * Fetches billing data from GCP BigQuery Billing Export and normalizes to FOCUS schema.
 *
 * TODO: Integrate with @google-cloud/bigquery
 */
export class GcpAdapter implements CloudAdapter {
  async getCosts(params: CostQueryParams): Promise<RawCostData[]> {
    // TODO: Implement BigQuery billing export query
    // const bigquery = new BigQuery({ projectId, credentials });
    // const query = `
    //   SELECT * FROM \`project.dataset.gcp_billing_export_v1_*\`
    //   WHERE usage_start_time >= @startDate AND usage_end_time <= @endDate
    // `;
    console.log(`[GCP] Fetching costs from ${params.startDate.toISOString()} to ${params.endDate.toISOString()}`);
    return [];
  }

  async normalizeToFocus(rawData: RawCostData[]): Promise<FocusCostItem[]> {
    return rawData.map((item) => {
      const data = item.data as Record<string, any>;
      return {
        billingPeriodStart: new Date(data['invoice.month'] || new Date()),
        billingPeriodEnd: new Date(data['invoice.month'] || new Date()),
        chargeCategory: this.mapChargeCategory(data['cost_type']),
        chargeType: data['cost_type'] || 'regular',
        billedCost: parseFloat(data['cost'] || '0'),
        effectiveCost: parseFloat(data['cost'] || '0') + parseFloat(data['credits.amount'] || '0'),
        billingCurrency: data['currency'] || 'USD',
        serviceCategory: data['service.description'],
        serviceName: data['service.description'],
        regionId: data['location.region'],
        regionName: data['location.region'],
        availabilityZone: data['location.zone'],
        resourceId: data['resource.name'],
        resourceName: data['resource.name'],
        resourceType: data['sku.description'],
        pricingCategory: data['price.pricing_type'],
        usageQuantity: parseFloat(data['usage.amount'] || '0') || undefined,
        usageUnit: data['usage.unit'],
        providerName: 'GCP',
        publisherName: 'Google',
        subAccountId: data['project.id'],
        subAccountName: data['project.name'],
        tags: data['labels'] || {},
      };
    });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    return !!(credentials['projectId'] && credentials['serviceAccountKey']);
  }

  private mapChargeCategory(costType?: string): FocusCostItem['chargeCategory'] {
    const mapping: Record<string, FocusCostItem['chargeCategory']> = {
      regular: 'USAGE',
      tax: 'TAX',
      adjustment: 'ADJUSTMENT',
      rounding_error: 'ADJUSTMENT',
    };
    return mapping[costType || ''] || 'USAGE';
  }
}
