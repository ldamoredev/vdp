CREATE SCHEMA "medical";
--> statement-breakpoint
CREATE TABLE "medical"."attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"filename" varchar(200) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_ref" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical"."records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"type" varchar(16) NOT NULL,
	"title" varchar(160) NOT NULL,
	"record_date" date NOT NULL,
	"professional" varchar(160),
	"specialty" varchar(120),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."file_blobs" (
	"ref" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" "bytea" NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medical"."attachments" ADD CONSTRAINT "attachments_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical"."attachments" ADD CONSTRAINT "attachments_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "medical"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical"."records" ADD CONSTRAINT "records_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medical_attachments_record_idx" ON "medical"."attachments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "medical_attachments_owner_user_idx" ON "medical"."attachments" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "medical_records_owner_user_idx" ON "medical"."records" USING btree ("owner_user_id");