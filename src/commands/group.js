import { InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";

/**
 * Handler: /hubungkan
 */
export async function handleConnectGroup(ctx) {
  const user = ctx.user; // Dari requireAuth middleware

  if (user.primaryGroupId) {
    await ctx.reply("⚠️ Kamu sudah terhubung dengan grup/pasangan!");
    return;
  }

  // Buat kode unik 6 karakter
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `NK-${randomCode}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expire 5 menit

  await prisma.inviteLink.create({
    data: {
      code,
      creatorId: user.id,
      expiresAt,
    },
  });

  const botUsername = ctx.me?.username || "TabunganBot";
  const inviteUrl = `https://t.me/${botUsername}?start=invite_${code}`;

  await ctx.reply(
    `👩‍❤️‍👨 <b>Link Undangan Dibuat!</b>\n\n` +
      `⚠️ <b>Peringatan: Jangan bagikan link ini kepada orang yang tidak dipercaya! Link ini hanya berlaku selama 5 menit.</b>\n\n` +
      `🔗 <b>Link Undangan:</b>\n${inviteUrl}\n\n` +
      `Atau pasangan kamu bisa langsung memasukkan perintah:\n` +
      `<code>/terima ${code}</code>`,
    { parse_mode: "HTML" },
  );
}

/**
 * Handler: /terima <kode>
 */
export async function handleAcceptInvite(ctx) {
  const user = ctx.user || (await getOrFetchUser(ctx));
  if (!user) {
    await ctx.reply(
      "🔒 Silakan login atau mendaftar terlebih dahulu sebelum menerima undangan.",
    );
    return;
  }

  const code = (ctx.match || "").trim().toUpperCase();

  if (!code) {
    await ctx.reply(
      "⚠️ Format salah! Gunakan: <code>/terima KODE</code>\n\nContoh: <code>/terima NK-X7Y9Z2</code>",
      { parse_mode: "HTML" },
    );
    return;
  }

  if (user.primaryGroupId) {
    await ctx.reply("⚠️ Kamu sudah terhubung dengan kelompok tabungan lain!");
    return;
  }

  // Cari kode di InviteLink
  const invite = await prisma.inviteLink.findUnique({
    where: { code },
    include: { creator: true },
  });

  if (!invite || invite.isUsed) {
    await ctx.reply("❌ Kode undangan tidak valid atau sudah digunakan.");
    return;
  }

  if (new Date() > invite.expiresAt) {
    await ctx.reply(
      "❌ Kode undangan sudah kadaluarsa (lebih dari 5 menit). Silakan buat baru dengan /hubungkan.",
    );
    return;
  }

  if (invite.creatorId === user.id) {
    await ctx.reply("❌ Kamu tidak bisa menggunakan kode undangan milikmu sendiri.");
    return;
  }

  let targetGroupId = invite.creator.primaryGroupId;

  // Jika pembuat belum memiliki SavingsGroup, buat baru
  if (!targetGroupId) {
    const groupName = `Tabungan ${invite.creator.fullName} & ${user.fullName}`;
    const newGroup = await prisma.savingsGroup.create({
      data: {
        name: groupName,
        members: {
          connect: [{ id: invite.creatorId }, { id: user.id }],
        },
      },
    });
    targetGroupId = newGroup.id;

    // Set primaryGroupId untuk creator
    await prisma.user.update({
      where: { id: invite.creatorId },
      data: { primaryGroupId: targetGroupId },
    });
  } else {
    // Hubungkan user ke group yang sudah ada
    await prisma.savingsGroup.update({
      where: { id: targetGroupId },
      data: {
        members: {
          connect: [{ id: user.id }],
        },
      },
    });
  }

  // Set primaryGroupId untuk user penerima
  await prisma.user.update({
    where: { id: user.id },
    data: { primaryGroupId: targetGroupId },
  });

  // Tandai link undangan terpakai
  await prisma.inviteLink.update({
    where: { id: invite.id },
    data: { isUsed: true },
  });

  await ctx.reply(
    `🎉 <b>Selamat!</b> Kamu dan <b>${invite.creator.fullName}</b> berhasil terhubung ke kelompok tabungan bersama!`,
    { parse_mode: "HTML" },
  );

  // Kirim notifikasi ke pembuat undangan jika telegramId terhubung
  if (invite.creator.telegramId) {
    try {
      await ctx.api.sendMessage(
        invite.creator.telegramId.toString(),
        `🎉 <b>${user.fullName}</b> telah menerima undangan kamu! Sekarang kalian resmi terhubung dalam satu kelompok tabungan.`,
        { parse_mode: "HTML" },
      );
    } catch (err) {
      console.error("Gagal mengirim notifikasi ke pembuat undangan:", err);
    }
  }
}

/**
 * Helper internal untuk fetch user jika dipanggil dari deep link
 */
async function getOrFetchUser(ctx) {
  if (ctx.user) return ctx.user;
  if (!ctx.from) return null;
  const telegramId = BigInt(ctx.from.id);
  return prisma.user.findUnique({
    where: { telegramId },
    include: { group: true },
  });
}

/**
 * Handler: /batalkanhubungan <username>
 */
export async function handleCancelConnectionPrompt(ctx) {
  const user = ctx.user;
  const targetUsernameRaw = (ctx.match || "").trim().replace(/^@/, "");

  if (!user.primaryGroupId) {
    await ctx.reply("⚠️ Kamu saat ini belum tergabung dalam kelompok tabungan.");
    return;
  }

  if (!targetUsernameRaw) {
    await ctx.reply(
      "⚠️ <b>Format Salah!</b>\n\nGunakan: <code>/batalkanhubungan USERNAME</code>\nContoh: <code>/batalkanhubungan budi_123</code>",
      { parse_mode: "HTML" },
    );
    return;
  }

  // Cari target user di kelompok yang sama
  const group = await prisma.savingsGroup.findUnique({
    where: { id: user.primaryGroupId },
    include: { members: true },
  });

  const targetUser = group?.members.find(
    (m) => m.username?.toLowerCase() === targetUsernameRaw.toLowerCase(),
  );

  if (!targetUser) {
    await ctx.reply(
      `❌ Username <b>@${targetUsernameRaw}</b> tidak ditemukan di dalam kelompok tabungan kamu.`,
      { parse_mode: "HTML" },
    );
    return;
  }

  if (targetUser.id === user.id) {
    await ctx.reply(
      "⚠️ Untuk keluar dari kelompok tabungan sendiri, silakan gunakan perintah <code>/keluarhubungan</code>.",
      { parse_mode: "HTML" },
    );
    return;
  }

  const keyboard = new InlineKeyboard()
    .text("✅ Ya, Keluarkan", `confirm_remove_${targetUser.id}`)
    .text("❌ Batal", "confirm_remove_cancel");

  await ctx.reply(
    `Apakah Anda yakin ingin mengeluarkan <b>${targetUser.fullName}</b> (@${targetUser.username}) dari kelompok tabungan?\n\n` +
      `<i>(Catatan: Saldo riwayat transaksi pengguna tersebut tetap tersimpan di dalam kelompok ini)</i>`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    },
  );
}

/**
 * Handler: /keluarhubungan
 */
export async function handleLeaveGroupPrompt(ctx) {
  const user = ctx.user;

  if (!user.primaryGroupId) {
    await ctx.reply("⚠️ Kamu saat ini belum tergabung dalam kelompok tabungan.");
    return;
  }

  const keyboard = new InlineKeyboard()
    .text("✅ Ya, Keluar", "confirm_leave_group_yes")
    .text("❌ Batal", "confirm_leave_group_no");

  await ctx.reply(
    `Apakah Anda yakin ingin keluar dari kelompok tabungan saat ini?\n\n` +
      `<i>(Catatan: Saldo riwayat transaksi Anda tetap tersimpan di kelompok ini)</i>`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    },
  );
}

/**
 * Callback query router untuk aksi hubungan grup
 */
export async function handleGroupCallbacks(ctx) {
  const data = ctx.callbackQuery.data;

  if (data === "confirm_remove_cancel") {
    await ctx.answerCallbackQuery("Proses pembatalan dikonfirmasi.");
    await ctx.editMessageText("❌ Pembatalan hubungan dibatalkan.");
    return;
  }

  if (data.startsWith("confirm_remove_")) {
    const targetUserId = data.replace("confirm_remove_", "");
    try {
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (targetUser) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { primaryGroupId: null },
        });
        await ctx.answerCallbackQuery("Anggota berhasil dikeluarkan.");
        await ctx.editMessageText(
          `✅ <b>${targetUser.fullName}</b> (@${targetUser.username}) telah dikeluarkan dari kelompok tabungan. Saldo riwayat tetap aman tersimpan.`,
          { parse_mode: "HTML" },
        );
      }
    } catch (err) {
      console.error("Error pada confirm_remove callback:", err);
      await ctx.answerCallbackQuery("Terjadi kesalahan.");
    }
    return;
  }

  if (data === "confirm_leave_group_no") {
    await ctx.answerCallbackQuery("Proses keluar dibatalkan.");
    await ctx.editMessageText("❌ Proses keluar dari kelompok dibatalkan.");
    return;
  }

  if (data === "confirm_leave_group_yes") {
    const telegramId = BigInt(ctx.from.id);
    try {
      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { primaryGroupId: null },
        });
        await ctx.answerCallbackQuery("Berhasil keluar kelompok.");
        await ctx.editMessageText(
          "✅ <b>Anda telah berhasil keluar dari kelompok tabungan.</b>",
          { parse_mode: "HTML" },
        );
      }
    } catch (err) {
      console.error("Error pada confirm_leave_group callback:", err);
      await ctx.answerCallbackQuery("Terjadi kesalahan.");
    }
    return;
  }
}

/**
 * Handler: /daftarhubungan
 */
export async function handleListConnections(ctx) {
  const user = ctx.user;

  if (!user.primaryGroupId) {
    await ctx.reply(
      "⚠️ Kamu belum tergabung dalam kelompok tabungan. Gunakan <code>/hubungkan</code> untuk mengundang pasangan.",
      { parse_mode: "HTML" },
    );
    return;
  }

  try {
    const group = await prisma.savingsGroup.findUnique({
      where: { id: user.primaryGroupId },
      include: { members: true },
    });

    if (!group || !group.members.length) {
      await ctx.reply("❌ Tidak ditemukan anggota di dalam kelompok tabungan ini.");
      return;
    }

    let message = `👨‍👩‍👧‍👦 <b>Daftar Anggota Kelompok (${group.name})</b>\n\n`;

    group.members.forEach((member, index) => {
      const isSelf = member.id === user.id ? " (Anda)" : "";
      message +=
        `${index + 1}. <b>${member.fullName}</b>${isSelf}\n` +
        `   • Username: @${member.username || "-"}\n` +
        `   • Email: ${member.email || "-"}\n\n`;
    });

    await ctx.reply(message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error pada handleListConnections:", error);
    await ctx.reply("❌ Terjadi kesalahan saat memuat daftar anggota.");
  }
}
