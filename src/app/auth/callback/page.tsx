"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { Button, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { persistSession } from "@/lib/auth";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const token = params.get("token") || params.get("access_token");
      const next = params.get("next") || "/dashboard";

      // Backend mengarahkan balik ke sini membawa token (atau sudah set httpOnly cookie).
      if (token) {
        document.cookie = `cbt_token=${encodeURIComponent(token)}; path=/; samesite=lax`;
      }

      try {
        const user = await api.me();
        if (!user) throw new Error("Sesi tidak valid");
        persistSession(user, token ?? undefined);
        router.replace(next);
      } catch {
        setError("Gagal memverifikasi sesi SSO. Silakan coba masuk kembali.");
      }
    })();
  }, [params, router]);

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <Wordmark subtitle={false} />
        {error ? (
          <>
            <p className="max-w-sm text-sm text-danger">{error}</p>
            <Button variant="outline" onClick={() => router.replace("/login")}>
              Kembali ke halaman masuk
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-ink-soft">
            <Spinner /> Memverifikasi sesi…
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner /></div>}>
      <CallbackInner />
    </Suspense>
  );
}
