"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  HeartHandshake,
  MessageSquare,
  BookOpen,
  Newspaper,
  Tag,
  Users,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface AdminNavProps {
  counts?: {
    merchants?: number;
    donations?: number;
    feedback?: number;
    docs?: number;
  };
}

export function AdminNav({ counts }: AdminNavProps) {
  const pathname = usePathname();

  const NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Merchants", href: "/admin/merchants", icon: Store, badge: counts?.merchants },
    { label: "Donations", href: "/admin/donations", icon: HeartHandshake, badge: counts?.donations ?? "—" },
    { label: "Feedback", href: "/admin/feedback", icon: MessageSquare, badge: counts?.feedback ?? "—" },
    { label: "Docs", href: "/admin/docs", icon: BookOpen, badge: counts?.docs },
    { label: "Blog", href: "/admin/blog", icon: Newspaper },
    { label: "Releases", href: "/admin/releases", icon: Tag },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Audit", href: "/admin/audit", icon: ShieldCheck },
  ];

  return (
    <aside className="border-hairline bg-surface/60 flex w-56 flex-col border-r">
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "border-azure bg-surface-elevated text-text-primary border-l-2 pl-2.5 font-semibold"
                  : "text-text-muted hover:bg-surface-elevated/50 hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? "text-azure" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-canvas text-text-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-hairline text-text-muted border-t p-3 font-mono text-[11px]">
        <div>Cloudflare D1 + KV</div>
        <div className="text-text-muted/70 text-[10px]">Edge Engine 2026</div>
      </div>
    </aside>
  );
}
