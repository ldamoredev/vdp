CREATE TABLE "health"."counter_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"counter_id" uuid NOT NULL,
	"started_at" date NOT NULL,
	"ended_at" date NOT NULL,
	"days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"emoji" varchar(8),
	"daily_cost" numeric(15, 2),
	"started_at" date NOT NULL,
	"last_milestone_notified" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health"."counter_attempts" ADD CONSTRAINT "counter_attempts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health"."counter_attempts" ADD CONSTRAINT "counter_attempts_counter_id_counters_id_fk" FOREIGN KEY ("counter_id") REFERENCES "health"."counters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health"."counters" ADD CONSTRAINT "counters_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "counter_attempts_counter_idx" ON "health"."counter_attempts" USING btree ("counter_id");--> statement-breakpoint
CREATE INDEX "counter_attempts_owner_user_idx" ON "health"."counter_attempts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "counters_owner_user_idx" ON "health"."counters" USING btree ("owner_user_id");