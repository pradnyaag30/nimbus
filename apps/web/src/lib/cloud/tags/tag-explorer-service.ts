import type { TagExplorerData, TagUsageEntry } from './types';
import { getTagMappings } from './tag-mapping-service';

// Demo data for tag explorer. Production: query CUR via Athena or Cost Explorer tag APIs.

function generateDemoTagUsage(): TagUsageEntry[] {
  return [
    {
      tagKey: 'Environment',
      resourceCount: 247,
      coveragePercent: 92.3,
      topValues: [
        { value: 'production', count: 98 },
        { value: 'staging', count: 67 },
        { value: 'development', count: 52 },
        { value: 'sandbox', count: 30 },
      ],
    },
    {
      tagKey: 'Team',
      resourceCount: 215,
      coveragePercent: 80.2,
      topValues: [
        { value: 'platform', count: 72 },
        { value: 'data-engineering', count: 58 },
        { value: 'backend', count: 45 },
        { value: 'frontend', count: 40 },
      ],
    },
    {
      tagKey: 'CostCenter',
      resourceCount: 189,
      coveragePercent: 70.5,
      topValues: [
        { value: 'CC-1001', count: 64 },
        { value: 'CC-2002', count: 53 },
        { value: 'CC-3003', count: 42 },
        { value: 'CC-4004', count: 30 },
      ],
    },
    {
      tagKey: 'ProjectName',
      resourceCount: 201,
      coveragePercent: 75.0,
      topValues: [
        { value: 'nimbus-platform', count: 55 },
        { value: 'data-lake', count: 48 },
        { value: 'api-gateway', count: 42 },
        { value: 'ml-pipeline', count: 36 },
        { value: 'monitoring', count: 20 },
      ],
    },
    {
      tagKey: 'ProjectOwner',
      resourceCount: 178,
      coveragePercent: 66.4,
      topValues: [
        { value: 'alex.kumar', count: 45 },
        { value: 'priya.sharma', count: 38 },
        { value: 'raj.patel', count: 35 },
        { value: 'neha.gupta', count: 32 },
        { value: 'arjun.singh', count: 28 },
      ],
    },
    {
      tagKey: 'Application',
      resourceCount: 156,
      coveragePercent: 58.2,
      topValues: [
        { value: 'web-app', count: 48 },
        { value: 'api-service', count: 42 },
        { value: 'worker', count: 36 },
        { value: 'scheduler', count: 30 },
      ],
    },
    {
      tagKey: 'Compliance',
      resourceCount: 132,
      coveragePercent: 49.3,
      topValues: [
        { value: 'pci-dss', count: 45 },
        { value: 'hipaa', count: 38 },
        { value: 'sox', count: 29 },
        { value: 'gdpr', count: 20 },
      ],
    },
    {
      tagKey: 'CreatedBy',
      resourceCount: 98,
      coveragePercent: 36.6,
      topValues: [
        { value: 'terraform', count: 52 },
        { value: 'cloudformation', count: 28 },
        { value: 'manual', count: 18 },
      ],
    },
  ];
}

export async function getTagExplorerData(tenantId: string): Promise<TagExplorerData> {
  const totalResources = 268;
  const tagUsage = generateDemoTagUsage();

  // Determine unmapped tags by comparing explorer data against configured mappings
  const mappings = await getTagMappings(tenantId);
  const mappedKeys = new Set(mappings.map((m) => m.cloudTagKey));
  const unmappedTags = tagUsage
    .map((t) => t.tagKey)
    .filter((key) => !mappedKeys.has(key));

  return {
    totalResources,
    tagUsage,
    unmappedTags,
  };
}
