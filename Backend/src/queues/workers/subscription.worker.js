import 'dotenv/config';
import { Worker } from 'bullmq';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { getBullMQConnection } from '../connection.js';
import { SUBSCRIPTION_QUEUE } from '../queue.constants.js';
import { processSubscriptionJob } from '../processors/subscription.processor.js';
import { connectDB, disconnectDB } from '../../config/db.js';

const defaultJobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
};

const startSubscriptionWorker = async () => {
    if (!config.bullmqEnabled) {
        logger.info('BullMQ is disabled. Subscription worker not started.');
        return null;
    }

    // Connect to MongoDB
    await connectDB();

    const connection = getBullMQConnection();
    if (!connection) {
        logger.error('Subscription worker: Redis connection unavailable. Exiting.');
        process.exit(1);
    }

    const worker = new Worker(SUBSCRIPTION_QUEUE, processSubscriptionJob, {
        connection,
        concurrency: 1, // Expiry check is a batch operation, no need for high concurrency
        defaultJobOptions
    });
    
    worker.on('completed', (job) => logger.debug(`Subscription job ${job.id} completed`));
    worker.on('failed', (job, err) => logger.error(`Subscription job ${job?.id} failed: ${err.message}`));
    worker.on('error', (err) => logger.error(`Subscription worker error: ${err.message}`));
    
    logger.info('Subscription worker started (Lifecycle Management)');
    return worker;
};

const workerPromise = startSubscriptionWorker();

const shutdown = async () => {
    logger.info('Graceful shutdown: closing subscription worker');
    try {
        const worker = await workerPromise;
        if (worker) {
            await worker.close();
        }
        await disconnectDB();
        logger.info('Graceful shutdown complete');
        process.exit(0);
    } catch (err) {
        logger.error(`Error during graceful shutdown: ${err.message}`);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
