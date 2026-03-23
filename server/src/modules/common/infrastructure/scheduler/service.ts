import cron from "node-cron";
import { Logger } from '../../base/observability/logging/Logger';
import { NoOpLogger } from '../observability/logging/NoOpLogger';

export interface ScheduledJob {
  name: string;
  schedule: string; // cron expression
  handler: () => void | Promise<void>;
  enabled: boolean;
}

/**
 * Simple cron-based scheduler for proactive agent behavior.
 *
 * v1: Uses node-cron for in-process scheduling.
 * v2: Can be upgraded to BullMQ + Redis for reliable job scheduling.
 */
export class SchedulerService {
  private jobs = new Map<string, { task: cron.ScheduledTask; job: ScheduledJob }>();
  constructor(private readonly logger: Logger = new NoOpLogger()) {}

  /**
   * Register and start a scheduled job.
   */
  register(job: ScheduledJob): void {
    if (this.jobs.has(job.name)) {
      this.logger.warn('scheduler job already registered; replacing', { name: job.name });
      this.remove(job.name);
    }

    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid cron expression for job "${job.name}": ${job.schedule}`);
    }

    const task = cron.schedule(job.schedule, async () => {
      this.logger.info('scheduler job running', { name: job.name });
      try {
        await job.handler();
      } catch (err) {
        this.logger.error('scheduler job failed', {
          name: job.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }, {
      scheduled: job.enabled,
    });

    this.jobs.set(job.name, { task, job });
    this.logger.info('scheduler job registered', {
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
    });
  }

  /**
   * Remove a scheduled job.
   */
  remove(name: string): void {
    const entry = this.jobs.get(name);
    if (entry) {
      entry.task.stop();
      this.jobs.delete(name);
    }
  }

  /**
   * Enable/disable a job.
   */
  setEnabled(name: string, enabled: boolean): void {
    const entry = this.jobs.get(name);
    if (entry) {
      if (enabled) {
        entry.task.start();
      } else {
        entry.task.stop();
      }
      entry.job.enabled = enabled;
    }
  }

  /**
   * List all registered jobs.
   */
  list(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map((e) => e.job);
  }

  /**
   * Run a job immediately (for testing or manual trigger).
   */
  async runNow(name: string): Promise<void> {
    const entry = this.jobs.get(name);
    if (!entry) throw new Error(`Job "${name}" not found`);
    await entry.job.handler();
  }

  /**
   * Stop all jobs and clear the registry.
   */
  shutdown(): void {
    for (const [, entry] of this.jobs) {
      entry.task.stop();
    }
    this.jobs.clear();
    this.logger.info('scheduler shutdown complete');
  }
}

export function createSchedulerService(logger: Logger): SchedulerService {
  return new SchedulerService(logger);
}
