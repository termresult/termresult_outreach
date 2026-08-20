"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Upload,
  Megaphone,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BRAND, hexToRgba } from "@/lib/color";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={
              active
                ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
                : { color: "#475569" }
            }
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={
                active
                  ? {
                      backgroundColor: hexToRgba(BRAND, 0.08),
                      border: `1px solid ${hexToRgba(BRAND, 0.15)}`,
                    }
                  : { backgroundColor: "#f8fafc" }
              }
            >
              <Icon className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-100 bg-white md:flex md:flex-col">
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            TermResult
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">Outreach</p>
        </div>
        <div className="flex-1 px-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="truncate text-xs font-medium text-slate-500">{email}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/20"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  TermResult
                </p>
                <p className="text-lg font-bold text-slate-900">Outreach</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="truncate text-xs font-medium text-slate-500">{email}</p>
              <button
                type="button"
                onClick={signOut}
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 md:hidden">
          <p className="font-bold text-slate-900">Outreach</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </button>
        </header>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
