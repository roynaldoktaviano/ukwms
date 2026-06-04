"use client";

import {
  CheckCircle2,
  Database,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { QuestionView } from "@/components/question-view";
import {
  Badge, Button, Card, CenterSpinner, EmptyState, Field, Input, Label,
  Modal, Select, Spinner, Textarea,
} from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { Department, OptionLabel, Question, QuestionDifficulty, QuestionOption } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: OptionLabel[] = ["A", "B", "C", "D", "E"];
function emptyOptions(): QuestionOption[] {
  return LABELS.map((label) => ({ label, teks: "" }));
}
function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function BankSoalPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "QUESTION_MANAGER";

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptId, setDeptId] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    api.bankSoal().then(setQuestions);
  }
  useEffect(() => {
    load();
    api.listDepartments().then(setDepartments);
  }, []);

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);

  const filtered = useMemo(() =>
    (questions ?? []).filter((x) =>
      (deptId === "all" || x.departmentId === deptId) &&
      (difficulty === "all" || x.difficulty === difficulty) &&
      (q === "" || x.pertanyaan.toLowerCase().includes(q.toLowerCase())),
    ), [questions, deptId, difficulty, q]);

  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    filtered.forEach((x) => { (map[x.departmentId] ??= []).push(x); });
    return Object.entries(map);
  }, [filtered]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteQuestion(toDelete.id);
      setToDelete(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Bank Soal"
        desc="Kumpulan soal per departemen. Setiap soal memiliki tingkat kesulitan dan opsional gambar."
        actions={canEdit ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Impor</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah Soal</Button>
          </div>
        ) : undefined}
      />

      {!questions ? (
        <CenterSpinner label="Memuat bank soal…" />
      ) : (
        <>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-wrap gap-3">
              <Select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="text-[13px]">
                <option value="all">Semua departemen</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
              </Select>
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="text-[13px]">
                <option value="all">Semua kesulitan</option>
                {(["EASY", "MEDIUM", "HARD"] as QuestionDifficulty[]).map((d) => (
                  <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
                ))}
              </Select>
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pertanyaan…" className="pl-9 text-[13px]" />
            </div>
          </Card>

          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Database className="h-4 w-4 text-ink-faint" /> {filtered.length} soal ditemukan
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Database className="h-8 w-8" />} title="Tidak ada soal" desc="Coba ubah filter atau kata kunci pencarian." />
          ) : (
            <div className="space-y-6">
              {grouped.map(([did, qs]) => (
                <section key={did} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-lg text-ink">{deptMap[did]?.nama ?? did}</h2>
                    <Badge tone="neutral">{deptMap[did]?.kode}</Badge>
                    <span className="text-sm text-ink-faint">· {qs.length} soal</span>
                  </div>
                  <div className="space-y-3">
                    {qs.map((question, i) => (
                      <QuestionView
                        key={question.id}
                        q={question}
                        index={i + 1}
                        departmentNama={deptMap[question.departmentId]?.nama}
                        actions={canEdit ? (
                          <>
                            <button onClick={() => { setEditing(question); setFormOpen(true); }} title="Edit"
                              className="rounded-lg p-1.5 text-ink-faint hover:bg-black/5 hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setToDelete(question)} title="Hapus"
                              className="rounded-lg p-1.5 text-ink-faint hover:bg-danger-soft hover:text-danger">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <QuestionFormModal
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        departments={departments}
        editing={editing}
        onSaved={load}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        departments={departments}
        onImported={load}
      />

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} size="sm" title="Hapus soal?"
        desc="Tindakan ini tidak dapat dibatalkan."
        footer={<><Button variant="outline" onClick={() => setToDelete(null)}>Batal</Button><Button variant="danger" onClick={confirmDelete} loading={deleting}>Hapus</Button></>}>
        <p className="text-sm text-ink-soft line-clamp-3">{toDelete?.pertanyaan}</p>
      </Modal>
    </div>
  );
}

// =====================================================================
//  FORM SOAL
// =====================================================================
function QuestionFormModal({ open, onClose, departments, editing, onSaved }: {
  open: boolean; onClose: () => void; departments: Department[]; editing: Question | null; onSaved: () => void;
}) {
  const [pertanyaan, setPertanyaan] = useState(editing?.pertanyaan ?? "");
  const [departmentId, setDepartmentId] = useState(editing?.departmentId ?? "");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(editing?.difficulty ?? "MEDIUM");
  const [gambarSoal, setGambarSoal] = useState<string | undefined>(editing?.gambarSoal);
  const [pilihan, setPilihan] = useState<QuestionOption[]>(
    editing ? LABELS.map((l) => editing.pilihan.find((p) => p.label === l) ?? { label: l, teks: "" }) : emptyOptions(),
  );
  const [jawabanBenar, setJawabanBenar] = useState<OptionLabel>(editing?.jawabanBenar ?? "A");
  const [saving, setSaving] = useState(false);

  function setOptText(label: OptionLabel, teks: string) {
    setPilihan((p) => p.map((o) => (o.label === label ? { ...o, teks } : o)));
  }
  async function setOptImage(label: OptionLabel, file?: File) {
    const gambar = file ? await readAsDataURL(file) : undefined;
    setPilihan((p) => p.map((o) => (o.label === label ? { ...o, gambar } : o)));
  }

  const valid = pertanyaan.trim() && departmentId && pilihan.every((o) => o.teks.trim() || o.gambar);

  async function save() {
    if (!valid) return;
    setSaving(true);
    const payload = { pertanyaan, departmentId, difficulty, gambarSoal, pilihan, jawabanBenar };
    try {
      if (editing) await api.updateQuestion(editing.id, payload);
      else await api.createQuestion(payload);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={editing ? "Edit Soal" : "Tambah Soal"}
      desc="Isi pertanyaan, departemen, tingkat kesulitan, pilihan jawaban, dan tandai jawaban benar."
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save} loading={saving} disabled={!valid}>{editing ? "Simpan Perubahan" : "Simpan Soal"}</Button></>}>
      <div className="space-y-5">
        <Field label="Pertanyaan">
          <Textarea value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} placeholder="Tulis pertanyaan…" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Departemen">
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— Pilih departemen —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Tingkat Kesulitan">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}>
              {(["EASY", "MEDIUM", "HARD"] as QuestionDifficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Gambar Soal" hint="Opsional">
          <ImageInput value={gambarSoal} onChange={setGambarSoal} />
        </Field>

        <div>
          <Label>Pilihan Jawaban</Label>
          <p className="mb-2 text-xs text-ink-faint">Pilih radio di kiri untuk menandai jawaban benar. Tambahkan gambar bila diperlukan.</p>
          <div className="space-y-2">
            {pilihan.map((opt) => (
              <div key={opt.label}
                className={cn("rounded-xl border p-2.5 transition-colors", jawabanBenar === opt.label ? "border-success/50 bg-success-soft" : "border-line bg-surface")}>
                <div className="flex items-center gap-2.5">
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <input type="radio" name="benar" checked={jawabanBenar === opt.label} onChange={() => setJawabanBenar(opt.label)}
                      className="h-4 w-4 accent-[var(--success)]" />
                    <span className={cn("grid h-7 w-7 place-items-center rounded-lg text-sm font-semibold",
                      jawabanBenar === opt.label ? "bg-success text-white" : "bg-surface-2 text-ink-soft")}>{opt.label}</span>
                  </label>
                  <Input value={opt.teks} onChange={(e) => setOptText(opt.label, e.target.value)} placeholder={`Teks pilihan ${opt.label}`} className="flex-1" />
                  <ImageInput
                    value={opt.gambar}
                    onChange={(v) => setPilihan((p) => p.map((o) => o.label === opt.label ? { ...o, gambar: v } : o))}
                    compact
                  />
                </div>
                {opt.gambar && (
                  <div className="mt-2 pl-9">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={opt.gambar} alt="" className="h-16 w-auto rounded-lg border border-line bg-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {jawabanBenar && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Jawaban benar: pilihan {jawabanBenar}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// =====================================================================
//  IMPOR
// =====================================================================
function ImportModal({ open, onClose, departments, onImported }: {
  open: boolean; onClose: () => void; departments: Department[]; onImported: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Omit<Question, "id" | "nomor">[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.nama]));

  function reset() { setFile(null); setPreview(null); setParsing(false); setImporting(false); }
  function close() { reset(); onClose(); }

  async function onFile(f?: File) {
    if (!f) return;
    setFile(f);
    setParsing(true);
    try {
      const result = await api.importQuestionsPreview("", f);
      setPreview(result);
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    if (!preview) return;
    setImporting(true);
    try {
      for (const q of preview) await api.createQuestion(q);
      onImported();
      close();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={close} size="lg"
      title="Impor Soal dari Excel / Word"
      desc="Unggah berkas berisi soal. Gambar tertanam ikut terbaca. Backend akan mendeteksi duplikat otomatis."
      footer={
        preview
          ? <><Button variant="outline" onClick={reset}>Ganti berkas</Button><Button onClick={doImport} loading={importing}><Upload className="h-4 w-4" /> Impor {preview.length} soal</Button></>
          : <Button variant="outline" onClick={close}>Tutup</Button>
      }>
      {!preview ? (
        <div>
          <button type="button" onClick={() => ref.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2 px-6 py-12 text-center transition-colors hover:border-primary">
            {parsing ? (
              <><Spinner className="h-7 w-7" /><p className="text-sm text-ink-soft">Membaca berkas…</p></>
            ) : (
              <>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Upload className="h-7 w-7" /></span>
                <div>
                  <p className="font-medium text-ink">{file ? file.name : "Klik untuk pilih berkas"}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Format: .xlsx, .xls, .csv, .docx, .doc</p>
                </div>
              </>
            )}
          </button>
          <input ref={ref} type="file" accept=".xlsx,.xls,.csv,.docx,.doc" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-ink-soft">
            <p className="mb-1 font-medium text-ink">Format kolom yang diharapkan</p>
            <p>No · Soal · Pilihan A–E · Departemen · Kesulitan (EASY/MEDIUM/HARD) · Jawaban Benar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success-soft px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-ink">Terbaca <b>{preview.length}</b> soal dari <b>{file?.name}</b>. Tinjau sebelum impor.</span>
          </div>
          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {preview.map((q, i) => (
              <QuestionView
                key={i}
                q={{ ...q, id: `prev-${i}`, nomor: i + 1 } as Question}
                index={i + 1}
                departmentNama={deptMap[q.departmentId]}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Komponen input gambar
function ImageInput({ value, onChange, compact }: { value?: string; onChange: (v?: string) => void; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  async function pick(file?: File) {
    if (!file) return;
    onChange(await readAsDataURL(file));
  }
  if (compact) {
    return (
      <>
        <button type="button" onClick={() => ref.current?.click()} title="Tambah gambar pilihan"
          className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors",
            value ? "border-primary text-primary" : "border-line text-ink-faint hover:text-ink")}>
          <ImagePlus className="h-4 w-4" />
        </button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </>
    );
  }
  return (
    <div>
      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-10 w-14 rounded-md border border-line bg-white object-contain" />
          <span className="flex-1 text-xs text-ink-soft">Gambar terlampir</span>
          <button type="button" onClick={() => onChange(undefined)} className="rounded-lg p-1 text-ink-faint hover:text-danger"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-ink-faint hover:border-primary hover:text-primary">
          <ImagePlus className="h-4 w-4" /> Unggah gambar
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
