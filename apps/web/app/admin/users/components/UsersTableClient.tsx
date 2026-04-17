"use client";

import { useState, useEffect } from "react";
import { getUsers } from "../actions";
import { UsersTable } from "./UsersTable";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

interface UsersTableClientProps {
  initialUsers: User[];
}

export function UsersTableClient({ initialUsers }: UsersTableClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data ?? []);
      }
    } catch (error) {
      console.error("Failed to refresh users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return <UsersTable users={users} onUserUpdated={refreshUsers} />;
}
