import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, BarChart3, Brain, FileText, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Carga de Datos", icon: Upload, path: "/upload" },
  { label: "Análisis", icon: BarChart3, path: "/analysis" },
  { label: "IA Estratégica", icon: Brain, path: "/ai" },
  { label: "Reportes", icon: FileText, path: "/reports" }
];

export default function Sidebar() {
  const loc = useLocation();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-primary border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-accent tracking-wider">VotoAnalytics</h1>
        <p className="text-xs text-gray-400 mt-1">APPYEMPRESA S.A.S</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {nav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              loc.pathname === item.path ? "bg-accent/20 text-accent" : "hover:bg-gray-800"
            }`}
          >
            <item.icon size={20} /> {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 m-4 text-gray-400 hover:text-danger transition">
        <LogOut size={20} /> Cerrar Sesión
      </button>
    </aside>
  );
}