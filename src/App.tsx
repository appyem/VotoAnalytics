import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";

export default function App() {
  
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      
      // Solo procesar inputs y textareas
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        
        // 🟢 NUEVO: Ignorar inputs numéricos, fecha, etc. que NO deben transformarse a mayúsculas
        const inputType = (target as HTMLInputElement).type;
        const textTypes = ['text', 'search', 'tel', 'password', 'email', 'url', ''];
        if (inputType && !textTypes.includes(inputType)) {
          return; // Salir sin modificar (ej: type="number" para campo Votos)
        }
        
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const upperValue = target.value.toUpperCase();
        
        // Solo modificar si hay cambio (evita loops infinitos)
        if (target.value !== upperValue) {
          target.value = upperValue;
          
          // 🟢 NUEVO: Restaurar cursor solo si las posiciones son números válidos
          if (typeof start === 'number' && typeof end === 'number') {
            try {
              target.setSelectionRange(start, end);
            } catch {
              // Ignorar error silenciosamente si el input no soporta setSelectionRange
            }
          }
        }
      }
    };

    // Usar fase 'capture' para ejecutar ANTES que React procese el evento
    document.addEventListener("input", handleInput, true);
    
    // Cleanup al desmontar
    return () => document.removeEventListener("input", handleInput, true);
  }, []);

  return <AppRouter />;
}