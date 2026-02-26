import type {
  WorkloadDefinition,
  ProviderPricingResult,
  InstancePricing,
  StoragePricing,
  DatabasePricing,
  NetworkPricing,
} from './types';

// GCP Cloud Billing Catalog API: https://cloud.google.com/billing/v1/how-tos/catalog-api
// Requires service account. For demo mode, we use realistic reference pricing.

const GCP_VM_PRICING: Record<string, { vcpus: number; memoryGb: number; pricePerHour: number }> = {
  'e2-micro': { vcpus: 2, memoryGb: 1, pricePerHour: 0.0084 },
  'e2-small': { vcpus: 2, memoryGb: 2, pricePerHour: 0.0168 },
  'e2-medium': { vcpus: 2, memoryGb: 4, pricePerHour: 0.0336 },
  'e2-standard-2': { vcpus: 2, memoryGb: 8, pricePerHour: 0.0671 },
  'e2-standard-4': { vcpus: 4, memoryGb: 16, pricePerHour: 0.1342 },
  'e2-standard-8': { vcpus: 8, memoryGb: 32, pricePerHour: 0.2684 },
  'e2-standard-16': { vcpus: 16, memoryGb: 64, pricePerHour: 0.5369 },
  'e2-standard-32': { vcpus: 32, memoryGb: 128, pricePerHour: 1.0737 },
  'n2-standard-2': { vcpus: 2, memoryGb: 8, pricePerHour: 0.0971 },
  'n2-standard-4': { vcpus: 4, memoryGb: 16, pricePerHour: 0.1942 },
  'n2-standard-8': { vcpus: 8, memoryGb: 32, pricePerHour: 0.3885 },
  'n2-highcpu-2': { vcpus: 2, memoryGb: 2, pricePerHour: 0.0717 },
  'n2-highcpu-4': { vcpus: 4, memoryGb: 4, pricePerHour: 0.1434 },
  'n2-highcpu-8': { vcpus: 8, memoryGb: 8, pricePerHour: 0.2868 },
  'n2-highmem-2': { vcpus: 2, memoryGb: 16, pricePerHour: 0.1311 },
  'n2-highmem-4': { vcpus: 4, memoryGb: 32, pricePerHour: 0.2622 },
  'n2-highmem-8': { vcpus: 8, memoryGb: 64, pricePerHour: 0.5243 },
  'n2-highmem-16': { vcpus: 16, memoryGb: 128, pricePerHour: 1.0486 },
};

const WINDOWS_MULTIPLIER = 1.5;

const STORAGE_PRICING = {
  ssd: 0.085, // pd-ssd per GB/month
  hdd: 0.04, // pd-standard per GB/month
  archive: 0.0012, // Archive per GB/month
};

const CLOUD_SQL_MULTIPLIER = 1.2;
const CLOUD_SQL_HA_MULTIPLIER = 2.0;
const CLOUD_SQL_STORAGE_PER_GB = 0.17;

const DATA_TRANSFER_PER_GB = 0.085;
const LB_MONTHLY = 18.26;

const REGION_MULTIPLIERS: Record<string, number> = {
  'us-central1': 1.0,
  'us-east1': 1.0,
  'europe-west1': 1.10,
  'europe-west3': 1.14,
  'asia-southeast1': 1.08,
  'asia-northeast1': 1.15,
  'asia-south1': 0.90,
};

function regionMultiplier(region: string): number {
  return REGION_MULTIPLIERS[region] ?? 1.05;
}

function findBestInstance(vcpus: number, memoryGb: number) {
  const candidates = Object.entries(GCP_VM_PRICING)
    .filter(([, spec]) => spec.vcpus >= vcpus && spec.memoryGb >= memoryGb)
    .sort((a, b) => a[1].pricePerHour - b[1].pricePerHour);

  if (candidates.length === 0) {
    const largest = Object.entries(GCP_VM_PRICING).sort((a, b) => b[1].pricePerHour - a[1].pricePerHour)[0];
    return { type: largest[0], ...largest[1] };
  }
  return { type: candidates[0][0], ...candidates[0][1] };
}

export async function getGcpPricing(workload: WorkloadDefinition, region: string): Promise<ProviderPricingResult> {
  const mult = regionMultiplier(region);
  let totalMonthly = 0;

  let compute: InstancePricing | undefined;
  if (workload.compute) {
    const inst = findBestInstance(workload.compute.vcpus, workload.compute.memoryGb);
    const osMult = workload.compute.os === 'windows' ? WINDOWS_MULTIPLIER : 1;
    const hourlyPrice = inst.pricePerHour * mult * osMult;
    const monthly = hourlyPrice * workload.compute.hoursPerMonth * workload.compute.instanceCount;
    compute = {
      instanceType: inst.type,
      vcpus: inst.vcpus,
      memoryGb: inst.memoryGb,
      pricePerHour: Math.round(hourlyPrice * 10000) / 10000,
      monthlyPrice: Math.round(monthly * 100) / 100,
      os: workload.compute.os,
      region,
    };
    totalMonthly += monthly;
  }

  let storage: StoragePricing | undefined;
  if (workload.storage) {
    const pricePerGb = (STORAGE_PRICING[workload.storage.storageType] ?? 0.085) * mult;
    const monthly = pricePerGb * workload.storage.sizeGb;
    storage = {
      storageType: workload.storage.storageType,
      pricePerGbMonth: Math.round(pricePerGb * 1000) / 1000,
      monthlyPrice: Math.round(monthly * 100) / 100,
      region,
    };
    totalMonthly += monthly;
  }

  let database: DatabasePricing | undefined;
  if (workload.database) {
    const inst = findBestInstance(workload.database.vcpus, workload.database.memoryGb);
    const hourlyPrice = inst.pricePerHour * mult * CLOUD_SQL_MULTIPLIER;
    const azMult = workload.database.multiAz ? CLOUD_SQL_HA_MULTIPLIER : 1;
    const computeMonthly = hourlyPrice * 744 * azMult;
    const storageMonthly = CLOUD_SQL_STORAGE_PER_GB * mult * workload.database.storageGb;
    database = {
      instanceType: inst.type,
      engine: workload.database.engine,
      vcpus: inst.vcpus,
      memoryGb: inst.memoryGb,
      pricePerHour: Math.round(hourlyPrice * 10000) / 10000,
      monthlyPrice: Math.round(computeMonthly * 100) / 100,
      storageMonthly: Math.round(storageMonthly * 100) / 100,
      totalMonthly: Math.round((computeMonthly + storageMonthly) * 100) / 100,
      region,
      multiAz: workload.database.multiAz,
    };
    totalMonthly += computeMonthly + storageMonthly;
  }

  let networking: NetworkPricing | undefined;
  if (workload.networking) {
    const dtCost = workload.networking.dataTransferOutGb * DATA_TRANSFER_PER_GB * mult;
    const lbCost = workload.networking.loadBalancerCount * LB_MONTHLY * mult;
    networking = {
      dataTransferPerGb: Math.round(DATA_TRANSFER_PER_GB * mult * 1000) / 1000,
      dataTransferMonthly: Math.round(dtCost * 100) / 100,
      loadBalancerMonthly: Math.round(lbCost * 100) / 100,
      totalMonthly: Math.round((dtCost + lbCost) * 100) / 100,
      region,
    };
    totalMonthly += dtCost + lbCost;
  }

  return {
    provider: 'GCP',
    region,
    regionName: `GCP ${region}`,
    compute,
    storage,
    database,
    networking,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    currency: 'USD',
  };
}
