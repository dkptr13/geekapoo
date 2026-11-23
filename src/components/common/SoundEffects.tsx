import { useEffect, useRef } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useAccessibilityPrefs } from '../../context/AccessibilityPrefsContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationsContext';
import { reproducirSonido } from '../../services/sound';

// ======================================================
// EFECTOS DE SONIDO OPCIONALES
// ======================================================
//
// Se monta una sola vez. No crea listeners por componente:
//   · un listener delegado para los clics de interfaz, solo si
//     el usuario activa esa opción;
//   · un efecto sobre el contador de notificaciones;
//   · un efecto sobre la actividad de las conversaciones.
//
// Todos los avisos siguen existiendo en pantalla. El sonido es
// un extra, nunca la única forma de saber que algo ha pasado.

export function SoundEffects() {
  const { prefs } = useAccessibilityPrefs();
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const { rooms, activeRoomId } = useChat();

  // ── Sonido de interfaz ─────────────────────────────
  useEffect(() => {
    if (!prefs.soundEnabled || !prefs.soundInterface) return;

    const alPulsar = (event: MouseEvent) => {
      const objetivo = event.target;
      if (!(objetivo instanceof Element)) return;
      const control = objetivo.closest<HTMLElement>(
        'button, [role="button"], [role="switch"], [role="tab"]',
      );
      if (!control) return;
      if (control.dataset.noSound === 'true') return;
      if (
        control instanceof HTMLButtonElement &&
        control.disabled
      ) {
        return;
      }
      reproducirSonido('interface');
    };

    document.addEventListener('click', alPulsar, true);
    return () => document.removeEventListener('click', alPulsar, true);
  }, [prefs.soundEnabled, prefs.soundInterface]);

  // ── Notificaciones nuevas ──────────────────────────
  const notificacionesPrevias = useRef<number | null>(null);
  useEffect(() => {
    if (notificacionesPrevias.current === null) {
      notificacionesPrevias.current = unreadCount;
      return;
    }

    if (unreadCount > notificacionesPrevias.current) {
      reproducirSonido('notification');
    }
    notificacionesPrevias.current = unreadCount;
  }, [unreadCount]);

  // ── Mensajes nuevos en conversaciones no abiertas ──
  const actividadPrevia = useRef<Record<string, string | undefined>>({});
  const mensajesInicializados = useRef(false);

  useEffect(() => {
    if (!currentUser || rooms.length === 0) return;

    const siguiente: Record<string, string | undefined> = {};
    let hayMensajeNuevo = false;

    for (const room of rooms) {
      siguiente[room.id] = room.lastMessageAt;
      const anterior = actividadPrevia.current[room.id];

      if (
        mensajesInicializados.current &&
        anterior &&
        anterior !== room.lastMessageAt &&
        room.lastMessageSenderId !== currentUser.uid &&
        room.id !== activeRoomId
      ) {
        hayMensajeNuevo = true;
      }
    }

    actividadPrevia.current = siguiente;
    mensajesInicializados.current = true;

    if (hayMensajeNuevo) reproducirSonido('message');
  }, [rooms, currentUser, activeRoomId]);

  return null;
}
