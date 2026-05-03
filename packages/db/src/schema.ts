import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
