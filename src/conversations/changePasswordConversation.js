import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

/**
 * Conversation handler untuk ubah kata sandi (/ubahsandi).
 */
export async function changePasswordConversation(conversation, ctx) {
  const telegramId = BigInt(ctx.from.id);

  const user = await conversation.external(() =>
    prisma.user.findUnique({ where: { telegramId } }),
  );

  if (!user || !user.passwordHash) {
    await ctx.reply("❌ Pengguna tidak ditemukan atau belum mengatur kata sandi.");
    return;
  }

  // Step 1: Minta kata sandi lama
  await ctx.reply(
    "🔒 <b>Ubah Kata Sandi</b>\n\nSilakan masukkan <b>Kata Sandi Lama</b> Anda:",
    { parse_mode: "HTML" },
  );

  const oldPassCtx = await conversation.waitFor("message:text");
  const oldPassword = oldPassCtx.message.text.trim();

  // Verifikasi kata sandi lama
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isMatch) {
    await ctx.reply("❌ Kata sandi lama Anda salah. Perintah ubah kata sandi dibatalkan.");
    return;
  }

  // Step 2: Minta kata sandi baru
  await ctx.reply(
    "✅ Kata sandi lama benar!\n\nSilakan masukkan <b>Kata Sandi Baru</b> Anda (minimal 4 karakter):",
    { parse_mode: "HTML" },
  );

  let newPassword = "";
  let passValid = false;

  while (!passValid) {
    const newPassCtx = await conversation.waitFor("message:text");
    const inputPass = newPassCtx.message.text.trim();

    if (inputPass.length < 4) {
      await ctx.reply("❌ Kata sandi baru minimal 4 karakter. Silakan masukkan kata sandi baru:");
      continue;
    }

    if (inputPass === oldPassword) {
      await ctx.reply("❌ Kata sandi baru harus berbeda dengan kata sandi lama. Silakan masukkan kata sandi baru:");
      continue;
    }

    newPassword = inputPass;
    passValid = true;
  }

  await ctx.reply("⏳ Memperbarui kata sandi Anda...");

  const newHash = await bcrypt.hash(newPassword, 10);

  await conversation.external(() =>
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    }),
  );

  await ctx.reply(
    "🎉 <b>Kata Sandi Berhasil Diubah!</b>\n\nSilakan gunakan kata sandi baru Anda untuk sesi berikutnya.",
    { parse_mode: "HTML" },
  );
}
