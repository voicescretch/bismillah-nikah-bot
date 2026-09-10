import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";

// Export Vercel Serverless Webhook Handler
export default webhookCallback(bot, "std/http");
