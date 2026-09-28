CREATE TABLE "ludo_revenuecat_events" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"product_id" text NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_revenuecat_events_app_id_environment_event_id_pk" PRIMARY KEY("app_id","environment","event_id")
);
--> statement-breakpoint
CREATE TABLE "ludo_subscriptions" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"subject" text NOT NULL,
	"product_id" text NOT NULL,
	"status" text NOT NULL,
	"will_renew" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_subscriptions_app_id_environment_subject_pk" PRIMARY KEY("app_id","environment","subject"),
	CONSTRAINT "ludo_subscriptions_status_check" CHECK ("status" IN ('active', 'cancelled', 'expired', 'billing_issue', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "ludo_wallet_transactions" DROP CONSTRAINT "ludo_wallet_transactions_reason_check";--> statement-breakpoint
ALTER TABLE "ludo_wallet_transactions" ADD CONSTRAINT "ludo_wallet_transactions_reason_check" CHECK ("reason" IN (
        'starter_grant', 'daily_login', 'rewarded_ad', 'level_up',
        'online_match_win', 'coin_table_entry', 'coin_table_payout',
        'coin_table_refund', 'iap_purchase', 'vortex_pass_perk',
        'store_purchase', 'admin_adjustment', 'refund'
      ));