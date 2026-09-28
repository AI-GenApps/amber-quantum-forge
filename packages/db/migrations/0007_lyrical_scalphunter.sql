CREATE TABLE "ludo_xp_claims" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"claim_id" text NOT NULL,
	"xp_delta" integer NOT NULL,
	"claim_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_xp_claims_app_id_environment_subject_claim_id_pk" PRIMARY KEY("app_id","environment","subject","claim_id")
);
--> statement-breakpoint
CREATE INDEX "ludo_xp_claims_daily_cap_idx" ON "ludo_xp_claims" USING btree ("app_id","environment","subject","claim_date");