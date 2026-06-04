"use client";

import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Layers,
  Monitor,
  Play,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import {
  Badge, Button, Card, CenterSpinner, Checkbox, Dot, EmptyState, Field, Input, Modal, Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import type {
  AssignmentType, Block, Department, Employee, Exam, ExamAssignment, ExamType, Period, Student,
} from "@/lib/types";
import { ASSIGNMENT_LABEL, EXAM_TYPE_LABEL } from "@/lib/types";
import { cn, fmtDuration } from "@/lib/utils";

export default function KelolaUjianPage() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [open, setOpen] = useState(false);
  const [busyToggle, setBusyToggle] = useState<string | null>(null);

  function load() { api.listExams().then(setExams); }
  useEffect(() => {
    load();
    api.listBlocks().then(setBlocks);
    api.listDepartments().then(setDepartments);
    api.listStudents().then(setStudents);
    api.listEmployees().then(setEmployees);
    api.listPeriods().then((ps) => setActivePeriod(ps.find((p) => p.status === "active") ?? null));
  }, []);

  async function toggleHasil(e: Exam) {
    setBusyToggle(e.id);
    try { await api.setLihatHasil(e.id, !e.lihatHasil); load(); }
    finally { setBusyToggle(null); }
  }

  async function startExam(e: Exam) {
    await api.updateExamStatus(e.id, "IN_PROGRESS");
    load();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Kelola Ujian"
        desc="Buat ujian, tetapkan peserta, pengawas & IT support, lalu pantau dan rilis nilai."
        actions={<Button onClick={() => setOpen(true)} disabled={!activePeriod}><Plus className="h-4 w-4" /> Buat Ujian</Button>}
      />

      {!activePeriod && (
        <div className="flex items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-ink">
          <CalendarClock className="h-4 w-4 text-warn" /> Belum ada periode aktif.{" "}
          <Link href="/periode" className="font-medium text-primary underline">Aktifkan periode</Link> sebelum membuat ujian.
        </div>
      )}

      {!exams ? (
        <CenterSpinner label="Memuat ujian…" />
      ) : exams.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="Belum ada ujian"
          desc="Buat ujian pertama untuk block yang sudah tersedia."
          action={<Button onClick={() => setOpen(true)} disabled={!activePeriod}><Plus className="h-4 w-4" /> Buat Ujian</Button>} />
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.status} />
                    <Badge tone="neutral">
                      {e.examType === "PRACTICUM" ? <FlaskConical className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                      {EXAM_TYPE_LABEL[e.examType]}
                    </Badge>
                  </div>
                  <h3 className="font-display text-lg text-ink">{e.nama}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
                    <span>{e.blockNama}{e.departmentNama && ` · ${e.departmentNama}`}</span>
                    <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-ink-faint" /> {e.jumlahSoal} soal</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-ink-faint" /> {fmtDuration(e.durasiMenit)}</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-ink-faint" /> KKM {e.nilaiMinimum}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-ink-faint" /> {e.pesertaIds.length} peserta</span>
                    {e.assignments.filter((a) => a.type === "PROCTOR").length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-ink-faint" />
                        {e.assignments.filter((a) => a.type === "PROCTOR").map((a) => a.employeeNama).join(", ")}
                      </span>
                    )}
                    {e.assignments.filter((a) => a.type === "IT_SUPPORT").length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Wifi className="h-4 w-4 text-ink-faint" />
                        {e.assignments.filter((a) => a.type === "IT_SUPPORT").map((a) => a.employeeNama).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    {e.status === "READY" && (
                      <Button size="sm" variant="subtle" onClick={() => startExam(e)}>
                        <Play className="h-4 w-4" /> Mulai Ujian
                      </Button>
                    )}
                    {e.status === "IN_PROGRESS" && (
                      <Link href={`/kelola-ujian/${e.id}/monitor`}>
                        <Button size="sm" variant="subtle"><Radio className="h-4 w-4" /> Monitor</Button>
                      </Link>
                    )}
                    {e.status === "FINISHED" && (
                      <Link href={`/kelola-ujian/${e.id}/monitor`}>
                        <Button size="sm" variant="outline"><Monitor className="h-4 w-4" /> Lihat Hasil</Button>
                      </Link>
                    )}
                  </div>

                  {(e.status === "FINISHED" || e.status === "IN_PROGRESS") && (
                    <button
                      onClick={() => toggleHasil(e)}
                      disabled={busyToggle === e.id}
                      className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50",
                        e.lihatHasil ? "border-success/40 bg-success-soft text-ink" : "border-line bg-surface text-ink-soft hover:border-ink-faint")}>
                      <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", e.lihatHasil ? "bg-success" : "bg-line")}>
                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", e.lihatHasil ? "translate-x-4" : "translate-x-0.5")} />
                      </span>
                      {e.lihatHasil ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4" />}
                      Lihat Hasil Ujian
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activePeriod && (
        <CreateExamModal
          key={open ? "open" : "closed"}
          open={open}
          onClose={() => setOpen(false)}
          blocks={blocks}
          departments={departments}
          students={students}
          employees={employees}
          period={activePeriod}
          onCreated={load}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Exam["status"] }) {
  if (status === "IN_PROGRESS") return <Badge tone="success"><Dot tone="success" pulse /> Berlangsung</Badge>;
  if (status === "READY") return <Badge tone="primary">Siap</Badge>;
  if (status === "FINISHED") return <Badge tone="neutral">Selesai</Badge>;
  return <Badge tone="neutral">Draf</Badge>;
}

// =====================================================================
//  MODAL BUAT UJIAN
// =====================================================================
function CreateExamModal({ open, onClose, blocks, departments, students, employees, period, onCreated }: {
  open: boolean; onClose: () => void;
  blocks: Block[]; departments: Department[]; students: Student[]; employees: Employee[];
  period: Period; onCreated: () => void;
}) {
  const [nama, setNama] = useState("");
  const [examType, setExamType] = useState<ExamType>("BLOCK");
  const [blockId, setBlockId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("90");
  const [jumlahSoal, setJumlahSoal] = useState("");
  const [nilaiMinimum, setNilaiMinimum] = useState("70");
  const [peserta, setPeserta] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [saving, setSaving] = useState(false);

  const block = blocks.find((b) => b.id === blockId);
  const maxSoal = block?.jumlahSoal ?? 0;

  useEffect(() => {
    if (block && (!jumlahSoal || Number(jumlahSoal) > block.jumlahSoal)) {
      setJumlahSoal(String(block.jumlahSoal || ""));
    }
  }, [blockId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Departemen yang tersedia: untuk PRACTICUM, filter ke departemen dari block yang dipilih
  const availableDepts = useMemo(() => {
    if (!block) return departments;
    return departments.filter((d) => block.departmentIds.includes(d.id));
  }, [block, departments]);

  function toggleAssignment(emp: Employee, type: AssignmentType) {
    setAssignments((prev) => {
      const exists = prev.find((a) => a.employeeId === emp.id && a.type === type);
      if (exists) return prev.filter((a) => !(a.employeeId === emp.id && a.type === type));
      return [...prev, { employeeId: emp.id, employeeNama: emp.nama, type }];
    });
  }

  const valid = nama.trim() && blockId && Number(jumlahSoal) > 0 && Number(jumlahSoal) <= maxSoal && peserta.size > 0 &&
    (examType === "BLOCK" || !!departmentId);

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await api.createExam({
        nama, examType, blockId, departmentId: examType === "PRACTICUM" ? departmentId : undefined,
        durasiMenit: Number(durasiMenit), jumlahSoal: Number(jumlahSoal),
        nilaiMinimum: Number(nilaiMinimum), periodeId: period.id,
        pesertaIds: [...peserta], assignments,
      });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="2xl"
      title="Buat Ujian"
      desc={`Periode aktif: ${period.nama} ${period.tahun}`}
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save} loading={saving} disabled={!valid}>Buat Ujian</Button></>}>
      <div className="space-y-4">

        {/* Baris 1: metadata */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <Field label="Nama Ujian">
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="UAB Sistem Kardiovaskular" />
            </Field>
          </div>
          <Field label="Tipe Ujian">
            <Select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)}>
              <option value="BLOCK">Block</option>
              <option value="PRACTICUM">Praktikum</option>
            </Select>
          </Field>
          <Field label="Block" hint={block ? `${maxSoal} soal tersedia` : undefined}>
            <Select value={blockId} onChange={(e) => setBlockId(e.target.value)}>
              <option value="">— Pilih block —</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.nama} ({b.jumlahSoal} soal)</option>)}
            </Select>
          </Field>

          {examType === "PRACTICUM" && (
            <div className="col-span-4">
              <Field label="Departemen" hint="Wajib untuk ujian Praktikum">
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">— Pilih departemen —</option>
                  {availableDepts.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </Select>
              </Field>
            </div>
          )}

          <Field label="Durasi (menit)">
            <Input type="number" min={1} value={durasiMenit} onChange={(e) => setDurasiMenit(e.target.value)} />
          </Field>
          <Field label="Jumlah Soal" hint={block ? `maks. ${maxSoal}` : undefined}
            error={block && Number(jumlahSoal) > maxSoal ? `Maks. ${maxSoal}` : undefined}>
            <Input type="number" min={1} max={maxSoal} value={jumlahSoal} onChange={(e) => setJumlahSoal(e.target.value)} disabled={!block} />
          </Field>
          <Field label="Nilai Min. (KKM)">
            <Input type="number" min={0} max={100} value={nilaiMinimum} onChange={(e) => setNilaiMinimum(e.target.value)} />
          </Field>
        </div>

        <div className="h-px bg-line" />

        {/* Baris 2: Peserta + Assignment */}
        <div className="grid grid-cols-[1fr_320px] gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Peserta Ujian</p>
            <p className="mb-2 text-xs text-ink-faint">Saring per semester atau cari nama / NRP.</p>
            <StudentPicker students={students} value={peserta} onChange={setPeserta} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Pengawas & IT Support</p>
            <p className="mb-2 text-xs text-ink-faint">Assignment per ujian — bukan role permanen.</p>
            <AssignmentPicker employees={employees} assignments={assignments} onToggle={toggleAssignment} />
          </div>
        </div>

      </div>
    </Modal>
  );
}

// =====================================================================
//  ASSIGNMENT PICKER — Proctor & IT Support
// =====================================================================
function AssignmentPicker({ employees, assignments, onToggle }: {
  employees: Employee[];
  assignments: ExamAssignment[];
  onToggle: (emp: Employee, type: AssignmentType) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = employees.filter((e) =>
    e.nama.toLowerCase().includes(q.toLowerCase()),
  );

  function isAssigned(empId: string, type: AssignmentType) {
    return assignments.some((a) => a.employeeId === empId && a.type === type);
  }

  return (
    <div className="rounded-xl border border-line">
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pegawai" className="h-9 pl-9 text-[13px]" />
        </div>
        <p className="mt-2 text-right text-xs font-medium text-primary">{assignments.length} penugasan</p>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-faint">Tidak ada pegawai cocok.</p>
        ) : (
          filtered.map((emp) => {
            const asProctor = isAssigned(emp.id, "PROCTOR");
            const asIT = isAssigned(emp.id, "IT_SUPPORT");
            return (
              <div key={emp.id} className="border-b border-line px-3 py-2.5 last:border-0">
                <p className="mb-2 truncate text-sm font-medium text-ink">{emp.nama}</p>
                <div className="flex gap-3">
                  {(["PROCTOR", "IT_SUPPORT"] as AssignmentType[]).map((type) => {
                    const active = type === "PROCTOR" ? asProctor : asIT;
                    return (
                      <label key={type} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
                        active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft hover:border-ink-faint")}>
                        <Checkbox checked={active} onChange={() => onToggle(emp, type)} />
                        {type === "PROCTOR" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                        {ASSIGNMENT_LABEL[type]}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =====================================================================
//  STUDENT PICKER
// =====================================================================
function StudentPicker({ students, value, onChange }: { students: Student[]; value: Set<string>; onChange: (s: Set<string>) => void }) {
  const [sem, setSem] = useState("all");
  const [q, setQ] = useState("");

  const semesters = useMemo(() => Array.from(new Set(students.map((s) => s.semester))).sort((a, b) => a - b), [students]);
  const filtered = useMemo(() =>
    students.filter((s) =>
      (sem === "all" || s.semester === Number(sem)) &&
      (s.nama.toLowerCase().includes(q.toLowerCase()) || s.nrp.toLowerCase().includes(q.toLowerCase())),
    ), [students, sem, q]);

  function toggle(id: string) {
    const next = new Set(value);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  }
  function selectAllVisible() {
    const next = new Set(value);
    filtered.forEach((s) => next.add(s.id));
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-line">
      <div className="space-y-2 border-b border-line p-3">
        <div className="flex gap-2">
          <Select value={sem} onChange={(e) => setSem(e.target.value)} className="h-9 w-40 text-[13px]">
            <option value="all">Semua semester</option>
            {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </Select>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / NRP" className="h-9 pl-9 text-[13px]" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="subtle" onClick={selectAllVisible}>Pilih semua ({filtered.length})</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(new Set())}>Kosongkan</Button>
          </div>
          <span className="text-xs font-medium text-primary">{value.size} dipilih</span>
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-faint">Tidak ada mahasiswa cocok.</p>
        ) : (
          filtered.map((s) => {
            const checked = value.has(s.id);
            return (
              <label key={s.id}
                className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors", checked ? "bg-primary-soft" : "hover:bg-surface-2")}>
                <Checkbox checked={checked} onChange={() => toggle(s.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{s.nama}</p>
                  <p className="text-xs text-ink-soft">{s.nrp}</p>
                </div>
                <Badge tone="neutral">Smt {s.semester}</Badge>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
