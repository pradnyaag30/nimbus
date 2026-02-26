import type { CommitmentItemData } from './types';

/**
 * GCP Commitment Inventory (Stub)
 *
 * When GCP adapter is implemented, this will use:
 * - compute.commitments.list (GCP Compute Engine API)
 *   https://cloud.google.com/compute/docs/reference/rest/v1/regionCommitments/list
 * - Lists all Committed Use Discounts (CUDs)
 *
 * SDK: @google-cloud/compute (CommitmentsClient)
 */
export async function listAllGcpCommitments(): Promise<CommitmentItemData[]> {
  // TODO: Implement when GCP adapter is built (Q3 2026)
  return [];
}
