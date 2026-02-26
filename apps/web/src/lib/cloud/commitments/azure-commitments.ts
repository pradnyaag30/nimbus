import type { CommitmentItemData } from './types';

/**
 * Azure Commitment Inventory (Stub)
 *
 * When Azure adapter is implemented, this will use:
 * - GET /subscriptions/{id}/providers/Microsoft.Capacity/reservationOrders
 *   (Azure Reservation Management API)
 * - Lists all Azure Reserved VM Instances, SQL DB reservations, etc.
 *
 * SDK: @azure/arm-reservations (ReservationsClient)
 */
export async function listAllAzureCommitments(): Promise<CommitmentItemData[]> {
  // TODO: Implement when Azure adapter is built (Q2 2026)
  return [];
}
