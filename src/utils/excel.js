import ExcelJS from "exceljs";
import { formatDate } from "./helpers.js";

/**
 * Generate file Excel buffer berisi riwayat transaksi tabungan.
 * 
 * @param {Object} params
 * @param {string} params.title - Judul laporan (misal: "Riwayat Tabungan Bersama")
 * @param {Array} params.transactions - Array data transaksi dari DB
 * @returns {Promise<Buffer>} Buffer file .xlsx
 */
export async function generateSavingsExcelBuffer({ title, transactions }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bot Tabungan Bersama";
  workbook.lastModifiedBy = "Bot Tabungan Bersama";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Riwayat Tabungan");

  // Style definisi
  const titleStyle = {
    font: { name: "Arial", size: 16, bold: true, color: { argb: "1F497D" } },
    alignment: { horizontal: "center", vertical: "middle" },
  };

  const headerStyle = {
    font: { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "2C3E50" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin", color: { argb: "000000" } },
      left: { style: "thin", color: { argb: "000000" } },
      bottom: { style: "medium", color: { argb: "000000" } },
      right: { style: "thin", color: { argb: "000000" } },
    },
  };

  const summaryHeaderStyle = {
    font: { name: "Arial", size: 11, bold: true, color: { argb: "000000" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "ECF0F1" } },
    alignment: { horizontal: "right", vertical: "middle" },
    border: {
      top: { style: "thin", color: { argb: "000000" } },
      left: { style: "thin", color: { argb: "000000" } },
      bottom: { style: "thin", color: { argb: "000000" } },
      right: { style: "thin", color: { argb: "000000" } },
    },
  };

  const totalNetStyle = {
    font: { name: "Arial", size: 11, bold: true, color: { argb: "27AE60" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "E8F8F5" } },
    alignment: { horizontal: "right", vertical: "middle" },
    border: {
      top: { style: "medium", color: { argb: "27AE60" } },
      left: { style: "thin", color: { argb: "000000" } },
      bottom: { style: "double", color: { argb: "27AE60" } },
      right: { style: "thin", color: { argb: "000000" } },
    },
  };

  // 1. Judul Laporan (Row 1-2)
  worksheet.mergeCells("A1:E1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title || "RIWAYAT TABUNGAN BERSAMA";
  titleCell.font = titleStyle.font;
  titleCell.alignment = titleStyle.alignment;
  worksheet.getRow(1).height = 30;

  worksheet.addRow([]); // Row 2 Kosong

  // 2. Header Tabel (Row 3)
  const headers = ["No", "Tanggal", "Username", "Tipe", "Nominal"];
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.font = headerStyle.font;
    cell.fill = headerStyle.fill;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });

  // Data & Perhitungan
  let totalDeposit = 0;
  let totalWithdrawal = 0;

  transactions.forEach((tx, index) => {
    const rawAmount = Number(tx.amount);
    const isDeposit = tx.type === "DEPOSIT";
    const tipeLabel = isDeposit ? "Pemasukan" : "Pengeluaran";
    const usernameDisplay = tx.user ? (tx.user.username || tx.user.fullName) : "-";

    if (isDeposit) {
      totalDeposit += rawAmount;
    } else {
      totalWithdrawal += rawAmount;
    }

    const row = worksheet.addRow([
      index + 1,
      formatDate(tx.createdAt),
      usernameDisplay,
      tipeLabel,
      rawAmount,
    ]);

    row.height = 20;

    // Formatting per Cell
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    
    // Warna Tipe Pemasukan vs Pengeluaran
    if (isDeposit) {
      row.getCell(4).font = { color: { argb: "27AE60" }, bold: true };
    } else {
      row.getCell(4).font = { color: { argb: "C0392B" }, bold: true };
    }

    // Nominal currency format
    const amountCell = row.getCell(5);
    amountCell.numFmt = '"Rp "#,##0';
    amountCell.alignment = { horizontal: "right", vertical: "middle" };

    // Border data row
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "E0E0E0" } },
        left: { style: "thin", color: { argb: "E0E0E0" } },
        bottom: { style: "thin", color: { argb: "E0E0E0" } },
        right: { style: "thin", color: { argb: "E0E0E0" } },
      };
    });
  });

  const netBalance = totalDeposit - totalWithdrawal;

  // 3. Baris Summary / Kalkulasi (Row paling bawah)
  worksheet.addRow([]); // Spacer row

  // Row Total Pemasukan
  const depositRow = worksheet.addRow(["", "", "", "Total Pemasukan:", totalDeposit]);
  depositRow.height = 22;
  depositRow.getCell(4).font = summaryHeaderStyle.font;
  depositRow.getCell(4).fill = summaryHeaderStyle.fill;
  depositRow.getCell(4).alignment = summaryHeaderStyle.alignment;
  depositRow.getCell(5).font = { bold: true, color: { argb: "27AE60" } };
  depositRow.getCell(5).numFmt = '"Rp "#,##0';
  depositRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

  // Row Total Pengeluaran
  const withdrawalRow = worksheet.addRow(["", "", "", "Total Pengeluaran:", totalWithdrawal]);
  withdrawalRow.height = 22;
  withdrawalRow.getCell(4).font = summaryHeaderStyle.font;
  withdrawalRow.getCell(4).fill = summaryHeaderStyle.fill;
  withdrawalRow.getCell(4).alignment = summaryHeaderStyle.alignment;
  withdrawalRow.getCell(5).font = { bold: true, color: { argb: "C0392B" } };
  withdrawalRow.getCell(5).numFmt = '"Rp "#,##0';
  withdrawalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };

  // Row Sisa Total Tabungan (Net)
  const netRow = worksheet.addRow(["", "", "", "Sisa Total Tabungan:", netBalance]);
  netRow.height = 25;
  netRow.getCell(4).font = totalNetStyle.font;
  netRow.getCell(4).fill = totalNetStyle.fill;
  netRow.getCell(4).alignment = totalNetStyle.alignment;
  netRow.getCell(5).font = { bold: true, size: 12, color: { argb: "27AE60" } };
  netRow.getCell(5).fill = totalNetStyle.fill;
  netRow.getCell(5).numFmt = '"Rp "#,##0';
  netRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
  netRow.getCell(5).border = totalNetStyle.border;

  // 4. Auto Column Widths
  worksheet.columns.forEach((col, i) => {
    let maxLen = 12;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const valStr = cell.value ? cell.value.toString() : "";
      if (valStr.length > maxLen && i !== 0) { // skip title row length
        maxLen = Math.min(valStr.length + 3, 35);
      }
    });
    col.width = maxLen;
  });

  worksheet.getColumn(1).width = 8;  // No
  worksheet.getColumn(2).width = 20; // Tanggal
  worksheet.getColumn(3).width = 22; // Username
  worksheet.getColumn(4).width = 22; // Tipe / Label
  worksheet.getColumn(5).width = 22; // Nominal

  // Output as Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
