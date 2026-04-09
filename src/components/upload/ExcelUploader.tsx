import { useState } from "react";
import * as XLSX from "xlsx";
import { VoteRecord } from "../../models/types";
import { useDataStore } from "../../store/dataStore";

export default function ExcelUploader() {
  const [file, setFile] = useState<File | null>(null);
  const { setVotes } = useDataStore();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const data = await f.arrayBuffer();
    const workbook = XLSX.read(data);
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<VoteRecord>(ws);

    // Validación básica
    const valid = json.filter(r => r.votes && r.partyId && r.mesa);
    setVotes(valid as VoteRecord[]);
    alert(`${valid.length} registros cargados correctamente.`);
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Carga Masiva por Excel</h3>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80"/>
      <p className="mt-3 text-xs text-gray-500">Columnas requeridas: department, municipality, corregimiento, puesto, mesa, partyId, partyName, candidateId, candidateName, leaderIds, votes, projectId</p>
    </div>
  );
}