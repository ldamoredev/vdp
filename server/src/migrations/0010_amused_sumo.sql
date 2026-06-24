CREATE TABLE "tasks"."daily_review_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"acknowledged_signal_ids" text[] DEFAULT '{}' NOT NULL,
	"watched_category_ids" text[] DEFAULT '{}' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"opened_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks"."daily_review_state" ADD CONSTRAINT "daily_review_state_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_review_owner_date_idx" ON "tasks"."daily_review_state" USING btree ("owner_user_id","date");