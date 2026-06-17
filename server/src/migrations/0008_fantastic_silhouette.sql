CREATE TABLE "health"."weight_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(6, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health"."goals" ADD COLUMN "target_weight_kg" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "health"."weight_entries" ADD CONSTRAINT "weight_entries_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entries_owner_date_idx" ON "health"."weight_entries" USING btree ("owner_user_id","date");--> statement-breakpoint
CREATE INDEX "weight_entries_owner_user_idx" ON "health"."weight_entries" USING btree ("owner_user_id");