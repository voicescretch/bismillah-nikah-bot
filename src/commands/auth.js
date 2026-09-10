import { handleAcceptInvite } from "./group.js";

/**
 * Text Panduan Perintah Bot
 */
export function getHelpMessage() {
  return (
    `📚 <b>Panduan & Daftar Perintah Bot Tabungan Bersama</b>\n\n` +
    `👤 <b>Informasi Akun:</b>\n` +
    `• /start - Pesan selamat datang & status akun\n` +
    `• /profil - Melihat profil pengguna & status pasangan\n` +
    `• /help - Menampilkan panduan ini\n\n` +
    `👩‍❤️‍👨 <b>Kelompok Tabungan Pasangan:</b>\n` +
    `• /hubungkan - Buat link & kode undangan untuk pasangan (berlaku 5 menit)\n` +
    `• /terima - Terima undangan dari pasangan dengan kode\n` +
    `• /daftarhubungan - Lihat daftar anggota terhubung dalam kelompok\n` +
    `• /batalkanhubungan - Keluarkan anggota dari kelompok\n` +
    `• /keluarhubungan - Keluar dari kelompok tabungan saat ini\n\n` +
    `💰 <b>Pencatatan Tabungan & Laporan:</b>\n` +
    `• /menabung - Catat pemasukan tabungan (contoh: /menabung 100000)\n` +
    `• /penarikan - Catat pengeluaran tabungan (contoh: /penarikan 50000)\n` +
    `• /riwayat - Download laporan Excel (.xlsx) seluruh grup\n` +
    `• /total - Ringkasan sisa saldo masing-masing anggota & total grup\n` +
    `• /ringkasan - Detail Pemasukan, Pengeluaran & Net Tabungan`
  );
}

/**
 * Handler: /start
 */
export async function handleStart(ctx) {
  const user = ctx.user;
  const match = ctx.match?.trim();

  // Jika start membawa parameter deep-linking undangan (/start invite_KODE)
  if (match && match.startsWith("invite_")) {
    const inviteCode = match.replace("invite_", "").trim();
    ctx.match = inviteCode;
    return handleAcceptInvite(ctx);
  }

  const groupStatus = user.group
    ? `✅ Terhubung dengan grup: <b>${user.group.name}</b>`
    : `❌ Belum terhubung dengan pasangan (Gunakan /hubungkan untuk membuat link undangan)`;

  // Pesan Selamat Datang dengan tautan perintah Telegram /help yang langsung bisa ditekan
  await ctx.reply(
    `👋 <b>Selamat Datang, ${user.fullName}!</b> 💍✨\n\n` +
      `Selamat datang di <b>Bot Tabungan Bersama</b>. Bot ini siap membantu Anda dan pasangan mencatat serta mengelola tabungan bersama secara otomatis.\n\n` +
      `📌 <b>Status Akun Anda:</b>\n` +
      `• Nama: <b>${user.fullName}</b>\n` +
      `• Status Pasangan: ${groupStatus}\n\n` +
      `💡 <b>Panduan Pengguna Baru:</b>\n` +
      `Tekan /help untuk melihat seluruh daftar perintah yang tersedia.`,
    { parse_mode: "HTML" },
  );
}

/**
 * Handler: /profil
 */
export async function handleProfile(ctx) {
  const user = ctx.user;

  const groupStatus = user.group
    ? `✅ Terhubung dengan <b>${user.group.name}</b>`
    : "❌ Belum terhubung (Gunakan /hubungkan)";

  await ctx.reply(
    `👤 <b>Profil Pengguna Telegram</b>\n\n` +
      `• Nama: <b>${user.fullName}</b>\n` +
      `• Username: <code>@${user.username || "tanpa_username"}</code>\n` +
      `• ID Telegram: <code>${user.telegramId}</code>\n` +
      `• Status Pasangan: ${groupStatus}\n` +
      `• Terdaftar sejak: <b>${new Date(user.createdAt).toLocaleDateString("id-ID")}</b>`,
    { parse_mode: "HTML" },
  );
}

/**
 * Handler: /help
 */
export async function handleHelp(ctx) {
  await ctx.reply(getHelpMessage(), { parse_mode: "HTML" });
}
