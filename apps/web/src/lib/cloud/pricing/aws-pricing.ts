import type {
  WorkloadDefinition,
  ProviderPricingResult,
  InstancePricing,
  StoragePricing,
  DatabasePricing,
  NetworkPricing,
} from './types';

// AWS Pricing uses @aws-sdk/client-pricing in production.
// For demo mode, we use realistic reference pricing data.

// --- Reference Pricing (us-east-1, on-demand, Linux) -------------------------

const EC2_PRICING: Record<string, { vcpus: number; memoryGb: number; pricePerHour: number }> = {
  't3.micro': { vcpus: 2, memoryGb: 1, pricePerHour: 0.0104 },
  't3.small': { vcpus: 2, memoryGb: 2, pricePerHour: 0.0208 },
  't3.medium': { vcpus: 2, memoryGb: 4, pricePerHour: 0.0416 },
  't3.large': { vcpus: 2, memoryGb: 8, pricePerHour: 0.0832 },
  't3.xlarge': { vcpus: 4, memoryGb: 16, pricePerHour: 0.1664 },
  'm5.large': { vcpus: 2, memoryGb: 8, pricePerHour: 0.096 },
  'm5.xlarge': { vcpus: 4, memoryGb: 16, pricePerHour: 0.192 },
  'm5.2xlarge': { vcpus: 8, memoryGb: 32, pricePerHour: 0.384 },
  'm5.4xlarge': { vcpus: 16, memoryGb: 64, pricePerHour: 0.768 },
  'm5.8xlarge': { vcpus: 32, memoryGb: 128, pricePerHour: 1.536 },
  'c5.large': { vcpus: 2, memoryGb: 4, pricePerHour: 0.085 },
  'c5.xlarge': { vcpus: 4, memoryGb: 8, pricePerHour: 0.17 },
  'c5.2xlarge': { vcpus: 8, memoryGb: 16, pricePerHour: 0.34 },
  'c5.4xlarge': { vcpus: 16, memoryGb: 32, pricePerHour: 0.68 },
  'r5.large': { vcpus: 2, memoryGb: 16, pricePerHour: 0.126 },
  'r5.xlarge': { vcpus: 4, memoryGb: 32, pricePerHour: 0.252 },
  'r5.2xlarge': { vcpus: 8, memoryGb: 64, pricePerHour: 0.504 },
  'r5.4xlarge': { vcpus: 16, memoryGb: 128, pricePerHour: 1.008 },
};

const WINDOWS_MULTIPLIER = 1.5;

const STORAGE_PRICING = {
  ssd: 0.10, // gp3 per GB/month
  hdd: 0.045, // st1 per GB/month
  archive: 0.004, // S3 Glacier per GB/month
};

const RDS_MULTIPLIER = 1.3; // RDS is ~30% more than EC2
const RDS_MULTI_AZ_MULTIPLIER = 2.0;
const RDS_STORAGE_PER_GB = 0.115; // gp3

const DATA_TRANSFER_PER_GB = 0.09; // first 10TB
const ALB_MONTHLY = 22.27; // ALB fixed cost

// --- Region Multipliers ------------------------------------------------------

const REGION_MULTIPLIERS: Record<string, number> = {
  'us-east-1': 1.0,
  'us-west-2': 1.0,
  'eu-west-1': 1.08,
  'eu-central-1': 1.12,
  'ap-southeast-1': 1.10,
  'ap-northeast-1': 1.15,
  'ap-south-1': 0.95,
};

function regionMultiplier(region: string): number {
  return REGION_MULTIPLIERS[region] ?? 1.05;
}

// --- Best-Fit Instance Selection ---------------------------------------------

function findBestInstance(vcpus: number, memoryGb: number): { type: string; vcpus: number; memoryGb: number; pricePerHour: number } {
  const candidates = Object.entries(EC2_PRICING)
    .filter(([, spec]) => spec.vcpus >= vcpus && spec.memoryGb >= memoryGb)
    .sort((a, b) => a[1].pricePerHour - b[1].pricePerHour);

  if (candidates.length === 0) {
    // Return the largest available
    const largest = Object.entries(EC2_PRICING).sort((a, b) => b[1].pricePerHour - a[1].pricePerHour)[0];
    return { type: largest[0], ...largest[1] };
  }

  return { type: candidates[0][0], ...candidates[0][1] };
}

// --- Main Pricing Function ---------------------------------------------------

export async function getAwsPricing(workload: WorkloadDefinition, region: string): Promise<ProviderPricingResult> {
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
    const pricePerGb = (STORAGE_PRICING[workload.storage.storageType] ?? 0.10) * mult;
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
    const hourlyPrice = inst.pricePerHour * mult * RDS_MULTIPLIER;
    const azMult = workload.database.multiAz ? RDS_MULTI_AZ_MULTIPLIER : 1;
    const computeMonthly = hourlyPrice * 744 * azMult;
    const storageMonthly = RDS_STORAGE_PER_GB * mult * workload.database.storageGb;
    database = {
      instanceType: `db.${inst.type}`,
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
    const lbCost = workload.networking.loadBalancerCount * ALB_MONTHLY * mult;
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
    provider: 'AWS',
    region,
    regionName: `AWS ${region}`,
    compute,
    storage,
    database,
    networking,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    currency: 'USD',
  };
}
