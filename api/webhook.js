import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";

// Handler untuk Vercel Node.js Serverless Function (menggunakan adapter "express")
const handler = webhookCallback(bot, "express");

export default handler;
