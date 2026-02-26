import type {
  WorkloadDefinition,
  ProviderPricingResult,
  InstancePricing,
  StoragePricing,
  DatabasePricing,
  NetworkPricing,
} from './types';

// Azure Retail Prices API: https://prices.azure.com/api/retail/prices
// Free, no auth required. For demo mode, we use realistic reference pricing.

// --- Reference Pricing (eastus, pay-as-you-go, Linux) ------------------------

const AZURE_VM_PRICING: Record<string, { vcpus: number; memoryGb: number; pricePerHour: number }> = {
  'Standard_B2s': { vcpus: 2, memoryGb: 4, pricePerHour: 0.0416 },
  'Standard_B2ms': { vcpus: 2, memoryGb: 8, pricePerHour: 0.0832 },
  'Standard_D2s_v5': { vcpus: 2, memoryGb: 8, pricePerHour: 0.096 },
  'Standard_D4s_v5': { vcpus: 4, memoryGb: 16, pricePerHour: 0.192 },
  'Standard_D8s_v5': { vcpus: 8, memoryGb: 32, pricePerHour: 0.384 },
  'Standard_D16s_v5': { vcpus: 16, memoryGb: 64, pricePerHour: 0.768 },
  'Standard_D32s_v5': { vcpus: 32, memoryGb: 128, pricePerHour: 1.536 },
  'Standard_F2s_v2': { vcpus: 2, memoryGb: 4, pricePerHour: 0.085 },
  'Standard_F4s_v2': { vcpus: 4, memoryGb: 8, pricePerHour: 0.17 },
  'Standard_F8s_v2': { vcpus: 8, memoryGb: 16, pricePerHour: 0.34 },
  'Standard_F16s_v2': { vcpus: 16, memoryGb: 32, pricePerHour: 0.68 },
  'Standard_E2s_v5': { vcpus: 2, memoryGb: 16, pricePerHour: 0.126 },
  'Standard_E4s_v5': { vcpus: 4, memoryGb: 32, pricePerHour: 0.252 },
  'Standard_E8s_v5': { vcpus: 8, memoryGb: 64, pricePerHour: 0.504 },
  'Standard_E16s_v5': { vcpus: 16, memoryGb: 128, pricePerHour: 1.008 },
};

const WINDOWS_MULTIPLIER = 1.45;

const STORAGE_PRICING = {
  ssd: 0.095, // Premium SSD per GB/month
  hdd: 0.04, // Standard HDD per GB/month
  archive: 0.002, // Archive per GB/month
};

const SQL_DB_MULTIPLIER = 1.25;
const SQL_DB_MULTI_AZ_MULTIPLIER = 2.0;
const SQL_DB_STORAGE_PER_GB = 0.115;

const DATA_TRANSFER_PER_GB = 0.087;
const LB_MONTHLY = 22.0;

const REGION_MULTIPLIERS: Record<string, number> = {
  'eastus': 1.0,
  'westus2': 1.0,
  'northeurope': 1.08,
  'westeurope': 1.10,
  'southeastasia': 1.08,
  'japaneast': 1.14,
  'centralindia': 0.92,
};

function regionMultiplier(region: string): number {
  return REGION_MULTIPLIERS[region] ?? 1.05;
}

function findBestInstance(vcpus: number, memoryGb: number) {
  const candidates = Object.entries(AZURE_VM_PRICING)
    .filter(([, spec]) => spec.vcpus >= vcpus && spec.memoryGb >= memoryGb)
    .sort((a, b) => a[1].pricePerHour - b[1].pricePerHour);

  if (candidates.length === 0) {
    const largest = Object.entries(AZURE_VM_PRICING).sort((a, b) => b[1].pricePerHour - a[1].pricePerHour)[0];
    return { type: largest[0], ...largest[1] };
  }
  return { type: candidates[0][0], ...candidates[0][1] };
}

export async function getAzurePricing(workload: WorkloadDefinition, region: string): Promise<ProviderPricingResult> {
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
    const pricePerGb = (STORAGE_PRICING[workload.storage.storageType] ?? 0.095) * mult;
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
    const hourlyPrice = inst.pricePerHour * mult * SQL_DB_MULTIPLIER;
    const azMult = workload.database.multiAz ? SQL_DB_MULTI_AZ_MULTIPLIER : 1;
    const computeMonthly = hourlyPrice * 744 * azMult;
    const storageMonthly = SQL_DB_STORAGE_PER_GB * mult * workload.database.storageGb;
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
    provider: 'AZURE',
    region,
    regionName: `Azure ${region}`,
    compute,
    storage,
    database,
    networking,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    currency: 'USD',
  };
}
