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

## 🚀 Panduan Deploy Gratis 24/7 di Vercel (Serverless Webhook)

### Mengapa Vercel Memerlukan Setup Khusus?
Vercel menggunakan **Serverless Functions** (bukan server 24 jam nonstop yang bisa menjalankan `bot.start()` / Long Polling). Oleh karena itu, bot di Vercel harus menggunakan **Telegram Webhook** (`api/webhook.js`).

### Langkah Deploy ke Vercel:
1. **Push kode ini ke GitHub**.
2. Buka **[Vercel.com](https://vercel.com)** -> Import repository dari GitHub.
3. Tambahkan **Environment Variables** di dashboard Vercel:
   - `BOT_TOKEN` = `TOKEN_BOT_TELEGRAM_DARI_BOTFATHER`
   - `DATABASE_URL` = `URL_DATABASE_POSTGRESQL_SUPABASE`
4. Klik **Deploy**.
5. Setelah sukses dipublikasikan, salin domain Vercel Anda (contoh: `https://bismillah-nikah-bot.vercel.app`).
6. **Aktifkan Webhook Telegram**: Buka browser Anda dan akses URL berikut (ganti `<TOKEN_BOT>` dan `<DOMAIN_VERCEL>`):
   ```
   https://api.telegram.org/bot<TOKEN_BOT>/setWebhook?url=https://<DOMAIN_VERCEL>/api/webhook
   ```
7. Jika balasan di browser `"ok": true, "result": true`, maka bot Telegram Anda di Vercel sudah aktif 100%!

---

## 💻 Panduan Instalasi Lokal

```bash
npm install
npx prisma db push
npm run dev
```

---

## 📄 Lisensi

Proyek ini dibuat di bawah lisensi [ISC License](LICENSE).
