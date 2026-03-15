import cron from "node-cron";

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
class SchedulerService {
  private jobs = new Map<string, { task: cron.ScheduledTask; job: ScheduledJob }>();

  /**
   * Register and start a scheduled job.
   */
  register(job: ScheduledJob): void {
    if (this.jobs.has(job.name)) {
      console.warn(`[SCHEDULER] Job "${job.name}" already registered, replacing...`);
      this.remove(job.name);
    }

    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid cron expression for job "${job.name}": ${job.schedule}`);
    }

    const task = cron.schedule(job.schedule, async () => {
      console.log(`[SCHEDULER] Running job: ${job.name}`);
      try {
        await job.handler();
      } catch (err) {
        console.error(`[SCHEDULER] Job "${job.name}" failed:`, err);
      }
    }, {
      scheduled: job.enabled,
    });

    this.jobs.set(job.name, { task, job });
    console.log(`[SCHEDULER] Registered job: ${job.name} (${job.schedule}) [${job.enabled ? "enabled" : "disabled"}]`);
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
    console.log("[SCHEDULER] All jobs stopped.");
  }
}

export const scheduler = new SchedulerService();
