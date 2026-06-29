CREATE SCHEMA "objectives";
--> statement-breakpoint
CREATE TABLE "objectives"."objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metric_source" varchar(40) NOT NULL,
	"target" numeric(15, 2) NOT NULL,
	"unit" varchar(24) NOT NULL,
	"manual_value" numeric(15, 2),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"achieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "objectives"."objectives" ADD CONSTRAINT "objectives_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "objectives_owner_user_idx" ON "objectives"."objectives" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "objectives_status_idx" ON "objectives"."objectives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "objectives_period_idx" ON "objectives"."objectives" USING btree ("owner_user_id","period_start","period_end");