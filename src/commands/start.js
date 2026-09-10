import { prisma } from "../lib/prisma.js";

export async function handleStart(ctx) {
  const telegramId = BigInt(ctx.from.id);

  // Ambil nama lengkap dari Telegram
  const firstName = ctx.from.first_name || "";
  const lastName = ctx.from.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Pengguna Telegram";

  // Ambil username Telegram jika ada
  const telegramUsername = ctx.from.username ? `@${ctx.from.username}` : null;

  try {
    // Cari user di database
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    // Jika belum terdaftar, buat akun otomatis!
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          fullName,
          username: telegramUsername,
        },
      });

      await ctx.reply(
        `👋 <b>Selamat datang, ${fullName}!</b>\n\n` +
          `Akun kamu telah otomatis terdaftar di <b>BismillahNikah Bot</b>. 💍✨\n\n` +
          `Gunakan perintah berikut untuk memulai:\n` +
          `• <code>/hubungkan</code> - Membuat kode undangan untuk pasanganmu\n` +
          `• <code>/terima KODE</code> - Menghubungkan akun dengan kode dari pasangan\n` +
          `• <code>/help</code> - Bantuan dan daftar perintah`,
        { parse_mode: "HTML" },
      );
      return;
    }

    // Jika sudah terdaftar sebelumnya
    await ctx.reply(
      `Halo kembali, <b>${user.fullName}</b>! 👋\n\n` +
        `Ada yang bisa dibantu untuk tabungan pernikahan kalian hari ini?\n\n` +
        `Gunakan perintah <code>/hubungkan</code> jika belum terhubung dengan pasangan.`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    console.error("Error pada handleStart:", error);
    await ctx.reply("❌ Terjadi kesalahan saat memproses akun kamu.");
  }
}
