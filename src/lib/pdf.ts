import { jsPDF } from "jspdf";

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, 30);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, margin, 50);
  }

  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Page ${pageNumber}`, 40, pageHeight - 25);
}

export function exportSimplePdf(title: string, rows: Array<{ label: string; value: string }>, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const lineHeight = 18;

  addHeader(doc, title, "Export généré depuis ELISHAMA");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let y = 95;

  rows.forEach((row) => {
    if (y > 760) {
      addFooter(doc, doc.getCurrentPageInfo().pageNumber);
      doc.addPage();
      addHeader(doc, title, "Export généré depuis ELISHAMA");
      y = 95;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y - 10, pageWidth - margin * 2, 22, 4, 4, "F");
    doc.setTextColor(71, 85, 105);
    doc.text(`${row.label}:`, margin + 12, y + 3);
    doc.setTextColor(15, 23, 42);
    doc.text(row.value, margin + 140, y + 3);
    y += lineHeight;
  });

  addFooter(doc, doc.getCurrentPageInfo().pageNumber);
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

  addHeader(doc, title, subtitle || "Export généré depuis ELISHAMA");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  let y = 95;
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
  columns.forEach((col, index) => {
    const x = margin + index * colWidth + 6;
    doc.text(col, x, y + 14);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 36;

  rows.forEach((row) => {
    if (y > 760) {
      addFooter(doc, doc.getCurrentPageInfo().pageNumber);
      doc.addPage();
      addHeader(doc, title, subtitle || "Export généré depuis ELISHAMA");
      y = 95;
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
      columns.forEach((col, index) => {
        const x = margin + index * colWidth + 6;
        doc.text(col, x, y + 14);
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      y += 36;
    }

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y - 8, pageWidth - margin * 2, 20, 3, 3, "S");
    row.forEach((cell, index) => {
      const x = margin + index * colWidth + 6;
      const text = String(cell ?? "");
      const wrapped = doc.splitTextToSize(text, colWidth - 12);
      doc.text(wrapped, x, y + 3);
    });
    y += lineHeight + 4;
  });

  addFooter(doc, doc.getCurrentPageInfo().pageNumber);
  doc.save(filename);
}
