import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Mengirimkan email reset kata sandi ke user.
 * @param {string} toEmail 
 * @param {string} newPassword 
 * @returns {Promise<boolean>} Status berhasil/gagal
 */
export async function sendPasswordResetEmail(toEmail, newPassword) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ Kredensial SMTP belum dikonfigurasi di file .env. Email simulasi:");
    console.log(`[SIMULASI EMAIL] Kepada: ${toEmail} | Password Baru: ${newPassword}`);
    return true;
  }

  const mailOptions = {
    from: `"${process.env.APP_NAME || "Bot Tabungan Bersama"}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset Kata Sandi - Bot Tabungan Bersama",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">Reset Kata Sandi</h2>
        <p>Halo,</p>
        <p>Anda telah meminta reset kata sandi untuk akun <b>Bot Tabungan Bersama</b> Anda.</p>
        <p>Berikut adalah kata sandi baru Anda:</p>
        <div style="background-color: #f4f6f9; padding: 15px; text-align: center; border-radius: 5px; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #27ae60;">
          ${newPassword}
        </div>
        <p style="margin-top: 20px;">Silakan login menggunakan kata sandi baru ini dan Anda dapat mengubahnya sewaktu-waktu dengan perintah <code>/ubahsandi</code> di bot Telegram.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Pesan ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✉️ Email reset password terkirim:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Gagal mengirim email reset password:", error);
    return false;
  }
}
