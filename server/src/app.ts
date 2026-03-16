import Fastify from "fastify";
import cors from "@fastify/cors";

// Wallet domain routes
import { accountsRoutes } from "./modules/wallet/routes/accounts.js";
import { categoriesRoutes } from "./modules/wallet/routes/categories.js";
import { transactionsRoutes } from "./modules/wallet/routes/transactions.js";
import { savingsRoutes } from "./modules/wallet/routes/savings.js";
import { investmentsRoutes } from "./modules/wallet/routes/investments.js";
import { statsRoutes } from "./modules/wallet/routes/stats.js";
import { exchangeRatesRoutes } from "./modules/wallet/routes/exchange-rates.js";

// Health domain routes
import { metricsRoutes } from "./modules/health/routes/metrics.js";
import { habitsRoutes } from "./modules/health/routes/habits.js";
import { medicationsRoutes } from "./modules/health/routes/medications.js";
import { appointmentsRoutes } from "./modules/health/routes/appointments.js";
import { bodyRoutes } from "./modules/health/routes/body.js";

// Tasks domain routes
import { tasksRoutes } from "./modules/tasks/routes/tasks.js";
import { tasksStatsRoutes } from "./modules/tasks/routes/stats.js";

// Shared agent route (serves ALL domains via registry)
import { agentRoutes } from "./agents/routes.js";

// Core infrastructure
import { eventBus } from "./core/event-bus/index.js";
import { scheduler } from "./core/scheduler/index.js";
import { skillRegistry } from "./skills/index.js";
import { agentRegistry } from "./agents/registry.js";

// Wiring: agents, skills, events, scheduler jobs
import { wireAll } from "./wiring.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  // ─── Wire Registries ──────────────────────────────────────
  wireAll();

  // ─── Wallet Domain Routes ───────────────────────────────
  await app.register(accountsRoutes);
  await app.register(categoriesRoutes);
  await app.register(transactionsRoutes);
  await app.register(savingsRoutes);
  await app.register(investmentsRoutes);
  await app.register(statsRoutes);
  await app.register(exchangeRatesRoutes);

  // ─── Health Domain Routes ───────────────────────────────
  await app.register(metricsRoutes);
  await app.register(habitsRoutes);
  await app.register(medicationsRoutes);
  await app.register(appointmentsRoutes);
  await app.register(bodyRoutes);

  // ─── Tasks Domain Routes ───────────────────────────────
  await app.register(tasksStatsRoutes); // Register before tasksRoutes so /stats/* matches before /:id
  await app.register(tasksRoutes);

  // ─── Shared Agent Routes (all domains) ─────────────────
  await app.register(agentRoutes);

  // ─── Event Bus Logging ──────────────────────────────────
  eventBus.onAll((event) => {
    console.log(`[TIMELINE] ${event.domain}.${event.type} at ${event.timestamp.toISOString()}`);
  });

  // ─── Health Check ───────────────────────────────────────
  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    domains: ["wallet", "health", "tasks"],
    agents: agentRegistry.getAll().map((a) => a.domain),
    skills: skillRegistry.list().map((s) => s.name),
    scheduler: scheduler.list().map((j) => ({ name: j.name, enabled: j.enabled })),
  }));

  return app;
}
