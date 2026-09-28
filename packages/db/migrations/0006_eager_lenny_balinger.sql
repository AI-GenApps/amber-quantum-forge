CREATE TABLE "ludo_ad_reward_claims" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"ad_transaction_id" text NOT NULL,
	"reward_type" text NOT NULL,
	"claim_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_ad_reward_claims_app_id_environment_subject_ad_transaction_id_pk" PRIMARY KEY("app_id","environment","subject","ad_transaction_id"),
	CONSTRAINT "ludo_ad_reward_claims_reward_type_check" CHECK ("reward_type" IN ('coins', 'diamonds'))
);
--> statement-breakpoint
CREATE TABLE "ludo_balances" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"currency" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_balances_app_id_environment_subject_currency_pk" PRIMARY KEY("app_id","environment","subject","currency"),
	CONSTRAINT "ludo_balances_currency_check" CHECK ("currency" IN ('coins', 'diamonds'))
);
--> statement-breakpoint
CREATE TABLE "ludo_catalog" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"item_id" text NOT NULL,
	"item_type" text NOT NULL,
	"display_name" text NOT NULL,
	"price_coins" integer,
	"price_diamonds" integer,
	"config_version" integer NOT NULL,
	CONSTRAINT "ludo_catalog_app_id_environment_item_id_pk" PRIMARY KEY("app_id","environment","item_id"),
	CONSTRAINT "ludo_catalog_item_type_check" CHECK ("item_type" IN ('dice', 'token', 'board', 'pass'))
);
--> statement-breakpoint
CREATE TABLE "ludo_coin_table_escrow" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"match_id" text NOT NULL,
	"tier" text NOT NULL,
	"pot" integer NOT NULL,
	"rake" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "ludo_coin_table_escrow_app_id_environment_match_id_pk" PRIMARY KEY("app_id","environment","match_id"),
	CONSTRAINT "ludo_coin_table_escrow_tier_check" CHECK ("tier" IN ('low', 'mid', 'high')),
	CONSTRAINT "ludo_coin_table_escrow_status_check" CHECK ("status" IN ('held', 'paid_out', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "ludo_daily_reward_state" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"last_claim_date" date,
	"streak_day" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_daily_reward_state_app_id_environment_subject_pk" PRIMARY KEY("app_id","environment","subject"),
	CONSTRAINT "ludo_daily_reward_state_streak_day_check" CHECK ("streak_day" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE TABLE "ludo_inventory" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"item_id" text NOT NULL,
	"item_type" text NOT NULL,
	"acquired_via" text NOT NULL,
	"acquired_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_inventory_app_id_environment_subject_item_id_pk" PRIMARY KEY("app_id","environment","subject","item_id"),
	CONSTRAINT "ludo_inventory_item_type_check" CHECK ("item_type" IN ('dice', 'token', 'board', 'pass'))
);
--> statement-breakpoint
CREATE TABLE "ludo_progression" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_progression_app_id_environment_subject_pk" PRIMARY KEY("app_id","environment","subject")
);
--> statement-breakpoint
CREATE TABLE "ludo_wallet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"currency" text NOT NULL,
	"delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text NOT NULL,
	"source_ref" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_wallet_transactions_currency_check" CHECK ("currency" IN ('coins', 'diamonds')),
	CONSTRAINT "ludo_wallet_transactions_reason_check" CHECK ("reason" IN (
        'starter_grant', 'daily_login', 'rewarded_ad', 'level_up',
        'online_match_win', 'coin_table_entry', 'coin_table_payout',
        'coin_table_refund', 'iap_purchase', 'vortex_pass_perk',
        'store_purchase', 'admin_adjustment'
      ))
);
--> statement-breakpoint
ALTER TABLE "ludo_matches" ADD COLUMN "economy_config_version" integer;--> statement-breakpoint
ALTER TABLE "ludo_coin_table_escrow" ADD CONSTRAINT "ludo_coin_table_escrow_match_fk" FOREIGN KEY ("app_id","environment","match_id") REFERENCES "public"."ludo_matches"("app_id","environment","match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ludo_ad_reward_claims_daily_cap_idx" ON "ludo_ad_reward_claims" USING btree ("app_id","environment","subject","reward_type","claim_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ludo_wallet_transactions_idempotency_unique" ON "ludo_wallet_transactions" USING btree ("app_id","environment","subject","idempotency_key");--> statement-breakpoint
CREATE INDEX "ludo_wallet_transactions_subject_idx" ON "ludo_wallet_transactions" USING btree ("app_id","environment","subject","currency","created_at");