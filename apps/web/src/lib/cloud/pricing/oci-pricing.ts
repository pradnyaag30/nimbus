import type {
  WorkloadDefinition,
  ProviderPricingResult,
  InstancePricing,
  StoragePricing,
  DatabasePricing,
  NetworkPricing,
} from './types';

// OCI Pricing API: https://apexapps.oracle.com/pls/apex/cetools/api/v1/products/
// Free, no auth required. For demo mode, we use realistic reference pricing.
// OCI is typically 30-50% cheaper than AWS for equivalent workloads.

const OCI_VM_PRICING: Record<string, { vcpus: number; memoryGb: number; pricePerHour: number }> = {
  'VM.Standard.E4.Flex.1': { vcpus: 1, memoryGb: 8, pricePerHour: 0.025 },
  'VM.Standard.E4.Flex.2': { vcpus: 2, memoryGb: 16, pricePerHour: 0.05 },
  'VM.Standard.E4.Flex.4': { vcpus: 4, memoryGb: 32, pricePerHour: 0.10 },
  'VM.Standard.E4.Flex.8': { vcpus: 8, memoryGb: 64, pricePerHour: 0.20 },
  'VM.Standard.E4.Flex.16': { vcpus: 16, memoryGb: 128, pricePerHour: 0.40 },
  'VM.Standard.E4.Flex.32': { vcpus: 32, memoryGb: 256, pricePerHour: 0.80 },
  'VM.Standard3.Flex.2': { vcpus: 2, memoryGb: 8, pricePerHour: 0.054 },
  'VM.Standard3.Flex.4': { vcpus: 4, memoryGb: 16, pricePerHour: 0.108 },
  'VM.Standard3.Flex.8': { vcpus: 8, memoryGb: 32, pricePerHour: 0.216 },
  'VM.Standard3.Flex.16': { vcpus: 16, memoryGb: 64, pricePerHour: 0.432 },
  'VM.Optimized3.Flex.2': { vcpus: 2, memoryGb: 4, pricePerHour: 0.054 },
  'VM.Optimized3.Flex.4': { vcpus: 4, memoryGb: 8, pricePerHour: 0.108 },
  'VM.Optimized3.Flex.8': { vcpus: 8, memoryGb: 16, pricePerHour: 0.216 },
};

const WINDOWS_MULTIPLIER = 1.6;

const STORAGE_PRICING = {
  ssd: 0.0255, // Block Volume Performance per GB/month (OCI is much cheaper)
  hdd: 0.0171, // Block Volume Balanced per GB/month
  archive: 0.0026, // Archive per GB/month
};

const DB_SYSTEM_MULTIPLIER = 1.15; // OCI DB System vs compute
const DB_SYSTEM_HA_MULTIPLIER = 2.0;
const DB_STORAGE_PER_GB = 0.0255;

const DATA_TRANSFER_PER_GB = 0.0085; // OCI: first 10TB free, then very cheap
const LB_MONTHLY = 10.0; // OCI LBaaS is cheaper

const REGION_MULTIPLIERS: Record<string, number> = {
  'us-ashburn-1': 1.0,
  'us-phoenix-1': 1.0,
  'uk-london-1': 1.08,
  'eu-frankfurt-1': 1.10,
  'ap-singapore-1': 1.05,
  'ap-tokyo-1': 1.10,
  'ap-mumbai-1': 0.88,
};

function regionMultiplier(region: string): number {
  return REGION_MULTIPLIERS[region] ?? 1.03;
}

function findBestInstance(vcpus: number, memoryGb: number) {
  const candidates = Object.entries(OCI_VM_PRICING)
    .filter(([, spec]) => spec.vcpus >= vcpus && spec.memoryGb >= memoryGb)
    .sort((a, b) => a[1].pricePerHour - b[1].pricePerHour);

  if (candidates.length === 0) {
    const largest = Object.entries(OCI_VM_PRICING).sort((a, b) => b[1].pricePerHour - a[1].pricePerHour)[0];
    return { type: largest[0], ...largest[1] };
  }
  return { type: candidates[0][0], ...candidates[0][1] };
}

export async function getOciPricing(workload: WorkloadDefinition, region: string): Promise<ProviderPricingResult> {
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
    const pricePerGb = (STORAGE_PRICING[workload.storage.storageType] ?? 0.0255) * mult;
    const monthly = pricePerGb * workload.storage.sizeGb;
    storage = {
      storageType: workload.storage.storageType,
      pricePerGbMonth: Math.round(pricePerGb * 10000) / 10000,
      monthlyPrice: Math.round(monthly * 100) / 100,
      region,
    };
    totalMonthly += monthly;
  }

  let database: DatabasePricing | undefined;
  if (workload.database) {
    const inst = findBestInstance(workload.database.vcpus, workload.database.memoryGb);
    const hourlyPrice = inst.pricePerHour * mult * DB_SYSTEM_MULTIPLIER;
    const azMult = workload.database.multiAz ? DB_SYSTEM_HA_MULTIPLIER : 1;
    const computeMonthly = hourlyPrice * 744 * azMult;
    const storageMonthly = DB_STORAGE_PER_GB * mult * workload.database.storageGb;
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
      dataTransferPerGb: Math.round(DATA_TRANSFER_PER_GB * mult * 10000) / 10000,
      dataTransferMonthly: Math.round(dtCost * 100) / 100,
      loadBalancerMonthly: Math.round(lbCost * 100) / 100,
      totalMonthly: Math.round((dtCost + lbCost) * 100) / 100,
      region,
    };
    totalMonthly += dtCost + lbCost;
  }

  return {
    provider: 'OCI',
    region,
    regionName: `OCI ${region}`,
    compute,
    storage,
    database,
    networking,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    currency: 'USD',
  };
}
