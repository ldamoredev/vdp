CREATE SCHEMA "core";
--> statement-breakpoint
CREATE SCHEMA "wallet";
--> statement-breakpoint
CREATE SCHEMA "health";
--> statement-breakpoint
CREATE SCHEMA "tasks";
--> statement-breakpoint
CREATE TABLE "core"."agent_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(20) NOT NULL,
	"title" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text,
	"tool_calls" jsonb,
	"tool_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
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
CREATE TABLE "health"."appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"doctor_name" varchar(100),
	"specialty" varchar(60),
	"location" varchar(200),
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer,
	"notes" text,
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"measurement_type" varchar(30) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"recorded_at" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."habit_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"completed_at" date NOT NULL,
	"value" numeric(10, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "health"."habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"frequency" varchar(20) DEFAULT 'daily' NOT NULL,
	"target_value" numeric(10, 2),
	"unit" varchar(30),
	"icon" varchar(10),
	"color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."health_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar(30) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"source" varchar(30) DEFAULT 'manual' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."medication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"taken_at" timestamp NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "health"."medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"dosage" varchar(50),
	"frequency" varchar(30) NOT NULL,
	"time_of_day" varchar(20),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks"."task_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"scheduled_date" date NOT NULL,
	"domain" varchar(20),
	"completed_at" timestamp,
	"carry_over_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."agent_messages" ADD CONSTRAINT "agent_messages_conversation_id_agent_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "core"."agent_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."investments" ADD CONSTRAINT "investments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "wallet"."savings_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."savings_contributions" ADD CONSTRAINT "savings_contributions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "wallet"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "wallet"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."transactions" ADD CONSTRAINT "transactions_transfer_to_account_id_accounts_id_fk" FOREIGN KEY ("transfer_to_account_id") REFERENCES "wallet"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health"."habit_completions" ADD CONSTRAINT "habit_completions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "health"."habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health"."medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "health"."medications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks"."task_notes" ADD CONSTRAINT "task_notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "core_msg_conversation_idx" ON "core"."agent_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_unique_idx" ON "wallet"."exchange_rates" USING btree ("from_currency","to_currency","type","date");--> statement-breakpoint
CREATE INDEX "tx_account_date_idx" ON "wallet"."transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "tx_category_date_idx" ON "wallet"."transactions" USING btree ("category_id","date");--> statement-breakpoint
CREATE INDEX "apt_scheduled_idx" ON "health"."appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "bm_type_recorded_idx" ON "health"."body_measurements" USING btree ("measurement_type","recorded_at");--> statement-breakpoint
CREATE INDEX "hc_habit_completed_idx" ON "health"."habit_completions" USING btree ("habit_id","completed_at");--> statement-breakpoint
CREATE INDEX "hm_type_recorded_idx" ON "health"."health_metrics" USING btree ("metric_type","recorded_at");--> statement-breakpoint
CREATE INDEX "ml_med_taken_idx" ON "health"."medication_logs" USING btree ("medication_id","taken_at");--> statement-breakpoint
CREATE INDEX "task_notes_task_idx" ON "tasks"."task_notes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_scheduled_date_idx" ON "tasks"."tasks" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks"."tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_domain_idx" ON "tasks"."tasks" USING btree ("domain");