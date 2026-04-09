export default function KPIGrid({ title, value, trend }: { title: string; value: string; trend?: "up" | "down" | "stable" }) {
  const color = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-warning";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-2 flex items-center gap-2 ${color}`}>
        {value} <span className="text-sm">{arrow}</span>
      </p>
    </div>
  );
}