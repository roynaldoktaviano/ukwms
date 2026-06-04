// =====================================================================
// Tipe data inti — kontrak antara frontend dan backend Python.
// =====================================================================

// CBT-specific roles (hanya ada di CBT, bukan dari Identity Service)
export type CbtStaffRole =
  | "ADMIN"
  | "EXAM_MANAGER"
  | "QUESTION_MANAGER"
  | "QUESTION_REVIEWER"
  | "ANALYTICS_VIEWER";

// Block & Department Coordinator berasal dari Identity Service snapshot
export type CoordinatorRole = "BLOCK_COORDINATOR" | "DEPT_COORDINATOR";

// Semua role yang dikenali di sistem CBT
export type Role = "student" | CoordinatorRole | CbtStaffRole;

export const ROLE_LABEL: Record<Role, string> = {
  student: "Mahasiswa",
  BLOCK_COORDINATOR: "Koordinator Block",
  DEPT_COORDINATOR: "Koordinator Departemen",
  ADMIN: "Admin CBT",
  EXAM_MANAGER: "Manajer Ujian",
  QUESTION_MANAGER: "Manajer Soal",
  QUESTION_REVIEWER: "Reviewer Soal",
  ANALYTICS_VIEWER: "Analis",
};

export interface BaseUser {
  id: string;
  role: Role;
  nama: string;
}

// Mahasiswa — snapshot dari Identity Service
export interface Student extends BaseUser {
  role: "student";
  nrp: string;
  semester: number;
}

// Pegawai — snapshot dari Identity Service, dengan role CBT
export interface Employee extends BaseUser {
  role: Exclude<Role, "student">;
  nik: string;
  coordinatedBlockIds?: string[];      // untuk BLOCK_COORDINATOR
  coordinatedDepartmentIds?: string[]; // untuk DEPT_COORDINATOR
}

export type User = Student | Employee;

// ---------------------------------------------------------------------
// Difficulty soal
// ---------------------------------------------------------------------
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
};
export const DIFFICULTY_TONE: Record<QuestionDifficulty, "success" | "warn" | "danger"> = {
  EASY: "success",
  MEDIUM: "warn",
  HARD: "danger",
};

// ---------------------------------------------------------------------
// Tipe & status ujian
// ---------------------------------------------------------------------
export type ExamType = "BLOCK" | "PRACTICUM";
export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  BLOCK: "Block",
  PRACTICUM: "Praktikum",
};

// Lifecycle: DRAFT → READY → IN_PROGRESS → FINISHED
export type ExamStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "FINISHED";

// Assignment per ujian — Proctor & IT Support bukan role, hanya penugasan
export type AssignmentType = "PROCTOR" | "IT_SUPPORT";
export const ASSIGNMENT_LABEL: Record<AssignmentType, string> = {
  PROCTOR: "Pengawas",
  IT_SUPPORT: "IT Support",
};
export interface ExamAssignment {
  employeeId: string;
  employeeNama: string;
  type: AssignmentType;
}

// ---------------------------------------------------------------------
// Periode akademik
// ---------------------------------------------------------------------
export interface Period {
  id: string;
  nama: "Ganjil" | "Ganjil Perbaikan" | "Genap" | "Genap Perbaikan";
  tahun: string;
  status: "draft" | "active" | "closed";
  activatedAt?: string;
}

// ---------------------------------------------------------------------
// Departemen — snapshot dari Identity Service
// ---------------------------------------------------------------------
export interface Department {
  id: string;
  kode: string;
  nama: string;
  coordinatorEmployeeId?: string;
  coordinatorNama?: string;
}

// ---------------------------------------------------------------------
// Block — snapshot dari Identity Service
// ---------------------------------------------------------------------
export interface Block {
  id: string;
  kode: string;
  nama: string;
  semester: number;
  deskripsi?: string;
  coordinatorEmployeeId?: string;
  coordinatorNama?: string;
  departmentIds: string[]; // departemen yang dicakup block ini
  jumlahSoal: number;      // derived dari soal di bank dengan departmentId ∈ departmentIds
}

// ---------------------------------------------------------------------
// Bank Soal — soal independen dari block, terikat ke department
// ---------------------------------------------------------------------
export type OptionLabel = "A" | "B" | "C" | "D" | "E";

export interface QuestionOption {
  label: OptionLabel;
  teks: string;
  gambar?: string; // url / data-uri (gambar bisa jadi pilihan jawaban)
}

export interface Question {
  id: string;
  departmentId: string;
  nomor: number;
  pertanyaan: string;
  gambarSoal?: string; // opsional
  difficulty: QuestionDifficulty;
  pilihan: QuestionOption[]; // A–E
  jawabanBenar: OptionLabel;
}

// ---------------------------------------------------------------------
// Ujian
// ---------------------------------------------------------------------
export interface Exam {
  id: string;
  nama: string;
  examType: ExamType;     // BLOCK | PRACTICUM
  blockId: string;
  blockNama: string;
  departmentId?: string;  // wajib untuk PRACTICUM
  departmentNama?: string;
  durasiMenit: number;
  jumlahSoal: number;
  nilaiMinimum: number;
  periodeId: string;
  pesertaIds: string[];
  assignments: ExamAssignment[]; // PROCTOR + IT_SUPPORT
  status: ExamStatus;
  lihatHasil: boolean;
  mulai?: string;
}

// Sesi pengerjaan satu mahasiswa untuk satu ujian
export interface Attempt {
  examId: string;
  studentId: string;
  status: "not_started" | "in_progress" | "submitted";
  jawaban: Record<string, OptionLabel>; // questionId -> label
  startedAt?: string;
  submittedAt?: string;
  sisaDetik?: number;
}

// Soal yang sudah diacak + diberikan ke mahasiswa
export interface AssignedExam {
  exam: Exam;
  student: Student;
  soal: Question[];
}

// Ringkasan hasil (untuk tab "Hasil Ujian" mahasiswa)
export interface ResultSummary {
  examId: string;
  examNama: string;
  blockNama: string;
  examType: ExamType;
  tanggal?: string;
  status: "Belum Dikerjakan" | "Sudah Dikerjakan" | "Belum Dirilis";
  dirilis: boolean;
  nilai?: number;
  lulus?: boolean;
  kkm: number;
}

// Monitoring live — per mahasiswa
export interface LiveStudentProgress {
  studentId: string;
  nama: string;
  nrp: string;
  status: Attempt["status"];
  dikerjakan: number;
  total: number;
  benar: number;
  salah: number;
  persen: number;
  estimasiNilai: number;
  sisaDetik?: number;
}

// Monitoring live — per nomor soal
export interface LiveQuestionProgress {
  questionId: string;
  nomor: number;
  departmentNama: string;
  difficulty: QuestionDifficulty;
  totalMengerjakan: number;
  benar: number;
  salah: number;
  belum: number;
}
