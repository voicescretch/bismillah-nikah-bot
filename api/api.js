import { Bot, session, webhookCallback } from "grammy";
import dotenv from "dotenv";
import { prisma } from "../src/lib/prisma.js";

// Import middleware & commands dari folder src
import { requireAuth } from "../src/middlewares/auth.js";
import {
  handleStart,
  handleProfile,
  handleHelp,
} from "../src/commands/auth.js";
import {
  handleConnectGroup,
  handleAcceptInvite,
  handleCancelConnectionPrompt,
  handleLeaveGroupPrompt,
  handleGroupCallbacks,
  handleListConnections,
} from "../src/commands/group.js";
import {
  handleDeposit,
  handleWithdrawal,
  handleHistory,
  handleTotal,
  handleSummary,
} from "../src/commands/savings.js";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

// Middleware
bot.use(
  session({
    initial: () => ({}),
  }),
);
bot.use(requireAuth);

// Callback Queries
bot.callbackQuery(
  (data) =>
    data.startsWith("confirm_remove_") ||
    data.startsWith("confirm_leave_group_"),
  handleGroupCallbacks,
);

// Routing Commands
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

// Export handler khusus untuk Serverless Function Vercel
export default webhookCallback(bot, "std/http");
