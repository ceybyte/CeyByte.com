"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  MessageSquare,
  HeartHandshake,
  Settings,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { LogoSlash } from "@/components/brand/logo-slash";
import { toast } from "sonner";

interface DashboardNavProps {
  locale: string;
}

export function DashboardNav({ locale }: DashboardNavProps) {
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
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/60 backdrop-blur-sm min-h-[calc(100vh-var(--header-h))]">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href={`/${locale}`} className="inline-block">
            <LogoSlash className="h-5 w-auto" />
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
            Merchant
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-secondary text-foreground border-l-2 border-cyan-400 font-semibold pl-2.5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Scrollable Tab Nav */}
      <div className="md:hidden border-b border-border bg-card overflow-x-auto flex items-center px-2 py-1 gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded text-xs font-medium transition ${
                isActive
                  ? "bg-secondary text-foreground border-b-2 border-cyan-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
