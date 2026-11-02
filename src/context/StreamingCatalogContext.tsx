import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { cachedRead, PUBLIC_CACHE } from '../lib/firestoreCache';
import { measureRead } from '../lib/firestoreDiagnostics';
import {
  PLATAFORMAS_INICIALES,
  REGIONES_INICIALES,
  normalizarCodigoRegion,
} from '../data/streaming';
import type { StreamingPlatform, StreamingRegion } from '../types';

// ======================================================
// CATÁLOGO COMPARTIDO DE PLATAFORMAS Y REGIONES
// ======================================================
// Las listas iniciales viven en `data/streaming.ts`. Lo que se
// añada desde el panel se guarda en Firestore y se junta aquí.
//
// Este provider se monta una sola vez: si la wiki y el panel
// escucharan cada uno sus colecciones, habría suscripciones
// duplicadas y dos listas que podrían no coincidir.
// ======================================================

interface StreamingCatalogContextType {
  platforms: StreamingPlatform[];
  regions: StreamingRegion[];
  platformById: Map<string, StreamingPlatform>;
  regionByCode: Map<string, StreamingRegion>;
  loading: boolean;
  error: string | null;
}

const StreamingCatalogContext = createContext<StreamingCatalogContextType | null>(null);

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asOrder(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function platformFromDoc(
  snap: QueryDocumentSnapshot<DocumentData>,
): StreamingPlatform | null {
  const data = snap.data() as Record<string, unknown>;
  const name = asText(data.name);
  if (!name) return null;

  return {
    id: snap.id,
    name,
    ...(asText(data.badgeColor) ? { badgeColor: asText(data.badgeColor) } : {}),
    ...(asText(data.logoUrl) ? { logoUrl: asText(data.logoUrl) } : {}),
    ...(asOrder(data.order) !== undefined ? { order: asOrder(data.order) } : {}),
  };
}

function regionFromDoc(snap: QueryDocumentSnapshot<DocumentData>): StreamingRegion | null {
  const data = snap.data() as Record<string, unknown>;
  const code = normalizarCodigoRegion(data.code) ?? normalizarCodigoRegion(snap.id);
  const name = asText(data.name);

  if (!code || !name) return null;

  return {
    code,
    name,
    ...(asOrder(data.order) !== undefined ? { order: asOrder(data.order) } : {}),
  };
}

function mergePlatforms(extra: StreamingPlatform[]): StreamingPlatform[] {
  const map = new Map<string, StreamingPlatform>();

  PLATAFORMAS_INICIALES.forEach((platform) => map.set(platform.id, platform));
  extra.forEach((platform) => {
    if (!platform.id || !platform.name) return;
    map.set(platform.id, { ...map.get(platform.id), ...platform });
  });

  return [...map.values()].sort(
    (a, b) =>
      (a.order ?? 1000) - (b.order ?? 1000) ||
      a.name.localeCompare(b.name, 'es'),
  );
}

function mergeRegions(extra: StreamingRegion[]): StreamingRegion[] {
  const map = new Map<string, StreamingRegion>();

  REGIONES_INICIALES.forEach((region) => map.set(region.code, region));
  extra.forEach((region) => {
    if (!region.code || !region.name) return;
    map.set(region.code, { ...map.get(region.code), ...region });
  });

  return [...map.values()].sort(
    (a, b) =>
      (a.order ?? 1000) - (b.order ?? 1000) ||
      a.name.localeCompare(b.name, 'es'),
  );
}

export const StreamingCatalogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [extraPlatforms, setExtraPlatforms] = useState<StreamingPlatform[]>([]);
  const [extraRegions, setExtraRegions] = useState<StreamingRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const TTL = 30 * 60 * 1000;

    const cargar = async (force = false) => {
      try {
        const [plataformas, regiones] = await Promise.all([
          cachedRead({
            key: 'streaming:platforms',
            scope: PUBLIC_CACHE,
            ttlMs: TTL,
            force,
            persist: true,
            read: async () => {
              const snap = await measureRead(
                { name: 'platforms', collection: 'streamingPlatforms', origin: 'StreamingCatalogContext' },
                (result) => result.size,
                () => getDocs(collection(db, 'streamingPlatforms')),
              );
              return snap.docs
                .map(platformFromDoc)
                .filter((p): p is StreamingPlatform => p !== null);
            },
          }),
          cachedRead({
            key: 'streaming:regions',
            scope: PUBLIC_CACHE,
            ttlMs: TTL,
            force,
            persist: true,
            read: async () => {
              const snap = await measureRead(
                { name: 'regions', collection: 'streamingRegions', origin: 'StreamingCatalogContext' },
                (result) => result.size,
                () => getDocs(collection(db, 'streamingRegions')),
              );
              return snap.docs
                .map(regionFromDoc)
                .filter((r): r is StreamingRegion => r !== null);
            },
          }),
        ]);

        if (!activo) return;
        setExtraPlatforms(plataformas);
        setExtraRegions(regiones);
        setError(null);
      } catch (e) {
        if (!activo) return;
        setError('No se pudo leer el catálogo de plataformas y regiones. Se muestran solo los datos base.');
        console.error('[Streaming] Error leyendo el catálogo:', e);
      } finally {
        if (activo) setLoading(false);
      }
    };

    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === 'streaming:platforms' || key === 'streaming:regions') void cargar(true);
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    void cargar();

    return () => {
      activo = false;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
  }, []);

  const platforms = useMemo(() => mergePlatforms(extraPlatforms), [extraPlatforms]);
  const regions = useMemo(() => mergeRegions(extraRegions), [extraRegions]);

  const platformById = useMemo(
    () => new Map(platforms.map((platform) => [platform.id, platform])),
    [platforms],
  );
  const regionByCode = useMemo(
    () => new Map(regions.map((region) => [region.code, region])),
    [regions],
  );

  const value = useMemo(
    () => ({
      platforms,
      regions,
      platformById,
      regionByCode,
      loading,
      error,
    }),
    [platforms, regions, platformById, regionByCode, loading, error],
  );

  return (
    <StreamingCatalogContext.Provider value={value}>
      {children}
    </StreamingCatalogContext.Provider>
  );
};

export function useStreamingCatalog(): StreamingCatalogContextType {
  const context = useContext(StreamingCatalogContext);
  if (!context) {
    throw new Error('useStreamingCatalog debe usarse dentro de StreamingCatalogProvider');
  }
  return context;
}
