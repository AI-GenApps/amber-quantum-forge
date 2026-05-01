import { getAdminSession } from "../../lib/admin-session";
import { Toaster } from "../components/ui/sonner";
import { AdminNav } from "./components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Without a session, render bare children (only the sign-in page is reachable
  // unauthenticated — proxy.ts gates everything else under /admin/**).
  const session = await getAdminSession();
  if (!session) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8">{children}</main>
      <Toaster richColors />
    </div>
  );
}
