CREATE TABLE "health"."mood_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"mood" integer NOT NULL,
	"energy" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health"."mood_check_ins" ADD CONSTRAINT "mood_check_ins_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mood_check_ins_owner_date_idx" ON "health"."mood_check_ins" USING btree ("owner_user_id","date");--> statement-breakpoint
CREATE INDEX "mood_check_ins_owner_user_idx" ON "health"."mood_check_ins" USING btree ("owner_user_id");