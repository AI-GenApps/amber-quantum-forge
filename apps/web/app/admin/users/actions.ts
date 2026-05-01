"use server";

import admin from "@repo/api/firebase";
import { auth, db, deviceRegistrations, eq, sql, users } from "@repo/db";
import { assertAdmin } from "../../../lib/admin-session";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  firebaseUid: string | null;
  provider: string | null;
  deviceCount: number;
  createdAt: Date;
}

export interface DeviceRow {
  id: number;
  fcmToken: string;
  deviceInfo: string | null;
  createdAt: Date;
}

export interface UserDetail {
  user: {
    id: number;
    name: string;
    email: string;
    firebaseUid: string | null;
    provider: string | null;
    createdAt: Date;
  };
  devices: DeviceRow[];
}

export async function listUsersWithDevices(): Promise<UserRow[]> {
  await assertAdmin();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      firebaseUid: auth.firebaseUid,
      provider: auth.provider,
      deviceCount: sql<number>`COUNT(${deviceRegistrations.id})::int`,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(auth, eq(auth.userId, users.id))
    .leftJoin(deviceRegistrations, eq(deviceRegistrations.userId, users.id))
    .groupBy(users.id, auth.firebaseUid, auth.provider)
    .orderBy(users.id);
  return rows;
}

export async function getUserDetail(userId: number): Promise<UserDetail | null> {
  await assertAdmin();
  const userRow = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      firebaseUid: auth.firebaseUid,
      provider: auth.provider,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(auth, eq(auth.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (userRow.length === 0) return null;
  const devices = await db
    .select({
      id: deviceRegistrations.id,
      fcmToken: deviceRegistrations.fcmToken,
      deviceInfo: deviceRegistrations.deviceInfo,
      createdAt: deviceRegistrations.createdAt,
    })
    .from(deviceRegistrations)
    .where(eq(deviceRegistrations.userId, userId))
    .orderBy(deviceRegistrations.createdAt);
  return { user: userRow[0]!, devices };
}

export async function revokeDevice(
  deviceId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  try {
    await db.delete(deviceRegistrations).where(eq(deviceRegistrations.id, deviceId));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to revoke" };
  }
}

export async function disableUser(
  userId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  try {
    const link = await db
      .select({ firebaseUid: auth.firebaseUid })
      .from(auth)
      .where(eq(auth.userId, userId))
      .limit(1);
    if (link.length === 0 || !link[0]!.firebaseUid) {
      return { ok: false, error: "User has no Firebase account linked" };
    }
    await admin.auth().updateUser(link[0]!.firebaseUid, { disabled: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to disable" };
  }
}

export async function deleteUser(
  userId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  try {
    const link = await db
      .select({ firebaseUid: auth.firebaseUid })
      .from(auth)
      .where(eq(auth.userId, userId))
      .limit(1);
    if (link.length > 0 && link[0]!.firebaseUid) {
      try {
        await admin.auth().deleteUser(link[0]!.firebaseUid);
      } catch (err) {
        // continue even if Firebase deletion fails (user may already be gone)
        console.warn("firebase deleteUser:", err);
      }
    }
    await db.delete(users).where(eq(users.id, userId));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete" };
  }
}
