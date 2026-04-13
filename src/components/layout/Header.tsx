import { useAuthStore } from "../../store/authStore";

export default function Header() {
  const { user } = useAuthStore();
  
  return (
    <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
      <img 
  src="https://raw.githubusercontent.com/appyem/imagenesappy/refs/heads/main/Logo%20de%20VotoAnalytics%20con%20gra%CC%81fico%20y%20texto.png" 
  alt="VotoAnalytics - APPYEMPRESA S.A.S" 
  className="h-32 w-auto object-contain"
/>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
          {user?.email?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}