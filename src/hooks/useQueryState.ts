import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// ======================================================
// RUTAS DE ANIME
// ======================================================
// Las fichas tienen URL propia ("/anime/nombre-del-anime") y no un
// parámetro ("/?tab=wiki&anime=...") por una razón que no es
// estética: Google indexa URLs, y una ficha metida en un parámetro
// de la portada no se puede posicionar como página propia. Tampoco
// se puede poner un <title> distinto por serie si todas comparten
// la misma ruta.
//
// El resto de la app sigue con parámetros ("?tab=chats"), que para
// secciones privadas o de navegación es suficiente y no ensucia.
export function slugDeRuta(pathname: string): string | null {
  const match = /^\/anime\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    // Un porcentaje suelto en la URL no debe romper la app.
    return match[1];
  }
}

/**
 * Estados que viven en la URL.
 *
 * Antes, la pestaña abierta y la sección del panel eran un
 * useState normal. Eso funcionaba bien hasta que alguien pulsa F5:
 * el estado se recrea desde cero y todo vuelve al inicio, aunque
 * la URL siga siendo la misma.
 *
 * La forma de que sobreviva es que el estado esté en la URL, no en
 * memoria. Con esto, recargar devuelve exactamente lo que había,
 * y además el botón "atrás" del navegador sirve para retroceder
 * de pestaña, que es lo que ya espera cualquiera que use un móvil.
 */
export function useQueryState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();

  // "anime" puede venir de dos sitios: la ruta nueva (/anime/x) o
  // un enlace antiguo (?anime=x). La ruta manda, para que al abrir
  // una ficha nunca se mezclen las dos formas.
  const slugRuta = key === 'anime' ? slugDeRuta(pathname) : null;

  const value = slugRuta ?? params.get(key) ?? fallback;

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
 * Aquí solo hay una navegación, así que las claves se aplican
 * juntas y ninguna pisa a otra.
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
 *
 * Además, esta es la única función que decide entre quedarse en
 * "/anime/<slug>" o volver a "/?tab=...". Si cada botón montara su
 * URL por su cuenta, tarde o temprano una ficha se quedaría con la
 * barra de direcciones mintiendo (ruta de anime y pestaña de chats).
 */
export function useQueryStateBatch(): (
  patch: Record<string, string | null | undefined>,
) => void {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  return useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(search);

      Object.entries(patch).forEach(([key, value]) => {
        // "anime" y "tab" se resuelven abajo: influyen en la ruta,
        // no solo en la query.
        if (key === 'anime' || key === 'tab') return;
        if (value === undefined) return;
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      const tocaAnime = Object.prototype.hasOwnProperty.call(patch, 'anime');
      const anime = patch.anime;
      const tab = patch.tab;
      const enFicha = slugDeRuta(pathname) !== null;

      // Por defecto se sigue en la ruta actual: cambiar un filtro o
      // abrir el editor del perfil no debe mover a nadie de sitio.
      let destino = pathname;

      if (tocaAnime && anime) {
        // Abrir ficha: ruta limpia y sin "tab", porque la ruta ya
        // dice que es la wiki.
        destino = `/anime/${encodeURIComponent(anime)}`;
        next.delete('anime');
        next.delete('tab');
      } else if (tocaAnime) {
        // Cerrar ficha: al catálogo. Si no se pide otra pestaña se
        // vuelve a la wiki, que es de donde se venía; sin esto se
        // caería en la portada del foro.
        destino = '/';
        next.delete('anime');
        if (tab === undefined) next.set('tab', 'wiki');
      } else if (enFicha && tab !== undefined) {
        // Salir de la ficha desde la barra de navegación.
        destino = '/';
      }

      // La pestaña se escribe después para que pise el "wiki" por
      // defecto de la rama anterior cuando el usuario pidió otra.
      if (tab !== undefined && !(tocaAnime && anime)) {
        if (tab === null || tab === '') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
      }

      const searchFinal = next.toString();
      navigate(
        { pathname: destino, search: searchFinal ? `?${searchFinal}` : '' },
        { replace: true },
      );
    },
    [navigate, pathname, search],
  );
}
