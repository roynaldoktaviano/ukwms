"use client";

import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Layers,
  Plus,
  Radio,
  RefreshCcw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import {
  Badge, Button, Card, CenterSpinner, Checkbox, Dot, EmptyState, Field, Input, Modal, Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Block, Dosen, Exam, JenisUjian, Period, Student, TipeUjian } from "@/lib/types";
import { cn, fmtDuration } from "@/lib/utils";

type Prefill = Partial<{
  nama: string; blockId: string; jenisUjian: JenisUjian; tipeUjian: TipeUjian;
  semester: number; nilaiMinimum: number; pesertaIds: string[]; pengawasIds: string[]; remedialOfExamId: string;
}>;

export default function KelolaUjianPage() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({});
  const [busyToggle, setBusyToggle] = useState<string | null>(null);

  function load() {
    api.listExams().then(setExams);
  }
  useEffect(() => {
    load();
    api.listBlocks().then(setBlocks);
    api.listStudents().then(setStudents);
    api.listDosen().then(setDosen);
    api.listPeriods().then((ps) => setActivePeriod(ps.find((p) => p.status === "active") ?? null));
  }, []);

  async function toggleHasil(e: Exam) {
    setBusyToggle(e.id);
    try {
      await api.setLihatHasil(e.id, !e.lihatHasil);
      load();
    } finally {
      setBusyToggle(null);
    }
  }

  function openCreate(p: Prefill = {}) {
    setPrefill(p);
    setOpen(true);
  }

  async function buatRemidi(e: Exam) {
    const rows = await api.liveStudents(e.id);
    const gagal = rows
      .filter((r) => r.status === "submitted" && Math.round((r.benar / (r.total || 1)) * 100) < e.nilaiMinimum)
      .map((r) => r.studentId);
    openCreate({
      nama: `Remidi ${e.nama}`,
      blockId: e.blockId,
      jenisUjian: "Remidi",
      tipeUjian: e.tipeUjian,
      semester: e.semester,
      nilaiMinimum: e.nilaiMinimum,
      pesertaIds: gagal,
      remedialOfExamId: e.id,
    });
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Kelola Ujian"
        desc="Buat ujian, pilih peserta, pantau langsung, dan rilis nilai."
        actions={<Button onClick={() => openCreate()} disabled={!activePeriod}><Plus className="h-4 w-4" /> Buat Ujian</Button>}
      />

      {!activePeriod && (
        <div className="flex items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-ink">
          <CalendarClock className="h-4 w-4 text-warn" /> Belum ada periode aktif. Aktifkan periode terlebih dahulu di menu <Link href="/periode" className="font-medium text-primary underline">Periode</Link> sebelum membuat ujian.
        </div>
      )}

      {!exams ? (
        <CenterSpinner label="Memuat ujian…" />
      ) : exams.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="Belum ada ujian"
          desc="Buat ujian pertama Anda untuk block yang sudah tersedia."
          action={<Button onClick={() => openCreate()} disabled={!activePeriod}><Plus className="h-4 w-4" /> Buat Ujian</Button>} />
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.status} />
                    <Badge tone={e.jenisUjian === "Remidi" ? "warn" : "neutral"}>{e.jenisUjian}</Badge>
                    <Badge tone="neutral">
                      {e.tipeUjian === "Praktikum" ? <FlaskConical className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />} {e.tipeUjian}
                    </Badge>
                    {e.remedialOfExamId && <Badge tone="accent"><RefreshCcw className="h-3 w-3" /> dari ujian utama</Badge>}
                  </div>
                  <h3 className="font-display text-lg text-ink">{e.nama}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
                    <span>{e.blockNama}</span>
                    <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-ink-faint" /> Smt {e.semester}</span>
                    <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-ink-faint" /> {e.jumlahSoal} soal</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-ink-faint" /> {fmtDuration(e.durasiMenit)}</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-ink-faint" /> KKM {e.nilaiMinimum}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-ink-faint" /> {e.pesertaIds.length} peserta</span>
                    {e.pengawasIds.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-ink-faint" />
                        {dosen.filter((d) => e.pengawasIds.includes(d.id)).map((d) => d.nama).join(", ") || `${e.pengawasIds.length} pengawas`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    {e.status === "ongoing" && (
                      <Link href={`/kelola-ujian/${e.id}/monitor`}><Button size="sm" variant="subtle"><Radio className="h-4 w-4" /> Monitor</Button></Link>
                    )}
                    {e.status === "finished" && e.jenisUjian !== "Remidi" && (
                      <Button size="sm" variant="outline" onClick={() => buatRemidi(e)}><RefreshCcw className="h-4 w-4" /> Buat Remidi</Button>
                    )}
                  </div>

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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activePeriod && (
        <CreateExamModal
          key={open ? (prefill.remedialOfExamId ?? "new") + Object.keys(prefill).length : "closed"}
          open={open}
          onClose={() => setOpen(false)}
          blocks={blocks}
          students={students}
          dosen={dosen}
          period={activePeriod}
          prefill={prefill}
          onCreated={load}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Exam["status"] }) {
  if (status === "ongoing") return <Badge tone="success"><Dot tone="success" pulse /> Berlangsung</Badge>;
  if (status === "scheduled") return <Badge tone="primary">Terjadwal</Badge>;
  if (status === "finished") return <Badge tone="neutral">Berakhir</Badge>;
  return <Badge tone="neutral">Draf</Badge>;
}

// =====================================================================
//  MODAL BUAT UJIAN
// =====================================================================
function CreateExamModal({ open, onClose, blocks, students, dosen, period, prefill, onCreated }: {
  open: boolean; onClose: () => void; blocks: Block[]; students: Student[]; dosen: Dosen[]; period: Period; prefill: Prefill; onCreated: () => void;
}) {
  const [nama, setNama] = useState(prefill.nama ?? "");
  const [blockId, setBlockId] = useState(prefill.blockId ?? "");
  const [semester, setSemester] = useState(String(prefill.semester ?? ""));
  const [jenisUjian, setJenisUjian] = useState<JenisUjian>(prefill.jenisUjian ?? "Utama");
  const [tipeUjian, setTipeUjian] = useState<TipeUjian>(prefill.tipeUjian ?? "Teori");
  const [durasiMenit, setDurasiMenit] = useState("90");
  const [jumlahSoal, setJumlahSoal] = useState("");
  const [nilaiMinimum, setNilaiMinimum] = useState(String(prefill.nilaiMinimum ?? "70"));
  const [peserta, setPeserta] = useState<Set<string>>(new Set(prefill.pesertaIds ?? []));
  const [pengawas, setPengawas] = useState<Set<string>>(new Set(prefill.pengawasIds ?? []));
  const [saving, setSaving] = useState(false);

  const block = blocks.find((b) => b.id === blockId);
  const maxSoal = block?.jumlahSoal ?? 0;

  // sinkron jumlah soal dgn block terpilih
  useEffect(() => {
    if (block && (!jumlahSoal || Number(jumlahSoal) > block.jumlahSoal)) {
      setJumlahSoal(String(block.jumlahSoal || ""));
    }
    if (block && !semester) setSemester(String(block.semester));
  }, [blockId]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = nama.trim() && blockId && Number(jumlahSoal) > 0 && Number(jumlahSoal) <= maxSoal && peserta.size > 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await api.createExam({
        nama, semester: Number(semester) || block!.semester, blockId,
        jenisUjian, tipeUjian, durasiMenit: Number(durasiMenit), jumlahSoal: Number(jumlahSoal),
        nilaiMinimum: Number(nilaiMinimum), periodeId: period.id, pesertaIds: [...peserta],
        pengawasIds: [...pengawas], remedialOfExamId: prefill.remedialOfExamId,
      });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="2xl"
      title={prefill.remedialOfExamId ? "Buat Ujian Remidi" : "Buat Ujian"}
      desc={`Periode aktif: ${period.nama} ${period.tahun}`}
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save} loading={saving} disabled={!valid}>Buat Ujian</Button></>}>
      <div className="space-y-4">

        {/* ── Baris 1: Form fields compact ── */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <Field label="Nama Ujian">
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="UAB Sistem Kardiovaskular" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Block" hint={block ? `${maxSoal} soal tersedia` : undefined}>
              <Select value={blockId} onChange={(e) => setBlockId(e.target.value)}>
                <option value="">— Pilih block —</option>
                {blocks.map((b) => <option key={b.id} value={b.id}>{b.nama} ({b.jumlahSoal} soal)</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Jenis Ujian">
            <Select value={jenisUjian} onChange={(e) => setJenisUjian(e.target.value as JenisUjian)}>
              <option value="Utama">Ujian Utama</option>
              <option value="Remidi">Remidi</option>
            </Select>
          </Field>
          <Field label="Tipe Ujian">
            <Select value={tipeUjian} onChange={(e) => setTipeUjian(e.target.value as TipeUjian)}>
              <option value="Teori">Teori</option>
              <option value="Praktikum">Praktikum</option>
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">— pilih —</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </Field>
          <Field label="Durasi (menit)">
            <Input type="number" min={1} value={durasiMenit} onChange={(e) => setDurasiMenit(e.target.value)} />
          </Field>
          <Field label="Jumlah Soal" hint={block ? `maks. ${maxSoal}` : undefined} error={block && Number(jumlahSoal) > maxSoal ? `Maks. ${maxSoal}` : undefined}>
            <Input type="number" min={1} max={maxSoal} value={jumlahSoal} onChange={(e) => setJumlahSoal(e.target.value)} disabled={!block} />
          </Field>
          <Field label="Nilai Min. (KKM)">
            <Input type="number" min={0} max={100} value={nilaiMinimum} onChange={(e) => setNilaiMinimum(e.target.value)} />
          </Field>
        </div>

        <div className="h-px bg-line" />

        {/* ── Baris 2: Pickers ── */}
        <div className="grid grid-cols-[1fr_280px] gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Peserta Ujian</p>
            <p className="mb-2 text-xs text-ink-faint">Saring per semester atau cari nama / NRP.</p>
            <StudentPicker students={students} value={peserta} onChange={setPeserta} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Pengawas</p>
            <p className="mb-2 text-xs text-ink-faint">Dosen yang bertugas mengawasi. Boleh lebih dari satu.</p>
            <DosenPicker dosen={dosen} value={pengawas} onChange={setPengawas} />
          </div>
        </div>

      </div>
    </Modal>
  );
}

function DosenPicker({ dosen, value, onChange }: { dosen: Dosen[]; value: Set<string>; onChange: (s: Set<string>) => void }) {
  const [q, setQ] = useState("");
  const filtered = dosen.filter((d) => d.nama.toLowerCase().includes(q.toLowerCase()) || (d.bidangIlmu ?? "").toLowerCase().includes(q.toLowerCase()));

  function toggle(id: string) {
    const next = new Set(value);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-line">
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / bidang ilmu" className="h-9 pl-9 text-[13px]" />
        </div>
        <p className="mt-2 text-right text-xs font-medium text-primary">{value.size} dipilih</p>
      </div>
      <div className="max-h-44 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-faint">Tidak ada dosen cocok.</p>
        ) : (
          filtered.map((d) => {
            const checked = value.has(d.id);
            return (
              <label key={d.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors", checked ? "bg-primary-soft" : "hover:bg-surface-2")}>
                <Checkbox checked={checked} onChange={() => toggle(d.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{d.nama}</p>
                  <p className="text-xs text-ink-soft">{d.bidangIlmu ?? "—"}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// Pemilih peserta: filter semester + cari nama + bulk select
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
  function clearAll() {
    onChange(new Set());
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
            <Button type="button" size="sm" variant="ghost" onClick={clearAll}>Kosongkan</Button>
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
