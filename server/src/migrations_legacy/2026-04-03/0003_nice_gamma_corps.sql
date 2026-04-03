CREATE SCHEMA "wallet";
--> statement-breakpoint
CREATE TABLE "wallet"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"type" varchar(20) NOT NULL,
	"initial_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"type" varchar(10) NOT NULL,
	"icon" varchar(30),
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(15, 4) NOT NULL,
	"type" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."savings_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"note" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "wallet"."savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"target_amount" numeric(15, 2) NOT NULL,
	"current_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) NOT NULL,
	"deadline" date,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"category_id" uuid,
	"type" varchar(10) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"description" varchar(255),
	"date" date NOT NULL,
	"transfer_to_account_id" uuid,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."agent_messages" DROP CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" DROP CONSTRAINT "task_notes_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "core"."agent_conversations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "core"."agent_conversations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "core"."agent_messages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks"."task_embeddings" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "core"."agent_conversations" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD COLUMN "owner_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD COLUMN "author_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ADD COLUMN "owner_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet"."accounts" ADD CONSTRAINT "accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."categories" ADD CONSTRAINT "categories_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."investments" ADD CONSTRAINT "investments_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."investments" ADD CONSTRAINT "investments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "wallet"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "wallet"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_goals" ADD CONSTRAINT "savings_goals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "wallet"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_transfer_to_account_id_accounts_id_fk" FOREIGN KEY ("transfer_to_account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_owner_user_idx" ON "wallet"."categories" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "wallet"."categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_unique_idx" ON "wallet"."exchange_rates" USING btree ("from_currency","to_currency","type","date");--> statement-breakpoint
CREATE INDEX "investments_account_id_idx" ON "wallet"."investments" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "sc_goal_id_idx" ON "wallet"."savings_contributions" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "sc_transaction_id_idx" ON "wallet"."savings_contributions" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "tx_owner_user_idx" ON "wallet"."transactions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "tx_account_date_idx" ON "wallet"."transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "tx_category_date_idx" ON "wallet"."transactions" USING btree ("category_id","date");--> statement-breakpoint
CREATE INDEX "tx_transfer_to_account_idx" ON "wallet"."transactions" USING btree ("transfer_to_account_id");--> statement-breakpoint
ALTER TABLE "core"."agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."agent_messages" ADD CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "core"."agent_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD CONSTRAINT "task_notes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD CONSTRAINT "task_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "core"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD CONSTRAINT "task_notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ADD CONSTRAINT "tasks_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_conv_domain_updated_idx" ON "core"."agent_conversations" USING btree ("user_id","domain","updated_at");--> statement-breakpoint
CREATE INDEX "task_notes_owner_user_idx" ON "tasks"."task_notes" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "tasks_owner_user_idx" ON "tasks"."tasks" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "tasks_date_status_idx" ON "tasks"."tasks" USING btree ("scheduled_date","status");