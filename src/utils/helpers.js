import { prisma } from "../lib/prisma.js";

/**
 * Parsing input nominal uang dari format string user (misal: "100.000", "Rp 500,000", "250000").
 * @param {string|number} input 
 * @returns {number} Nominal dalam float/number, atau NaN jika invalid.
 */
export function parseNominal(input) {
  if (typeof input === "number") return input;
  if (!input || typeof input !== "string") return NaN;

  // Hapus karakter selain angka, minus, dan titik desimal
  // Catatan: Jika format rupiah seperti 100.000, titik adalah pemisah ribuan.
  let cleaned = input.replace(/Rp/gi, "").trim();
  
  // Jika mengandung titik pemisah ribuan (seperti 100.000 atau 1.500.000)
  if (cleaned.includes(".") && !cleaned.includes(",")) {
    // Cek apakah titik dijadikan desimal atau ribuan
    const parts = cleaned.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleaned = cleaned.replace(/\./g, "");
    }
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    // Format US: 1,000,000.00 -> hapus koma
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    // Format ID: 100,000 -> ubah ke 100000 atau 100,50 -> 100.50
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const parsed = parseFloat(cleaned);
  return parsed;
}

/**
 * Format angka ke mata uang Rupiah IDR (misal: Rp 100.000).
 * @param {number|string} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format tanggal ke format lokal Indonesia (misal: 10/09/2026 14:30).
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Auto-generate username unik berbasis nama pengguna.
 * @param {string} fullName 
 * @returns {Promise<string>} Username unik (misal: budi_8392)
 */
export async function generateUniqueUsername(fullName) {
  const cleanName = (fullName || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10) || "user";

  let username = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    username = `${cleanName}_${randomDigits}`;

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    username = `user_${Date.now().toString().slice(-6)}`;
  }

  return username;
}
