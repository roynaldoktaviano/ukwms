"use client";

import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Crown,
  Database,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  Wifi,
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
  Select,
  Tabs,
} from "@/components/ui";
import { api } from "@/lib/api";
import { ROLE_LABEL, type CbtStaffRole, type CoordinatorRole, type Role, type User } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabId = "all" | Role;

// Icon per role
const ROLE_ICON: Record<Role, typeof Users> = {
  student: GraduationCap,
  BLOCK_COORDINATOR: BookOpen,
  DEPT_COORDINATOR: Database,
  ADMIN: Crown,
  EXAM_MANAGER: ClipboardList,
  QUESTION_MANAGER: Database,
  QUESTION_REVIEWER: ShieldCheck,
  ANALYTICS_VIEWER: BarChart3,
};

const ROLE_TONE: Record<Role, "primary" | "accent" | "warn" | "success" | "neutral" | "danger"> = {
  student: "primary",
  BLOCK_COORDINATOR: "accent",
  DEPT_COORDINATOR: "accent",
  ADMIN: "danger",
  EXAM_MANAGER: "warn",
  QUESTION_MANAGER: "success",
  QUESTION_REVIEWER: "neutral",
  ANALYTICS_VIEWER: "neutral",
};

function userMeta(u: User): { ident: string; extra?: string } {
  if (u.role === "student") return { ident: `NRP ${u.nrp}`, extra: `Semester ${u.semester}` };
  return { ident: `NIK ${u.nik}` };
}

const STAFF_ROLES: Role[] = ["ADMIN", "EXAM_MANAGER", "QUESTION_MANAGER", "QUESTION_REVIEWER", "ANALYTICS_VIEWER"];
const COORD_ROLES: Role[] = ["BLOCK_COORDINATOR", "DEPT_COORDINATOR"];

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  function load() { api.listUsers().then(setUsers); }
  useEffect(load, []);

  const counts = useMemo(() => {
    const c: Record<Role, number> = {
      student: 0, BLOCK_COORDINATOR: 0, DEPT_COORDINATOR: 0,
      ADMIN: 0, EXAM_MANAGER: 0, QUESTION_MANAGER: 0, QUESTION_REVIEWER: 0, ANALYTICS_VIEWER: 0,
    };
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
        return u.nama.toLowerCase().includes(term) || meta.ident.toLowerCase().includes(term);
      });
    }
    return [...list].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [users, tab, q]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "all", label: "Semua", count: users?.length },
    { id: "student", label: "Mahasiswa", count: counts.student },
    { id: "BLOCK_COORDINATOR", label: "Koord. Block", count: counts.BLOCK_COORDINATOR },
    { id: "DEPT_COORDINATOR", label: "Koord. Dept", count: counts.DEPT_COORDINATOR },
    { id: "ADMIN", label: "Admin", count: counts.ADMIN },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        desc="Kelola akun mahasiswa dan pegawai CBT. Koordinator berasal dari sinkronisasi Identity Service."
        actions={<Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" /> Tambah Pengguna</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, NRP, atau NIK…" className="pl-9" />
        </div>
      </div>

      {/* Info: koordinator dari Identity Service */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-ink">
        <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          <b>Koordinator Block & Departemen</b> disinkronisasi dari <b>Identity Service</b> —
          ditentukan oleh atribut karyawan di sistem kepegawaian, bukan oleh input manual di sini.
        </span>
      </div>

      {!users ? (
        <CenterSpinner label="Memuat pengguna…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Tidak ada pengguna"
          desc={q ? "Tidak ada hasil untuk pencarian ini." : "Belum ada pengguna pada kategori ini."}
          action={<Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" /> Tambah Pengguna</Button>}
        />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {filtered.map((u) => {
            const meta = userMeta(u);
            const Icon = ROLE_ICON[u.role];
            const isCoord = COORD_ROLES.includes(u.role);
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
                <div className="flex shrink-0 flex-wrap gap-1.5 justify-end">
                  <Badge tone={ROLE_TONE[u.role] as "primary" | "accent" | "warn" | "success" | "neutral"}>
                    <Icon className="h-3.5 w-3.5" /> {ROLE_LABEL[u.role]}
                  </Badge>
                  {isCoord && <Badge tone="neutral" className="text-[11px]">Identity Service</Badge>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={load}
      />
    </div>
  );
}

const CBT_ROLE_CHOICES: (CbtStaffRole | "student")[] = ["student", "ADMIN", "EXAM_MANAGER", "QUESTION_MANAGER", "QUESTION_REVIEWER", "ANALYTICS_VIEWER"];

function AddUserModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [role, setRole] = useState<Role>("student");
  const [nama, setNama] = useState("");
  const [nrp, setNrp] = useState("");
  const [semester, setSemester] = useState("1");
  const [nik, setNik] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) { setRole("student"); setNama(""); setNrp(""); setSemester("1"); setNik(""); setErr({}); }
  }, [open]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama wajib diisi.";
    if (role === "student") {
      if (!nrp.trim()) e.nrp = "NRP wajib diisi.";
      if (!semester || Number(semester) < 1) e.semester = "Semester tidak valid.";
    } else {
      if (!nik.trim()) e.nik = "NIK wajib diisi.";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { role, nama: nama.trim() };
      if (role === "student") {
        payload.nrp = nrp.trim();
        payload.semester = Number(semester);
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

  const roleIcons: Record<typeof CBT_ROLE_CHOICES[number], typeof Users> = {
    student: GraduationCap,
    ADMIN: Crown,
    EXAM_MANAGER: ClipboardList,
    QUESTION_MANAGER: Database,
    QUESTION_REVIEWER: ShieldCheck,
    ANALYTICS_VIEWER: BarChart3,
  };

  return (
    <Modal open={open} onClose={onClose} size="md"
      title="Tambah Pengguna"
      desc="Koordinator Block dan Departemen dikelola via Identity Service, bukan di sini."
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button><Button onClick={save} loading={saving}><Plus className="h-4 w-4" /> Simpan</Button></>}>
      <div className="space-y-4">
        <Field label="Role">
          <div className="grid grid-cols-3 gap-2">
            {CBT_ROLE_CHOICES.map((r) => {
              const Icon = roleIcons[r];
              const active = role === r;
              return (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors",
                    active ? "border-primary bg-primary-soft text-primary" : "border-line text-ink-soft hover:border-ink-faint hover:text-ink")}>
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
              <Input value={nrp} onChange={(e) => setNrp(e.target.value)} placeholder="cth. G1A021001" />
            </Field>
            <Field label="Semester" error={err.semester}>
              <Input type="number" min={1} max={14} value={semester} onChange={(e) => setSemester(e.target.value)} />
            </Field>
          </div>
        )}

        {role !== "student" && (
          <Field label="NIK" error={err.nik}>
            <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="cth. 198703152015041002" />
          </Field>
        )}

        {(role === "ADMIN" || role === "EXAM_MANAGER") && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-faint">
            Role <b>Admin CBT</b> dan <b>Manajer Ujian</b> memiliki akses ke Kelola Ujian dan Block Ujian.
          </p>
        )}
        {(role === "QUESTION_MANAGER" || role === "QUESTION_REVIEWER") && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-faint">
            Role <b>Manajer Soal</b> dapat menambah/edit soal. <b>Reviewer Soal</b> hanya dapat melihat.
          </p>
        )}
      </div>
    </Modal>
  );
}
