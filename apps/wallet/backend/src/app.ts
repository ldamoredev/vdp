import Fastify from "fastify";
import cors from "@fastify/cors";
import { accountsRoutes } from "./routes/accounts";
import { categoriesRoutes } from "./routes/categories";
import { transactionsRoutes } from "./routes/transactions";
import { savingsRoutes } from "./routes/savings";
import { investmentsRoutes } from "./routes/investments";
import { statsRoutes } from "./routes/stats";
import { exchangeRatesRoutes } from "./routes/exchange-rates";
import { agentRoutes } from "./routes/agent";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  await app.register(accountsRoutes);
  await app.register(categoriesRoutes);
  await app.register(transactionsRoutes);
  await app.register(savingsRoutes);
  await app.register(investmentsRoutes);
  await app.register(statsRoutes);
  await app.register(exchangeRatesRoutes);
  await app.register(agentRoutes);

  return app;
}
