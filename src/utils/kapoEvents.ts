// ======================================================
// AVISOS LOCALES PARA KAPO-CHAN
// ======================================================
//
// Hay acciones que ocurren en un contexto y Kapo escucha en otro
// (por ejemplo, el chat sabe cuándo se envía un mensaje y la
// mascota no). En vez de meter al chat dentro de Kapo o al revés,
// se lanza un evento del navegador.
//
// No es Firestore, no hay red y no se guarda nada. Si nadie
// escucha, el evento se pierde sin afectar a la acción original.

export const KAPO_EVENTO = 'geekapoo:kapo';

export type KapoEventoLocal = 'chat_message' | 'search_empty';

export interface KapoEventoDetalle {
  tipo: KapoEventoLocal;
  /** Texto de la búsqueda que no ha dado resultados. */
  query?: string;
}

export function avisarKapo(tipo: KapoEventoLocal, detalle: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent<KapoEventoDetalle>(KAPO_EVENTO, {
        detail: { tipo, ...detalle },
      }),
    );
  } catch {
    // Navegadores sin CustomEvent (o entornos de prueba): el aviso
    // es opcional, la acción que lo lanzó ya ha terminado.
  }
}

export function escucharKapo(
  handler: (detalle: KapoEventoDetalle) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const onEvento = (event: Event) => {
    const detalle = (event as CustomEvent<KapoEventoDetalle>).detail;
    if (!detalle || typeof detalle.tipo !== 'string') return;
    handler(detalle);
  };

  window.addEventListener(KAPO_EVENTO, onEvento);
  return () => window.removeEventListener(KAPO_EVENTO, onEvento);
}
