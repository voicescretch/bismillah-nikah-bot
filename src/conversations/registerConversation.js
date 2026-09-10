import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { generateUniqueUsername } from "../utils/helpers.js";

/**
 * Conversation handler untuk pendaftaran pengguna baru (/daftar).
 */
export async function registerConversation(conversation, ctx) {
  const telegramId = BigInt(ctx.from.id);

  // 1. Cek apakah telegramId sudah terdaftar di DB
  const existingUser = await conversation.external(() =>
    prisma.user.findUnique({ where: { telegramId } }),
  );

  if (existingUser) {
    await ctx.reply(
      `⚠️ Akun Telegram kamu sudah terdaftar dengan username <b>${existingUser.username}</b>.\n` +
        `Gunakan <code>/profil</code> untuk melihat informasi akun.`,
      { parse_mode: "HTML" },
    );
    return;
  }

  // Step 1: Minta Nama Lengkap
  await ctx.reply(
    "📝 <b>Pendaftaran Akun Tabungan</b>\n\nLangkah 1/3: Silakan masukkan <b>Nama Lengkap</b> Anda:",
    { parse_mode: "HTML" },
  );
  const nameCtx = await conversation.waitFor("message:text");
  const fullName = nameCtx.message.text.trim();

  if (fullName.length < 2) {
    await ctx.reply("❌ Nama terlalu pendek. Pendaftaran dibatalkan. Silakan ketik /daftar kembali.");
    return;
  }

  // Step 2: Minta Email & Validasi
  await ctx.reply(
    `Terima kasih, <b>${fullName}</b>!\n\nLangkah 2/3: Silakan masukkan <b>Email</b> aktif Anda:`,
    { parse_mode: "HTML" },
  );

  let email = "";
  let emailValid = false;

  while (!emailValid) {
    const emailCtx = await conversation.waitFor("message:text");
    const inputEmail = emailCtx.message.text.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inputEmail)) {
      await ctx.reply("❌ Format email tidak valid. Silakan masukkan ulang email yang benar (contoh: user@gmail.com):");
      continue;
    }

    // Cek keunikan email di database
    const emailExists = await conversation.external(() =>
      prisma.user.findUnique({ where: { email: inputEmail } }),
    );

    if (emailExists) {
      await ctx.reply("❌ Email tersebut sudah terdaftar di sistem. Silakan gunakan email lain:");
      continue;
    }

    email = inputEmail;
    emailValid = true;
  }

  // Step 3: Minta Kata Sandi
  await ctx.reply(
    "🔒 Langkah 3/3: Silakan masukkan <b>Kata Sandi (Password)</b> Anda (minimal 4 karakter):",
    { parse_mode: "HTML" },
  );

  let password = "";
  let passValid = false;

  while (!passValid) {
    const passCtx = await conversation.waitFor("message:text");
    const inputPass = passCtx.message.text.trim();

    if (inputPass.length < 4) {
      await ctx.reply("❌ Kata sandi minimal 4 karakter. Silakan masukkan kata sandi baru:");
      continue;
    }

    password = inputPass;
    passValid = true;
  }

  // Proses pembuatan akun di backend
  await ctx.reply("⏳ Sedang memproses pendaftaran akun Anda...");

  const passwordHash = await bcrypt.hash(password, 10);
  const username = await conversation.external(() => generateUniqueUsername(fullName));

  const newUser = await conversation.external(() =>
    prisma.user.create({
      data: {
        telegramId,
        fullName,
        email,
        username,
        passwordHash,
      },
    }),
  );

  if (ctx.session) {
    ctx.session.userId = newUser.id;
  }

  await ctx.reply(
    `🎉 <b>Pendaftaran Berhasil!</b>\n\n` +
      `• Nama Lengkap: <b>${newUser.fullName}</b>\n` +
      `• Username Otonom: <code>${newUser.username}</code>\n` +
      `• Email: <b>${newUser.email}</b>\n\n` +
      `📌 <i>Username dan Kata Sandi dapat Anda gunakan untuk login di lain waktu (/masuk).</i>\n\n` +
      `Selanjutnya Anda dapat:\n` +
      `• Mengundang pasangan: <code>/hubungkan</code>\n` +
      `• Mulai menabung: <code>/menabung 100000</code>`,
    { parse_mode: "HTML" },
  );
}
