import { jsPDF } from "jspdf";

export function exportSimplePdf(title: string, rows: Array<{ label: string; value: string }>, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let y = 80;

  rows.forEach((row) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    doc.setTextColor(80, 80, 80);
    doc.text(`${row.label}:`, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(row.value, margin + 140, y);
    y += lineHeight;
  });

  doc.save(filename);
}

export function exportTablePdf({
  title,
  subtitle,
  columns,
  rows,
  filename,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
  filename: string;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 14;
  const colWidth = (pageWidth - margin * 2) / columns.length;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, 50);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, margin, 70);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  let y = subtitle ? 95 : 80;
  columns.forEach((col, index) => {
    const x = margin + index * colWidth;
    doc.text(col, x, y);
  });

  doc.setFont("helvetica", "normal");
  y += 14;

  rows.forEach((row, rowIndex) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      columns.forEach((col, index) => {
        const x = margin + index * colWidth;
        doc.text(col, x, y);
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      y += 14;
    }

    row.forEach((cell, index) => {
      const x = margin + index * colWidth;
      const text = String(cell ?? "");
      const wrapped = doc.splitTextToSize(text, colWidth - 10);
      doc.text(wrapped, x, y);
    });
    y += Math.max(12, row.length > 0 ? 12 : 10);
  });

  doc.save(filename);
}
