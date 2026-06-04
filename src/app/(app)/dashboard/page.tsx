"use client";

import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  GraduationCap,
  Radio,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, CenterSpinner, Dot } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { Block, Department, Employee, Exam, ResultSummary, Student, User } from "@/lib/types";
import { cn, fmtDuration } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={`${greet()}, ${firstName(user.nama)}`}
        desc="Ringkasan aktivitas Computer-Based Test Anda."
      />
      {user.role === "student" && <StudentHome student={user as Student} />}
      {user.role === "BLOCK_COORDINATOR" && <CoordinatorHome user={user as Employee} type="block" />}
      {user.role === "DEPT_COORDINATOR" && <CoordinatorHome user={user as Employee} type="dept" />}
      {(user.role === "ADMIN" || user.role === "EXAM_MANAGER" || user.role === "QUESTION_MANAGER" || user.role === "QUESTION_REVIEWER" || user.role === "ANALYTICS_VIEWER") && (
        <StaffHome user={user as Employee} />
      )}
    </div>
  );
}

// ----------------------------- shared -----------------------------
function StatCard({ icon: Icon, label, value, hint, tone = "primary" }: {
  icon: React.ElementType; label: string; value: React.ReactNode; hint?: string; tone?: "primary" | "accent" | "success" | "warn";
}) {
  const t = { primary: "bg-primary-soft text-primary", accent: "bg-accent-soft text-accent", success: "bg-success-soft text-success", warn: "bg-warn-soft text-warn" }[tone];
  return (
    <Card className="p-5">
      <div className={cn("mb-4 grid h-10 w-10 place-items-center rounded-xl", t)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </Card>
  );
}

// ----------------------------- mahasiswa -----------------------------
function StudentHome({ student }: { student: Student }) {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [results, setResults] = useState<ResultSummary[]>([]);

  useEffect(() => {
    api.listExams().then((all) => setExams(all.filter((e) => e.pesertaIds.includes(student.id))));
    api.resultsForStudent(student.id).then(setResults);
  }, [student.id]);

  if (!exams) return <CenterSpinner />;
  const upcoming = exams.filter((e) => e.status === "READY" || e.status === "IN_PROGRESS");
  const released = results.filter((r) => r.dirilis && r.nilai != null);
  const avg = released.length ? Math.round(released.reduce((s, r) => s + (r.nilai ?? 0), 0) / released.length) : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarClock} label="Ujian mendatang" value={upcoming.length} tone="accent" />
        <StatCard icon={CheckCircle2} label="Ujian selesai" value={results.filter((r) => r.status !== "Belum Dikerjakan").length} tone="success" />
        <StatCard icon={GraduationCap} label="Rata-rata nilai dirilis" value={avg ?? "—"} hint={released.length ? `dari ${released.length} ujian` : "belum ada nilai dirilis"} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg text-ink">Ujian aktif & mendatang</h2>
          <Link href="/ujian"><Button variant="ghost" size="sm">Lihat semua <ArrowUpRight className="h-4 w-4" /></Button></Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">Tidak ada ujian yang dijadwalkan.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{e.nama}</p>
                  <p className="text-sm text-ink-soft">{e.blockNama} · {e.jumlahSoal} soal · {fmtDuration(e.durasiMenit)}</p>
                </div>
                {e.status === "IN_PROGRESS" ? (
                  <><Badge tone="success"><Dot tone="success" pulse /> Sedang berlangsung</Badge>
                    <Link href="/ujian"><Button size="sm">Kerjakan</Button></Link></>
                ) : (
                  <Badge tone="neutral">Siap</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

// ----------------------------- koordinator block / departemen -----------------------------
function CoordinatorHome({ user, type }: { user: Employee; type: "block" | "dept" }) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [depts, setDepts] = useState<Department[] | null>(null);
  const myBlockIds = user.coordinatedBlockIds ?? [];
  const myDeptIds = user.coordinatedDepartmentIds ?? [];

  useEffect(() => {
    if (type === "block") {
      api.listBlocks().then((all) => setBlocks(all.filter((b) => myBlockIds.includes(b.id))));
    } else {
      api.listDepartments().then((all) => setDepts(all.filter((d) => myDeptIds.includes(d.id))));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (type === "block") {
    if (!blocks) return <CenterSpinner />;
    const totalSoal = blocks.reduce((s, b) => s + b.jumlahSoal, 0);
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={BookOpen} label="Block diampu" value={blocks.length} />
          <StatCard icon={Database} label="Total soal di bank" value={totalSoal} tone="accent" />
          <StatCard icon={ClipboardList} label="Role" value="Koordinator Block" tone="success" />
        </div>
        <Card className="p-6 text-center">
          <p className="text-sm text-ink-soft">Tinjau soal dan nilai mahasiswa pada block yang Anda koordinasi.</p>
          <Link href="/blok-saya"><Button className="mt-4">Buka Blok Saya <ArrowUpRight className="h-4 w-4" /></Button></Link>
        </Card>
      </>
    );
  }

  if (!depts) return <CenterSpinner />;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Database} label="Departemen diampu" value={depts.length} />
        <StatCard icon={ClipboardList} label="Role" value="Koordinator Departemen" tone="accent" />
      </div>
      <Card className="p-6 text-center">
        <p className="text-sm text-ink-soft">Tinjau soal di bank soal untuk departemen yang Anda koordinasi.</p>
        <Link href="/dept-saya"><Button className="mt-4">Buka Departemen Saya <ArrowUpRight className="h-4 w-4" /></Button></Link>
      </Card>
    </>
  );
}

// ----------------------------- staf CBT -----------------------------
function StaffHome({ user }: { user: Employee }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const canManageExam = user.role === "ADMIN" || user.role === "EXAM_MANAGER";
  const canManageQuestion = user.role === "ADMIN" || user.role === "QUESTION_MANAGER";
  const canAnalytics = user.role === "ADMIN" || user.role === "ANALYTICS_VIEWER";

  useEffect(() => {
    if (canManageExam) {
      api.listBlocks().then(setBlocks);
      api.listExams().then(setExams);
      api.listStudents().then(setStudents);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ongoing = (exams ?? []).filter((e) => e.status === "IN_PROGRESS");

  return (
    <>
      {canManageExam && (
        <>
          {!exams ? <CenterSpinner /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={BookOpen} label="Block ujian" value={blocks.length} />
              <StatCard icon={ClipboardList} label="Total ujian" value={exams.length} tone="accent" />
              <StatCard icon={Radio} label="Sedang berlangsung" value={ongoing.length} tone="warn" />
              <StatCard icon={Users} label="Mahasiswa" value={students.length} tone="success" />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="overflow-hidden lg:col-span-3">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-lg text-ink">Pantau ujian berlangsung</h2>
                <Link href="/kelola-ujian"><Button variant="ghost" size="sm">Kelola ujian <ArrowUpRight className="h-4 w-4" /></Button></Link>
              </div>
              {ongoing.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-soft">Belum ada ujian yang berlangsung.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {ongoing.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-4">
                      <Dot tone="success" pulse />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{e.nama}</p>
                        <p className="text-sm text-ink-soft">{e.pesertaIds.length} peserta · {e.examType}</p>
                      </div>
                      <Link href={`/kelola-ujian/${e.id}/monitor`}><Button size="sm" variant="subtle"><Radio className="h-4 w-4" /> Monitor</Button></Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h2 className="font-display text-lg text-ink">Aksi cepat</h2>
              <div className="mt-4 space-y-2">
                {canManageExam && <>
                  <QuickLink href="/blocks" icon={BookOpen} label="Kelola Block Ujian" />
                  <QuickLink href="/kelola-ujian" icon={ClipboardList} label="Buat / kelola ujian" />
                  <QuickLink href="/periode" icon={CalendarClock} label="Atur periode akademik" />
                </>}
                {canManageQuestion && <QuickLink href="/bank-soal" icon={Database} label="Kelola Bank Soal" />}
                {canAnalytics && <QuickLink href="/analitik" icon={BarChart3} label="Lihat analitik ujian" />}
                {user.role === "ADMIN" && <QuickLink href="/pengguna" icon={Users} label="Manajemen pengguna" />}
              </div>
            </Card>
          </div>
        </>
      )}

      {!canManageExam && (
        <div className="grid gap-4 sm:grid-cols-2">
          {canManageQuestion && (
            <Card className="p-6">
              <Database className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-display text-lg text-ink">Bank Soal</h3>
              <p className="mt-1 text-sm text-ink-soft">Kelola soal ujian: tambah, edit, dan tinjau soal per departemen.</p>
              <Link href="/bank-soal"><Button className="mt-4">Buka Bank Soal <ArrowUpRight className="h-4 w-4" /></Button></Link>
            </Card>
          )}
          {canAnalytics && (
            <Card className="p-6">
              <BarChart3 className="mb-3 h-8 w-8 text-accent" />
              <h3 className="font-display text-lg text-ink">Analitik</h3>
              <p className="mt-1 text-sm text-ink-soft">Tinjau statistik ujian, performa mahasiswa, dan analisis soal.</p>
              <Link href="/analitik"><Button variant="outline" className="mt-4">Buka Analitik <ArrowUpRight className="h-4 w-4" /></Button></Link>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 transition-all hover:border-primary hover:bg-surface-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-[18px] w-[18px]" /></span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-ink-faint group-hover:text-primary" />
    </Link>
  );
}

// ----------------------------- helpers -----------------------------
function greet() {
  const h = new Date().getHours();
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
}
function firstName(n: string) {
  const parts = n.replace(/^dr\.\s*/i, "").split(" ");
  return parts[0];
}
