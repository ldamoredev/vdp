ALTER TABLE "inbox"."inbox_items" ADD COLUMN "suggested_destination" varchar(40);--> statement-breakpoint
ALTER TABLE "inbox"."inbox_items" ADD COLUMN "suggested_at" timestamp with time zone;