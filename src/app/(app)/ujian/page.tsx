"use client";

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  FlaskConical,
  Hash,
  Layers,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, CenterSpinner, Dot, EmptyState } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { Exam, ResultSummary, Student } from "@/lib/types";
import { EXAM_TYPE_LABEL } from "@/lib/types";
import { fmtDuration } from "@/lib/utils";

export default function UjianPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [results, setResults] = useState<Record<string, ResultSummary>>({});

  const student = user as Student | null;

  useEffect(() => {
    if (!student) return;
    api.listExams().then((all) => setExams(all.filter((e) => e.pesertaIds.includes(student.id))));
    api.resultsForStudent(student.id).then((rs) => {
      const map: Record<string, ResultSummary> = {};
      rs.forEach((r) => (map[r.examId] = r));
      setResults(map);
    });
  }, [student]);

  if (!student) return null;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Ujian Saya" desc="Daftar ujian yang ditugaskan. Soal akan diacak otomatis saat ujian dimulai." />

      {/* Kartu identitas */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-gradient-to-r from-primary to-[#0a3a34] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 font-display text-lg">
              {student.nama.split(" ").slice(0, 2).map((p) => p[0]).join("")}
            </span>
            <div>
              <p className="font-display text-xl leading-tight">{student.nama}</p>
              <p className="text-sm text-white/70">Mahasiswa Fakultas Kedokteran</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-x-8 gap-y-2">
            <Meta icon={Hash} label="NRP" value={student.nrp} />
            <Meta icon={Layers} label="Semester" value={`Semester ${student.semester}`} />
          </div>
        </div>
      </Card>

      {!exams ? (
        <CenterSpinner label="Memuat daftar ujian…" />
      ) : exams.length === 0 ? (
        <EmptyState icon={<CalendarClock className="h-8 w-8" />} title="Belum ada ujian" desc="Saat ini belum ada ujian yang ditugaskan kepada Anda." />
      ) : (
        <div className="grid gap-4">
          {exams.map((e) => {
            const r = results[e.id];
            const done = r && r.status !== "Belum Dikerjakan";
            const canStart = e.status === "IN_PROGRESS" && !done;
            return (
              <Card key={e.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={e.status} done={!!done} />
                      <Badge tone="neutral">
                        {e.examType === "PRACTICUM" ? <FlaskConical className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                        {EXAM_TYPE_LABEL[e.examType]}
                      </Badge>
                    </div>
                    <h3 className="font-display text-lg text-ink">{e.nama}</h3>
                    <p className="text-sm text-ink-soft">
                      {e.blockNama}{e.departmentNama && ` · ${e.departmentNama}`}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink-soft">
                      <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-ink-faint" /> {e.jumlahSoal} soal acak</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-ink-faint" /> {fmtDuration(e.durasiMenit)}</span>
                      <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-ink-faint" /> KKM {e.nilaiMinimum}</span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                    {done ? (
                      <Badge tone="success"><CheckCircle2 className="h-3.5 w-3.5" /> Sudah dikerjakan</Badge>
                    ) : canStart ? (
                      <Button onClick={() => router.push(`/exam/${e.id}`)} className="w-full sm:w-auto">
                        <PlayCircle className="h-4 w-4" /> Mulai Ujian
                      </Button>
                    ) : e.status === "READY" ? (
                      <Button variant="outline" disabled className="w-full sm:w-auto">Menunggu dibuka</Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full sm:w-auto">Belum tersedia</Button>
                    )}
                    {canStart && (
                      <p className="flex items-center gap-1 text-xs text-ink-faint">
                        <ShieldCheck className="h-3.5 w-3.5" /> Mode layar penuh
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-5 w-5 text-white/60" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-white/55">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, done }: { status: Exam["status"]; done: boolean }) {
  if (done) return <Badge tone="success">Selesai</Badge>;
  if (status === "IN_PROGRESS") return <Badge tone="success"><Dot tone="success" pulse /> Berlangsung</Badge>;
  if (status === "READY") return <Badge tone="primary">Siap</Badge>;
  if (status === "FINISHED") return <Badge tone="neutral">Berakhir</Badge>;
  return <Badge tone="neutral">Draf</Badge>;
}
