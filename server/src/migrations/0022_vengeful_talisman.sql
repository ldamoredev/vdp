CREATE TABLE "wallet"."loan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"date" date NOT NULL,
	"note" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet"."loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"direction" varchar(10) NOT NULL,
	"counterparty" varchar(120) NOT NULL,
	"principal" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"date" date NOT NULL,
	"due_date" date,
	"note" varchar(255),
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallet"."loan_payments" ADD CONSTRAINT "loan_payments_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."loan_payments" ADD CONSTRAINT "loan_payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "wallet"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet"."loans" ADD CONSTRAINT "loans_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "core"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loan_payments_loan_id_idx" ON "wallet"."loan_payments" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "loans_owner_user_idx" ON "wallet"."loans" USING btree ("owner_user_id");