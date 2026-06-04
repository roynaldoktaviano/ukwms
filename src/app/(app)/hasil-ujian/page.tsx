"use client";

import {
  Award,
  CheckCircle2,
  FlaskConical,
  FileText,
  GraduationCap,
  Lock,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Card, CenterSpinner, EmptyState } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { ResultSummary, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HasilUjianPage() {
  const { user } = useAuth();
  const student = user as Student | null;
  const [results, setResults] = useState<ResultSummary[] | null>(null);

  useEffect(() => {
    if (student) api.resultsForStudent(student.id).then(setResults);
  }, [student]);

  if (!student) return null;

  const released = (results ?? []).filter((r) => r.dirilis && r.nilai != null);
  const avg = released.length ? Math.round(released.reduce((s, r) => s + (r.nilai ?? 0), 0) / released.length) : null;
  const lulus = released.filter((r) => r.lulus).length;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Hasil Ujian" desc="Nilai ditampilkan hanya untuk ujian yang telah dirilis oleh pengelola." />

      {!results ? (
        <CenterSpinner label="Memuat hasil…" />
      ) : results.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-8 w-8" />} title="Belum ada riwayat ujian" desc="Hasil ujian Anda akan muncul di sini." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary icon={Award} label="Rata-rata nilai" value={avg ?? "—"} hint={released.length ? `${released.length} ujian dirilis` : "belum ada yang dirilis"} tone="primary" />
            <Summary icon={CheckCircle2} label="Lulus KKM" value={released.length ? `${lulus}/${released.length}` : "—"} tone="success" />
            <Summary icon={Lock} label="Menunggu rilis" value={results.filter((r) => r.status === "Belum Dirilis").length} tone="warn" />
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Riwayat & Nilai</h2>
            </div>
            <ul className="divide-y divide-line">
              {results.map((r) => (
                <li key={r.examId} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    r.examType === "PRACTICUM" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary")}>
                    {r.examType === "PRACTICUM" ? <FlaskConical className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{r.examNama}</p>
                    <p className="text-sm text-ink-soft">
                      {r.blockNama} · {r.examType === "PRACTICUM" ? "Praktikum" : "Block"} · KKM {r.kkm}
                      {r.tanggal && ` · ${new Date(r.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  </div>

                  <ResultValue r={r} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function ResultValue({ r }: { r: ResultSummary }) {
  if (r.status === "Belum Dikerjakan") {
    return <Badge tone="neutral">Belum dikerjakan</Badge>;
  }
  if (!r.dirilis || r.nilai == null) {
    return (
      <div className="text-right">
        <Badge tone="warn"><Lock className="h-3.5 w-3.5" /> Belum dirilis</Badge>
        <p className="mt-1 text-xs text-ink-faint">menunggu pengelola</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className={cn("font-display text-3xl leading-none", r.lulus ? "text-success" : "text-danger")}>{r.nilai}</p>
        <p className="mt-1 text-xs text-ink-faint">dari 100</p>
      </div>
      {r.lulus
        ? <Badge tone="success"><CheckCircle2 className="h-3.5 w-3.5" /> Lulus</Badge>
        : <Badge tone="danger"><XCircle className="h-3.5 w-3.5" /> Tidak Lulus</Badge>}
    </div>
  );
}

function Summary({ icon: Icon, label, value, hint, tone }: {
  icon: React.ElementType; label: string; value: React.ReactNode; hint?: string; tone: "primary" | "success" | "warn";
}) {
  const t = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warn: "bg-warn-soft text-warn" }[tone];
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", t)}><Icon className="h-6 w-6" /></span>
      <div>
        <p className="font-display text-2xl text-ink">{value}</p>
        <p className="text-sm text-ink-soft">{label}</p>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
    </Card>
  );
}
