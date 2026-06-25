CREATE SCHEMA "projects";
--> statement-breakpoint
CREATE TABLE "projects"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"outcome" text NOT NULL,
	"next_action" text NOT NULL,
	"focus" varchar(160) NOT NULL,
	"client" varchar(160),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ADD COLUMN "board_status" varchar(20) DEFAULT 'backlog' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects"."projects" ADD CONSTRAINT "projects_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_owner_user_idx" ON "projects"."projects" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects"."projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_kind_idx" ON "projects"."projects" USING btree ("kind");--> statement-breakpoint
ALTER TABLE "tasks"."tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks"."tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_project_board_idx" ON "tasks"."tasks" USING btree ("project_id","board_status");