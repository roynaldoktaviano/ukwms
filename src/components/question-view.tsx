"use client";

import { Check, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Tampilan soal read-only dengan jawaban benar disorot.
 * Dipakai di: detail Block (admin), Blok Saya (ketua), Bank Soal (super admin).
 */
export function QuestionView({ q, index, actions }: { q: Question; index?: number; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-white">
          {index ?? q.nomor}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[15px] leading-relaxed text-ink">{q.pertanyaan}</p>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
          </div>
          <Badge tone="neutral" className="mt-2">{q.bidangIlmu}</Badge>

          {q.gambarSoal && (
            <div className="mt-3 inline-flex overflow-hidden rounded-lg border border-line bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.gambarSoal} alt="Gambar soal" className="max-h-44 w-auto" />
            </div>
          )}

          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {q.pilihan.map((opt) => {
              const correct = opt.label === q.jawabanBenar;
              return (
                <li key={opt.label}
                  className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                    correct ? "border-success/40 bg-success-soft" : "border-line bg-surface-2")}>
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold",
                    correct ? "bg-success text-white" : "bg-surface text-ink-soft")}>
                    {correct ? <Check className="h-3.5 w-3.5" /> : opt.label}
                  </span>
                  {opt.gambar ? (
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={opt.gambar} alt={`Pilihan ${opt.label}`} className="h-9 w-auto rounded border border-line bg-white" />
                      {opt.teks}
                    </span>
                  ) : (
                    <span className={cn(correct ? "font-medium text-ink" : "text-ink-soft")}>{opt.teks}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
