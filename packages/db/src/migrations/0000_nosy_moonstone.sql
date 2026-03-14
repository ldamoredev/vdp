CREATE SCHEMA "wallet";
--> statement-breakpoint
CREATE TABLE "wallet"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"type" varchar(20) NOT NULL,
	"initial_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."agent_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text,
	"tool_calls" jsonb,
	"tool_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(60) NOT NULL,
	"type" varchar(10) NOT NULL,
	"icon" varchar(30),
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(15, 4) NOT NULL,
	"type" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(30) NOT NULL,
	"account_id" uuid,
	"currency" varchar(3) NOT NULL,
	"invested_amount" numeric(15, 2) NOT NULL,
	"current_value" numeric(15, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rate" numeric(6, 4),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."savings_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"note" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "wallet"."savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"deadline" date,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"category_id" uuid,
	"type" varchar(10) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"description" varchar(255),
	"date" date NOT NULL,
	"transfer_to_account_id" uuid,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallet"."agent_messages" ADD CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "wallet"."agent_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."investments" ADD CONSTRAINT "investments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "wallet"."savings_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "wallet"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "wallet"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_transfer_to_account_id_accounts_id_fk" FOREIGN KEY ("transfer_to_account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "msg_conversation_idx" ON "wallet"."agent_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_unique_idx" ON "wallet"."exchange_rates" USING btree ("from_currency","to_currency","type","date");--> statement-breakpoint
CREATE INDEX "tx_account_date_idx" ON "wallet"."transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "tx_category_date_idx" ON "wallet"."transactions" USING btree ("category_id","date");