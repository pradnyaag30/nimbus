import { z } from 'zod';

// --- Tag Mapping Configuration -----------------------------------------------

export const TagMappingSchema = z.object({
  dimensionName: z.string().min(1).max(100),
  dimensionDescription: z.string().max(500).optional(),
  provider: z.enum(['AWS', 'AZURE', 'GCP', 'OCI', 'KUBERNETES']),
  cloudTagKey: z.string().min(1).max(200),
  valueMapping: z.record(z.string()).optional(),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type TagMappingInput = z.infer<typeof TagMappingSchema>;

export interface TagMappingRecord {
  id: string;
  tenantId: string;
  dimensionName: string;
  dimensionDescription: string | null;
  provider: string;
  cloudTagKey: string;
  valueMapping: Record<string, string> | null;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Tag Explorer Data -------------------------------------------------------

export interface TagUsageEntry {
  tagKey: string;
  resourceCount: number;
  coveragePercent: number;
  topValues: { value: string; count: number }[];
}

export interface TagExplorerData {
  totalResources: number;
  tagUsage: TagUsageEntry[];
  unmappedTags: string[];
}
