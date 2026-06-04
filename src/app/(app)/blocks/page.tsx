"use client";

import {
  ArrowUpRight,
  BookOpen,
  Database,
  Layers,
  Plus,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, CenterSpinner, EmptyState, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import type { Block, Department, Employee } from "@/lib/types";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);

  function load() { api.listBlocks().then(setBlocks); }
  useEffect(() => {
    load();
    api.listEmployees().then(setEmployees);
    api.listDepartments().then(setDepartments);
  }, []);

  const coordinators = employees.filter((e) => e.role === "BLOCK_COORDINATOR");

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Block Ujian"
        desc="Kelola block ujian: koordinator, departemen yang dicakup, dan soal di bank."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Buat Block</Button>}
      />

      {!blocks ? (
        <CenterSpinner label="Memuat block…" />
      ) : blocks.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-8 w-8" />} title="Belum ada block" desc="Mulai dengan membuat block ujian pertama."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Buat Block</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {blocks.map((b) => (
            <Link key={b.id} href={`/blocks/${b.id}`} className="group">
              <Card className="h-full p-5 transition-all hover:border-primary hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><BookOpen className="h-5 w-5" /></span>
                  <Badge tone="neutral">{b.kode}</Badge>
                </div>
                <h3 className="mt-4 font-display text-lg text-ink group-hover:text-primary">{b.nama}</h3>
                {b.deskripsi && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{b.deskripsi}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-ink-faint" /> Semester {b.semester}</span>
                  <span className="inline-flex items-center gap-1.5"><Database className="h-4 w-4 text-ink-faint" /> {b.jumlahSoal} soal</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                    <UserCog className="h-4 w-4 text-ink-faint" />
                    {b.coordinatorNama ?? <span className="text-ink-faint">Belum ada koordinator</span>}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-ink-faint group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateBlockModal
        open={open}
        onClose={() => setOpen(false)}
        coordinators={coordinators}
        departments={departments}
        onCreated={load}
      />
    </div>
  );
}

function CreateBlockModal({ open, onClose, coordinators, departments, onCreated }: {
  open: boolean; onClose: () => void; coordinators: Employee[]; departments: Department[]; onCreated: () => void;
}) {
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [semester, setSemester] = useState("1");
  const [deskripsi, setDeskripsi] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function reset() {
    setKode(""); setNama(""); setSemester("1"); setDeskripsi(""); setCoordinatorId(""); setSelectedDepts(new Set());
  }

  function toggleDept(id: string) {
    setSelectedDepts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    if (!nama || !kode) return;
    setSaving(true);
    const coordinator = coordinators.find((k) => k.id === coordinatorId);
    try {
      await api.createBlock({
        kode, nama, semester: Number(semester), deskripsi: deskripsi || undefined,
        coordinatorEmployeeId: coordinator?.id,
        coordinatorNama: coordinator?.nama,
        departmentIds: [...selectedDepts],
      });
      onCreated();
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Block Ujian"
      desc="Block menampung mahasiswa dan menjadi dasar pemilihan peserta ujian."
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save} loading={saving} disabled={!nama || !kode}>Simpan Block</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode Block"><Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="BLK-301" /></Field>
          <Field label="Semester">
            <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Nama Block"><Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Sistem Kardiovaskular" /></Field>
        <Field label="Deskripsi" hint="Opsional">
          <Textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Cakupan materi block ini…" />
        </Field>
        <Field label="Koordinator Block" hint="Koordinator dari Identity Service yang mengampu block ini">
          <Select value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)}>
            <option value="">— Belum ditentukan —</option>
            {coordinators.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </Select>
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Departemen yang dicakup</p>
          <p className="mb-2 text-xs text-ink-faint">Soal dari departemen terpilih akan digunakan dalam ujian block ini.</p>
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => {
              const active = selectedDepts.has(d.id);
              return (
                <button key={d.id} type="button" onClick={() => toggleDept(d.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft hover:border-ink-faint"}`}>
                  {d.nama}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
