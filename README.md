# CBT Fakultas Kedokteran — Frontend

Frontend **Computer-Based Test (CBT)** untuk Fakultas Kedokteran, dibangun dengan **Next.js 14 (App Router) + TypeScript + Tailwind CSS**.

Aplikasi ini adalah **frontend saja**. Backend (Python) kamu yang menyediakan REST API + SSO. Untuk memudahkan pengembangan, frontend ini **sudah berisi data dummy (mock)** sehingga seluruh peran bisa langsung dicoba **tanpa backend**. Tinggal ganti satu variabel environment untuk menyambung ke backend sungguhan.

---

## 1. Menjalankan (mode dummy / tanpa backend)

```bash
npm install
cp .env.example .env.local      # opsional — default sudah mode dummy
npm run dev
```

Buka <http://localhost:3000>. Halaman login menampilkan tombol **login demo** untuk tiap peran (di mode dummy, tombol SSO dinonaktifkan).

Akun demo yang tersedia:

| Peran        | Keterangan              |
|--------------|-------------------------|
| Mahasiswa    | NRP G1A021001, Semester 3 |
| Ketua Block  | Block Kardiorespirasi   |
| Admin        | Admin                   |
| Super Admin  | Super Admin             |

Membangun versi produksi:

```bash
npm run build
npm run start
```

> Catatan: font (Fraunces + Hanken Grotesk) dimuat lewat `<link>` ke Google Fonts di `src/app/layout.tsx`, jadi build tidak butuh akses Google Fonts saat proses build.

---

## 2. Menyambung ke backend Python (mode produksi)

Ubah `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=https://api.kampus.ac.id/api
NEXT_PUBLIC_SSO_LOGIN_URL=https://api.kampus.ac.id/api/auth/sso/login
NEXT_PUBLIC_SSO_LOGOUT_URL=https://api.kampus.ac.id/api/auth/sso/logout
```

| Variabel | Fungsi |
|----------|--------|
| `NEXT_PUBLIC_USE_MOCK` | `true` = data dummy + login demo. `false` = backend + SSO sungguhan. |
| `NEXT_PUBLIC_API_URL` | Base URL REST API backend. |
| `NEXT_PUBLIC_SSO_LOGIN_URL` | Endpoint backend yang memulai alur SSO. |
| `NEXT_PUBLIC_SSO_LOGOUT_URL` | Endpoint backend untuk logout SSO. |

Saat `NEXT_PUBLIC_USE_MOCK=false`, semua pemanggilan API otomatis diarahkan ke `NEXT_PUBLIC_API_URL` (lihat `src/lib/api.ts`). Token dikirim sebagai header `Authorization: Bearer <token>` yang dibaca dari cookie `cbt_token`.

---

## 3. Alur SSO

```
[Frontend] tombol "Masuk dengan SSO"
   └─> redirect ke NEXT_PUBLIC_SSO_LOGIN_URL  (backend)
        └─> backend redirect ke Identity Provider (IdP) kampus
             └─> setelah sukses, IdP balik ke backend
                  └─> backend redirect ke:  /auth/callback?token=<JWT>
                       └─> [Frontend] halaman /auth/callback:
                            - simpan token ke cookie (cbt_token)
                            - panggil GET /auth/me untuk ambil profil + peran
                            - simpan peran ke cookie, lalu arahkan ke /dashboard
```

Frontend **tidak pernah** berbicara langsung dengan IdP — semua negosiasi SSO ditangani backend. Frontend hanya mengarahkan pengguna dan menerima token di `/auth/callback`.

Middleware (`src/middleware.ts`) menjaga setiap rute berdasarkan peran. Rute publik: `/login` dan `/auth/callback`.

---

## 4. Peran & fitur

**Mahasiswa**
- Dashboard berisi daftar ujian + identitas (Nama, NRP, Semester).
- Soal **diacak** per mahasiswa (urutan stabil per mahasiswa+ujian).
- Mode **Safe Browser**: fullscreen, anti pindah tab, blokir copy/paste/print/devtools, peringatan saat keluar fullscreen.
- Bisa navigasi bolak-balik antar soal + tandai ragu.
- Halaman **selesai** hanya menampilkan konfirmasi — tanpa skor, status, atau benar/salah.
- Nilai muncul di tab **Hasil Ujian** **hanya** bila admin mengaktifkan "Lihat Hasil Ujian" untuk ujian tersebut.

**Ketua Block**
- Melihat block + seluruh soal pada block yang ditugaskan.
- Melihat nilai mahasiswa dalam block-nya.

**Admin**
- Membuat Block Ujian.
- Input/edit/hapus soal via **Excel**, **Word**, atau **Form** dalam sistem (gambar bisa jadi pilihan jawaban).
- Membuat ujian: Nama, Semester, Block, Jenis (Utama/Remidi), Tipe (Praktikum/Teori), Waktu, Nilai Minimum (KKM), pilih peserta (massal per-semester atau per-nama).
- Mahasiswa di bawah KKM → otomatis disiapkan ujian Remidi.
- **Monitoring langsung**: progres per mahasiswa (selesai/benar/salah/estimasi nilai/%) dan per soal.
- Membuat & mengaktifkan **Periode** (Ganjil, Ganjil Perbaikan, Genap, Genap Perbaikan). Hanya satu periode aktif; mengaktifkan periode berikutnya tidak bisa dibatalkan dan menaikkan semester seluruh mahasiswa +1.

**Super Admin**
- Semua fitur Admin.
- **Bank Soal** (seluruh soal seluruh block).
- **Manajemen Pengguna**: tambah Mahasiswa (Nama, NRP, Semester, Password), Ketua Block (Nama, Jenis Block, NIK, Password), Admin & Super Admin (Nama, NIK, Password).

---

## 5. Kontrak REST API (yang diharapkan dari backend)

Semua path relatif terhadap `NEXT_PUBLIC_API_URL`. Bentuk data persis ada di `src/lib/types.ts`, dan tiap fungsi di `src/lib/api.ts` diberi komentar `REAL:` berisi endpoint-nya.

| Domain | Endpoint |
|--------|----------|
| Auth | `GET /auth/me` |
| Periode | `GET /periods` · `POST /periods` · `POST /periods/{id}/activate` |
| Block | `GET /blocks` · `GET /blocks/{id}` · `POST /blocks` · `PATCH /blocks/{id}` |
| Soal | `GET /blocks/{id}/questions` · `POST /blocks/{id}/questions` · `PATCH /questions/{id}` · `DELETE /questions/{id}` |
| Impor soal | `POST /blocks/{id}/questions/import?preview=1` (multipart upload Excel/Word → kembalikan daftar soal hasil parse untuk pratinjau) |
| Ujian | `GET /exams` · `GET /exams/{id}` · `POST /exams` · `PATCH /exams/{id}` |
| Pengerjaan | `POST /exams/{id}/start` · `PUT /exams/{id}/answer` · `POST /exams/{id}/submit` |
| Hasil | `GET /students/{id}/results` |
| Live monitoring | `GET /exams/{id}/live/students` · `GET /exams/{id}/live/questions` |
| Pengguna | `GET /users?role=` · `POST /users` |

`PATCH /exams/{id}` juga dipakai untuk toggle "Lihat Hasil Ujian" (`lihatHasil`).

---

## 6. Yang menjadi tugas backend (sengaja tidak dikerjakan frontend)

Frontend ini menyediakan **UI** untuk hal-hal berikut, tetapi logika intinya ada di backend:

1. **Parsing Excel & Word** — frontend hanya mengunggah file dan menampilkan **pratinjau** hasil parse. Backend yang membaca file dan mengekstrak soal.
2. **Ekstraksi gambar tertanam** — gambar di Excel/Word harus dikembalikan backend sebagai data gambar nyata (mis. data URL / URL file), **bukan tautan teks**. Frontend menampilkannya apa adanya, termasuk untuk pilihan jawaban.
3. **Update langsung (live)** — frontend saat ini memakai **polling** (interval ~4 detik) di halaman monitoring. Untuk produksi disarankan **WebSocket/SSE**; titik integrasinya sudah ditandai di kode (`kelola-ujian/[id]/monitor`).
4. **Pengacakan & penilaian otoritatif** — pengacakan/penilaian di mode dummy hanya untuk demo. Sumber kebenaran skor & urutan soal tetap backend.
5. **Pembuatan Remidi & kenaikan semester** — di mode dummy disimulasikan; pada produksi, backend yang memutuskan dan mengeksekusi.

---

## 7. Struktur folder

```
src/
  app/
    layout.tsx              # root layout, font, AuthProvider
    page.tsx                # redirect -> /dashboard
    login/                  # halaman login (SSO + demo)
    auth/callback/          # penerima token SSO
    (app)/                  # area ber-sidebar (butuh login)
      layout.tsx            # guard auth + DashboardShell
      dashboard/            # beranda per peran
      ujian/                # daftar ujian mahasiswa
      hasil-ujian/          # hasil mahasiswa (saat dirilis)
      blok-saya/            # ketua block
      blocks/               # admin: kelola block + soal
      kelola-ujian/         # admin: kelola ujian + monitoring
      periode/              # admin: periode akademik
      bank-soal/            # super admin: semua soal
      pengguna/             # super admin: manajemen user
    exam/[id]/              # mode Safe Browser (di luar sidebar)
    exam/[id]/selesai/      # halaman selesai (tanpa skor)
  components/
    ui/                     # komponen UI (Button, Card, Modal, dst.)
    dashboard-shell.tsx     # sidebar + topbar
    brand.tsx               # logo
    question-view.tsx       # tampilan soal read-only
  contexts/auth-context.tsx # state autentikasi
  lib/
    api.ts                  # semua pemanggilan API + switch mock/real
    types.ts                # tipe data (kontrak dengan backend)
    mock-data.ts            # data dummy
    auth.ts                 # cookie sesi + URL SSO
    utils.ts                # util kecil
  middleware.ts             # proteksi rute per peran
```

---

## 8. Catatan Safe Browser

Proteksi yang sudah ada di `src/app/exam/[id]/page.tsx`: fullscreen (via gesture pengguna), deteksi pindah tab/blur/keluar fullscreen + peringatan, blokir copy/cut/paste/print/save/view-source/devtools (F12 & kombinasi), blokir klik kanan, dan guard `beforeunload`.

Ini adalah lapisan **pencegah di sisi browser** dan bukan jaminan keamanan absolut. Untuk pengamanan lebih kuat, kombinasikan dengan kebijakan sisi server (validasi waktu, deteksi anomali) dan/atau lingkungan kiosk/lockdown browser.
