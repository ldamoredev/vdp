CREATE TABLE "core"."usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"surface" varchar(40) NOT NULL,
	"action" varchar(120) NOT NULL,
	"occurred_on" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."usage_events" ADD CONSTRAINT "usage_events_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_owner_key_day_idx" ON "core"."usage_events" USING btree ("owner_user_id","surface","action","occurred_on");