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
import type { Block, KetuaBlock } from "@/lib/types";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [ketuas, setKetuas] = useState<KetuaBlock[]>([]);
  const [open, setOpen] = useState(false);

  function load() {
    api.listBlocks().then(setBlocks);
  }
  useEffect(() => {
    load();
    api.listUsers("ketua_block").then((u) => setKetuas(u as KetuaBlock[]));
  }, []);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Block Ujian"
        desc="Buat block ujian, lalu kelola soal di dalamnya (Form, Excel, atau Word)."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Buat Block</Button>}
      />

      {!blocks ? (
        <CenterSpinner label="Memuat block…" />
      ) : blocks.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-8 w-8" />} title="Belum ada block" desc="Mulai dengan membuat block ujian pertama Anda."
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
                    {b.ketuaNama ?? <span className="text-ink-faint">Belum ada ketua</span>}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-ink-faint group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateBlockModal open={open} onClose={() => setOpen(false)} ketuas={ketuas} onCreated={load} />
    </div>
  );
}

function CreateBlockModal({ open, onClose, ketuas, onCreated }: {
  open: boolean; onClose: () => void; ketuas: KetuaBlock[]; onCreated: () => void;
}) {
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [semester, setSemester] = useState("1");
  const [deskripsi, setDeskripsi] = useState("");
  const [ketuaId, setKetuaId] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setKode(""); setNama(""); setSemester("1"); setDeskripsi(""); setKetuaId("");
  }

  async function save() {
    if (!nama || !kode) return;
    setSaving(true);
    const ketua = ketuas.find((k) => k.id === ketuaId);
    try {
      await api.createBlock({
        kode, nama, semester: Number(semester), deskripsi: deskripsi || undefined,
        ketuaId: ketua?.id, ketuaNama: ketua?.nama,
      });
      onCreated();
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Block Ujian" desc="Block menampung kumpulan soal untuk satu sistem/topik."
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
        <Field label="Ketua Block" hint="Ketua dapat melihat soal & nilai mahasiswa di block ini">
          <Select value={ketuaId} onChange={(e) => setKetuaId(e.target.value)}>
            <option value="">— Belum ditentukan —</option>
            {ketuas.map((k) => <option key={k.id} value={k.id}>{k.nama} · {k.jenisBlock}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
