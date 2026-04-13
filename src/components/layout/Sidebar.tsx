import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Upload, BarChart3, Brain, FileText, LogOut, 
  ChevronLeft, ChevronRight, Settings, HelpCircle 
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Carga de Datos", icon: Upload, path: "/upload" },
  { label: "Análisis", icon: BarChart3, path: "/analysis" },
];

const secondaryNav = [
  { label: "IA Estratégica", icon: Brain, path: "/ai" },
  { label: "Reportes", icon: FileText, path: "/reports" },
];

const utilityNav = [
  { label: "Configuración", icon: Settings, path: "/settings" },
  { label: "Ayuda", icon: HelpCircle, path: "/help" },
];

export default function Sidebar() {
  const loc = useLocation();
  const { logout, user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ item }: { item: typeof mainNav[0]; isSecondary?: boolean }) => {
    const isActive = loc.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive 
            ? "bg-accent/15 text-accent border border-accent/30" 
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
        } ${isCollapsed ? "justify-center px-2" : ""}`}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent" : ""}`} />
        {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
        {isActive && !isCollapsed && (
          <span className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <aside className={`bg-primary border-r border-gray-800 flex flex-col transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-64"
    }`}>
      {/* Brand Header */}
      <div className={`p-4 border-b border-gray-800 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed ? (
          <>
            <div>
              <img 
                src="https://raw.githubusercontent.com/appyem/imagenesappy/refs/heads/main/Logo%20de%20VotoAnalytics%20con%20gra%CC%81fico%20y%20texto.png" 
                alt="VotoAnalytics - APPYEMPRESA S.A.S" 
                className="h-32 w-auto object-contain"
                />
              <p className="text-xs text-gray-500 mt-0.5">APPYEMPRESA S.A.S</p>
            </div>
          </>
        ) : (
          <div className="p-2 bg-accent/20 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-accent" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          {!isCollapsed && <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Principal</p>}
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Secondary Section */}
        <div className="space-y-1">
          {!isCollapsed && <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Análisis</p>}
          {secondaryNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Utilities Section */}
        <div className="space-y-1 pt-4 border-t border-gray-800">
          {!isCollapsed && <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilidades</p>}
          {utilityNav.map((item) => (
            <NavItem key={item.path} item={item} isSecondary />
          ))}
        </div>
      </nav>

      {/* User & Logout */}
      <div className={`p-3 border-t border-gray-800 ${isCollapsed ? "flex justify-center" : ""}`}>
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-800/30">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-sm">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.email?.split("@")[0]}</p>
                <p className="text-xs text-gray-500 truncate">Administrador</p>
              </div>
            </div>
            
            {/* Logout */}
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}