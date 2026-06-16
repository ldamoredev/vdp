ALTER TABLE "health"."habits" ADD COLUMN "cadence" varchar(12) DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "health"."habits" ADD COLUMN "weekly_target" integer;