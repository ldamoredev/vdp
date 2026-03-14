import { db } from "./client";
import { accounts, categories } from "./schema/index";
import { sql } from "drizzle-orm";
import { DEFAULT_CATEGORIES } from "@vdp/shared";

async function seed() {
  console.log("Creating wallet schema...");
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS wallet`);

  console.log("Seeding categories...");
  for (const cat of DEFAULT_CATEGORIES.expense) {
    await db
      .insert(categories)
      .values({ name: cat.name, type: "expense", icon: cat.icon })
      .onConflictDoNothing();
  }
  for (const cat of DEFAULT_CATEGORIES.income) {
    await db
      .insert(categories)
      .values({ name: cat.name, type: "income", icon: cat.icon })
      .onConflictDoNothing();
  }

  console.log("Seeding default accounts...");
  await db
    .insert(accounts)
    .values([
      { name: "Efectivo ARS", currency: "ARS", type: "cash", initialBalance: "0" },
      { name: "Efectivo USD", currency: "USD", type: "cash", initialBalance: "0" },
    ])
    .onConflictDoNothing();

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
