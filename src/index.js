import { bot } from "./bot.js";
import { prisma } from "./lib/prisma.js";

// Mode Polling Lokal (npm run dev / npm start)
bot.start();
console.log("🤖 Bot Tabungan Bersama (Local Polling Mode) berhasil dijalankan!");

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
