import { Bot, session } from "grammy";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

// Import middleware
import { requireAuth } from "./middlewares/auth.js";

// Import auth commands
import { handleStart, handleProfile, handleHelp } from "./commands/auth.js";

// Import group commands
import {
  handleConnectGroup,
  handleAcceptInvite,
  handleCancelConnectionPrompt,
  handleLeaveGroupPrompt,
  handleGroupCallbacks,
  handleListConnections,
} from "./commands/group.js";

// Import savings commands
import {
  handleDeposit,
  handleWithdrawal,
  handleHistory,
  handleTotal,
  handleSummary,
} from "./commands/savings.js";

dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error("❌ ERROR: BOT_TOKEN belum diatur di file .env");
  process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

// 1. Session Middleware
bot.use(
  session({
    initial: () => ({}),
  }),
);

// 2. Telegram Auto-Sync Middleware (Semua interaksi otomatis mensinkronkan akun Telegram pengguna)
bot.use(requireAuth);

// 3. Callback Queries Handler
bot.callbackQuery(
  (data) =>
    data.startsWith("confirm_remove_") ||
    data.startsWith("confirm_leave_group_"),
  handleGroupCallbacks,
);

// 4. Command Routing
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("profil", handleProfile);

bot.command("hubungkan", handleConnectGroup);
bot.command("terima", handleAcceptInvite);
bot.command("batalkanhubungan", handleCancelConnectionPrompt);
bot.command("keluarhubungan", handleLeaveGroupPrompt);
bot.command("daftarhubungan", handleListConnections);

bot.command("menabung", handleDeposit);
bot.command("penarikan", handleWithdrawal);
bot.command("riwayat", handleHistory);
bot.command("total", handleTotal);
bot.command("ringkasan", handleSummary);

// Global Error Handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(
    `Error saat menangani update ${ctx.update?.update_id}:`,
    err.error,
  );
});

// Graceful Shutdown
process.once("SIGINT", async () => {
  console.log("Shutting down bot...");
  await prisma.$disconnect();
  bot.stop();
});
process.once("SIGTERM", async () => {
  console.log("Shutting down bot...");
  await prisma.$disconnect();
  bot.stop();
});

// Jalankan Bot
bot.start();
console.log(
  "🤖 Bot Tabungan Bersama (Telegram Auto-Sync) berhasil dijalankan!",
);
