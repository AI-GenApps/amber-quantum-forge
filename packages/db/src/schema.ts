import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profilePictureUrl: text("profile_picture_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auth = pgTable("auth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deviceRegistrations = pgTable("device_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  fcmToken: text("fcm_token").notNull().unique(),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  auth: one(auth, {
    fields: [users.id],
    references: [auth.userId],
  }),
  deviceRegistrations: many(deviceRegistrations),
  refreshTokens: many(authRefreshTokens),
  chatMessages: many(chatMessages),
}));

export const authRelations = relations(auth, ({ one }) => ({
  user: one(users, {
    fields: [auth.userId],
    references: [users.id],
  }),
}));

export const deviceRegistrationsRelations = relations(deviceRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [deviceRegistrations.userId],
    references: [users.id],
  }),
}));

export const authRefreshTokens = pgTable("auth_refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  deviceId: text("device_id"),
  expiresAt: timestamp("expires_at").notNull(),
  rotatedAt: timestamp("rotated_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authRefreshTokensRelations = relations(authRefreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [authRefreshTokens.userId],
    references: [users.id],
  }),
}));

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    clientId: text("client_id").notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAtClient: timestamp("created_at_client").notNull(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.clientId, t.userId)],
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const mergeRelayScopes = pgTable(
  "merge_relay_scopes",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    revision: integer("revision").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.appId, table.environment] })],
);

export const mergeRelayRecords = pgTable(
  "merge_relay_records",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    recordType: text("record_type").notNull(),
    recordId: text("record_id").notNull(),
    revision: integer("revision"),
    ownerSubject: text("owner_subject"),
    challengeId: text("challenge_id"),
    resultId: text("result_id"),
    idempotencyKey: text("idempotency_key"),
    alias: text("alias"),
    targetSubject: text("target_subject"),
    lookupKey: text("lookup_key"),
    parentRecordType: text("parent_record_type"),
    parentRecordId: text("parent_record_id"),
    payload: jsonb("payload").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.recordType, table.recordId] }),
    index("merge_relay_records_owner_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.ownerSubject,
      table.updatedAt,
    ),
    index("merge_relay_records_challenge_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.challengeId,
      table.ownerSubject,
      table.updatedAt,
    ),
    index("merge_relay_records_result_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.resultId,
      table.ownerSubject,
      table.updatedAt,
    ),
    index("merge_relay_records_idempotency_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.idempotencyKey,
      table.ownerSubject,
    ),
    index("merge_relay_records_alias_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.alias,
    ),
    index("merge_relay_records_target_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.ownerSubject,
      table.targetSubject,
    ),
    index("merge_relay_records_lookup_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.lookupKey,
    ),
    index("merge_relay_records_config_revision_idx").on(
      table.appId,
      table.environment,
      table.recordType,
      table.revision,
    ),
    uniqueIndex("merge_relay_records_scope_idempotency_unique")
      .on(table.appId, table.environment, table.recordType, table.idempotencyKey)
      .where(sql`"idempotency_key" IS NOT NULL`),
    check(
      "merge_relay_records_parent_pair_check",
      sql`("parent_record_type" IS NULL) = ("parent_record_id" IS NULL)`,
    ),
    foreignKey({
      columns: [table.appId, table.environment, table.parentRecordType, table.parentRecordId],
      foreignColumns: [table.appId, table.environment, table.recordType, table.recordId],
      name: "merge_relay_records_parent_fk",
    }),
  ],
);

export const ludoMatches = pgTable(
  "ludo_matches",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    matchId: text("match_id").notNull(),
    mode: text("mode").notNull(),
    status: text("status").notNull(),
    seatCount: integer("seat_count").notNull(),
    rulesVersion: text("rules_version").notNull(),
    currentTurnSeat: integer("current_turn_seat").notNull(),
    phase: text("phase").notNull(),
    sixStreak: integer("six_streak").notNull().default(0),
    turnDeadlineAt: timestamp("turn_deadline_at"),
    revision: integer("revision").notNull().default(0),
    matchOrigin: text("match_origin").notNull(),
    // Pins the economy config version (packages/api/src/games/ludo/economy-config.ts)
    // this match started under, so a config bump mid-flight cannot change
    // the stakes/payouts of an in-progress match. Null for matches created
    // before task 26a shipped, or for modes with no economy involvement.
    economyConfigVersion: integer("economy_config_version"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.matchId] }),
    check("ludo_matches_origin_check", sql`"match_origin" IN ('matchmaking', 'room', 'direct')`),
    check("ludo_matches_mode_check", sql`"mode" IN ('classic', 'quick')`),
  ],
);

export const ludoPlayers = pgTable(
  "ludo_players",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    matchId: text("match_id").notNull(),
    seat: integer("seat").notNull(),
    subject: text("subject"),
    isBot: boolean("is_bot").notNull().default(false),
    botDifficulty: text("bot_difficulty"),
    displayNameCache: text("display_name_cache"),
    connectedAt: timestamp("connected_at"),
    missCount: integer("miss_count").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.matchId, table.seat] }),
    index("ludo_players_subject_idx").on(table.appId, table.environment, table.subject),
    foreignKey({
      columns: [table.appId, table.environment, table.matchId],
      foreignColumns: [ludoMatches.appId, ludoMatches.environment, ludoMatches.matchId],
      name: "ludo_players_match_fk",
    }).onDelete("cascade"),
  ],
);

export const ludoEvents = pgTable(
  "ludo_events",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    matchId: text("match_id").notNull(),
    sequence: integer("sequence").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.matchId, table.sequence] }),
    uniqueIndex("ludo_events_sequence_unique").on(
      table.appId,
      table.environment,
      table.matchId,
      table.sequence,
    ),
    foreignKey({
      columns: [table.appId, table.environment, table.matchId],
      foreignColumns: [ludoMatches.appId, ludoMatches.environment, ludoMatches.matchId],
      name: "ludo_events_match_fk",
    }).onDelete("cascade"),
  ],
);

export const ludoCommands = pgTable(
  "ludo_commands",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    matchId: text("match_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    commandType: text("command_type").notNull(),
    resultSummary: jsonb("result_summary").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.appId, table.environment, table.matchId, table.idempotencyKey],
    }),
    foreignKey({
      columns: [table.appId, table.environment, table.matchId],
      foreignColumns: [ludoMatches.appId, ludoMatches.environment, ludoMatches.matchId],
      name: "ludo_commands_match_fk",
    }).onDelete("cascade"),
  ],
);

export const ludoMatchmakingTickets = pgTable(
  "ludo_matchmaking_tickets",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    ticketId: text("ticket_id").notNull(),
    subject: text("subject").notNull(),
    mode: text("mode").notNull(),
    seatTarget: integer("seat_target").notNull(),
    status: text("status").notNull(),
    matchedMatchId: text("matched_match_id"),
    // Coin-stake table tier (task 26c). Null for a free-play ticket; a
    // coin-stake ticket is matched only against other tickets of the same
    // tier (see matchmaking-service.ts's grouping) and never bot-filled.
    coinTier: text("coin_tier"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.ticketId] }),
    index("ludo_matchmaking_tickets_fifo_idx").on(
      table.appId,
      table.environment,
      table.status,
      table.mode,
      table.seatTarget,
      table.createdAt,
    ),
    check("ludo_matchmaking_tickets_seat_target_check", sql`"seat_target" IN (2, 4)`),
    check(
      "ludo_matchmaking_tickets_status_check",
      sql`"status" IN ('searching', 'matched', 'cancelled', 'expired')`,
    ),
    check(
      "ludo_matchmaking_tickets_coin_tier_check",
      sql`"coin_tier" IS NULL OR "coin_tier" IN ('low', 'mid', 'high')`,
    ),
  ],
);

export const ludoRooms = pgTable(
  "ludo_rooms",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    roomCode: text("room_code").notNull(),
    ownerSubject: text("owner_subject").notNull(),
    mode: text("mode").notNull(),
    seatTarget: integer("seat_target").notNull(),
    matchId: text("match_id"),
    // Coin-stake table tier (task 26c), remembered from room creation until
    // the room's first join forms the underlying match. Null for a
    // free-play room.
    coinTier: text("coin_tier"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.roomCode] }),
    check("ludo_rooms_seat_target_check", sql`"seat_target" IN (2, 4)`),
    check(
      "ludo_rooms_coin_tier_check",
      sql`"coin_tier" IS NULL OR "coin_tier" IN ('low', 'mid', 'high')`,
    ),
  ],
);

// --- Ludo economy (task 26a) ---------------------------------------------
// Server-authoritative wallet: append-only ledger (`ludoWalletTransactions`)
// is the source of truth, `ludoBalances` is a denormalized summary written
// only inside the same transaction as a ledger insert. No handler writes a
// balance column directly from a request. Purpose-built tables per
// research.md section 3(b), not the generic merge-relay artifact table.

export const ludoWalletTransactions = pgTable(
  "ludo_wallet_transactions",
  {
    id: text("id").primaryKey(),
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    currency: text("currency").notNull(),
    delta: integer("delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason").notNull(),
    sourceRef: text("source_ref"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("ludo_wallet_transactions_currency_check", sql`"currency" IN ('coins', 'diamonds')`),
    check(
      "ludo_wallet_transactions_reason_check",
      sql`"reason" IN (
        'starter_grant', 'daily_login', 'rewarded_ad', 'level_up',
        'online_match_win', 'coin_table_entry', 'coin_table_payout',
        'coin_table_refund', 'iap_purchase', 'vortex_pass_perk',
        'store_purchase', 'admin_adjustment'
      )`,
    ),
    uniqueIndex("ludo_wallet_transactions_idempotency_unique").on(
      table.appId,
      table.environment,
      table.subject,
      table.idempotencyKey,
    ),
    index("ludo_wallet_transactions_subject_idx").on(
      table.appId,
      table.environment,
      table.subject,
      table.currency,
      table.createdAt,
    ),
  ],
);

export const ludoBalances = pgTable(
  "ludo_balances",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    currency: text("currency").notNull(),
    balance: integer("balance").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.subject, table.currency] }),
    check("ludo_balances_currency_check", sql`"currency" IN ('coins', 'diamonds')`),
  ],
);

export const ludoInventory = pgTable(
  "ludo_inventory",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    acquiredVia: text("acquired_via").notNull(),
    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.subject, table.itemId] }),
    check("ludo_inventory_item_type_check", sql`"item_type" IN ('dice', 'token', 'board', 'pass')`),
  ],
);

export const ludoCatalog = pgTable(
  "ludo_catalog",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    displayName: text("display_name").notNull(),
    priceCoins: integer("price_coins"),
    priceDiamonds: integer("price_diamonds"),
    configVersion: integer("config_version").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.itemId] }),
    check("ludo_catalog_item_type_check", sql`"item_type" IN ('dice', 'token', 'board', 'pass')`),
  ],
);

export const ludoProgression = pgTable(
  "ludo_progression",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.appId, table.environment, table.subject] })],
);

export const ludoDailyRewardState = pgTable(
  "ludo_daily_reward_state",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    lastClaimDate: date("last_claim_date"),
    streakDay: integer("streak_day").notNull().default(1),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.subject] }),
    check("ludo_daily_reward_state_streak_day_check", sql`"streak_day" BETWEEN 1 AND 7`),
  ],
);

export const ludoAdRewardClaims = pgTable(
  "ludo_ad_reward_claims",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    adTransactionId: text("ad_transaction_id").notNull(),
    rewardType: text("reward_type").notNull(),
    claimDate: date("claim_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.appId, table.environment, table.subject, table.adTransactionId],
    }),
    check("ludo_ad_reward_claims_reward_type_check", sql`"reward_type" IN ('coins', 'diamonds')`),
    index("ludo_ad_reward_claims_daily_cap_idx").on(
      table.appId,
      table.environment,
      table.subject,
      table.rewardType,
      table.claimDate,
    ),
  ],
);

// Task 26b: durable idempotency + daily-cap tracking for `POST
// /:environment/xp/claim`. Mirrors `ludoAdRewardClaims`'s shape (a claim id
// unique per subject, a UTC `claim_date` column indexed for a same-day sum
// query) rather than extending `ludoWalletTransactions`, since that table's
// `currency` check constrains rows to `coins`/`diamonds` and XP is not a
// wallet currency.
export const ludoXpClaims = pgTable(
  "ludo_xp_claims",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    subject: text("subject").notNull(),
    claimId: text("claim_id").notNull(),
    xpDelta: integer("xp_delta").notNull(),
    claimDate: date("claim_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.subject, table.claimId] }),
    index("ludo_xp_claims_daily_cap_idx").on(
      table.appId,
      table.environment,
      table.subject,
      table.claimDate,
    ),
  ],
);

export const ludoCoinTableEscrow = pgTable(
  "ludo_coin_table_escrow",
  {
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    matchId: text("match_id").notNull(),
    tier: text("tier").notNull(),
    pot: integer("pot").notNull(),
    rake: integer("rake").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    primaryKey({ columns: [table.appId, table.environment, table.matchId] }),
    check("ludo_coin_table_escrow_tier_check", sql`"tier" IN ('low', 'mid', 'high')`),
    check("ludo_coin_table_escrow_status_check", sql`"status" IN ('held', 'paid_out', 'refunded')`),
    foreignKey({
      columns: [table.appId, table.environment, table.matchId],
      foreignColumns: [ludoMatches.appId, ludoMatches.environment, ludoMatches.matchId],
      name: "ludo_coin_table_escrow_match_fk",
    }).onDelete("cascade"),
  ],
);
