CREATE TABLE "health"."goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"notes" text,
	"target_date" date NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"deadline_notified" varchar(4) DEFAULT 'none' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health"."goals" ADD CONSTRAINT "goals_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_owner_user_idx" ON "health"."goals" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "goals_status_idx" ON "health"."goals" USING btree ("status");