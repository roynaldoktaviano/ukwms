"use client";

import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock,
  Pause,
  Play,
  Radio,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CenterSpinner, Dot, ProgressBar, Tabs } from "@/components/ui";
import { api } from "@/lib/api";
import type { Exam, LiveQuestionProgress, LiveStudentProgress } from "@/lib/types";
import { DIFFICULTY_LABEL, DIFFICULTY_TONE } from "@/lib/types";
import { cn, fmtClock } from "@/lib/utils";

const POLL_MS = 4000;

export default function MonitorPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [tab, setTab] = useState<"mahasiswa" | "soal">("mahasiswa");
  const [students, setStudents] = useState<LiveStudentProgress[] | null>(null);
  const [questions, setQuestions] = useState<LiveQuestionProgress[] | null>(null);
  const [live, setLive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const [s, q] = await Promise.all([api.liveStudents(id), api.liveQuestions(id)]);
    setStudents(s);
    setQuestions(q);
    setUpdatedAt(new Date());
  }, [id]);

  useEffect(() => {
    api.getExam(id).then(setExam);
    poll();
  }, [id, poll]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (live) timer.current = setInterval(poll, POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [live, poll]);

  if (!exam || !students || !questions) {
    return (
      <div className="animate-fade-up space-y-6">
        <Link href="/kelola-ujian" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        <CenterSpinner label="Memuat data monitoring…" />
      </div>
    );
  }

  const mengerjakan = students.filter((s) => s.status === "in_progress").length;
  const selesai = students.filter((s) => s.status === "submitted").length;
  const belum = students.filter((s) => s.status === "not_started").length;
  const rataProgres = Math.round(students.reduce((a, s) => a + s.persen, 0) / (students.length || 1));
  const rataEstimasi = (() => {
    const aktif = students.filter((s) => s.dikerjakan > 0);
    return aktif.length ? Math.round(aktif.reduce((a, s) => a + s.estimasiNilai, 0) / aktif.length) : 0;
  })();

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/kelola-ujian" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Ujian</Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {exam.status === "IN_PROGRESS"
              ? <Badge tone="success"><Dot tone="success" pulse /> Berlangsung</Badge>
              : <Badge tone="neutral">{exam.status === "FINISHED" ? "Selesai" : exam.status}</Badge>}
            <Badge tone="neutral">{exam.blockNama}</Badge>
            {exam.departmentNama && <Badge tone="accent">{exam.departmentNama}</Badge>}
          </div>
          <h1 className="font-display text-2xl text-ink sm:text-[28px]">{exam.nama}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            {live && <Dot tone="success" pulse />}
            {updatedAt ? `Diperbarui ${updatedAt.toLocaleTimeString("id-ID")}` : "—"}
          </span>
          <Button size="sm" variant="outline" onClick={() => setLive((v) => !v)}>
            {live ? <><Pause className="h-4 w-4" /> Jeda</> : <><Play className="h-4 w-4" /> Lanjut</>}
          </Button>
        </div>
      </div>

      {/* ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Users} label="Peserta" value={students.length} tone="primary" />
        <Stat icon={Radio} label="Mengerjakan" value={mengerjakan} tone="warn" />
        <Stat icon={CheckCircle2} label="Selesai" value={selesai} tone="success" />
        <Stat icon={CircleDashed} label="Belum mulai" value={belum} tone="neutral" />
        <Stat icon={TrendingUp} label="Estimasi rata²" value={rataEstimasi} tone="accent" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1"><ProgressBar value={rataProgres} /></div>
        <span className="text-sm font-medium text-ink">{rataProgres}% rata-rata progres</span>
      </div>

      <Tabs
        tabs={[{ id: "mahasiswa", label: "Per Mahasiswa", count: students.length }, { id: "soal", label: "Per Soal", count: questions.length }]}
        value={tab}
        onChange={setTab}
      />

      {tab === "mahasiswa"
        ? <PerMahasiswa rows={students} kkm={exam.nilaiMinimum} />
        : <PerSoal rows={questions} peserta={students.length} />}
    </div>
  );
}

function PerMahasiswa({ rows, kkm }: { rows: LiveStudentProgress[]; kkm: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-medium">Mahasiswa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="min-w-[140px] px-4 py-3 font-medium">Progres</th>
              <th className="px-4 py-3 text-center font-medium">B / S</th>
              <th className="px-4 py-3 text-center font-medium">Estimasi</th>
              <th className="px-4 py-3 text-right font-medium">Sisa waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.studentId} className="hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{r.nama}</p>
                  <p className="text-xs text-ink-soft">{r.nrp}</p>
                </td>
                <td className="px-4 py-3">
                  {r.status === "submitted" ? <Badge tone="success">Selesai</Badge>
                    : r.status === "in_progress" ? <Badge tone="warn"><Dot tone="warn" pulse /> Mengerjakan</Badge>
                    : <Badge tone="neutral">Belum mulai</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.persen} className="w-24" tone={r.status === "submitted" ? "success" : "primary"} />
                    <span className="text-xs text-ink-soft">{r.dikerjakan}/{r.total}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-success">{r.benar}</span> <span className="text-ink-faint">/</span> <span className="text-danger">{r.salah}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.dikerjakan > 0 ? (
                    <span className={cn("font-medium", r.estimasiNilai >= kkm ? "text-success" : "text-danger")}>{r.estimasiNilai}</span>
                  ) : <span className="text-ink-faint">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "in_progress" && r.sisaDetik != null ? (
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft"><Clock className="h-3.5 w-3.5" /> {fmtClock(r.sisaDetik)}</span>
                  ) : <span className="text-ink-faint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PerSoal({ rows, peserta }: { rows: LiveQuestionProgress[]; peserta: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => {
        const total = peserta || 1;
        const benarPct = (r.benar / total) * 100;
        const salahPct = (r.salah / total) * 100;
        const belumPct = (r.belum / total) * 100;
        return (
          <Card key={r.questionId} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-white">{r.nomor}</span>
                <Badge tone="neutral">{r.departmentNama}</Badge>
                <Badge tone={DIFFICULTY_TONE[r.difficulty]}>{DIFFICULTY_LABEL[r.difficulty]}</Badge>
              </div>
              <span className="text-xs text-ink-soft">{r.totalMengerjakan}/{peserta} mengerjakan</span>
            </div>

            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div className="bg-success transition-all" style={{ width: `${benarPct}%` }} />
              <div className="bg-danger transition-all" style={{ width: `${salahPct}%` }} />
              <div className="bg-line transition-all" style={{ width: `${belumPct}%` }} />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-soft"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {r.benar} benar</span>
              <span className="inline-flex items-center gap-1.5 text-ink-soft"><XCircle className="h-3.5 w-3.5 text-danger" /> {r.salah} salah</span>
              <span className="inline-flex items-center gap-1.5 text-ink-soft"><CircleDashed className="h-3.5 w-3.5 text-ink-faint" /> {r.belum} belum</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
  tone: "primary" | "accent" | "success" | "warn" | "neutral";
}) {
  const t = {
    primary: "bg-primary-soft text-primary", accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success", warn: "bg-warn-soft text-warn", neutral: "bg-surface-2 text-ink-soft",
  }[tone];
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t)}><Icon className="h-5 w-5" /></span>
      <div>
        <p className="font-display text-2xl text-ink">{value}</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </Card>
  );
}
