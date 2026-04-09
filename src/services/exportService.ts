import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const exportToPDF = (title: string, headers: string[], data: any[][]) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  autoTable(doc, { head: [headers], body: data, startY: 30 });
  doc.save(`${title.replace(/\s/g, "_")}.pdf`);
};

export const exportToExcel = (data: any[], sheetName: string, fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};