import type { WorkloadDefinition, CrossCloudComparison, RegionInfo } from './types';
import { getAwsPricing } from './aws-pricing';
import { getAzurePricing } from './azure-pricing';
import { getGcpPricing } from './gcp-pricing';
import { getOciPricing } from './oci-pricing';

// --- Region Mapping ----------------------------------------------------------

const REGION_MAP: Record<string, { aws: string; azure: string; gcp: string; oci: string }> = {
  'us-east': {
    aws: 'us-east-1',
    azure: 'eastus',
    gcp: 'us-east1',
    oci: 'us-ashburn-1',
  },
  'us-west': {
    aws: 'us-west-2',
    azure: 'westus2',
    gcp: 'us-central1',
    oci: 'us-phoenix-1',
  },
  'europe-west': {
    aws: 'eu-west-1',
    azure: 'northeurope',
    gcp: 'europe-west1',
    oci: 'uk-london-1',
  },
  'europe-central': {
    aws: 'eu-central-1',
    azure: 'westeurope',
    gcp: 'europe-west3',
    oci: 'eu-frankfurt-1',
  },
  'asia-southeast': {
    aws: 'ap-southeast-1',
    azure: 'southeastasia',
    gcp: 'asia-southeast1',
    oci: 'ap-singapore-1',
  },
  'asia-northeast': {
    aws: 'ap-northeast-1',
    azure: 'japaneast',
    gcp: 'asia-northeast1',
    oci: 'ap-tokyo-1',
  },
  'asia-south': {
    aws: 'ap-south-1',
    azure: 'centralindia',
    gcp: 'asia-south1',
    oci: 'ap-mumbai-1',
  },
};

export function getAvailableRegions(): RegionInfo[] {
  const regions: RegionInfo[] = [];
  for (const [key, map] of Object.entries(REGION_MAP)) {
    const name = key.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    regions.push(
      { code: map.aws, name: `${name} (${map.aws})`, provider: 'AWS' },
      { code: map.azure, name: `${name} (${map.azure})`, provider: 'AZURE' },
      { code: map.gcp, name: `${name} (${map.gcp})`, provider: 'GCP' },
      { code: map.oci, name: `${name} (${map.oci})`, provider: 'OCI' },
    );
  }
  return regions;
}

export function getNormalizedRegions(): { label: string; value: string }[] {
  return Object.entries(REGION_MAP).map(([key]) => {
    const name = key.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return { label: name, value: key };
  });
}

function resolveProviderRegion(normalizedRegion: string, provider: 'aws' | 'azure' | 'gcp' | 'oci'): string {
  const mapping = REGION_MAP[normalizedRegion];
  if (mapping) return mapping[provider];
  // Fallback to US East
  return REGION_MAP['us-east'][provider];
}

// --- Cross-Cloud Comparison --------------------------------------------------

export async function comparePricing(workload: WorkloadDefinition): Promise<CrossCloudComparison> {
  const region = workload.regions[0] || 'us-east';

  const results = await Promise.all([
    getAwsPricing(workload, resolveProviderRegion(region, 'aws')),
    getAzurePricing(workload, resolveProviderRegion(region, 'azure')),
    getGcpPricing(workload, resolveProviderRegion(region, 'gcp')),
    getOciPricing(workload, resolveProviderRegion(region, 'oci')),
  ]);

  const cheapest = results.reduce((min, r) => (r.totalMonthly < min.totalMonthly ? r : min), results[0]);

  return {
    workload,
    results,
    cheapest,
    generatedAt: new Date().toISOString(),
  };
}
