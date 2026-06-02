"use client";

import {
  BookOpen,
  CalendarRange,
  ClipboardList,
  Database,
  FileStack,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand";
import { Avatar, Badge } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: Role[] };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "ketua_block", "admin", "super_admin"] },
  { href: "/ujian", label: "Ujian Saya", icon: ClipboardList, roles: ["student"] },
  { href: "/hasil-ujian", label: "Hasil Ujian", icon: GraduationCap, roles: ["student"] },
  { href: "/blok-saya", label: "Blok Saya", icon: BookOpen, roles: ["ketua_block"] },
  { href: "/blocks", label: "Block Ujian", icon: BookOpen, roles: ["admin", "super_admin"] },
  { href: "/kelola-ujian", label: "Kelola Ujian", icon: ClipboardList, roles: ["admin", "super_admin"] },
  { href: "/periode", label: "Periode", icon: CalendarRange, roles: ["admin", "super_admin"] },
  { href: "/bank-soal", label: "Bank Soal", icon: Database, roles: ["super_admin"] },
  { href: "/pengguna", label: "Pengguna", icon: Users, roles: ["super_admin"] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<string | null>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    api.listPeriods().then((ps) => {
      const a = ps.find((p) => p.status === "active");
      setActivePeriod(a ? `${a.nama} ${a.tahun}` : null);
    });
  }, []);

  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  const sidebar = (
    <div className="flex h-full flex-col bg-nav text-nav-text">
      <div className="flex h-16 items-center justify-between px-5">
        <Wordmark dark />
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-nav-muted hover:bg-white/10 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-nav-text" : "text-nav-muted hover:bg-white/5 hover:text-nav-text",
              )}>
              <it.icon className={cn("h-[18px] w-[18px]", active ? "text-accent" : "")} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-nav-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.nama} className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-nav-text">{user.nama}</p>
            <p className="truncate text-xs text-nav-muted">{ROLE_LABEL[user.role]}</p>
          </div>
          <button onClick={logout} title="Keluar" className="rounded-lg p-2 text-nav-muted hover:bg-white/10 hover:text-nav-text">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grain-bg min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 shadow-pop animate-fade-in">{sidebar}</div>
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-soft hover:bg-black/5 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <FileStack className="hidden h-4 w-4 text-ink-faint sm:block" />
          <p className="hidden text-sm text-ink-soft sm:block">
            Computer-Based Test · <span className="text-ink">{ROLE_LABEL[user.role]}</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            {activePeriod ? (
              <Badge tone="primary"><CalendarRange className="h-3.5 w-3.5" /> Periode {activePeriod}</Badge>
            ) : (
              <Badge tone="warn">Belum ada periode aktif</Badge>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

// Header section helper untuk konsistensi judul halaman
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-[28px]">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-soft">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
