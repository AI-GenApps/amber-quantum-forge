"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings } from "lucide-react";
import { cn } from "../../../lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "App Config",
      href: "/admin/app-config",
      icon: Settings,
    },
  ];

  return (
    <nav className="w-64 border-r bg-muted/40 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
