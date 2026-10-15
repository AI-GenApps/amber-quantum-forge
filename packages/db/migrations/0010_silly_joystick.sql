CREATE TABLE "ludo_free_play_win_claims" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"match_id" text NOT NULL,
	"claim_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_free_play_win_claims_app_id_environment_subject_match_id_pk" PRIMARY KEY("app_id","environment","subject","match_id")
);
--> statement-breakpoint
CREATE INDEX "ludo_free_play_win_claims_daily_cap_idx" ON "ludo_free_play_win_claims" USING btree ("app_id","environment","subject","claim_date");