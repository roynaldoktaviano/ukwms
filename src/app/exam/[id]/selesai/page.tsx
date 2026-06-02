"use client";

import { CheckCircle2, Home, ListChecks } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function SelesaiPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [nama, setNama] = useState<string>("");

  useEffect(() => {
    // pastikan halaman tidak lagi terkunci (jaga-jaga)
    document.body.classList.remove("exam-locked");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    api.getExam(id).then((e) => setNama(e.nama)).catch(() => {});
  }, [id]);

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="grain-bg pointer-events-none fixed inset-0" />
      <div className="relative w-full max-w-md text-center animate-fade-up">
        <div className="mb-8 flex justify-center"><Wordmark /></div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-card sm:p-10">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-11 w-11 text-success" />
          </div>

          <h1 className="font-display text-2xl text-ink">Ujian telah dikumpulkan</h1>
          {nama && <p className="mt-1 text-sm text-ink-soft">{nama}</p>}

          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
            Terima kasih, jawaban Anda sudah berhasil direkam dan dikumpulkan ke sistem.
            Anda boleh menutup halaman ini.
          </p>

          <div className="mt-7 flex flex-col gap-2">
            <Button onClick={() => router.replace("/ujian")} size="lg">
              <ListChecks className="h-4 w-4" /> Kembali ke Daftar Ujian
            </Button>
            <Button onClick={() => router.replace("/dashboard")} variant="ghost">
              <Home className="h-4 w-4" /> Ke Dashboard
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-faint">
          Hasil ujian akan tersedia pada menu <span className="font-medium text-ink-soft">Hasil Ujian</span> setelah dirilis oleh pengelola.
        </p>
      </div>
    </div>
  );
}
