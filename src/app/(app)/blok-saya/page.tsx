"use client";

import {
  BookOpen,
  ClipboardList,
  Database,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { QuestionView } from "@/components/question-view";
import { Badge, Card, CenterSpinner, EmptyState, Select, Tabs } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { Block, Department, Employee, Exam, LiveStudentProgress, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BlokSayaPage() {
  const { user } = useAuth();
  const coordinator = user as Employee | null;
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeBlock, setActiveBlock] = useState<string>("");
  const [tab, setTab] = useState<"soal" | "nilai">("soal");

  useEffect(() => {
    if (!coordinator) return;
    const ids = coordinator.coordinatedBlockIds ?? [];
    api.listBlocks().then((all) => {
      const mine = all.filter((b) => ids.includes(b.id));
      setBlocks(mine);
      if (mine[0]) setActiveBlock(mine[0].id);
    });
    api.listDepartments().then(setDepartments);
  }, [coordinator]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!coordinator) return null;

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Blok Saya" desc="Tinjau soal dan nilai mahasiswa pada block yang Anda koordinasi." />

      {!blocks ? (
        <CenterSpinner label="Memuat block…" />
      ) : blocks.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-8 w-8" />} title="Belum ada block" desc="Anda belum ditugaskan sebagai koordinator pada block manapun." />
      ) : (
        <>
          <Tabs tabs={blocks.map((b) => ({ id: b.id, label: b.nama }))} value={activeBlock} onChange={setActiveBlock} />

          {blocks
            .filter((b) => b.id === activeBlock)
            .map((b) => (
              <div key={b.id} className="space-y-5">
                <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-5 py-3.5 text-sm text-ink-soft">
                  <Badge tone="neutral">{b.kode}</Badge>
                  <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-ink-faint" /> Semester {b.semester}</span>
                  <span className="inline-flex items-center gap-1.5"><Database className="h-4 w-4 text-ink-faint" /> {b.jumlahSoal} soal</span>
                </div>

                {/* Departemen yang dicakup */}
                {b.departmentIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-ink-soft">Departemen:</span>
                    {b.departmentIds.map((did) => (
                      <Badge key={did} tone="primary">{deptMap[did]?.nama ?? did}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
                  <SubTab active={tab === "soal"} onClick={() => setTab("soal")} icon={ClipboardList} label="Soal" />
                  <SubTab active={tab === "nilai"} onClick={() => setTab("nilai")} icon={GraduationCap} label="Nilai Mahasiswa" />
                </div>

                {tab === "soal" ? <SoalList blockId={b.id} deptMap={deptMap} /> : <NilaiBlock blockId={b.id} />}
              </div>
            ))}
        </>
      )}
    </div>
  );
}

function SubTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink")}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function SoalList({ blockId, deptMap }: { blockId: string; deptMap: Record<string, Department> }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  useEffect(() => { setQuestions(null); api.listQuestions(blockId).then(setQuestions); }, [blockId]);

  if (!questions) return <CenterSpinner label="Memuat soal…" />;
  if (questions.length === 0) return (
    <EmptyState icon={<Database className="h-8 w-8" />} title="Belum ada soal" desc="Belum ada soal di bank soal untuk departemen block ini." />
  );
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionView key={q.id} q={q} departmentNama={deptMap[q.departmentId]?.nama} />
      ))}
    </div>
  );
}

function NilaiBlock({ blockId }: { blockId: string }) {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState<LiveStudentProgress[] | null>(null);

  useEffect(() => {
    setExams(null); setExamId(""); setRows(null);
    api.listExams().then((all) => {
      const inBlock = all.filter((e) => e.blockId === blockId);
      setExams(inBlock);
      if (inBlock[0]) setExamId(inBlock[0].id);
    });
  }, [blockId]);

  useEffect(() => {
    if (!examId) return;
    setRows(null);
    api.liveStudents(examId).then(setRows);
  }, [examId]);

  const exam = useMemo(() => exams?.find((e) => e.id === examId), [exams, examId]);

  if (!exams) return <CenterSpinner label="Memuat ujian…" />;
  if (exams.length === 0) return <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="Belum ada ujian" desc="Belum ada ujian yang dibuat untuk block ini." />;

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.nama} · {e.examType}</option>)}
        </Select>
      </div>

      {!rows ? (
        <CenterSpinner label="Memuat nilai…" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3 font-medium">Mahasiswa</th>
                  <th className="px-4 py-3 font-medium">NRP</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Benar</th>
                  <th className="px-4 py-3 text-right font-medium">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const nilai = Math.round((r.benar / (r.total || 1)) * 100);
                  const done = r.status === "submitted";
                  const lulus = exam ? nilai >= exam.nilaiMinimum : false;
                  return (
                    <tr key={r.studentId}>
                      <td className="px-4 py-3 font-medium text-ink">{r.nama}</td>
                      <td className="px-4 py-3 text-ink-soft">{r.nrp}</td>
                      <td className="px-4 py-3">
                        {done ? <Badge tone="success">Selesai</Badge>
                          : r.status === "in_progress" ? <Badge tone="warn">Mengerjakan</Badge>
                          : <Badge tone="neutral">Belum mulai</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center text-ink-soft">{r.benar}/{r.total}</td>
                      <td className="px-4 py-3 text-right">
                        {done ? (
                          <span className={cn("font-display text-lg", lulus ? "text-success" : "text-danger")}>{nilai}</span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
