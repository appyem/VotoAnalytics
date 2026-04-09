import * as XLSX from "xlsx";
export const downloadTemplate = () => {
  const headers = ["department","municipality","corregimiento","puesto","mesa","partyId","partyName","candidateId","candidateName","leaderIds","votes","projectId"];
  const ws = XLSX.utils.aoa_to_sheet([headers, ["", "", "", "", "", "", "", "", "", "", "", ""]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Votos");
  XLSX.writeFile(wb, "Plantilla_VotoAnalytics.xlsx");
};