CREATE TABLE "ludo_commands" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"match_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"command_type" text NOT NULL,
	"result_summary" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_commands_app_id_environment_match_id_idempotency_key_pk" PRIMARY KEY("app_id","environment","match_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "ludo_events" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"match_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_events_app_id_environment_match_id_sequence_pk" PRIMARY KEY("app_id","environment","match_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "ludo_matches" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"match_id" text NOT NULL,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"seat_count" integer NOT NULL,
	"rules_version" text NOT NULL,
	"current_turn_seat" integer NOT NULL,
	"phase" text NOT NULL,
	"six_streak" integer DEFAULT 0 NOT NULL,
	"turn_deadline_at" timestamp,
	"revision" integer DEFAULT 0 NOT NULL,
	"match_origin" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ludo_matches_app_id_environment_match_id_pk" PRIMARY KEY("app_id","environment","match_id"),
	CONSTRAINT "ludo_matches_origin_check" CHECK ("match_origin" IN ('matchmaking', 'room', 'direct')),
	CONSTRAINT "ludo_matches_mode_check" CHECK ("mode" IN ('classic', 'quick'))
);
--> statement-breakpoint
CREATE TABLE "ludo_matchmaking_tickets" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"ticket_id" text NOT NULL,
	"subject" text NOT NULL,
	"mode" text NOT NULL,
	"seat_target" integer NOT NULL,
	"status" text NOT NULL,
	"matched_match_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "ludo_matchmaking_tickets_app_id_environment_ticket_id_pk" PRIMARY KEY("app_id","environment","ticket_id"),
	CONSTRAINT "ludo_matchmaking_tickets_seat_target_check" CHECK ("seat_target" IN (2, 4)),
	CONSTRAINT "ludo_matchmaking_tickets_status_check" CHECK ("status" IN ('searching', 'matched', 'cancelled', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "ludo_players" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"match_id" text NOT NULL,
	"seat" integer NOT NULL,
	"subject" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"bot_difficulty" text,
	"display_name_cache" text,
	"connected_at" timestamp,
	"miss_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ludo_players_app_id_environment_match_id_seat_pk" PRIMARY KEY("app_id","environment","match_id","seat")
);
--> statement-breakpoint
CREATE TABLE "ludo_rooms" (
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"room_code" text NOT NULL,
	"owner_subject" text NOT NULL,
	"mode" text NOT NULL,
	"seat_target" integer NOT NULL,
	"match_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "ludo_rooms_app_id_environment_room_code_pk" PRIMARY KEY("app_id","environment","room_code"),
	CONSTRAINT "ludo_rooms_seat_target_check" CHECK ("seat_target" IN (2, 4))
);
--> statement-breakpoint
ALTER TABLE "ludo_commands" ADD CONSTRAINT "ludo_commands_match_fk" FOREIGN KEY ("app_id","environment","match_id") REFERENCES "public"."ludo_matches"("app_id","environment","match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ludo_events" ADD CONSTRAINT "ludo_events_match_fk" FOREIGN KEY ("app_id","environment","match_id") REFERENCES "public"."ludo_matches"("app_id","environment","match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ludo_players" ADD CONSTRAINT "ludo_players_match_fk" FOREIGN KEY ("app_id","environment","match_id") REFERENCES "public"."ludo_matches"("app_id","environment","match_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ludo_events_sequence_unique" ON "ludo_events" USING btree ("app_id","environment","match_id","sequence");--> statement-breakpoint
CREATE INDEX "ludo_matchmaking_tickets_fifo_idx" ON "ludo_matchmaking_tickets" USING btree ("app_id","environment","status","mode","seat_target","created_at");--> statement-breakpoint
CREATE INDEX "ludo_players_subject_idx" ON "ludo_players" USING btree ("app_id","environment","subject");