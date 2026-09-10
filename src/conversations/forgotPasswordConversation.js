import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

/**
 * Conversation handler untuk reset kata sandi (/lupasandi).
 */
export async function forgotPasswordConversation(conversation, ctx) {
  await ctx.reply(
    "🔑 <b>Lupa Kata Sandi</b>\n\nSilakan masukkan <b>Email</b> yang sudah terdaftar di sistem:",
    { parse_mode: "HTML" },
  );

  const emailCtx = await conversation.waitFor("message:text");
  const email = emailCtx.message.text.trim().toLowerCase();

  // Cari user berdasarkan email
  const user = await conversation.external(() =>
    prisma.user.findUnique({ where: { email } }),
  );

  if (!user) {
    await ctx.reply(
      `❌ Email <b>${email}</b> tidak terdaftar di sistem kami.\n` +
        `Silakan periksa kembali email Anda atau buat akun baru dengan <code>/daftar</code>.`,
      { parse_mode: "HTML" },
    );
    return;
  }

  await ctx.reply("⏳ Sedang memproses kata sandi baru dan mengirimkannya ke email Anda...");

  // Generate kata sandi baru secara acak (8 karakter)
  const randomStr = Math.random().toString(36).substring(2, 8);
  const newPassword = `Pass-${randomStr}`;
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update ke database
  await conversation.external(() =>
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
  );

  // Kirim via email
  const mailSent = await conversation.external(() =>
    sendPasswordResetEmail(email, newPassword),
  );

  if (mailSent) {
    await ctx.reply(
      `✅ <b>Kata Sandi Baru Telah Dikirim!</b>\n\n` +
        `Kata sandi acak baru telah dikirimkan ke email: <b>${email}</b>.\n` +
        `Silakan periksa kotak masuk (inbox / spam) email Anda.\n\n` +
        `Setelah login, Anda disarankan mengubah kata sandi dengan <code>/ubahsandi</code>.`,
      { parse_mode: "HTML" },
    );
  } else {
    await ctx.reply(
      `⚠️ Gagal mengirim email reset kata sandi.\n` +
        `Namun kata sandi sementara Anda telah diubah menjadi: <code>${newPassword}</code>\n` +
        `Silakan gunakan kata sandi tersebut untuk login.`,
      { parse_mode: "HTML" },
    );
  }
}
