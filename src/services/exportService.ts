import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ============================================================================
// TIPOS SEGUROS (Cero 'any')
// ============================================================================

type TableCell = string | number | { content: string | number; styles?: Record<string, unknown> };
type TableRow = TableCell[];
type ExcelRow = Record<string, string | number | boolean | null | undefined>;

// ============================================================================
// EXPORTACIÓN PDF
// ============================================================================

export const exportToPDF = (title: string, headers: string[], data: TableRow[]): void => {
  const doc = new jsPDF({ orientation: "landscape" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 30,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" }
  });
  
  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${safeTitle}.pdf`);
};

// ============================================================================
// EXPORTACIÓN EXCEL
// ============================================================================

export const exportToExcel = (data: ExcelRow[], sheetName: string, fileName: string): void => {
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 25 }];
  
  const wb = XLSX.utils.book_new();
  const safeSheetName = sheetName.slice(0, 31).replace(/[\\/\\?*:\\[\]]/g, "");
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  
  const safeName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  XLSX.writeFile(wb, `${safeName}.xlsx`);
};

// ============================================================================
// UTILIDADES DE CONVERSIÓN
// ============================================================================

export const toTableRowFormat = <T extends Record<string, unknown>>(data: T[], columns: string[]): TableRow[] => {
  return data.map(row => 
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number") return value;
      return String(value);
    })
  );
};

export const sanitizeExcelValue = (value: string | number | boolean | null | undefined): string | number => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return value;
};