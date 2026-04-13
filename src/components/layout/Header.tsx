import { useAuthStore } from "../../store/authStore";

export default function Header() {
  const { user } = useAuthStore();
  
  return (
    <header className="h-16 bg-surface border-b border-gray-800 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-100">VotoAnalytics</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
          {user?.email?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}