import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import { normalizarCodigoRegion } from '../data/streaming';
import { withId } from '../services/firestoreUtils';
import { normalizarDisponibilidad } from '../services/streamingAvailabilityLogic';
import type { StreamingAvailability } from '../types';

// ======================================================
// LECTURA DE DISPONIBILIDAD
// ======================================================
// La wiki pide SOLO la obra y la región que está viendo. El panel
// pide la obra entera para poder editar todas sus regiones.
//
// No se usa `orderBy`: el orden (disponible primero, luego no
// disponible y por último sin verificar) se calcula en el cliente
// con `construirTarjetas`. Así no hace falta un índice compuesto
// por cada orden visual.
// ======================================================

export interface UseStreamingAvailability {
  datos: StreamingAvailability[];
  cargando: boolean;
  error: string | null;
}

export function useStreamingAvailability(
  animeId: string | null | undefined,
  region?: string | null,
  /** `false` para no consultar hasta que el apartado esté abierto. */
  enabled = true,
): UseStreamingAvailability {
  const [datos, setDatos] = useState<StreamingAvailability[]>([]);
  const [cargando, setCargando] = useState(Boolean(animeId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animeId || !enabled) {
      setDatos([]);
      setCargando(false);
      setError(null);
      return;
    }

    let activo = true;
    const filtroRegion = normalizarCodigoRegion(region);
    const key = `streaming:availability:${animeId}:${filtroRegion ?? 'all'}`;

    setDatos([]);
    setCargando(true);
    setError(null);

    const cargar = async (force = false) => {
      try {
        const constraints: QueryConstraint[] = [where('animeId', '==', animeId)];
        if (filtroRegion) constraints.push(where('region', '==', filtroRegion));
        const consulta = query(collection(db, 'streamingAvailability'), ...constraints);

        const filas = await cachedRead({
          key,
          scope: PUBLIC_CACHE,
          ttlMs: 30 * 60 * 1000,
          force,
          persist: true,
          read: async () => {
            const snap = await measureRead(
              { name: 'availability', collection: 'streamingAvailability', origin: 'useStreamingAvailability' },
              (result) => result.size,
              () => getDocs(consulta),
            );
            return snap.docs
              .map((docSnap) => normalizarDisponibilidad({ ...withId<Record<string, unknown>>(docSnap) }))
              .filter((row): row is StreamingAvailability => row !== null)
              .sort(
                (a, b) =>
                  a.region.localeCompare(b.region) ||
                  a.platformId.localeCompare(b.platformId),
              );
          },
        });

        if (!activo) return;
        setDatos(filas);
        setError(null);
      } catch (e) {
        if (!activo) return;
        console.error('[Streaming] Error leyendo streamingAvailability:', e);
        setError('No se pudo cargar la disponibilidad regional. Inténtalo de nuevo más tarde.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    const alInvalidar = (event: Event) => {
      const invalidada = (event as CustomEvent<{ key?: string }>).detail?.key;
      // Solo se recarga lo que de verdad ha cambiado. Antes
      // cualquier edición de cualquier obra invalidaba todas las
      // fichas abiertas y volvía a leer su disponibilidad.
      if (invalidada === key) void cargar(true);
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    void cargar();

    return () => {
      activo = false;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
  }, [animeId, region, enabled]);

  return { datos, cargando, error };
}
