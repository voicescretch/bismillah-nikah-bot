# 💍 Bot Telegram Tabungan Bersama (BismillahNikah)

Bot Telegram pintar untuk mencatat dan mengelola tabungan menikah bersama pasangan secara otomatis, transparan, dan teratur. Dibuat menggunakan **Node.js (ES Modules)**, **grammY Framework**, **Prisma ORM**, **PostgreSQL**, dan **ExcelJS**.

---

## 🌟 Fitur Utama

- ⚡ **Telegram Account Auto-Sync**: Tanpa perlu mendaftar atau login email/password. Akun terhubung secara otomatis dengan akun Telegram pengguna.
- 👩‍❤️‍👨 **Kelompok Tabungan Pasangan**: Hubungkan akun dengan pasangan menggunakan link & kode undangan unik (berlaku 5 menit dengan proteksi keamanan).
- 💰 **Pencatatan Pemasukan & Pengeluaran**: Catat tabungan masuk (`/menabung`) dan penarikan (`/penarikan`) secara instan.
- 📊 **Export Laporan Excel (.xlsx)**: Unduh laporan riwayat transaksi dalam format file Excel rapi lengkap dengan header, styling warna, serta kalkulasi otomatis (Total Pemasukan, Total Pengeluaran, dan Sisa Saldo Tabungan).
- 📈 **Ringkasan Transparan**: Lihat sisa saldo masing-masing anggota dan total keseluruhan tabungan grup secara realtime (`/total` & `/ringkasan`).
- 🤖 **Interaktif & Mudah Digunakan**: Klik langsung perintah `/help` untuk panduan cepat.

---

## 📚 Daftar Perintah (Commands)

| Perintah | Deskripsi | Contoh Penggunaan |
|---|---|---|
| `/start` | Menampilkan pesan selamat datang, status akun, dan panduan perintah | `/start` |
| `/help` | Menampilkan daftar lengkap panduan perintah bot | `/help` |
| `/profil` | Melihat profil pengguna Telegram & status kelompok pasangan | `/profil` |
| `/hubungkan` | Membuat kode 6 karakter & link undangan pasangan (berlaku 5 menit) | `/hubungkan` |
| `/terima` | Menerima kode undangan dari pasangan untuk bergabung ke grup | `/terima NK-X7Y9Z2` |
| `/daftarhubungan` | Menampilkan daftar seluruh anggota dalam kelompok tabungan | `/daftarhubungan` |
| `/batalkanhubungan` | Mengeluarkan anggota dari kelompok (saldo riwayat tetap tersimpan) | `/batalkanhubungan budi_123` |
| `/keluarhubungan` | Keluar dari kelompok tabungan saat ini | `/keluarhubungan` |
| `/menabung` | Mencatat transaksi pemasukan tabungan | `/menabung 100000` |
| `/penarikan` | Mencatat transaksi pengeluaran/penarikan tabungan | `/penarikan 50000` |
| `/riwayat` | Download file laporan Excel (.xlsx) seluruh grup atau per pengguna | `/riwayat` atau `/riwayat pribadi` |
| `/total` | Ringkasan sisa saldo masing-masing anggota & total keseluruhan grup | `/total` |
| `/ringkasan` | Detail rincian Pemasukan, Pengeluaran, dan Net Saldo per anggota & grup | `/ringkasan` |

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js (ES Modules `"type": "module"`)
- **Bot Framework**: [grammY](https://grammy.dev/)
- **Database & ORM**: PostgreSQL & [Prisma ORM](https://www.prisma.io/)
- **Excel Generator**: [ExcelJS](https://github.com/exceljs/exceljs)
- **Utilities**: `dotenv`

---

## 📁 Struktur Folder Proyek

```
bismillahnikah/
├── .env                              # Environment Variables (Bot Token & DB URL)
├── package.json                      # NPM Dependencies & Scripts
├── prisma/
│   └── schema.prisma                 # Schema Database (User, SavingsGroup, SavingsHistory, InviteLink)
└── src/
    ├── index.js                      # Main entry point & Bot router
    ├── commands/
    │   ├── auth.js                   # Handlers: /start, /profil, /help
    │   ├── group.js                  # Handlers: /hubungkan, /terima, /batalkanhubungan, /keluarhubungan, /daftarhubungan
    │   └── savings.js                # Handlers: /menabung, /penarikan, /riwayat, /total, /ringkasan
    ├── middlewares/
    │   └── auth.js                   # Middleware Telegram Account Auto-Sync
    ├── lib/
    │   └── prisma.js                 # PrismaClient Instance
    └── utils/
        ├── excel.js                  # Generator laporan Excel (.xlsx) dengan ExcelJS
        └── helpers.js                # Helper format Rupiah, tanggal, & parsing nominal
```

---

## 💻 Panduan Instalasi Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Database PostgreSQL yang aktif (lokal atau cloud).

### 2. Langkah-Langkah
1. **Clone repository**:
   ```bash
   git clone https://github.com/USERNAME_KAMU/bismillah-nikah-bot.git
   cd bismillah-nikah-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Konfigurasi file `.env`**:
   Buat atau sesuaikan file `.env` di root direktori:
   ```env
   BOT_TOKEN="BOT_TOKEN_DARI_BOTFATHER"
   DATABASE_URL="postgresql://postgres:password@localhost:5432/db_tabungan?schema=public"
   ```

4. **Migrasi Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Jalankan Bot**:
   ```bash
   # Mode Development (auto-reload via Nodemon)
   npm run dev

   # Mode Production
   npm start
   ```

---

## 🚀 Panduan Deploy Gratis 24/7 di Koyeb & Supabase

### 1. Database Gratis di Supabase (Always Free)
1. Buat akun di [Supabase.com](https://supabase.com).
2. Buat proyek baru dan dapatkan **Connection String PostgreSQL**.
3. Pasang URL database Supabase tersebut ke `DATABASE_URL` di `.env`.

### 2. Web Hosting Bot Gratis di Koyeb.com
1. Push kode Anda ke repository GitHub.
2. Buat akun di [Koyeb.com](https://app.koyeb.com) dan hubungkan akun GitHub Anda.
3. Buat **New App / Service** -> Pilih repository GitHub Anda.
4. Masukkan **Environment Variables**:
   - `BOT_TOKEN`
   - `DATABASE_URL`
5. Koyeb akan secara otomatis menjalankan `npm run build` (`npx prisma generate`) dan `npm start`.
6. Bot Telegram Anda kini online 24 jam nonstop secara gratis!

---

## 📄 Lisensi

Proyek ini dibuat di bawah lisensi [ISC License](LICENSE).
