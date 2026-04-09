import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AppLayout from "../components/layout/AppLayout.tsx";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import DataUpload from "../pages/DataUpload";
import Analysis from "../pages/Analysis";
import AIInsights from "../pages/AIInsights";
import Reports from "../pages/Reports";
import PublicDashboard from "../pages/PublicDashboard";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/public/:id" element={<PublicDashboard />} />
        <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><DataUpload /></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}