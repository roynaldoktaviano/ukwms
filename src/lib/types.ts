// =====================================================================
// Tipe data inti — sekaligus "kontrak" yang harus dipenuhi backend Python.
// =====================================================================

export type Role = "student" | "ketua_block" | "admin" | "super_admin";

export interface Dosen {
  id: string;
  nama: string;
  nidn: string;
  bidangIlmu?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  student: "Mahasiswa",
  ketua_block: "Ketua Block",
  admin: "Admin",
  super_admin: "Super Admin",
};

export interface BaseUser {
  id: string;
  role: Role;
  nama: string;
}

export interface Student extends BaseUser {
  role: "student";
  nrp: string;
  semester: number;
}

export interface KetuaBlock extends BaseUser {
  role: "ketua_block";
  nik: string;
  jenisBlock: string; // bidang block yang dipegang
  blockIds: string[]; // block yang di-assign
}

export interface Staff extends BaseUser {
  role: "admin" | "super_admin";
  nik: string;
}

export type User = Student | KetuaBlock | Staff;

// ---------------------------------------------------------------------

export interface Period {
  id: string;
  nama: "Ganjil" | "Ganjil Perbaikan" | "Genap" | "Genap Perbaikan";
  tahun: string; // mis. "2025/2026"
  status: "draft" | "active" | "closed";
  activatedAt?: string;
}

export interface Block {
  id: string;
  kode: string;
  nama: string;
  semester: number;
  deskripsi?: string;
  ketuaId?: string;
  ketuaNama?: string;
  jumlahSoal: number;
}

export type OptionLabel = "A" | "B" | "C" | "D" | "E";

export interface QuestionOption {
  label: OptionLabel;
  teks: string;
  gambar?: string; // url / data-uri (gambar bisa jadi pilihan jawaban)
}

export interface Question {
  id: string;
  blockId: string;
  nomor: number;
  pertanyaan: string;
  gambarSoal?: string; // url / data-uri
  bidangIlmu: string;
  pilihan: QuestionOption[]; // A–E
  jawabanBenar: OptionLabel;
}

export type JenisUjian = "Utama" | "Remidi";
export type TipeUjian = "Praktikum" | "Teori";
export type ExamStatus = "draft" | "scheduled" | "ongoing" | "finished";

export interface Exam {
  id: string;
  nama: string;
  semester: number;
  blockId: string;
  blockNama: string;
  jenisUjian: JenisUjian;
  tipeUjian: TipeUjian;
  durasiMenit: number;
  jumlahSoal: number; // jumlah soal yang diacak untuk tiap peserta
  nilaiMinimum: number; // KKM
  periodeId: string;
  pesertaIds: string[];
  pengawasIds: string[]; // dosen yang ditugaskan sebagai pengawas
  status: ExamStatus;
  lihatHasil: boolean; // checklist admin -> rilis nilai ke mahasiswa
  remedialOfExamId?: string; // jika ini ujian remidi otomatis
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
  soal: Question[]; // urutan & subset acak khusus mahasiswa ini
}

// Ringkasan hasil (untuk tab "Hasil Ujian" mahasiswa)
export interface ResultSummary {
  examId: string;
  examNama: string;
  blockNama: string;
  jenisUjian: JenisUjian;
  tipeUjian: TipeUjian;
  tanggal?: string;
  status: "Belum Dikerjakan" | "Sudah Dikerjakan" | "Belum Dirilis";
  dirilis: boolean; // = exam.lihatHasil
  nilai?: number; // hanya jika dirilis
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
  persen: number; // % selesai
  estimasiNilai: number; // nilai dari soal yang sudah dikerjakan
  sisaDetik?: number;
}

// Monitoring live — per nomor soal
export interface LiveQuestionProgress {
  questionId: string;
  nomor: number;
  bidangIlmu: string;
  totalMengerjakan: number;
  benar: number;
  salah: number;
  belum: number;
}
