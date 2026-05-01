"use client";

import { LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "../../../lib/utils";

const NAV_ITEMS = [
  { title: "Metadata", href: "/admin/metadata", icon: Settings },
  { title: "Users", href: "/admin/users", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();

  function signOut() {
    start(async () => {
      await fetch("/api/admin/session", { method: "DELETE" });
      router.replace("/admin/sign-in");
      router.refresh();
    });
  }

  return (
    <nav className="flex w-64 flex-col border-r bg-muted/40 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>
      <ul className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <LogOut className="h-5 w-5" />
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </nav>
  );
}
