/**
 * Wiring: Connects all registries, event subscriptions, and scheduled jobs.
 *
 * Called once at app startup from buildApp().
 * Keeps app.ts clean — all cross-cutting concerns wired here.
 */
import { eventBus } from "./core/event-bus/index.js";
import { scheduler } from "./core/scheduler/index.js";
import { skillRegistry } from "./skills/index.js";
import { agentRegistry } from "./agents/registry.js";
import { WalletAgent } from "./modules/wallet/agent/wallet-agent.js";
import { HealthAgent } from "./modules/health/agent/health-agent.js";
import { TasksAgent } from "./modules/tasks/agent/tasks-agent.js";
import { summarizeSkill } from "./skills/summarize.js";

export function wireAll() {
  // ─── Register Agents ────────────────────────────────────
  const agentDeps = { eventBus, skills: skillRegistry };
  agentRegistry.register(new WalletAgent(agentDeps));
  agentRegistry.register(new HealthAgent(agentDeps));
  agentRegistry.register(new TasksAgent(agentDeps));

  // ─── Register Skills ────────────────────────────────────
  skillRegistry.register(summarizeSkill);

  // ─── Cross-Domain Event Subscribers ─────────────────────

  // When health reports poor sleep, log it for wallet context
  // (future: wallet agent could flag "you tend to overspend after poor sleep")
  eventBus.on("health.sleep.poor_quality", (event) => {
    console.log(
      `[CROSS-DOMAIN] Poor sleep detected (${(event.payload as { hours: number }).hours}h). ` +
      `Wallet agent may correlate with spending patterns.`
    );
  });

  // When a wallet spending spike occurs, log for health context
  // (future: health agent could note "high spending correlates with stress")
  eventBus.on("wallet.spending.spike", (event) => {
    console.log(
      `[CROSS-DOMAIN] Spending spike detected. ` +
      `Health agent may correlate with mood/stress patterns.`
    );
  });

  // ─── Scheduler Jobs ─────────────────────────────────────

  // Daily health check reminder — runs every day at 9 AM (Argentina time)
  scheduler.register({
    name: "daily-health-reminder",
    schedule: "0 9 * * *",
    enabled: true,
    handler: async () => {
      console.log("[SCHEDULER] Daily health reminder triggered");
      // v1: Just logs. v2: Could trigger the health agent to proactively
      // check for missed medications, incomplete habits, etc.
      const healthAgent = agentRegistry.get("health");
      if (healthAgent) {
        console.log("[SCHEDULER] Health agent available for proactive check");
        // Future: healthAgent.evaluate({ additionalContext: "Daily morning check" });
      }
    },
  });
}
