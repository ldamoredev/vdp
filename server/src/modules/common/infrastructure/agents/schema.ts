import {
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const coreSchema = pgSchema("core");

// ─── Agent Conversations (shared across all domains) ─────
export const agentConversations = coreSchema.table(
  "agent_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domain: varchar("domain", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("agent_conv_domain_updated_idx").on(table.domain, table.updatedAt),
  ]
);

// ─── Agent Messages (shared across all domains) ──────────
export const agentMessages = coreSchema.table(
  "agent_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: 'cascade' }),
    role: varchar("role", { length: 10 }).notNull(),
    content: text("content"),
    toolCalls: jsonb("tool_calls"),
    toolResult: jsonb("tool_result"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("core_msg_conversation_idx").on(table.conversationId),
  ]
);
