"use server";

import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

export async function getUsers() {
  try {
    const allUsers = await db.select().from(users);
    return { success: true, data: allUsers };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUser(id: number) {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (user.length === 0) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: user[0] };
  } catch (error) {
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function createUser(data: { name: string; email: string }) {
  try {
    if (!data.name || !data.email) {
      return { success: false, error: "Name and email are required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    const newUser = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
      })
      .returning();

    return { success: true, data: newUser[0] };
  } catch (error: any) {
    if (error?.code === "23505") {
      return { success: false, error: "Email already exists" };
    }
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string }
) {
  try {
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, error: "Invalid email format" };
      }
    }

    const updatedUser = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: updatedUser[0] };
  } catch (error: any) {
    if (error?.code === "23505") {
      return { success: false, error: "Email already exists" };
    }
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(id: number) {
  try {
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (deletedUser.length === 0) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: deletedUser[0] };
  } catch (error) {
    return { success: false, error: "Failed to delete user" };
  }
}

