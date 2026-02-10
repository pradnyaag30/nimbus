import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { processIngestionJob } from './processors/ingestion';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Queue for scheduling ingestion jobs
export const ingestionQueue = new Queue('ingestion', { connection });

// Worker that processes ingestion jobs
const worker = new Worker(
  'ingestion',
  async (job) => {
    console.log(`[Worker] Processing job ${job.id}: ${job.name}`);
    await processIngestionJob(job);
    console.log(`[Worker] Completed job ${job.id}`);
  },
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute max
    },
  },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err.message);
});

console.log('[Nimbus Ingestion Worker] Started and listening for jobs...');

// Graceful shutdown
const shutdown = async () => {
  console.log('[Worker] Shutting down...');
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
