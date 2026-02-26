import type { TagMappingInput, TagMappingRecord } from './types';

// In-memory tag mapping store for demo mode. Production: write to TagMapping table via Prisma.
const tagMappingStore: TagMappingRecord[] = [];
let counter = 0;

// Seed default AWS tag mappings
function ensureDefaults() {
  if (tagMappingStore.length > 0) return;

  const defaults: { dim: string; desc: string; key: string }[] = [
    { dim: 'Environment', desc: 'Deployment environment (prod, staging, dev)', key: 'Environment' },
    { dim: 'Team', desc: 'Owning team or business unit', key: 'Team' },
    { dim: 'Cost Center', desc: 'Financial cost center for chargeback', key: 'CostCenter' },
    { dim: 'Project', desc: 'Project or application name', key: 'ProjectName' },
    { dim: 'Owner', desc: 'Technical owner or team lead', key: 'ProjectOwner' },
  ];

  const now = new Date();
  for (const d of defaults) {
    tagMappingStore.push({
      id: `tm_${++counter}`,
      tenantId: 'default',
      dimensionName: d.dim,
      dimensionDescription: d.desc,
      provider: 'AWS',
      cloudTagKey: d.key,
      valueMapping: null,
      isRequired: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// --- CRUD Operations ---------------------------------------------------------

export async function getTagMappings(tenantId: string): Promise<TagMappingRecord[]> {
  ensureDefaults();
  return tagMappingStore
    .filter((m) => m.tenantId === tenantId || m.tenantId === 'default')
    .sort((a, b) => a.dimensionName.localeCompare(b.dimensionName) || a.provider.localeCompare(b.provider));
}

export async function createTagMapping(
  tenantId: string,
  input: TagMappingInput
): Promise<TagMappingRecord> {
  ensureDefaults();

  const now = new Date();
  const mapping: TagMappingRecord = {
    id: `tm_${++counter}`,
    tenantId,
    dimensionName: input.dimensionName,
    dimensionDescription: input.dimensionDescription || null,
    provider: input.provider,
    cloudTagKey: input.cloudTagKey,
    valueMapping: input.valueMapping || null,
    isRequired: input.isRequired,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  };

  tagMappingStore.push(mapping);
  return mapping;
}

export async function updateTagMapping(
  id: string,
  tenantId: string,
  input: Partial<TagMappingInput>
): Promise<TagMappingRecord | null> {
  const idx = tagMappingStore.findIndex((m) => m.id === id && (m.tenantId === tenantId || m.tenantId === 'default'));
  if (idx === -1) return null;

  const existing = tagMappingStore[idx];
  const updated: TagMappingRecord = {
    ...existing,
    ...(input.dimensionName !== undefined && { dimensionName: input.dimensionName }),
    ...(input.dimensionDescription !== undefined && { dimensionDescription: input.dimensionDescription }),
    ...(input.cloudTagKey !== undefined && { cloudTagKey: input.cloudTagKey }),
    ...(input.valueMapping !== undefined && { valueMapping: input.valueMapping || null }),
    ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    updatedAt: new Date(),
  };

  tagMappingStore[idx] = updated;
  return updated;
}

export async function deleteTagMapping(id: string, tenantId: string): Promise<boolean> {
  const idx = tagMappingStore.findIndex((m) => m.id === id && (m.tenantId === tenantId || m.tenantId === 'default'));
  if (idx === -1) return false;
  tagMappingStore.splice(idx, 1);
  return true;
}

// --- Get Required Tags from Mappings ----------------------------------------

const DEFAULT_REQUIRED_TAGS = ['Environment', 'Team', 'CostCenter', 'ProjectName', 'ProjectOwner'];

export async function getRequiredTagKeys(tenantId: string, _provider?: string): Promise<string[]> {
  ensureDefaults();
  const mappings = tagMappingStore.filter(
    (m) =>
      (m.tenantId === tenantId || m.tenantId === 'default') &&
      m.isRequired &&
      m.isActive &&
      (_provider ? m.provider === _provider : true)
  );

  if (mappings.length === 0) return DEFAULT_REQUIRED_TAGS;
  return mappings.map((m) => m.cloudTagKey);
}
