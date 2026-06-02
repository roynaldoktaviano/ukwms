"use client";

import { BookOpen, Database, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Card, CenterSpinner, EmptyState, Input, Select } from "@/components/ui";
import { QuestionView } from "@/components/question-view";
import { api } from "@/lib/api";
import type { Block, Question } from "@/lib/types";

export default function BankSoalPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockId, setBlockId] = useState("all");
  const [bidang, setBidang] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.bankSoal().then(setQuestions);
    api.listBlocks().then(setBlocks);
  }, []);

  const blockMap = useMemo(() => Object.fromEntries(blocks.map((b) => [b.id, b])), [blocks]);
  const bidangList = useMemo(() => Array.from(new Set((questions ?? []).map((x) => x.bidangIlmu))).sort(), [questions]);

  const filtered = useMemo(() =>
    (questions ?? []).filter((x) =>
      (blockId === "all" || x.blockId === blockId) &&
      (bidang === "all" || x.bidangIlmu === bidang) &&
      (q === "" || x.pertanyaan.toLowerCase().includes(q.toLowerCase())),
    ), [questions, blockId, bidang, q]);

  // kelompokkan per block
  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    filtered.forEach((x) => { (map[x.blockId] ??= []).push(x); });
    return Object.entries(map);
  }, [filtered]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Bank Soal" desc="Seluruh soal dari semua block yang diinput oleh admin." />

      {!questions ? (
        <CenterSpinner label="Memuat bank soal…" />
      ) : (
        <>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-3">
              <Select value={blockId} onChange={(e) => setBlockId(e.target.value)} className="text-[13px]">
                <option value="all">Semua block</option>
                {blocks.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
              </Select>
              <Select value={bidang} onChange={(e) => setBidang(e.target.value)} className="text-[13px]">
                <option value="all">Semua bidang ilmu</option>
                {bidangList.map((b) => <option key={b} value={b}>{b}</option>)}
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
              {grouped.map(([bid, qs]) => (
                <section key={bid} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-lg text-ink">{blockMap[bid]?.nama ?? "Block"}</h2>
                    <Badge tone="neutral">{blockMap[bid]?.kode}</Badge>
                    <span className="text-sm text-ink-faint">· {qs.length} soal</span>
                  </div>
                  <div className="space-y-3">
                    {qs.map((question, i) => <QuestionView key={question.id} q={question} index={i + 1} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
