import { useEffect, useState } from 'react';

// ======================================================
// VALOR CON RETRASO (DEBOUNCE)
// ======================================================
// Devuelve el valor 300 ms después de que deje de cambiar.
// La búsqueda de la wiki lo usa para no filtrar con cada
// tecla: el input sigue controlado e instantáneo, y solo el
// cálculo espera. Si el valor cambia antes, se cancela el
// pendiente y empieza otro.

export function useDebouncedValue<T>(valor: T, retrasoMs = 300): T {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setDiferido(valor), retrasoMs);
    return () => window.clearTimeout(temporizador);
  }, [valor, retrasoMs]);

  return diferido;
}
