"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutGrid,
  Loader2,
  Lock,
  Maximize,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand";
import { Button, Modal } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { AssignedExam, OptionLabel, Student } from "@/lib/types";
import { cn, fmtClock } from "@/lib/utils";

type Phase = "loading" | "gate" | "exam" | "submitting";

export default function ExamRunnerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const student = user as Student | null;

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<AssignedExam | null>(null);
  const [answers, setAnswers] = useState<Record<string, OptionLabel>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [sisa, setSisa] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // pelanggaran (keluar fullscreen / pindah tab)
  const [violations, setViolations] = useState(0);
  const [warnOpen, setWarnOpen] = useState(false);
  const [fsLost, setFsLost] = useState(false);
  const examActive = useRef(false);

  // ---------- muat data + attempt ----------
  useEffect(() => {
    if (loading) return;
    if (!student) {
      router.replace("/login");
      return;
    }
    (async () => {
      const assigned = await api.assignedExam(id, student.id);
      const attempt = await api.startAttempt(id, student.id);
      setData(assigned);
      setAnswers(attempt.jawaban ?? {});
      setSisa(attempt.sisaDetik ?? assigned.exam.durasiMenit * 60);
      setPhase("gate");
    })();
  }, [id, student, loading, router]);

  // ---------- submit ----------
  const submit = useCallback(async () => {
    if (!student || phase === "submitting") return;
    setPhase("submitting");
    examActive.current = false;
    try {
      await api.submitAttempt(id, student.id);
    } finally {
      document.body.classList.remove("exam-locked");
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      router.replace(`/exam/${id}/selesai`);
    }
  }, [id, student, phase, router]);

  // ---------- timer ----------
  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      setSisa((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, submit]);

  // ---------- proteksi safe-browser ----------
  useEffect(() => {
    if (phase !== "exam") return;

    const onVisibility = () => {
      if (document.hidden && examActive.current) bump();
    };
    const onBlur = () => {
      if (examActive.current) bump();
    };
    const onFsChange = () => {
      const out = !document.fullscreenElement;
      setFsLost(out);
      if (out && examActive.current) bump();
    };
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const combo = e.ctrlKey || e.metaKey;
      // blokir copy/paste/print/save/find/view-source & PrintScreen
      if ((combo && ["c", "v", "x", "p", "s", "u", "f", "a"].includes(k)) || k === "printscreen" || (combo && e.shiftKey && ["i", "j", "c"].includes(k)) || k === "f12") {
        e.preventDefault();
      }
    };
    const blockCtx = (e: MouseEvent) => e.preventDefault();

    const bump = () => {
      setViolations((v) => v + 1);
      setWarnOpen(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockCtx);

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockCtx);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [phase]);

  // ---------- mulai (gesture user) ----------
  async function enterExam() {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* sebagian browser memblokir; ujian tetap berjalan */
    }
    document.body.classList.add("exam-locked");
    examActive.current = true;
    setPhase("exam");
  }

  async function reenterFullscreen() {
    try {
      await document.documentElement.requestFullscreen?.();
      setFsLost(false);
    } catch {
      /* ignore */
    }
  }

  function choose(qid: string, label: OptionLabel) {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: label };
      if (student) api.saveAnswer(id, student.id, qid, label);
      return next;
    });
  }

  function toggleFlag(qid: string) {
    setFlags((f) => ({ ...f, [qid]: !f[qid] }));
  }

  // ============================ RENDER ============================
  if (phase === "loading" || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-ink-faint">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Menyiapkan soal ujian…</p>
        </div>
      </div>
    );
  }

  const { exam, soal } = data;
  const answered = Object.keys(answers).length;
  const q = soal[idx];

  // ---------- GATE: konfirmasi masuk mode aman ----------
  if (phase === "gate") {
    return (
      <div className="grid min-h-screen place-items-center bg-nav px-4 py-10 text-nav-text">
        <div className="w-full max-w-lg animate-scale-in rounded-2xl border border-nav-line bg-nav-soft p-8 shadow-pop">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <p className="font-display text-lg">{exam.nama}</p>
              <p className="text-sm text-nav-muted">{exam.blockNama}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl bg-black/20 p-4 text-center">
            <Stat label="Soal" value={`${soal.length}`} />
            <Stat label="Durasi" value={fmtClock(sisa)} />
            <Stat label="KKM" value={`${exam.nilaiMinimum}`} />
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-nav-text"><ShieldCheck className="h-4 w-4 text-accent" /> Mode Ujian Aman</p>
            <Rule>Ujian berjalan dalam layar penuh. Soal Anda telah diacak.</Rule>
            <Rule>Jangan berpindah tab atau keluar dari layar penuh — aktivitas tersebut terekam.</Rule>
            <Rule>Anda bebas berpindah antar nomor untuk memeriksa jawaban sebelum mengumpulkan.</Rule>
            <Rule>Salin–tempel, klik kanan, dan pintasan tertentu dinonaktifkan.</Rule>
          </div>

          <Button onClick={enterExam} size="lg" className="mt-7 w-full">
            <Maximize className="h-4 w-4" /> Masuk Mode Ujian
          </Button>
          <button onClick={() => router.replace("/ujian")} className="mt-3 w-full text-center text-sm text-nav-muted hover:text-nav-text">
            Kembali ke daftar ujian
          </button>
        </div>
      </div>
    );
  }

  // ---------- EXAM ----------
  const low = sisa <= 60;
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* top bar ujian */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
        <Lock className="h-4 w-4 text-primary" />
        <p className="truncate text-sm font-medium text-ink">{exam.nama}</p>
        <span className="hidden text-xs text-ink-faint sm:inline">· Mode Aman</span>

        <div className="ml-auto flex items-center gap-3">
          {violations > 0 && (
            <span className="hidden items-center gap-1 text-xs font-medium text-danger sm:flex">
              <AlertTriangle className="h-3.5 w-3.5" /> {violations} pelanggaran
            </span>
          )}
          <div className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
            low ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary")}>
            <TimerReset className="h-4 w-4" />
            {fmtClock(sisa)}
          </div>
          <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setShowGrid(true)}>
            <LayoutGrid className="h-4 w-4" /> {answered}/{soal.length}
          </Button>
          <Button size="sm" onClick={() => setConfirmSubmit(true)}>Kumpulkan</Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* kolom soal */}
        <main className="min-w-0 flex-1">
          <div key={q.id} className="animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm text-ink-soft">Soal {idx + 1} dari {soal.length}</span>
              <button
                onClick={() => toggleFlag(q.id)}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  flags[q.id] ? "bg-warn-soft text-warn" : "text-ink-faint hover:bg-black/5")}>
                <Flag className="h-3.5 w-3.5" /> {flags[q.id] ? "Ditandai ragu" : "Tandai ragu"}
              </button>
            </div>

            <p className="selectable text-[17px] leading-relaxed text-ink">{q.pertanyaan}</p>
            <span className="mt-2 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink-faint">{q.difficulty}</span>

            {q.gambarSoal && (
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.gambarSoal} alt="Gambar soal" className="mx-auto max-h-72 w-auto" />
              </div>
            )}

            {/* pilihan */}
            <div className="mt-6 space-y-2.5">
              {q.pilihan.map((opt) => {
                const active = answers[q.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => choose(q.id, opt.label)}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all",
                      active ? "border-primary bg-primary-soft shadow-sm" : "border-line bg-surface hover:border-ink-faint hover:bg-surface-2",
                    )}>
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-semibold",
                      active ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-ink-soft")}>
                      {opt.label}
                    </span>
                    {opt.gambar ? (
                      <span className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opt.gambar} alt={`Pilihan ${opt.label}`} className="h-20 w-auto rounded-lg border border-line bg-white" />
                        {opt.teks && <span className="text-sm text-ink">{opt.teks}</span>}
                      </span>
                    ) : (
                      <span className="text-[15px] text-ink">{opt.teks}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* navigasi prev/next */}
            <div className="mt-7 flex items-center justify-between">
              <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              {idx === soal.length - 1 ? (
                <Button onClick={() => setConfirmSubmit(true)}>Selesai & Kumpulkan</Button>
              ) : (
                <Button variant="outline" onClick={() => setIdx((i) => Math.min(soal.length - 1, i + 1))}>
                  Berikutnya <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* navigasi nomor (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <NavGrid soal={soal} answers={answers} flags={flags} current={idx} onPick={setIdx} answered={answered} />
          </div>
        </aside>
      </div>

      {/* drawer navigasi (mobile) */}
      {showGrid && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowGrid(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-pop animate-fade-up">
            <NavGrid soal={soal} answers={answers} flags={flags} current={idx} answered={answered}
              onPick={(i) => { setIdx(i); setShowGrid(false); }} />
          </div>
        </div>
      )}

      {/* overlay: keluar fullscreen */}
      {fsLost && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-nav/95 px-4 text-center text-nav-text backdrop-blur">
          <div className="max-w-sm">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warn" />
            <h2 className="font-display text-xl">Anda keluar dari layar penuh</h2>
            <p className="mt-2 text-sm text-nav-muted">Aktivitas ini tercatat ({violations} pelanggaran). Kembali ke layar penuh untuk melanjutkan ujian.</p>
            <Button onClick={reenterFullscreen} size="lg" className="mt-6 w-full"><Maximize className="h-4 w-4" /> Kembali ke Layar Penuh</Button>
          </div>
        </div>
      )}

      {/* peringatan pelanggaran */}
      <Modal open={warnOpen && !fsLost} onClose={() => setWarnOpen(false)} size="sm" title="Peringatan">
        <div className="flex gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-warn" />
          <p className="text-sm text-ink-soft">
            Sistem mendeteksi Anda berpindah dari halaman ujian. Pelanggaran ke-<b>{violations}</b> ini terekam dan dapat dilaporkan ke pengawas. Tetap berada di halaman ujian.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setWarnOpen(false)}>Saya mengerti</Button>
        </div>
      </Modal>

      {/* konfirmasi kumpulkan */}
      <Modal
        open={confirmSubmit}
        onClose={() => phase !== "submitting" && setConfirmSubmit(false)}
        size="sm"
        title="Kumpulkan jawaban?"
        desc="Setelah dikumpulkan, jawaban tidak dapat diubah."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)} disabled={phase === "submitting"}>Periksa lagi</Button>
            <Button onClick={submit} loading={phase === "submitting"}>Ya, kumpulkan</Button>
          </>
        }>
        <div className="rounded-xl bg-surface-2 p-4 text-sm">
          <Row label="Terjawab" value={`${answered} soal`} tone={answered === soal.length ? "ok" : undefined} />
          <Row label="Belum dijawab" value={`${soal.length - answered} soal`} tone={soal.length - answered > 0 ? "warn" : undefined} />
          <Row label="Ditandai ragu" value={`${Object.values(flags).filter(Boolean).length} soal`} />
          <Row label="Sisa waktu" value={fmtClock(sisa)} />
        </div>
        {soal.length - answered > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-warn">
            <AlertTriangle className="h-3.5 w-3.5" /> Masih ada soal yang belum dijawab.
          </p>
        )}
      </Modal>
    </div>
  );
}

// ----------------------------- sub-komponen -----------------------------
function NavGrid({ soal, answers, flags, current, onPick, answered }: {
  soal: AssignedExam["soal"]; answers: Record<string, OptionLabel>; flags: Record<string, boolean>;
  current: number; onPick: (i: number) => void; answered: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Navigasi Soal</p>
        <span className="text-xs text-ink-faint">{answered}/{soal.length}</span>
      </div>
      <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
        {soal.map((s, i) => {
          const done = !!answers[s.id];
          const flag = !!flags[s.id];
          const here = i === current;
          return (
            <button key={s.id} onClick={() => onPick(i)}
              className={cn(
                "relative grid h-9 w-full place-items-center rounded-lg border text-sm font-medium transition-all",
                here ? "border-primary ring-2 ring-primary/30" : "border-line",
                done ? "bg-primary text-white" : "bg-surface-2 text-ink-soft hover:border-ink-faint",
              )}>
              {i + 1}
              {flag && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warn ring-2 ring-surface" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5 text-xs text-ink-soft">
        <Legend className="bg-primary" label="Sudah dijawab" />
        <Legend className="bg-surface-2 border border-line" label="Belum dijawab" />
        <Legend className="bg-warn" label="Ditandai ragu" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded", className)} /> {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg text-nav-text">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-nav-muted">{label}</p>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-nav-muted">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> <span>{children}</span>
    </p>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ink-soft">{label}</span>
      <span className={cn("font-medium", tone === "ok" ? "text-success" : tone === "warn" ? "text-warn" : "text-ink")}>{value}</span>
    </div>
  );
}
