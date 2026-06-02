"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Wordmark } from "@/components/brand";
import { Avatar, Button, Spinner } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { demoAccounts } from "@/lib/mock-data";
import { ROLE_LABEL } from "@/lib/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

function LoginInner() {
  const { user, loading, devLogin, startSSO } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function loginAs(id: string) {
    setBusyId(id);
    try {
      await devLogin(id);
      router.replace(next);
    } finally {
      setBusyId(null);
    }
  }

  if (loading || user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel kiri — foto gedung */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/gedung2.webp"
          alt="Gedung Universitas Katolik Widya Mandala Surabaya"
          fill
          className="object-cover object-center"
          priority
        />
        {/* overlay gradient bawah */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* logo pojok kanan bawah */}
        <div className="absolute bottom-8 right-8 z-10">
          <Image
            src="/logo_gambar.png"
            alt="Logo Widya Mandala"
            width={72}
            height={72}
            className="drop-shadow-xl"
          />
        </div>
      </div>

      {/* Panel kanan — login */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <h2 className="font-display text-3xl text-ink">Masuk</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Gunakan akun Single Sign-On (SSO) universitas Anda untuk melanjutkan.
          </p>

          <Button size="lg" className="mt-7 w-full" onClick={startSSO} disabled={USE_MOCK}>
            <KeyRound className="h-[18px] w-[18px]" />
            Masuk dengan SSO
          </Button>

          {USE_MOCK && (
            <>
              <div className="my-7 flex items-center gap-3 text-xs text-ink-faint">
                <span className="h-px flex-1 bg-line" />
                MODE DEMO — pilih peran
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="space-y-2">
                {demoAccounts.map(({ user: u, subtitle }) => (
                  <button
                    key={u.id}
                    onClick={() => loginAs(u.id)}
                    disabled={!!busyId}
                    className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition-all hover:border-primary hover:shadow-card disabled:opacity-60"
                  >
                    <Avatar name={u.nama} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{u.nama}</p>
                      <p className="truncate text-xs text-ink-soft">
                        <span className="text-primary">{ROLE_LABEL[u.role]}</span> · {subtitle}
                      </p>
                    </div>
                    {busyId === u.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-ink-faint">
                Tombol SSO aktif saat <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_USE_MOCK=false</code> &amp; backend tersambung.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
