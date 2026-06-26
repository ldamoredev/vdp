CREATE TABLE "projects"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects"."time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"date" date NOT NULL,
	"minutes" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects"."projects" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "projects"."clients" ADD CONSTRAINT "clients_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects"."time_entries" ADD CONSTRAINT "time_entries_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects"."time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_owner_user_idx" ON "projects"."clients" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "projects"."clients" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_owner_name_idx" ON "projects"."clients" USING btree ("owner_user_id","name");--> statement-breakpoint
INSERT INTO "projects"."clients" ("owner_user_id", "name")
SELECT DISTINCT "owner_user_id", "client"
FROM "projects"."projects"
WHERE "client" IS NOT NULL AND btrim("client") <> ''
ON CONFLICT ("owner_user_id", "name") DO NOTHING;--> statement-breakpoint
UPDATE "projects"."projects" AS p
SET "client_id" = c."id"
FROM "projects"."clients" AS c
WHERE p."client_id" IS NULL
  AND p."client" IS NOT NULL
  AND btrim(p."client") <> ''
  AND c."owner_user_id" = p."owner_user_id"
  AND c."name" = p."client";--> statement-breakpoint
CREATE INDEX "time_entries_owner_date_idx" ON "projects"."time_entries" USING btree ("owner_user_id","date");--> statement-breakpoint
CREATE INDEX "time_entries_project_date_idx" ON "projects"."time_entries" USING btree ("project_id","date");--> statement-breakpoint
CREATE INDEX "time_entries_task_idx" ON "projects"."time_entries" USING btree ("task_id");--> statement-breakpoint
ALTER TABLE "projects"."projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "projects"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_client_idx" ON "projects"."projects" USING btree ("client_id");
