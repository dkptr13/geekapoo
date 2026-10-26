import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
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
): UseStreamingAvailability {
  const [datos, setDatos] = useState<StreamingAvailability[]>([]);
  const [cargando, setCargando] = useState(Boolean(animeId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!animeId) {
      setDatos([]);
      setCargando(false);
      setError(null);
      return;
    }

    let activo = true;
    const filtroRegion = normalizarCodigoRegion(region);

    setDatos([]);
    setCargando(true);
    setError(null);

    const constraints: QueryConstraint[] = [where('animeId', '==', animeId)];
    if (filtroRegion) constraints.push(where('region', '==', filtroRegion));

    const consulta = query(collection(db, 'streamingAvailability'), ...constraints);

    const parar = onSnapshot(
      consulta,
      (snap) => {
        if (!activo) return;

        const filas = snap.docs
          .map((docSnap) => {
            const raw = { ...withId<Record<string, unknown>>(docSnap) };
            return normalizarDisponibilidad(raw);
          })
          .filter((row): row is StreamingAvailability => row !== null)
          .sort(
            (a, b) =>
              a.region.localeCompare(b.region) ||
              a.platformId.localeCompare(b.platformId),
          );

        setDatos(filas);
        setCargando(false);
      },
      (e) => {
        if (!activo) return;
        console.error('[Streaming] Error leyendo streamingAvailability:', e);
        setError(
          'No se pudo cargar la disponibilidad regional. Inténtalo de nuevo más tarde.',
        );
        setCargando(false);
      },
    );

    return () => {
      activo = false;
      parar();
    };
  }, [animeId, region]);

  return { datos, cargando, error };
}
