import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
        <footer className="p-4 text-center text-gray-500 text-sm border-t border-gray-800">
          © {new Date().getFullYear()} APPYEMPRESA S.A.S | VotoAnalytics v1.0
        </footer>
      </div>
    </div>
  );
}