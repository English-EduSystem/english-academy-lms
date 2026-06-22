# Frontend — English Academy Indonesia

Situs statis biasa (HTML/CSS/JS, Bootstrap 5). Tidak ada proses build, tidak ada framework — file di folder ini langsung di-host apa adanya oleh GitHub Pages.

## Struktur

```
frontend/
├── index.html              ← login & registrasi
├── dashboard-student.html  ← ringkasan nilai, progres, tugas/ujian mendatang
├── dashboard-teacher.html  ← ringkasan kelas yang diampu
├── dashboard-admin.html    ← ringkasan sistem & aktivitas terbaru
├── lessons.html            ← Subjects → Modules → Lessons (drill-down)
├── lesson-detail.html      ← konten, video, PDF, tombol "Tandai Selesai"
├── quiz.html               ← daftar kuis + pengerjaan kuis + leaderboard
├── exam.html                ← ujian dengan timer, fullscreen, anti-cheat
├── ocr.html                 ← OCR Scanner (Tesseract.js, di browser)
├── translator.html          ← translator EN↔ID
├── vocabulary.html          ← pencarian kata + daftar kosakata pribadi
├── certificates.html        ← sertifikat siswa
├── verify.html               ← verifikasi sertifikat (PUBLIK, tanpa login)
├── content-manager.html      ← guru/admin: kelola modul, kuis, ujian, tugas
├── gradebook.html             ← guru: nilai tugas, esai kuis, esai ujian
├── attendance.html            ← guru: catat kehadiran per kelas/tanggal
├── user-management.html       ← admin: kelola akun, aktivasi siswa baru
├── analytics.html              ← admin: grafik nilai per mapel, siswa per tingkat
├── settings.html                ← admin: pengaturan sistem
├── css/
│   └── style.css      ← tema warna & font, dipakai semua halaman
├── js/
│   ├── api.js          ← satu-satunya file yang bicara ke backend (Apps Script)
│   └── navbar.js        ← navigasi atas, otomatis menyesuaikan role user
└── assets/
    ├── images/
    └── icons/
```

## Cara kerja komunikasi ke backend

Setiap halaman yang butuh data dari server memanggil `callApi(action, payload)` dari `js/api.js`, contoh:

```html
<script src="js/api.js"></script>
<script>
  const data = await callApi('login', { email, password });
</script>
```

Tidak ada halaman yang melakukan `fetch()` langsung — semua lewat `callApi()` supaya kalau URL backend berubah, cukup diedit satu kali di `js/api.js`.

## Menambah halaman baru

1. Buat file `.html` baru di folder ini (mis. `dashboard-student.html`).
2. Di bagian atas script, panggil `await requireLogin()` (dari `api.js`) kalau halaman tersebut butuh login — ini otomatis mengarahkan ke `index.html` kalau belum login, dan mengembalikan data user kalau sudah.
3. Tambahkan link/redirect ke halaman ini dari `index.html` -> `goToDashboard()` sesuai role, atau dari navigasi halaman lain.
4. Kalau halaman butuh action backend yang belum ada di daftar, tambahkan dulu controller-nya di file `.gs` terkait (mis. `Quiz.gs`), lalu daftarkan di `getActionMap_()` pada `backend/Code.gs`.

Lihat `docs/03-DEPLOYMENT-GUIDE.md` untuk cara meng-upload perubahan ke GitHub Pages.
