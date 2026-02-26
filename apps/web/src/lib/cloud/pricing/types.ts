import { z } from 'zod';

// --- Workload Definition -----------------------------------------------------

export const ComputeWorkloadSchema = z.object({
  vcpus: z.number().min(1).max(512),
  memoryGb: z.number().min(0.5).max(4096),
  os: z.enum(['linux', 'windows']).default('linux'),
  instanceCount: z.number().min(1).max(1000).default(1),
  hoursPerMonth: z.number().min(1).max(744).default(744),
});

export const StorageWorkloadSchema = z.object({
  sizeGb: z.number().min(1).max(1_000_000),
  storageType: z.enum(['ssd', 'hdd', 'archive']).default('ssd'),
  iops: z.number().min(0).max(256_000).optional(),
});

export const DatabaseWorkloadSchema = z.object({
  engine: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle']).default('postgresql'),
  vcpus: z.number().min(1).max(128),
  memoryGb: z.number().min(1).max(1024),
  storageGb: z.number().min(10).max(100_000).default(100),
  multiAz: z.boolean().default(false),
});

export const NetworkWorkloadSchema = z.object({
  dataTransferOutGb: z.number().min(0).max(1_000_000).default(100),
  loadBalancerCount: z.number().min(0).max(100).default(0),
});

export const WorkloadDefinitionSchema = z.object({
  name: z.string().min(1).max(200),
  compute: ComputeWorkloadSchema.optional(),
  storage: StorageWorkloadSchema.optional(),
  database: DatabaseWorkloadSchema.optional(),
  networking: NetworkWorkloadSchema.optional(),
  regions: z.array(z.string()).min(1).default(['us-east-1']),
});

export type WorkloadDefinition = z.infer<typeof WorkloadDefinitionSchema>;
export type ComputeWorkload = z.infer<typeof ComputeWorkloadSchema>;
export type StorageWorkload = z.infer<typeof StorageWorkloadSchema>;
export type DatabaseWorkload = z.infer<typeof DatabaseWorkloadSchema>;
export type NetworkWorkload = z.infer<typeof NetworkWorkloadSchema>;

// --- Pricing Results ---------------------------------------------------------

export interface InstancePricing {
  instanceType: string;
  vcpus: number;
  memoryGb: number;
  pricePerHour: number;
  monthlyPrice: number;
  os: string;
  region: string;
}

export interface StoragePricing {
  storageType: string;
  pricePerGbMonth: number;
  monthlyPrice: number;
  region: string;
}

export interface DatabasePricing {
  instanceType: string;
  engine: string;
  vcpus: number;
  memoryGb: number;
  pricePerHour: number;
  monthlyPrice: number;
  storageMonthly: number;
  totalMonthly: number;
  region: string;
  multiAz: boolean;
}

export interface NetworkPricing {
  dataTransferPerGb: number;
  dataTransferMonthly: number;
  loadBalancerMonthly: number;
  totalMonthly: number;
  region: string;
}

export interface ProviderPricingResult {
  provider: 'AWS' | 'AZURE' | 'GCP' | 'OCI';
  region: string;
  regionName: string;
  compute?: InstancePricing;
  storage?: StoragePricing;
  database?: DatabasePricing;
  networking?: NetworkPricing;
  totalMonthly: number;
  currency: string;
}

export interface CrossCloudComparison {
  workload: WorkloadDefinition;
  results: ProviderPricingResult[];
  cheapest: ProviderPricingResult | null;
  generatedAt: string;
}

// --- Region Mapping ----------------------------------------------------------

export interface RegionInfo {
  code: string;
  name: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'OCI';
}
