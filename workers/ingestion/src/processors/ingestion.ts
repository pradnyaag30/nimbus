import type { Job } from 'bullmq';
import { prisma } from '@nimbus/db';
import { getCloudAdapter } from '../providers';

interface IngestionJobData {
  cloudAccountId: string;
  tenantId: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'KUBERNETES';
  startDate: string;
  endDate: string;
}

export async function processIngestionJob(job: Job<IngestionJobData>) {
  const { cloudAccountId, tenantId, provider, startDate, endDate } = job.data;

  // Update sync job status
  const syncJob = await prisma.syncJob.create({
    data: {
      cloudAccountId,
      jobType: 'cost_ingestion',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    // Get the cloud adapter for this provider
    const adapter = getCloudAdapter(provider);

    // Fetch cost data from the cloud provider
    await job.updateProgress(10);
    const rawCostData = await adapter.getCosts({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    // Normalize to FOCUS schema
    await job.updateProgress(50);
    const normalizedItems = await adapter.normalizeToFocus(rawCostData);

    // Batch insert into database
    await job.updateProgress(70);
    const batchSize = 1000;
    for (let i = 0; i < normalizedItems.length; i += batchSize) {
      const batch = normalizedItems.slice(i, i + batchSize);
      await prisma.costLineItem.createMany({
        data: batch.map((item) => ({
          tenantId,
          cloudAccountId,
          ...item,
        })),
        skipDuplicates: true,
      });
      await job.updateProgress(70 + (30 * Math.min(i + batchSize, normalizedItems.length)) / normalizedItems.length);
    }

    // Update cloud account sync timestamp
    await prisma.cloudAccount.update({
      where: { id: cloudAccountId },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: null,
        status: 'CONNECTED',
      },
    });

    // Mark sync job complete
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: { itemCount: normalizedItems.length },
      },
    });

    return { itemsProcessed: normalizedItems.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update sync job with error
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: errorMessage,
      },
    });

    // Update cloud account status
    await prisma.cloudAccount.update({
      where: { id: cloudAccountId },
      data: {
        lastSyncError: errorMessage,
        status: 'ERROR',
      },
    });

    throw error;
  }
}
