import {
  allUsers,
  attempts as seedAttempts,
  blocks as seedBlocks,
  departments as seedDepartments,
  exams as seedExams,
  periods as seedPeriods,
  questions as seedQuestions,
  students,
} from "./mock-data";
import { sleep } from "./utils";
import type {
  AssignedExam,
  Attempt,
  Block,
  Department,
  Employee,
  Exam,
  LiveQuestionProgress,
  LiveStudentProgress,
  OptionLabel,
  Period,
  Question,
  ResultSummary,
  Role,
  Student,
  User,
} from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// =====================================================================
//  REAL MODE
// =====================================================================
function token(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )cbt_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${path}`);
  return (await res.json()) as T;
}

// =====================================================================
//  MOCK MODE — DB in-memory
// =====================================================================
const db = {
  periods: structuredClone(seedPeriods) as Period[],
  departments: structuredClone(seedDepartments) as Department[],
  blocks: structuredClone(seedBlocks) as Block[],
  questions: structuredClone(seedQuestions) as Question[],
  exams: structuredClone(seedExams) as Exam[],
  attempts: structuredClone(seedAttempts) as Attempt[],
  users: structuredClone(allUsers) as User[],
};

// Shuffle deterministik per mahasiswa+ujian
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h, 48271) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Soal untuk satu ujian — BLOCK: semua dept di block, PRACTICUM: dept spesifik
function examQuestions(exam: Exam): Question[] {
  if (exam.examType === "PRACTICUM" && exam.departmentId) {
    return db.questions.filter((q) => q.departmentId === exam.departmentId);
  }
  const block = db.blocks.find((b) => b.id === exam.blockId);
  const deptIds = new Set(block?.departmentIds ?? []);
  return db.questions.filter((q) => deptIds.has(q.departmentId));
}

function assignedFor(examId: string, studentId: string): AssignedExam {
  const exam = db.exams.find((e) => e.id === examId)!;
  const student = db.users.find((u) => u.id === studentId) as Student;
  const pool = examQuestions(exam);
  const picked = seededShuffle(pool, examId + studentId).slice(0, Math.min(exam.jumlahSoal, pool.length));
  return { exam, student, soal: picked };
}

function scoreAttempt(exam: Exam, a: Attempt) {
  const soal = assignedFor(exam.id, a.studentId).soal;
  let benar = 0, dikerjakan = 0;
  for (const q of soal) {
    const j = a.jawaban[q.id];
    if (j) { dikerjakan++; if (j === q.jawabanBenar) benar++; }
  }
  const total = soal.length || 1;
  return {
    total, dikerjakan, benar, salah: dikerjakan - benar,
    nilai: Math.round((benar / total) * 100),
    persen: Math.round((dikerjakan / total) * 100),
    estimasi: dikerjakan ? Math.round((benar / dikerjakan) * 100) : 0,
  };
}

// Simulasi "live" — dorong beberapa peserta maju tiap poll
function tickLive(examId: string) {
  const exam = db.exams.find((e) => e.id === examId);
  if (!exam || exam.status !== "IN_PROGRESS") return;
  for (const a of db.attempts.filter((x) => x.examId === examId && x.status === "in_progress")) {
    const soal = assignedFor(examId, a.studentId).soal;
    const unanswered = soal.filter((q) => !a.jawaban[q.id]);
    if (unanswered.length && Math.random() < 0.55) {
      const q = unanswered[0];
      a.jawaban[q.id] = Math.random() < 0.72 ? q.jawabanBenar : (["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)] as OptionLabel);
    }
    if (a.sisaDetik) a.sisaDetik = Math.max(0, a.sisaDetik - 6 - Math.floor(Math.random() * 8));
  }
}

// =====================================================================
//  PUBLIC API
// =====================================================================
export const api = {
  // ---------------- AUTH ----------------
  // REAL: GET /auth/me
  async me(): Promise<User | null> {
    if (!USE_MOCK) {
      try { return await http<User>("/auth/me"); } catch { return null; }
    }
    await sleep(120);
    const uid = typeof document !== "undefined" ? document.cookie.match(/cbt_uid=([^;]+)/)?.[1] : null;
    return uid ? db.users.find((u) => u.id === decodeURIComponent(uid)) ?? null : null;
  },

  async devLogin(userId: string): Promise<User> {
    await sleep(200);
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new Error("User tidak ditemukan");
    return u;
  },

  // ---------------- PERIODE ----------------
  // REAL: GET /periods · POST /periods · POST /periods/{id}/activate
  async listPeriods(): Promise<Period[]> {
    if (!USE_MOCK) return http("/periods");
    await sleep(150);
    return structuredClone(db.periods);
  },
  async createPeriod(p: Pick<Period, "nama" | "tahun">): Promise<Period> {
    if (!USE_MOCK) return http("/periods", { method: "POST", body: JSON.stringify(p) });
    await sleep(200);
    const period: Period = { id: `p-${Date.now()}`, status: "draft", ...p };
    db.periods.push(period);
    return period;
  },
  async activatePeriod(id: string): Promise<{ semesterBumped: boolean }> {
    if (!USE_MOCK) return http(`/periods/${id}/activate`, { method: "POST" });
    await sleep(300);
    const next = db.periods.find((p) => p.id === id);
    if (!next) throw new Error("Periode tidak ditemukan");
    const current = db.periods.find((p) => p.status === "active");
    let bumped = false;
    if (current && current.id !== id) {
      current.status = "closed";
      (db.users.filter((u) => u.role === "student") as Student[]).forEach((s) => (s.semester += 1));
      bumped = true;
    }
    next.status = "active";
    next.activatedAt = new Date().toISOString();
    return { semesterBumped: bumped };
  },

  // ---------------- DEPARTEMEN ----------------
  // REAL: GET /departments
  async listDepartments(): Promise<Department[]> {
    if (!USE_MOCK) return http("/departments");
    await sleep(120);
    return structuredClone(db.departments);
  },

  // ---------------- BLOCK ----------------
  // REAL: GET /blocks · GET /blocks/{id} · POST /blocks · PATCH /blocks/{id}
  async listBlocks(): Promise<Block[]> {
    if (!USE_MOCK) return http("/blocks");
    await sleep(150);
    // update jumlahSoal dari questions di departmentIds block
    return structuredClone(db.blocks.map((b) => {
      const deptIds = new Set(b.departmentIds);
      const count = db.questions.filter((q) => deptIds.has(q.departmentId)).length;
      return { ...b, jumlahSoal: count };
    }));
  },
  async getBlock(id: string): Promise<Block> {
    if (!USE_MOCK) return http(`/blocks/${id}`);
    await sleep(120);
    const b = db.blocks.find((b) => b.id === id)!;
    const deptIds = new Set(b.departmentIds);
    return structuredClone({ ...b, jumlahSoal: db.questions.filter((q) => deptIds.has(q.departmentId)).length });
  },
  async createBlock(b: Omit<Block, "id" | "jumlahSoal">): Promise<Block> {
    if (!USE_MOCK) return http("/blocks", { method: "POST", body: JSON.stringify(b) });
    await sleep(250);
    const block: Block = { id: `blk-${Date.now()}`, jumlahSoal: 0, ...b };
    db.blocks.push(block);
    return block;
  },

  // ---------------- SOAL (Bank Soal) ----------------
  // REAL: GET /questions?departmentId=&difficulty=
  //       GET /questions · POST /questions · PATCH /questions/{id} · DELETE /questions/{id}
  //       POST /questions/import (multipart)

  // Soal semua / difilter per block (menggunakan departmentIds block)
  async listQuestions(blockId?: string): Promise<Question[]> {
    if (!USE_MOCK) return http(`/questions${blockId ? `?blockId=${blockId}` : ""}`);
    await sleep(150);
    if (blockId) {
      const block = db.blocks.find((b) => b.id === blockId);
      if (!block) return [];
      const deptIds = new Set(block.departmentIds);
      return structuredClone(db.questions.filter((q) => deptIds.has(q.departmentId)));
    }
    return structuredClone(db.questions);
  },
  async bankSoal(): Promise<Question[]> {
    if (!USE_MOCK) return http("/questions");
    await sleep(180);
    return structuredClone(db.questions);
  },
  async createQuestion(q: Omit<Question, "id" | "nomor">): Promise<Question> {
    if (!USE_MOCK) return http("/questions", { method: "POST", body: JSON.stringify(q) });
    await sleep(200);
    const nomor = db.questions.filter((x) => x.departmentId === q.departmentId).length + 1;
    const created: Question = { id: `q-${Date.now()}`, nomor, ...q };
    db.questions.push(created);
    return created;
  },
  async updateQuestion(id: string, patch: Partial<Question>): Promise<Question> {
    if (!USE_MOCK) return http(`/questions/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await sleep(180);
    const idx = db.questions.findIndex((q) => q.id === id);
    db.questions[idx] = { ...db.questions[idx], ...patch };
    return structuredClone(db.questions[idx]);
  },
  async deleteQuestion(id: string): Promise<void> {
    if (!USE_MOCK) return http(`/questions/${id}`, { method: "DELETE" });
    await sleep(150);
    db.questions = db.questions.filter((x) => x.id !== id);
  },
  async importQuestionsPreview(_blockId: string, _file: File): Promise<Omit<Question, "id" | "nomor">[]> {
    if (!USE_MOCK) {
      const fd = new FormData();
      fd.append("file", _file);
      const res = await fetch(`${API_URL}/questions/import?preview=1&blockId=${_blockId}`, {
        method: "POST",
        headers: token() ? { Authorization: `Bearer ${token()}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error("Gagal mengunggah file");
      return res.json();
    }
    await sleep(700);
    return [
      { departmentId: "dept-fis", difficulty: "MEDIUM", pertanyaan: "(dari file) Curah jantung (cardiac output) ditentukan oleh stroke volume dan ...?", jawabanBenar: "A", pilihan: [{ label: "A", teks: "Heart rate" }, { label: "B", teks: "Tekanan vena" }, { label: "C", teks: "Suhu tubuh" }, { label: "D", teks: "pH darah" }, { label: "E", teks: "Hematokrit" }] },
      { departmentId: "dept-ana", difficulty: "EASY", pertanyaan: "(dari file) Bunyi jantung S1 dihasilkan oleh penutupan katup ...?", jawabanBenar: "B", pilihan: [{ label: "A", teks: "Semilunar" }, { label: "B", teks: "Atrioventrikular" }, { label: "C", teks: "Aorta" }, { label: "D", teks: "Pulmonal" }, { label: "E", teks: "Eustachian" }] },
    ];
  },

  // ---------------- UJIAN ----------------
  // REAL: GET /exams · GET /exams/{id} · POST /exams · PATCH /exams/{id}
  async listExams(): Promise<Exam[]> {
    if (!USE_MOCK) return http("/exams");
    await sleep(150);
    return structuredClone(db.exams);
  },
  async getExam(id: string): Promise<Exam> {
    if (!USE_MOCK) return http(`/exams/${id}`);
    await sleep(120);
    return structuredClone(db.exams.find((e) => e.id === id)!);
  },
  async createExam(e: Omit<Exam, "id" | "status" | "lihatHasil" | "blockNama" | "departmentNama">): Promise<Exam> {
    if (!USE_MOCK) return http("/exams", { method: "POST", body: JSON.stringify(e) });
    await sleep(280);
    const blk = db.blocks.find((b) => b.id === e.blockId);
    const dept = e.departmentId ? db.departments.find((d) => d.id === e.departmentId) : undefined;
    const created: Exam = {
      id: `ex-${Date.now()}`, status: "DRAFT", lihatHasil: false,
      blockNama: blk?.nama ?? "", departmentNama: dept?.nama,
      ...e,
    };
    db.exams.push(created);
    return created;
  },
  async updateExamStatus(id: string, status: Exam["status"]): Promise<Exam> {
    if (!USE_MOCK) return http(`/exams/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await sleep(200);
    const e = db.exams.find((x) => x.id === id)!;
    e.status = status;
    if (status === "IN_PROGRESS") e.mulai = new Date().toISOString();
    return structuredClone(e);
  },
  async setLihatHasil(id: string, value: boolean): Promise<Exam> {
    if (!USE_MOCK) return http(`/exams/${id}`, { method: "PATCH", body: JSON.stringify({ lihatHasil: value }) });
    await sleep(160);
    const e = db.exams.find((x) => x.id === id)!;
    e.lihatHasil = value;
    return structuredClone(e);
  },

  // Soal acak untuk satu mahasiswa
  async assignedExam(examId: string, studentId: string): Promise<AssignedExam> {
    if (!USE_MOCK) return http(`/exams/${examId}/assigned?student=${studentId}`);
    await sleep(220);
    return structuredClone(assignedFor(examId, studentId));
  },

  // ---------------- ATTEMPT ----------------
  // REAL: POST /exams/{id}/start · PUT /exams/{id}/answer · POST /exams/{id}/submit
  async startAttempt(examId: string, studentId: string): Promise<Attempt> {
    if (!USE_MOCK) return http(`/exams/${examId}/start`, { method: "POST", body: JSON.stringify({ studentId }) });
    await sleep(200);
    let a = db.attempts.find((x) => x.examId === examId && x.studentId === studentId);
    const exam = db.exams.find((e) => e.id === examId)!;
    if (!a) {
      a = { examId, studentId, status: "in_progress", jawaban: {}, startedAt: new Date().toISOString(), sisaDetik: exam.durasiMenit * 60 };
      db.attempts.push(a);
    } else if (a.status === "not_started") {
      a.status = "in_progress";
      a.startedAt = new Date().toISOString();
      a.sisaDetik = exam.durasiMenit * 60;
    }
    return structuredClone(a);
  },
  async saveAnswer(examId: string, studentId: string, questionId: string, label: OptionLabel | null): Promise<void> {
    if (!USE_MOCK) {
      await http(`/exams/${examId}/answer`, { method: "PUT", body: JSON.stringify({ studentId, questionId, label }) });
      return;
    }
    await sleep(40);
    const a = db.attempts.find((x) => x.examId === examId && x.studentId === studentId);
    if (!a) return;
    if (label) a.jawaban[questionId] = label;
    else delete a.jawaban[questionId];
  },
  async submitAttempt(examId: string, studentId: string): Promise<void> {
    if (!USE_MOCK) {
      await http(`/exams/${examId}/submit`, { method: "POST", body: JSON.stringify({ studentId }) });
      return;
    }
    await sleep(300);
    const a = db.attempts.find((x) => x.examId === examId && x.studentId === studentId);
    if (a) { a.status = "submitted"; a.submittedAt = new Date().toISOString(); }
  },

  // ---------------- HASIL (mahasiswa) ----------------
  // REAL: GET /students/{id}/results
  async resultsForStudent(studentId: string): Promise<ResultSummary[]> {
    if (!USE_MOCK) return http(`/students/${studentId}/results`);
    await sleep(180);
    const out: ResultSummary[] = [];
    for (const e of db.exams.filter((x) => x.pesertaIds.includes(studentId))) {
      const a = db.attempts.find((x) => x.examId === e.id && x.studentId === studentId);
      const done = a?.status === "submitted";
      const sc = a ? scoreAttempt(e, a) : null;
      out.push({
        examId: e.id, examNama: e.nama, blockNama: e.blockNama,
        examType: e.examType, tanggal: a?.submittedAt,
        kkm: e.nilaiMinimum, dirilis: e.lihatHasil,
        status: !done ? "Belum Dikerjakan" : e.lihatHasil ? "Sudah Dikerjakan" : "Belum Dirilis",
        nilai: done && e.lihatHasil ? sc!.nilai : undefined,
        lulus: done && e.lihatHasil ? sc!.nilai >= e.nilaiMinimum : undefined,
      });
    }
    return out;
  },

  // ---------------- MONITORING LIVE (admin/proctor) ----------------
  // REAL: GET /exams/{id}/live/students · GET /exams/{id}/live/questions
  async liveStudents(examId: string): Promise<LiveStudentProgress[]> {
    if (!USE_MOCK) return http(`/exams/${examId}/live/students`);
    await sleep(120);
    tickLive(examId);
    const exam = db.exams.find((e) => e.id === examId)!;
    return exam.pesertaIds.map((sid) => {
      const s = db.users.find((u) => u.id === sid) as Student;
      const a = db.attempts.find((x) => x.examId === examId && x.studentId === sid);
      const sc = a ? scoreAttempt(exam, a) : { total: exam.jumlahSoal, dikerjakan: 0, benar: 0, salah: 0, persen: 0, estimasi: 0 };
      return {
        studentId: sid, nama: s.nama, nrp: s.nrp,
        status: a?.status ?? "not_started",
        dikerjakan: sc.dikerjakan, total: sc.total, benar: sc.benar, salah: sc.salah,
        persen: sc.persen, estimasiNilai: sc.estimasi, sisaDetik: a?.sisaDetik,
      };
    });
  },
  async liveQuestions(examId: string): Promise<LiveQuestionProgress[]> {
    if (!USE_MOCK) return http(`/exams/${examId}/live/questions`);
    await sleep(120);
    const exam = db.exams.find((e) => e.id === examId)!;
    const soal = examQuestions(exam).slice(0, exam.jumlahSoal);
    const sessions = db.attempts.filter((x) => x.examId === examId);
    const deptMap = Object.fromEntries(db.departments.map((d) => [d.id, d.nama]));
    return soal.map((q) => {
      let benar = 0, salah = 0, belum = 0;
      for (const a of sessions) {
        const j = a.jawaban[q.id];
        if (!j) belum++;
        else if (j === q.jawabanBenar) benar++;
        else salah++;
      }
      return {
        questionId: q.id, nomor: q.nomor,
        departmentNama: deptMap[q.departmentId] ?? q.departmentId,
        difficulty: q.difficulty,
        totalMengerjakan: benar + salah, benar, salah, belum,
      };
    });
  },

  // ---------------- USER ----------------
  // REAL: GET /users?role= · POST /users
  async listUsers(role?: Role): Promise<User[]> {
    if (!USE_MOCK) return http(`/users${role ? `?role=${role}` : ""}`);
    await sleep(160);
    return structuredClone(role ? db.users.filter((u) => u.role === role) : db.users);
  },
  async createUser(payload: Partial<User> & { role: Role }): Promise<User> {
    if (!USE_MOCK) return http("/users", { method: "POST", body: JSON.stringify(payload) });
    await sleep(240);
    const user = { id: `u-${Date.now()}`, ...(payload as object) } as User;
    db.users.push(user);
    return user;
  },

  async listStudents(): Promise<Student[]> {
    if (!USE_MOCK) return http("/users?role=student");
    await sleep(120);
    return structuredClone(db.users.filter((u) => u.role === "student") as Student[]);
  },

  // Daftar pegawai (untuk picker Proctor/IT Support saat buat ujian)
  async listEmployees(): Promise<Employee[]> {
    if (!USE_MOCK) return http("/employees");
    await sleep(120);
    return structuredClone(db.users.filter((u) => u.role !== "student") as Employee[]);
  },
};

export { students };
