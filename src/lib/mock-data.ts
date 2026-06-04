import type {
  Attempt,
  Block,
  Department,
  Employee,
  Exam,
  ExamAssignment,
  Period,
  Question,
  Student,
  User,
} from "./types";

// --- Gambar contoh (SVG data-uri) untuk demo "gambar sebagai soal/jawaban" ---
const svg = (inner: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>${inner}</svg>`,
  );

export const IMG_ECG = svg(
  `<rect width='320' height='180' fill='#fff'/>
   <g stroke='#e6e1d6'>${Array.from({ length: 16 }, (_, i) => `<line x1='${i * 20}' y1='0' x2='${i * 20}' y2='180'/>`).join("")}${Array.from({ length: 9 }, (_, i) => `<line x1='0' y1='${i * 20}' x2='320' y2='${i * 20}'/>`).join("")}</g>
   <polyline fill='none' stroke='#b23a2e' stroke-width='2.5' points='0,95 40,95 50,95 56,70 62,120 70,40 78,140 86,95 120,95 130,95 136,70 142,120 150,40 158,140 166,95 200,95 210,95 216,70 222,120 230,40 238,140 246,95 290,95 320,95'/>`,
);

const shape = (color: string, path: string) =>
  svg(`<rect width='320' height='180' fill='#faf8f3'/><g transform='translate(160,90)'>${path.replace("FILL", color)}</g>`);

export const IMG_OPT_A = shape("#0e4c44", "<circle r='52' fill='FILL'/>");
export const IMG_OPT_B = shape("#c1672c", "<rect x='-50' y='-50' width='100' height='100' rx='10' fill='FILL'/>");
export const IMG_OPT_C = shape("#1f7a52", "<polygon points='0,-58 58,42 -58,42' fill='FILL'/>");
export const IMG_OPT_D = shape("#b8860b", "<polygon points='0,-58 55,-18 34,52 -34,52 -55,-18' fill='FILL'/>");

// =====================================================================
// PERIODE
// =====================================================================
export const periods: Period[] = [
  { id: "p-2025-ganjil", nama: "Ganjil", tahun: "2025/2026", status: "active", activatedAt: "2025-08-01" },
  { id: "p-2024-genap", nama: "Genap", tahun: "2024/2025", status: "closed", activatedAt: "2025-02-01" },
  { id: "p-2025-genap", nama: "Genap", tahun: "2025/2026", status: "draft" },
];

// =====================================================================
// DEPARTEMEN (snapshot dari Identity Service)
// =====================================================================
export const departments: Department[] = [
  { id: "dept-fis", kode: "FIS", nama: "Fisiologi", coordinatorEmployeeId: "emp-coord-dept-1", coordinatorNama: "dr. Hartono Wijaya, Sp.JP" },
  { id: "dept-kar", kode: "KAR", nama: "Kardiologi", coordinatorEmployeeId: "emp-coord-dept-1", coordinatorNama: "dr. Hartono Wijaya, Sp.JP" },
  { id: "dept-ana", kode: "ANA", nama: "Anatomi" },
  { id: "dept-far", kode: "FAR", nama: "Farmakologi" },
  { id: "dept-pat", kode: "PAT", nama: "Patologi" },
  { id: "dept-neu", kode: "NEU", nama: "Neurologi", coordinatorEmployeeId: "emp-coord-dept-2", coordinatorNama: "dr. Sari Melati, Sp.S" },
  { id: "dept-his", kode: "HIS", nama: "Histologi" },
];

// =====================================================================
// BLOCK (snapshot dari Identity Service)
// =====================================================================
export const blocks: Block[] = [
  {
    id: "blk-cardio", kode: "BLK-301", nama: "Sistem Kardiovaskular", semester: 3,
    coordinatorEmployeeId: "emp-coord-blk-1", coordinatorNama: "dr. Hartono Wijaya, Sp.JP",
    departmentIds: ["dept-fis", "dept-kar", "dept-ana", "dept-far", "dept-pat"],
    jumlahSoal: 8,
    deskripsi: "Fisiologi & patologi jantung dan pembuluh darah.",
  },
  {
    id: "blk-resp", kode: "BLK-302", nama: "Sistem Respirasi", semester: 3,
    coordinatorEmployeeId: "emp-coord-blk-1", coordinatorNama: "dr. Hartono Wijaya, Sp.JP",
    departmentIds: ["dept-ana", "dept-fis", "dept-pat"],
    jumlahSoal: 0,
    deskripsi: "Anatomi & gangguan sistem pernapasan.",
  },
  {
    id: "blk-neuro", kode: "BLK-401", nama: "Sistem Neurologi", semester: 4,
    coordinatorEmployeeId: "emp-coord-blk-2", coordinatorNama: "dr. Sari Melati, Sp.S",
    departmentIds: ["dept-neu", "dept-ana"],
    jumlahSoal: 0,
    deskripsi: "Sistem saraf pusat & perifer.",
  },
  {
    id: "blk-musk", kode: "BLK-205", nama: "Sistem Muskuloskeletal", semester: 2,
    departmentIds: ["dept-ana", "dept-fis"],
    jumlahSoal: 0,
    deskripsi: "Tulang, otot, dan sendi.",
  },
];

// =====================================================================
// USER — Mahasiswa (snapshot dari Identity Service)
// =====================================================================
export const students: Student[] = [
  { id: "u-mhs-1", role: "student", nama: "Ahmad Fauzan", nrp: "G1A021001", semester: 3 },
  { id: "u-mhs-2", role: "student", nama: "Bella Anggraini", nrp: "G1A021002", semester: 3 },
  { id: "u-mhs-3", role: "student", nama: "Citra Dewanti", nrp: "G1A021003", semester: 3 },
  { id: "u-mhs-4", role: "student", nama: "Dimas Prakoso", nrp: "G1A021004", semester: 3 },
  { id: "u-mhs-5", role: "student", nama: "Eka Saputri", nrp: "G1A021005", semester: 3 },
  { id: "u-mhs-6", role: "student", nama: "Farhan Maulana", nrp: "G1A020011", semester: 4 },
  { id: "u-mhs-7", role: "student", nama: "Gita Larasati", nrp: "G1A020012", semester: 4 },
  { id: "u-mhs-8", role: "student", nama: "Hadi Nugroho", nrp: "G1A022031", semester: 2 },
];

// =====================================================================
// USER — Pegawai (snapshot dari Identity Service, dengan role CBT)
// =====================================================================
export const employees: Employee[] = [
  // Koordinator Block
  {
    id: "emp-coord-blk-1", role: "BLOCK_COORDINATOR",
    nama: "dr. Hartono Wijaya, Sp.JP", nik: "198203152008011001",
    coordinatedBlockIds: ["blk-cardio", "blk-resp"],
  },
  {
    id: "emp-coord-blk-2", role: "BLOCK_COORDINATOR",
    nama: "dr. Sari Melati, Sp.S", nik: "198706222010012003",
    coordinatedBlockIds: ["blk-neuro"],
  },
  // Koordinator Departemen
  {
    id: "emp-coord-dept-1", role: "DEPT_COORDINATOR",
    nama: "dr. Hartono Wijaya, Sp.JP", nik: "198203152008011001",
    coordinatedDepartmentIds: ["dept-fis", "dept-kar"],
  },
  {
    id: "emp-coord-dept-2", role: "DEPT_COORDINATOR",
    nama: "dr. Sari Melati, Sp.S", nik: "198706222010012003",
    coordinatedDepartmentIds: ["dept-neu"],
  },
  // Staf CBT
  { id: "emp-exam-1", role: "EXAM_MANAGER", nama: "Rina Kusuma", nik: "199001012015011005" },
  { id: "emp-qm-1", role: "QUESTION_MANAGER", nama: "dr. Budi Santosa, M.Kes", nik: "198808077501" },
  { id: "emp-qr-1", role: "QUESTION_REVIEWER", nama: "dr. Anita Rahayu, Sp.PD", nik: "198803058301" },
  { id: "emp-av-1", role: "ANALYTICS_VIEWER", nama: "dr. Reza Firmansyah, M.Biomed", nik: "199017059001" },
  { id: "emp-admin-1", role: "ADMIN", nama: "Bagus Santoso", nik: "198512302010011009" },
  // Pegawai yang ditugaskan sebagai Proctor/IT (tidak punya role CBT khusus, tapi bisa di-assign)
  { id: "emp-it-1", role: "EXAM_MANAGER", nama: "Andi Wicaksono", nik: "199512031234" },
  { id: "emp-it-2", role: "EXAM_MANAGER", nama: "Rizky Pratama", nik: "199801071234" },
];

export const allUsers: User[] = [...students, ...employees];

// Akun demo cepat untuk login (mode mock)
export const demoAccounts: { user: User; subtitle: string }[] = [
  { user: students[0], subtitle: "NRP G1A021001 · Semester 3" },
  { user: employees[0], subtitle: "Koordinator Block Kardiorespirasi" },
  { user: employees[4], subtitle: "Manajer Ujian" },
  { user: employees[8], subtitle: "Admin CBT" },
];

// =====================================================================
// SOAL — Bank Soal (terikat department, bukan block)
// =====================================================================
const cardioQuestions: Question[] = [
  {
    id: "q-c1", departmentId: "dept-fis", nomor: 1, difficulty: "EASY",
    pertanyaan: "Fase pengisian ventrikel jantung yang berlangsung saat tekanan ventrikel lebih rendah dari atrium disebut?",
    pilihan: [
      { label: "A", teks: "Sistol" }, { label: "B", teks: "Diastol" },
      { label: "C", teks: "Isovolumetrik kontraksi" }, { label: "D", teks: "Ejeksi" },
      { label: "E", teks: "Isovolumetrik relaksasi" },
    ], jawabanBenar: "B",
  },
  {
    id: "q-c2", departmentId: "dept-kar", nomor: 2, difficulty: "HARD",
    pertanyaan: "Perhatikan rekaman EKG berikut. Gambaran kompleks QRS yang ditampilkan paling sesuai menggambarkan?",
    gambarSoal: IMG_ECG,
    pilihan: [
      { label: "A", teks: "Irama sinus normal" }, { label: "B", teks: "Atrial fibrilasi" },
      { label: "C", teks: "Ventricular tachycardia" }, { label: "D", teks: "AV block derajat 3" },
      { label: "E", teks: "Asistol" },
    ], jawabanBenar: "A",
  },
  {
    id: "q-c3", departmentId: "dept-ana", nomor: 3, difficulty: "EASY",
    pertanyaan: "Katup yang memisahkan atrium kiri dan ventrikel kiri adalah?",
    pilihan: [
      { label: "A", teks: "Katup trikuspid" }, { label: "B", teks: "Katup pulmonal" },
      { label: "C", teks: "Katup mitral (bikuspid)" }, { label: "D", teks: "Katup aorta" },
      { label: "E", teks: "Katup eustachian" },
    ], jawabanBenar: "C",
  },
  {
    id: "q-c4", departmentId: "dept-far", nomor: 4, difficulty: "MEDIUM",
    pertanyaan: "Manakah bentuk gambar yang merepresentasikan struktur 'segiempat'? (contoh soal jawaban berupa gambar)",
    pilihan: [
      { label: "A", teks: "", gambar: IMG_OPT_A }, { label: "B", teks: "", gambar: IMG_OPT_B },
      { label: "C", teks: "", gambar: IMG_OPT_C }, { label: "D", teks: "", gambar: IMG_OPT_D },
      { label: "E", teks: "Tidak ada yang sesuai" },
    ], jawabanBenar: "B",
  },
  {
    id: "q-c5", departmentId: "dept-pat", nomor: 5, difficulty: "MEDIUM",
    pertanyaan: "Penumpukan plak ateromatosa pada dinding arteri yang menyebabkan penyempitan lumen disebut?",
    pilihan: [
      { label: "A", teks: "Aterosklerosis" }, { label: "B", teks: "Trombositopenia" },
      { label: "C", teks: "Anemia" }, { label: "D", teks: "Leukemia" },
      { label: "E", teks: "Edema" },
    ], jawabanBenar: "A",
  },
  {
    id: "q-c6", departmentId: "dept-fis", nomor: 6, difficulty: "MEDIUM",
    pertanyaan: "Nodus yang berfungsi sebagai pacu jantung alami (pacemaker) adalah?",
    pilihan: [
      { label: "A", teks: "Nodus AV" }, { label: "B", teks: "Berkas His" },
      { label: "C", teks: "Serabut Purkinje" }, { label: "D", teks: "Nodus SA" },
      { label: "E", teks: "Bundle branch" },
    ], jawabanBenar: "D",
  },
  {
    id: "q-c7", departmentId: "dept-kar", nomor: 7, difficulty: "HARD",
    pertanyaan: "Tekanan darah 140/90 mmHg menurut klasifikasi JNC termasuk kategori?",
    pilihan: [
      { label: "A", teks: "Normal" }, { label: "B", teks: "Prahipertensi" },
      { label: "C", teks: "Hipertensi derajat 1" }, { label: "D", teks: "Hipertensi derajat 2" },
      { label: "E", teks: "Krisis hipertensi" },
    ], jawabanBenar: "C",
  },
  {
    id: "q-c8", departmentId: "dept-far", nomor: 8, difficulty: "MEDIUM",
    pertanyaan: "Golongan obat yang bekerja menghambat enzim pengubah angiotensin (ACE) adalah?",
    pilihan: [
      { label: "A", teks: "Beta blocker" }, { label: "B", teks: "ACE inhibitor" },
      { label: "C", teks: "Diuretik tiazid" }, { label: "D", teks: "Calcium channel blocker" },
      { label: "E", teks: "Nitrat" },
    ], jawabanBenar: "B",
  },
];

export const questions: Question[] = [...cardioQuestions];

// =====================================================================
// UJIAN
// =====================================================================
const proctorsCardio: ExamAssignment[] = [
  { employeeId: "emp-coord-blk-1", employeeNama: "dr. Hartono Wijaya, Sp.JP", type: "PROCTOR" },
  { employeeId: "emp-qm-1", employeeNama: "dr. Budi Santosa, M.Kes", type: "PROCTOR" },
  { employeeId: "emp-it-1", employeeNama: "Andi Wicaksono", type: "IT_SUPPORT" },
];

export const exams: Exam[] = [
  {
    id: "ex-cardio-utama", nama: "UAB Sistem Kardiovaskular",
    examType: "BLOCK", blockId: "blk-cardio", blockNama: "Sistem Kardiovaskular",
    durasiMenit: 90, jumlahSoal: 8, nilaiMinimum: 70, periodeId: "p-2025-ganjil",
    pesertaIds: ["u-mhs-1", "u-mhs-2", "u-mhs-3", "u-mhs-4", "u-mhs-5"],
    assignments: proctorsCardio,
    status: "IN_PROGRESS", lihatHasil: false, mulai: "2025-11-20T08:00:00",
  },
  {
    id: "ex-cardio-prak", nama: "Ujian Praktikum Kardiovaskular",
    examType: "PRACTICUM", blockId: "blk-cardio", blockNama: "Sistem Kardiovaskular",
    departmentId: "dept-fis", departmentNama: "Fisiologi",
    durasiMenit: 60, jumlahSoal: 6, nilaiMinimum: 75, periodeId: "p-2025-ganjil",
    pesertaIds: ["u-mhs-1", "u-mhs-2", "u-mhs-3", "u-mhs-4", "u-mhs-5"],
    assignments: [
      { employeeId: "emp-coord-blk-2", employeeNama: "dr. Sari Melati, Sp.S", type: "PROCTOR" },
      { employeeId: "emp-it-2", employeeNama: "Rizky Pratama", type: "IT_SUPPORT" },
    ],
    status: "FINISHED", lihatHasil: true, mulai: "2025-11-10T08:00:00",
  },
  {
    id: "ex-resp-utama", nama: "UAB Sistem Respirasi",
    examType: "BLOCK", blockId: "blk-resp", blockNama: "Sistem Respirasi",
    durasiMenit: 90, jumlahSoal: 8, nilaiMinimum: 70, periodeId: "p-2025-ganjil",
    pesertaIds: ["u-mhs-1", "u-mhs-2", "u-mhs-3"],
    assignments: [],
    status: "READY", lihatHasil: false, mulai: "2025-12-05T08:00:00",
  },
];

// =====================================================================
// ATTEMPT (sesi pengerjaan)
// =====================================================================
const ans = (ids: string[]): Record<string, "A" | "B" | "C" | "D" | "E"> =>
  Object.fromEntries(ids.map((id) => [id, cardioQuestions.find((q) => q.id === id)!.jawabanBenar]));

export const attempts: Attempt[] = [
  // Praktikum (selesai)
  { examId: "ex-cardio-prak", studentId: "u-mhs-1", status: "submitted", jawaban: { ...ans(["q-c1", "q-c2", "q-c3", "q-c5"]), "q-c6": "A", "q-c7": "B" }, submittedAt: "2025-11-10T08:42:00" },
  { examId: "ex-cardio-prak", studentId: "u-mhs-2", status: "submitted", jawaban: { ...ans(["q-c1", "q-c2", "q-c3", "q-c5", "q-c6", "q-c7"]) }, submittedAt: "2025-11-10T08:39:00" },
  { examId: "ex-cardio-prak", studentId: "u-mhs-3", status: "submitted", jawaban: { "q-c1": "A", "q-c2": "C", "q-c3": "C", "q-c5": "A", "q-c6": "D", "q-c7": "E" }, submittedAt: "2025-11-10T08:51:00" },

  // Ujian Teori (IN_PROGRESS) — progress beragam untuk monitoring
  { examId: "ex-cardio-utama", studentId: "u-mhs-1", status: "in_progress", jawaban: { ...ans(["q-c1", "q-c2", "q-c3"]), "q-c4": "A" }, startedAt: "2025-11-20T08:01:00", sisaDetik: 3650 },
  { examId: "ex-cardio-utama", studentId: "u-mhs-2", status: "in_progress", jawaban: { ...ans(["q-c1", "q-c2"]) }, startedAt: "2025-11-20T08:02:00", sisaDetik: 3900 },
  { examId: "ex-cardio-utama", studentId: "u-mhs-3", status: "in_progress", jawaban: { "q-c1": "A", "q-c2": "B", "q-c3": "C", "q-c4": "B", "q-c5": "A" }, startedAt: "2025-11-20T08:00:00", sisaDetik: 3400 },
  { examId: "ex-cardio-utama", studentId: "u-mhs-4", status: "not_started", jawaban: {} },
  { examId: "ex-cardio-utama", studentId: "u-mhs-5", status: "in_progress", jawaban: { ...ans(["q-c1", "q-c2", "q-c3", "q-c5", "q-c6", "q-c7"]), "q-c4": "C" }, startedAt: "2025-11-20T07:59:00", sisaDetik: 2900 },
];
