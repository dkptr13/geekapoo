import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// ======================================================
// ESTADO QUE VIVE EN LA URL
// ======================================================
// Antes, la pestaña abierta y la sección del panel eran un
// useState normal. Eso funcioba bien hasta que alguien pulsa F5:
// el estado se recrea desde cero y todo vuelve al inicio, aunque
// la URL siga siendo la misma.
//
// La forma de que sobreviva es que el estado esté en la URL, no en
// memoria. Con esto, recargar devuelve exactamente lo que había,
// y además el botón "atrás" del navegador sirve para retroceder
// de pestaña, que es lo que ya espera cualquiera que use un móvil.
//
// Se guarda como parámetro de búsqueda ("?tab=admin") y no como
// ruta ("/admin") porque la app ya usa BrowserRouter y todas las
// vistas se montan en la misma "/": cambiar a rutas obligaría a
// tocar el enrutado entero para un problema que solo pide
// acordarse de dónde estaba.
export function useQueryState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();

  const value = params.get(key) ?? fallback;

  const setValue = useCallback(
    (nextValue: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextValue === fallback) {
            // El valor por defecto no se escribe. "?tab=inicio" en
            // la barra de direcciones es ruido que no aporta nada.
            next.delete(key);
          } else {
            next.set(key, nextValue);
          }
          return next;
        },
        // replace en vez de push a propósito: cambiar de pestaña es
        // navegar, no deshacer, y llenaría el historial de pasos
        // que nadie quiere recuperar.
        { replace: true },
      );
    },
    [key, fallback, setParams],
  );

  return [value, setValue];
}

/**
 * Cambia varios parámetros de la URL en una sola operación.
 *
 * Hace falta porque useQueryState abre su propia instancia de
 * useSearchParams por clave, y eso rompe al tocar más de una en el
 * mismo clic.
 *
 * El problema concreto: el navegador no aplica la escritura hasta
 * que termina el evento, así que cuando se llaman dos setters
 * seguidos, el segundo parte de los parámetros ANTERIORES y
 * sobrescribe lo que hizo el primero. Volver al catálogo borraba
 * "?anime=" y "?q=", y al final "?anime=" volvía a estar ahí:
 * no se podía volver al catálogo ni de broma.
 *
 * Aquí solo hay un setParams, así que las claves se aplican juntas
 * y ninguna pisa a otra.
 *
 * Cada valor va a un sitio distinto:
 *
 *   undefined → no se toca esa clave.
 *   null o "" → se borra (se queda el valor por defecto).
 *   otro      → se escribe.
 *
 * Los tres estados existen porque hay acciones que cambian una
 * clave y dejan las demás como están, y sin esa distinción
 * borrar "anime" al escribir en el buscador acabaría escribiendo
 * la palabra "undefined" en la barra de direcciones.
 */
export function useQueryStateBatch(): (
  patch: Record<string, string | null | undefined>,
) => void {
  const [, setParams] = useSearchParams();

  return useCallback(
    (patch: Record<string, string | null | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined) return;
            if (value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          });

          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
}
