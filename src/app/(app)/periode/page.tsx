"use client";

import React from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Lock,
  Plus,
  Power,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, CenterSpinner, EmptyState, Field, Modal, Select } from "@/components/ui";
import { api } from "@/lib/api";
import type { Period } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAMA_OPTS: Period["nama"][] = ["Ganjil", "Ganjil Perbaikan", "Genap", "Genap Perbaikan"];

function academicYears(): string[] {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1, y + 2].map((a) => `${a}/${a + 1}`);
}

export default function PeriodePage() {
  const [periods, setPeriods] = useState<Period[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toActivate, setToActivate] = useState<Period | null>(null);

  function load() {
    api.listPeriods().then((ps) =>
      setPeriods([...ps].sort((a, b) => (a.status === "active" ? -1 : b.status === "active" ? 1 : 0))),
    );
  }
  useEffect(load, []);

  const current = periods?.find((p) => p.status === "active") ?? null;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Periode Akademik"
        desc="Hanya satu periode aktif pada satu waktu. Ujian yang berjalan mengikuti periode aktif."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Buat Periode</Button>}
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <span>Mengaktifkan periode baru akan <b>menutup</b> periode yang sedang aktif dan <b>tidak dapat dikembalikan</b>. Bila beralih dari periode sebelumnya, seluruh <b>semester mahasiswa bertambah +1</b>.</span>
      </div>

      {!periods ? (
        <CenterSpinner label="Memuat periode…" />
      ) : periods.length === 0 ? (
        <EmptyState icon={<CalendarRange className="h-8 w-8" />} title="Belum ada periode"
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Buat Periode</Button>} />
      ) : (
        <div className="space-y-8">
          {/* Aktif */}
          {periods.some((p) => p.status === "active") && (
            <section>
              <SectionLabel>Periode Aktif</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {periods.filter((p) => p.status === "active").map((p) => (
                  <PeriodCard key={p.id} p={p} onActivate={setToActivate} />
                ))}
              </div>
            </section>
          )}

          {/* Draf */}
          {periods.some((p) => p.status === "draft") && (
            <section>
              <SectionLabel>Draf</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {periods.filter((p) => p.status === "draft").map((p) => (
                  <PeriodCard key={p.id} p={p} onActivate={setToActivate} />
                ))}
              </div>
            </section>
          )}

          {/* Sudah lewat */}
          {periods.some((p) => p.status === "closed") && (
            <section>
              <SectionLabel muted>Sudah Lewat</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {periods.filter((p) => p.status === "closed").map((p) => (
                  <PeriodCard key={p.id} p={p} onActivate={setToActivate} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <CreatePeriodModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <ActivateModal period={toActivate} current={current} onClose={() => setToActivate(null)} onDone={load} />
    </div>
  );
}

function SectionLabel({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={cn("mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest", muted ? "text-ink-faint" : "text-ink-soft")}>
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function PeriodCard({ p, onActivate }: { p: Period; onActivate: (p: Period) => void }) {
  return (
    <Card className={cn("p-5", p.status === "active" && "border-primary ring-1 ring-primary/20", p.status === "closed" && "opacity-70")}>
      <div className="flex items-start justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl",
          p.status === "active" ? "bg-primary text-white" : p.status === "closed" ? "bg-surface-2 text-ink-faint" : "bg-accent-soft text-accent")}>
          <CalendarRange className="h-5 w-5" />
        </span>
        <StatusBadge status={p.status} />
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{p.nama}</h3>
      <p className="text-sm text-ink-soft">Tahun Ajaran {p.tahun}</p>
      {p.activatedAt && p.status !== "draft" && (
        <p className="mt-1 text-xs text-ink-faint">
          Diaktifkan {new Date(p.activatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <div className="mt-4 border-t border-line pt-4">
        {p.status === "draft" && <Button className="w-full" onClick={() => onActivate(p)}><Power className="h-4 w-4" /> Aktifkan Periode</Button>}
        {p.status === "active" && <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary"><CheckCircle2 className="h-4 w-4" /> Sedang aktif</p>}
        {p.status === "closed" && <p className="flex items-center justify-center gap-1.5 text-sm text-ink-faint"><Lock className="h-4 w-4" /> Telah ditutup</p>}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Period["status"] }) {
  if (status === "active") return <Badge tone="success"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</Badge>;
  if (status === "closed") return <Badge tone="neutral">Ditutup</Badge>;
  return <Badge tone="accent">Draf</Badge>;
}

function CreatePeriodModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [nama, setNama] = useState<Period["nama"]>("Ganjil");
  const [tahun, setTahun] = useState(academicYears()[1]);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.createPeriod({ nama, tahun });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" title="Buat Periode" desc="Periode dibuat sebagai draf dan belum aktif."
      footer={<><Button variant="outline" onClick={onClose}>Batal</Button><Button onClick={save} loading={saving}>Simpan</Button></>}>
      <div className="space-y-4">
        <Field label="Nama Periode">
          <Select value={nama} onChange={(e) => setNama(e.target.value as Period["nama"])}>
            {NAMA_OPTS.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <Field label="Tahun Ajaran">
          <Select value={tahun} onChange={(e) => setTahun(e.target.value)}>
            {academicYears().map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function ActivateModal({ period, current, onClose, onDone }: {
  period: Period | null; current: Period | null; onClose: () => void; onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const willBump = !!current && current.id !== period?.id;

  async function activate() {
    if (!period) return;
    setSaving(true);
    try {
      await api.activatePeriod(period.id);
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!period} onClose={onClose} size="sm" title="Aktifkan periode ini?"
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button><Button onClick={activate} loading={saving}><Power className="h-4 w-4" /> Ya, aktifkan</Button></>}>
      {period && (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <p className="font-display text-xl text-ink">{period.nama}</p>
            <p className="text-sm text-ink-soft">Tahun Ajaran {period.tahun}</p>
          </div>

          <ul className="space-y-2 text-sm text-ink-soft">
            <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" /> Tindakan ini <b className="text-ink">tidak dapat dibatalkan</b>.</li>
            {current && (
              <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" /> Periode <b className="text-ink">{current.nama} {current.tahun}</b> akan ditutup.</li>
            )}
            {willBump && (
              <li className="flex gap-2 rounded-lg bg-warn-soft p-2.5 text-ink"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-warn" /> Semester seluruh mahasiswa akan <b>bertambah +1</b>.</li>
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}
