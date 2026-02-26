import { fetchTagCompliance } from '@/lib/cloud/aws-tags';
import { getTagMappings } from '@/lib/cloud/tags/tag-mapping-service';
import { getTagExplorerData } from '@/lib/cloud/tags/tag-explorer-service';
import { TagGovernanceClient } from './TagGovernanceClient';

export const metadata = { title: 'Tag Governance' };
export const dynamic = 'force-dynamic';

export default async function TagGovernancePage() {
  const [data, tagMappings, explorerData] = await Promise.all([
    fetchTagCompliance().catch(() => null),
    getTagMappings('default').catch(() => []),
    getTagExplorerData('default').catch(() => null),
  ]);

  return <TagGovernanceClient data={data} tagMappings={tagMappings} explorerData={explorerData} />;
}
