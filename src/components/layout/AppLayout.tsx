import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />
        
        {/* Scrollable Content with Professional Grid */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb Context */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
              <img 
  src="https://raw.githubusercontent.com/appyem/imagenesappy/refs/heads/main/Logo%20de%20VotoAnalytics%20con%20gra%CC%81fico%20y%20texto.png" 
  alt="VotoAnalytics - APPYEMPRESA S.A.S" 
  className="h-32 w-auto object-contain hover:opacity-90 transition-opacity cursor-pointer"
/>
              <span className="text-gray-700">/</span>
              <span className="text-gray-300 font-medium">Dashboard</span>
            </nav>
            
            {/* Page Content */}
            <div className="animate-fade-in">
              {children || <Outlet />}
            </div>
          </div>
        </main>
        
        {/* Professional Footer */}
        <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
              <span>© {new Date().getFullYear()} <span className="text-gray-400">APPYEMPRESA S.A.S</span></span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  Sistema operativo
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">v1.0.2</span>
                <span className="hidden sm:inline">•</span>
                <a href="#" className="hover:text-accent transition-colors">Soporte</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}