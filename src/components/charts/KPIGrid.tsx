import type { ReactNode } from "react";

interface KPIGridProps {
  title: string;
  value: string;
  trend?: "up" | "down" | "stable";
  icon?: ReactNode;
  subtitle?: string;
  highlight?: boolean;
}

export default function KPIGrid({ title, value, trend = "stable", icon, subtitle, highlight = false }: KPIGridProps) {
  const trendConfig = {
    up: { color: "text-success", bg: "bg-success/10", border: "border-success/30", arrow: "↑", label: "Crecimiento" },
    down: { color: "text-danger", bg: "bg-danger/10", border: "border-danger/30", arrow: "↓", label: "Disminución" },
    stable: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", arrow: "→", label: "Estable" }
  };

  const { color, bg, arrow, label } = trendConfig[trend];

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 group ${
      highlight 
        ? "bg-gradient-to-br from-accent/10 to-surface border-accent/30 shadow-lg shadow-accent/10" 
        : "bg-surface/50 backdrop-blur-sm border-gray-700/50 hover:border-gray-600/50"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${highlight ? "text-gray-200" : "text-gray-400"}`}>
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-3xl font-bold ${highlight ? "text-white" : color}`}>
          {value}
        </span>
        <span className={`text-sm font-medium ${color} flex items-center`}>
          {arrow}
        </span>
      </div>

      {/* Trend Label */}
      <span className={`text-xs font-medium ${color}`}>{label}</span>

      {/* Subtitle */}
      {subtitle && (
        <p className={`mt-3 pt-3 border-t ${highlight ? "border-accent/20" : "border-gray-700/50"} text-xs ${
          highlight ? "text-gray-300" : "text-gray-500"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}