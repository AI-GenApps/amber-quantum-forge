ALTER TABLE "ludo_matchmaking_tickets" ADD COLUMN "coin_tier" text;--> statement-breakpoint
ALTER TABLE "ludo_rooms" ADD COLUMN "coin_tier" text;--> statement-breakpoint
ALTER TABLE "ludo_matchmaking_tickets" ADD CONSTRAINT "ludo_matchmaking_tickets_coin_tier_check" CHECK ("coin_tier" IS NULL OR "coin_tier" IN ('low', 'mid', 'high'));--> statement-breakpoint
ALTER TABLE "ludo_rooms" ADD CONSTRAINT "ludo_rooms_coin_tier_check" CHECK ("coin_tier" IS NULL OR "coin_tier" IN ('low', 'mid', 'high'));