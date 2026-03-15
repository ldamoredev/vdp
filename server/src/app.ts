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
import { agentRoutes } from "./modules/wallet/routes/agent.js";

// Health domain routes
import { metricsRoutes } from "./modules/health/routes/metrics.js";
import { habitsRoutes } from "./modules/health/routes/habits.js";
import { medicationsRoutes } from "./modules/health/routes/medications.js";
import { appointmentsRoutes } from "./modules/health/routes/appointments.js";
import { bodyRoutes } from "./modules/health/routes/body.js";
import { healthAgentRoutes } from "./modules/health/routes/agent.js";

// Core infrastructure
import { eventBus } from './core/event-bus';
import { scheduler } from './core/scheduler';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  // ─── Wallet Domain Routes ───────────────────────────────
  await app.register(accountsRoutes);
  await app.register(categoriesRoutes);
  await app.register(transactionsRoutes);
  await app.register(savingsRoutes);
  await app.register(investmentsRoutes);
  await app.register(statsRoutes);
  await app.register(exchangeRatesRoutes);
  await app.register(agentRoutes);

  // ─── Health Domain Routes ───────────────────────────────
  await app.register(metricsRoutes);
  await app.register(habitsRoutes);
  await app.register(medicationsRoutes);
  await app.register(appointmentsRoutes);
  await app.register(bodyRoutes);
  await app.register(healthAgentRoutes);

  // ─── Future Domain Routes ───────────────────────────────
  // await app.register(workRoutes, { prefix: "/api/v1/work" });
  // await app.register(peopleRoutes, { prefix: "/api/v1/people" });
  // await app.register(studyRoutes, { prefix: "/api/v1/study" });

  // ─── Event Bus Logging ──────────────────────────────────
  eventBus.onAll((event) => {
    // Timeline-worthy events are logged centrally
    console.log(`[TIMELINE] ${event.domain}.${event.type} at ${event.timestamp.toISOString()}`);
  });

  // ─── Health Check ───────────────────────────────────────
  app.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    domains: ["wallet", "health"],
    scheduler: scheduler.list().map((j) => ({ name: j.name, enabled: j.enabled })),
  }));

  return app;
}
