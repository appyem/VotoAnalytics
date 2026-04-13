import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";

export default function App() {
  
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      
      // Solo procesar inputs y textareas
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const upperValue = target.value.toUpperCase();
        
        // Solo modificar si hay cambio (evita loops)
        if (target.value !== upperValue) {
          target.value = upperValue;
          // Restaurar posición del cursor
          target.setSelectionRange(start, end);
        }
      }
    };

   
    document.addEventListener("input", handleInput, true);
    
    // Cleanup al desmontar
    return () => document.removeEventListener("input", handleInput, true);
  }, []);

  
  return <AppRouter />;
}
