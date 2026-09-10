import { prisma } from "../lib/prisma.js";

/**
 * Middleware untuk otomatis mendapatkan atau membuat user berdasarkan akun Telegram pengguna.
 */
export async function requireAuth(ctx, next) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const firstName = ctx.from.first_name || "";
  const lastName = ctx.from.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Pengguna Telegram";
  const telegramUsername = ctx.from.username ? ctx.from.username : null;

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { group: true },
    });

    if (!user) {
      // Auto-create user jika belum ada di DB
      user = await prisma.user.create({
        data: {
          telegramId,
          fullName,
          username: telegramUsername,
        },
        include: { group: true },
      });
    } else {
      // Auto-update nama & username jika pengguna mengubahnya di Telegram
      if (user.fullName !== fullName || user.username !== telegramUsername) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName,
            username: telegramUsername,
          },
          include: { group: true },
        });
      }
    }

    // Pass data user ke context grammY
    ctx.user = user;
    return await next();
  } catch (error) {
    console.error("Error pada middleware requireAuth (Telegram auto-sync):", error);
    return ctx.reply("❌ Terjadi kesalahan saat memproses akun Telegram Anda.");
  }
}
