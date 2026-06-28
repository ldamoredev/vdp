ALTER TABLE "projects"."projects" ADD COLUMN "hourly_rate" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects"."projects" ADD COLUMN "rate_currency" varchar(3) DEFAULT 'ARS' NOT NULL;