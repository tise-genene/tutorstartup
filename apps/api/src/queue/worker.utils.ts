import { Logger } from '@nestjs/common';
import { Job, Worker, WorkerOptions } from 'bullmq';

export interface StandardWorkerOptions extends WorkerOptions {
    queueName: string;
}

/**
 * Standardizes worker setup with logging and failure handling.
 */
export function setupStandardWorker<T = any, R = any, N extends string = string>(
    worker: Worker<T, R, N>,
    logger: Logger,
) {
    const queueName = worker.name;

    worker.on('active', (job) => {
        logger.log(`Job ${job.id} [${queueName}] started processing`);
    });

    worker.on('completed', (job) => {
        logger.log(`Job ${job.id} [${queueName}] completed successfully`);
    });

    worker.on('failed', async (job: Job | undefined, error: Error) => {
        const jobId = job?.id ?? 'unknown';
        const attempts = job?.attemptsMade ?? 0;
        const maxAttempts = job?.opts?.attempts ?? 1;

        if (job && attempts >= maxAttempts) {
            logger.error(
                `Job ${jobId} [${queueName}] failed after ${attempts} attempts. Moving to DLQ concept (check failed jobs). ERROR: ${error.message}`,
                error.stack,
            );
            // Note: In a real DLQ setup, we might push to a specific "dead" queue.
            // For now, keeping them in the failed set with a clear log is the first step.
        } else {
            logger.warn(
                `Job ${jobId} [${queueName}] failed (Attempt ${attempts}/${maxAttempts}). Retrying if applicable. ERROR: ${error.message}`,
            );
        }
    });

    worker.on('error', (error) => {
        logger.error(`Worker error in queue [${queueName}]: ${error.message}`, error.stack);
    });

    return worker;
}
