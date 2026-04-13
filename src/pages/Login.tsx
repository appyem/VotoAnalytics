import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Credenciales inválidas. Verifique su usuario y contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-primary relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-surface/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/20 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-700/50 bg-gradient-to-r from-primary to-surface">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <div>
                <img 
                    src="https://raw.githubusercontent.com/appyem/imagenesappy/refs/heads/main/Logo%20de%20VotoAnalytics%20con%20gra%CC%81fico%20y%20texto.png" 
                    alt="VotoAnalytics - APPYEMPRESA S.A.S" 
                    className="h-48 w-auto object-contain mx-auto mb-4"
                    />
                <p className="text-xs text-gray-400">Plataforma de Inteligencia Electoral</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@appyempresa.digital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl 
                           text-gray-100 placeholder-gray-500 
                           focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl 
                           text-gray-100 placeholder-gray-500 
                           focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm animate-shake">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent to-blue-600 
                       hover:from-accent/90 hover:to-blue-600/90 
                       text-white font-semibold rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2
                       transition-all duration-200 shadow-lg shadow-accent/20
                       hover:shadow-accent/40 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-center text-xs text-gray-500">
                © {new Date().getFullYear()} <span className="text-gray-400">APPYEMPRESA S.A.S</span>
                <br />
                <span className="text-gray-600">Ing. Cristian Marín - CEO</span>
              </p>
            </div>
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Conexión segura • Datos encriptados</span>
        </div>
      </div>
    </div>
  );
}