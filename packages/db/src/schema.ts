import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
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
