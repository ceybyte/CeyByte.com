"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, MessageSquare, HeartHandshake, Settings, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { MerchantListing } from "../types";
import { toast } from "sonner";

interface DashboardNavProps {
  locale: string;
  listing?: MerchantListing | null;
}

export function DashboardNav({ locale, listing }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = [
    { label: "Overview", href: `/${locale}/dashboard`, exact: true, icon: LayoutDashboard },
    { label: "My listing", href: `/${locale}/dashboard/listing`, icon: Store },
    { label: "My tickets", href: `/${locale}/dashboard/tickets`, icon: MessageSquare },
    { label: "My donations", href: `/${locale}/dashboard/donations`, icon: HeartHandshake },
    { label: "Settings", href: `/${locale}/dashboard/settings`, icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out");
      router.push(`/${locale}/login`);
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      {/* Desktop Left Nav */}
      <aside className="border-border bg-card/60 hidden min-h-[calc(100vh-var(--header-h))] w-64 flex-col border-r backdrop-blur-sm md:flex">
        <div className="border-border/80 border-b p-3">
          <div className="border-border bg-card/70 rounded-xl border p-3 shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span
                className="text-muted-foreground max-w-[130px] truncate font-mono text-[10px] tracking-widest uppercase"
                title={listing?.shopName ?? "Ceylon Byte"}
              >
                {listing?.shopName ?? "Ceylon Byte"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                {listing ? "Linked" : "Active"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Store className="size-3.5" aria-hidden="true" />
              </div>
              <span className="text-foreground text-xs font-semibold tracking-tight">Merchant Portal</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-secondary text-foreground border-l-2 border-cyan-400 pl-2.5 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-border border-t p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-xs transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Scrollable Tab Nav */}
      <div className="border-border bg-card flex items-center gap-1 overflow-x-auto border-b px-2 py-1 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-secondary text-foreground border-b-2 border-cyan-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
