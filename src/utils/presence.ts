// ======================================================
// ESTADO VISIBLE DE PRESENCIA
// ======================================================

export interface PresenceInfo {
  online: boolean;
  lastSeenAt: string | null;
}

export const ONLINE_WINDOW_MS = 2 * 60_000;

export interface PresenceState {
  online: boolean;
  label: string;
}

function minutos(n: number): string {
  return `${n} min`;
}

function horas(n: number): string {
  return `${n} h`;
}

function dias(n: number): string {
  return `${n} d`;
}

/**
 * Decide qué texto y color lógico enseñar.
 *
 * `online` también comprueba la antigüedad del último latido. Si el
 * navegador se cerró de golpe, el documento puede seguir diciendo
 * `online: true`; pasado el margen se trata como desconectado.
 */
export function estadoPresencia(
  info: PresenceInfo | undefined,
  now = Date.now(),
): PresenceState {
  const ts = info?.lastSeenAt ? Date.parse(info.lastSeenAt) : NaN;
  const edad = Number.isNaN(ts) ? Infinity : Math.max(0, now - ts);

  if (info?.online === true && edad <= ONLINE_WINDOW_MS) {
    return { online: true, label: 'En línea' };
  }

  if (!info || Number.isNaN(ts)) {
    return { online: false, label: 'Desconectado' };
  }

  if (edad < 60_000) return { online: false, label: 'Hace un momento' };
  if (edad < 60 * 60_000) {
    return { online: false, label: `Últ. vez hace ${minutos(Math.floor(edad / 60_000))}` };
  }
  if (edad < 24 * 60 * 60_000) {
    return { online: false, label: `Últ. vez hace ${horas(Math.floor(edad / (60 * 60_000)))}` };
  }
  if (edad < 7 * 24 * 60 * 60_000) {
    return { online: false, label: `Últ. vez hace ${dias(Math.floor(edad / (24 * 60 * 60_000)))}` };
  }

  const fecha = new Date(ts).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return { online: false, label: `Últ. vez el ${fecha}` };
}
