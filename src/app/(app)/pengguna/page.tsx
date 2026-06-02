"use client";

import {
  Crown,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CenterSpinner,
  EmptyState,
  Field,
  Input,
  Modal,
  Tabs,
} from "@/components/ui";
import { api } from "@/lib/api";
import { ROLE_LABEL, type Role, type User } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabId = "all" | Role;

const ROLE_ICON: Record<Role, typeof Users> = {
  student: GraduationCap,
  ketua_block: ShieldCheck,
  admin: UserCog,
  super_admin: Crown,
};

const ROLE_TONE: Record<Role, "primary" | "accent" | "warn" | "success"> = {
  student: "primary",
  ketua_block: "accent",
  admin: "warn",
  super_admin: "success",
};

// Identitas + atribut tambahan yang ditampilkan per peran (narrowing aman via u.role)
function userMeta(u: User): { ident: string; extra?: string } {
  if (u.role === "student") return { ident: `NRP ${u.nrp}`, extra: `Semester ${u.semester}` };
  if (u.role === "ketua_block") return { ident: `NIK ${u.nik}`, extra: u.jenisBlock };
  return { ident: `NIK ${u.nik}` };
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  function load() {
    api.listUsers().then(setUsers);
  }
  useEffect(load, []);

  const counts = useMemo(() => {
    const c: Record<Role, number> = { student: 0, ketua_block: 0, admin: 0, super_admin: 0 };
    (users ?? []).forEach((u) => (c[u.role] += 1));
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (tab !== "all") list = list.filter((u) => u.role === tab);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((u) => {
        const meta = userMeta(u);
        return (
          u.nama.toLowerCase().includes(term) ||
          meta.ident.toLowerCase().includes(term) ||
          (meta.extra?.toLowerCase().includes(term) ?? false)
        );
      });
    }
    return [...list].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [users, tab, q]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "all", label: "Semua", count: users?.length },
    { id: "student", label: ROLE_LABEL.student, count: counts.student },
    { id: "ketua_block", label: ROLE_LABEL.ketua_block, count: counts.ketua_block },
    { id: "admin", label: ROLE_LABEL.admin, count: counts.admin },
    { id: "super_admin", label: ROLE_LABEL.super_admin, count: counts.super_admin },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        desc="Kelola seluruh akun: mahasiswa, ketua block, admin, dan super admin."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, NRP, atau NIK…"
            className="pl-9"
          />
        </div>
      </div>

      {!users ? (
        <CenterSpinner label="Memuat pengguna…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Tidak ada pengguna"
          desc={q ? "Tidak ada hasil untuk pencarian ini." : "Belum ada pengguna pada kategori ini."}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" /> Tambah Pengguna
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {filtered.map((u) => {
            const meta = userMeta(u);
            const Icon = ROLE_ICON[u.role];
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60">
                <Avatar name={u.nama} className="h-10 w-10 shrink-0 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{u.nama}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {meta.ident}
                    {meta.extra && <span className="text-ink-faint"> · {meta.extra}</span>}
                  </p>
                </div>
                <Badge tone={ROLE_TONE[u.role]} className="shrink-0">
                  <Icon className="h-3.5 w-3.5" /> {ROLE_LABEL[u.role]}
                </Badge>
              </div>
            );
          })}
        </Card>
      )}

      <AddUserModal
        open={addOpen}
        defaultRole={tab === "all" ? "student" : tab}
        onClose={() => setAddOpen(false)}
        onCreated={load}
      />
    </div>
  );
}

const ROLE_CHOICES: Role[] = ["student", "ketua_block", "admin", "super_admin"];

function AddUserModal({
  open,
  defaultRole,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultRole: Role;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [nama, setNama] = useState("");
  const [nrp, setNrp] = useState("");
  const [semester, setSemester] = useState("1");
  const [nik, setNik] = useState("");
  const [jenisBlock, setJenisBlock] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  // reset form tiap kali modal dibuka
  useEffect(() => {
    if (open) {
      setRole(defaultRole);
      setNama("");
      setNrp("");
      setSemester("1");
      setNik("");
      setJenisBlock("");
      setPassword("");
      setErr({});
    }
  }, [open, defaultRole]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama wajib diisi.";
    if (!password.trim()) e.password = "Password wajib diisi.";
    else if (password.length < 4) e.password = "Minimal 4 karakter.";
    if (role === "student") {
      if (!nrp.trim()) e.nrp = "NRP wajib diisi.";
      if (!semester || Number(semester) < 1) e.semester = "Semester tidak valid.";
    } else {
      if (!nik.trim()) e.nik = "NIK wajib diisi.";
      if (role === "ketua_block" && !jenisBlock.trim()) e.jenisBlock = "Jenis block wajib diisi.";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { role, nama: nama.trim(), password };
      if (role === "student") {
        payload.nrp = nrp.trim();
        payload.semester = Number(semester);
      } else if (role === "ketua_block") {
        payload.nik = nik.trim();
        payload.jenisBlock = jenisBlock.trim();
        payload.blockIds = [];
      } else {
        payload.nik = nik.trim();
      }
      await api.createUser(payload as Parameters<typeof api.createUser>[0]);
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Tambah Pengguna"
      desc="Pilih peran, lalu lengkapi data sesuai peran tersebut."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} loading={saving}>
            <Plus className="h-4 w-4" /> Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Peran">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLE_CHOICES.map((r) => {
              const Icon = ROLE_ICON[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-line text-ink-soft hover:border-ink-faint hover:text-ink",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {ROLE_LABEL[r]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Nama Lengkap" error={err.nama}>
          <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth. dr. Andi Pratama" />
        </Field>

        {role === "student" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NRP" error={err.nrp}>
              <Input value={nrp} onChange={(e) => setNrp(e.target.value)} placeholder="cth. 2021010123" />
            </Field>
            <Field label="Semester" error={err.semester}>
              <Input
                type="number"
                min={1}
                max={14}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </Field>
          </div>
        )}

        {role === "ketua_block" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NIK" error={err.nik}>
              <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="cth. 198703152015041002" />
            </Field>
            <Field label="Jenis Block" error={err.jenisBlock} hint="Bidang block yang dipegang.">
              <Input value={jenisBlock} onChange={(e) => setJenisBlock(e.target.value)} placeholder="cth. Kardiovaskular" />
            </Field>
          </div>
        )}

        {(role === "admin" || role === "super_admin") && (
          <Field label="NIK" error={err.nik}>
            <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="cth. 198703152015041002" />
          </Field>
        )}

        <Field label="Password" error={err.password} hint="Dipakai untuk login non-SSO / akun internal.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 4 karakter"
          />
        </Field>

        {role === "ketua_block" && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-faint">
            Penugasan block ke ketua dilakukan saat membuat / mengelola block pada menu <b>Block Ujian</b>.
          </p>
        )}
      </div>
    </Modal>
  );
}
