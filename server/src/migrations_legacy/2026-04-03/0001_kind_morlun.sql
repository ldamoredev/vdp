ALTER TABLE "tasks"."task_notes"
ADD COLUMN "type" varchar(30) DEFAULT 'note' NOT NULL;
