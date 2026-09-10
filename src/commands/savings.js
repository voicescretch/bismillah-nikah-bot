import { InputFile } from "grammy";
import { prisma } from "../lib/prisma.js";
import { parseNominal, formatCurrency } from "../utils/helpers.js";
import { generateSavingsExcelBuffer } from "../utils/excel.js";

/**
 * Handler: /menabung <nominal>
 */
export async function handleDeposit(ctx) {
  const user = ctx.user; // Dari requireAuth middleware
  const amountRaw = ctx.match?.trim();

  const amount = parseNominal(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(
      `⚠️ <b>Format Salah!</b>\n\n` +
        `Gunakan: <code>/menabung &lt;nominal&gt;</code>\n` +
        `<i>Contoh:</i> <code>/menabung 100000</code> atau <code>/menabung 150.000</code>`,
      { parse_mode: "HTML" },
    );
    return;
  }

  try {
    await prisma.savingsHistory.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: amount,
      },
    });

    const formatted = formatCurrency(amount);
    await ctx.reply(
      `✅ Berhasil mencatat tabungan pemasukan sebesar <b>${formatted}</b>! 💰✨`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    console.error("Error pada handleDeposit:", error);
    await ctx.reply("❌ Terjadi kesalahan saat mencatat tabungan.");
  }
}

/**
 * Handler: /penarikan <nominal>
 */
export async function handleWithdrawal(ctx) {
  const user = ctx.user;
  const amountRaw = ctx.match?.trim();

  const amount = parseNominal(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(
      `⚠️ <b>Format Salah!</b>\n\n` +
        `Gunakan: <code>/penarikan &lt;nominal&gt;</code>\n` +
        `<i>Contoh:</i> <code>/penarikan 50000</code> atau <code>/penarikan 50.000</code>`,
      { parse_mode: "HTML" },
    );
    return;
  }

  try {
    await prisma.savingsHistory.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount: amount,
      },
    });

    const formatted = formatCurrency(amount);
    await ctx.reply(
      `✅ Berhasil mencatat penarikan tabungan sebesar <b>${formatted}</b>! 💸`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    console.error("Error pada handleWithdrawal:", error);
    await ctx.reply("❌ Terjadi kesalahan saat mencatat penarikan.");
  }
}

/**
 * Handler: /riwayat dan /riwayat <username> (atau /riwayat pribadi)
 */
export async function handleHistory(ctx) {
  const user = ctx.user;
  const matchArg = (ctx.match || "").trim().toLowerCase();

  try {
    let userIds = [user.id];
    let reportTitle = `RIWAYAT TABUNGAN - ${user.fullName.toUpperCase()}`;

    // Cek filter argumen
    if (!matchArg) {
      // /riwayat (Seluruh transaksi dalam group jika terhubung)
      if (user.primaryGroupId) {
        const groupMembers = await prisma.user.findMany({
          where: { primaryGroupId: user.primaryGroupId },
          select: { id: true },
        });
        userIds = groupMembers.map((m) => m.id);
        reportTitle = `RIWAYAT TABUNGAN KELOMPOK BERSAMA`;
      }
    } else if (matchArg === "pribadi" || matchArg === "saya") {
      // /riwayat pribadi
      userIds = [user.id];
      reportTitle = `RIWAYAT TABUNGAN PRIBADI (${user.fullName})`;
    } else {
      // /riwayat <username>
      const cleanUsername = matchArg.replace(/^@/, "");
      const targetUser = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (!targetUser) {
        await ctx.reply(
          `❌ Username <b>@${cleanUsername}</b> tidak ditemukan.`,
          { parse_mode: "HTML" },
        );
        return;
      }

      // Pastikan target user dalam grup yang sama atau diri sendiri
      if (
        targetUser.id !== user.id &&
        targetUser.primaryGroupId !== user.primaryGroupId
      ) {
        await ctx.reply(
          `❌ Pengguna @${cleanUsername} tidak berada di dalam kelompok tabungan Anda.`,
        );
        return;
      }

      userIds = [targetUser.id];
      reportTitle = `RIWAYAT TABUNGAN - ${targetUser.fullName.toUpperCase()} (@${targetUser.username})`;
    }

    // Ambil data transaksi dari database
    const transactions = await prisma.savingsHistory.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (transactions.length === 0) {
      await ctx.reply("ℹ️ Belum ada riwayat transaksi yang tercatat.");
      return;
    }

    await ctx.reply("📊 Generating file laporan Excel riwayat tabungan...");

    // Buat file Excel buffer
    const excelBuffer = await generateSavingsExcelBuffer({
      title: reportTitle,
      transactions,
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Riwayat_Tabungan_${dateStr}.xlsx`;

    await ctx.replyWithDocument(new InputFile(excelBuffer, fileName), {
      caption: `📄 <b>Laporan Excel Riwayat Tabungan</b>\n<i>${reportTitle}</i>`,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Error pada handleHistory:", error);
    await ctx.reply("❌ Terjadi kesalahan saat memproses file laporan riwayat.");
  }
}

/**
 * Handler: /total
 */
export async function handleTotal(ctx) {
  const user = ctx.user;

  try {
    let groupMembers = [user];

    if (user.primaryGroupId) {
      groupMembers = await prisma.user.findMany({
        where: { primaryGroupId: user.primaryGroupId },
        include: {
          savingsHistory: true,
        },
      });
    } else {
      // Ambil transaksi user sendiri
      const selfWithHistory = await prisma.user.findUnique({
        where: { id: user.id },
        include: { savingsHistory: true },
      });
      if (selfWithHistory) groupMembers = [selfWithHistory];
    }

    let overallTotal = 0;
    let textSummary = `📊 <b>Total Tabungan Masing-Masing Anggota</b>\n\n`;

    groupMembers.forEach((member) => {
      let memberDeposit = 0;
      let memberWithdrawal = 0;

      (member.savingsHistory || []).forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === "DEPOSIT") memberDeposit += amt;
        if (tx.type === "WITHDRAWAL") memberWithdrawal += amt;
      });

      const memberNet = memberDeposit - memberWithdrawal;
      overallTotal += memberNet;

      textSummary += `👤 <b>${member.fullName}</b> (@${member.username || "tanpa_username"}):\n`;
      textSummary += `   • Sisa Saldo: <b>${formatCurrency(memberNet)}</b>\n\n`;
    });

    textSummary += `💰 <b>Total Keseluruhan Tabungan Group:</b> <code>${formatCurrency(overallTotal)}</code>`;

    await ctx.reply(textSummary, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error pada handleTotal:", error);
    await ctx.reply("❌ Terjadi kesalahan saat memuat total tabungan.");
  }
}

/**
 * Handler: /ringkasan
 */
export async function handleSummary(ctx) {
  const user = ctx.user;

  try {
    let groupMembers = [user];

    if (user.primaryGroupId) {
      groupMembers = await prisma.user.findMany({
        where: { primaryGroupId: user.primaryGroupId },
        include: {
          savingsHistory: true,
        },
      });
    } else {
      const selfWithHistory = await prisma.user.findUnique({
        where: { id: user.id },
        include: { savingsHistory: true },
      });
      if (selfWithHistory) groupMembers = [selfWithHistory];
    }

    let totalGroupDeposit = 0;
    let totalGroupWithdrawal = 0;

    let textDetail = `📈 <b>Ringkasan Rincian Tabungan</b>\n\n`;

    groupMembers.forEach((member) => {
      let dep = 0;
      let wd = 0;

      (member.savingsHistory || []).forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === "DEPOSIT") dep += amt;
        if (tx.type === "WITHDRAWAL") wd += amt;
      });

      totalGroupDeposit += dep;
      totalGroupWithdrawal += wd;
      const net = dep - wd;

      textDetail += `👤 <b>${member.fullName}</b> (@${member.username || "tanpa_username"})\n`;
      textDetail += `   • Total Pemasukan: <b>${formatCurrency(dep)}</b>\n`;
      textDetail += `   • Total Pengeluaran: <b>${formatCurrency(wd)}</b>\n`;
      textDetail += `   • Net Tabungan: <b>${formatCurrency(net)}</b>\n\n`;
    });

    const netGroup = totalGroupDeposit - totalGroupWithdrawal;

    textDetail += `============================\n`;
    textDetail += `💵 <b>Total Pemasukan Group:</b> ${formatCurrency(totalGroupDeposit)}\n`;
    textDetail += `💸 <b>Total Pengeluaran Group:</b> ${formatCurrency(totalGroupWithdrawal)}\n`;
    textDetail += `🏦 <b>Net Total Tabungan Group:</b> <code>${formatCurrency(netGroup)}</code>`;

    await ctx.reply(textDetail, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error pada handleSummary:", error);
    await ctx.reply("❌ Terjadi kesalahan saat memuat ringkasan tabungan.");
  }
}
