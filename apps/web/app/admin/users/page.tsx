import { getUsers } from "./actions";
import { UsersTableClient } from "./components/UsersTableClient";

export default async function UsersPage() {
  const result = await getUsers();
  const users = result.success ? (result.data ?? []) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>
      <UsersTableClient initialUsers={users} />
    </div>
  );
}
