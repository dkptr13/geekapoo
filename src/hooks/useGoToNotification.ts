import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { destinoDeNotificacion, type DestinoNotificacion } from '../utils/notificaciones';
import type { AppNotification } from '../types/notifications';

export { destinoDeNotificacion };
export type { DestinoNotificacion };

// ======================================================
// IR AL CONTENIDO DE UNA NOTIFICACIÓN
// ======================================================
//
// Antes esto era un `CustomEvent` disparado desde la campana
// ("geekapoo:goToThread") que nadie escuchaba: el aviso se cerraba
// y no pasaba nada. La navegación se hace escribiendo en la URL,
// como el resto de la web (ver `useGoToProfile`), que además tiene
// una ventaja que el evento no podía dar: recargar conserva el
// destino, así que un aviso se puede compartir o abrir en otra
// pestaña.
//
// El "qué URL lleva este aviso" está en
// `utils/notificaciones.ts` y no aquí: es lógica pura y se comprueba
// sin navegador, en `tests/logica.notificaciones.ts`. Este archivo
// solo añade el `navigate`.

/**
 * Navega al contenido de un aviso.
 *
 * Devuelve el mensaje de "ya no está" si el aviso no lleva a ningún
 * sitio, para que quien llama pueda enseñarlo en vez de cerrar el
 * panel en silencio (que es lo que pasaba antes: el clic no
 * respondía a nada y parecía un aviso roto).
 */
export function useGoToNotification(): (n: AppNotification) => string | null {
  const navigate = useNavigate();

  return useCallback(
    (n: AppNotification): string | null => {
      const { search, sinDestino } = destinoDeNotificacion(n);

      if (!search) return sinDestino ?? 'Ese aviso ya no lleva a ningún sitio.';

      navigate({ pathname: '/', search });

      // Los avisos con hilo tienen su propio anclaje (HomeFeed espera
      // a que el hilo y el comentario existan). El resto empieza
      // arriba: un perfil, un chat o la wiki no deben heredar la
      // posición de la página desde la que se pulsó la campana.
      const tieneAncla = new URLSearchParams(search).get('hilo');
      if (!tieneAncla) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        });
      }
      return null;
    },
    [navigate],
  );
}

export default useGoToNotification;