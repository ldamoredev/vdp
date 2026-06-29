CREATE SCHEMA "inbox";
--> statement-breakpoint
CREATE TABLE "inbox"."inbox_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"routed_to" varchar(40),
	"triaged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inbox"."inbox_items" ADD CONSTRAINT "inbox_items_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbox_items_owner_user_idx" ON "inbox"."inbox_items" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "inbox_items_owner_status_idx" ON "inbox"."inbox_items" USING btree ("owner_user_id","status");