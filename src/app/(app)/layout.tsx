"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { CenterSpinner } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center"><CenterSpinner label="Memuat…" /></div>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
