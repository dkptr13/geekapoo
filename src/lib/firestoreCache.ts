import { recordCache } from './firestoreDiagnostics';
import {
  deletePersistentPrefix,
  readPersistent,
  writePersistent,
} from './persistentCache';

// ======================================================
// CACHÉ COMPARTIDA DE LECTURAS
// ======================================================
//
// Solo vive en memoria: no escribe perfiles, mensajes ni documentos en
// localStorage. La clave incluye un ámbito (`public` o `user:${uid}`),
// así que dos cuentas nunca comparten una entrada privada.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CachedReadOptions<T> {
  /** Nombre estable de la consulta, sin ids privados si no son necesarios. */
  key: string;
  ttlMs: number;
  /** `public` por defecto; para datos privados usar `user:${uid}`. */
  scope?: string;
  force?: boolean;
  /** Persistir en IndexedDB. Solo se permite en el ámbito público. */
  persist?: boolean;
  read: () => Promise<T>;
}

const entries = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
// Si se invalida mientras una consulta está en vuelo, su respuesta
// antigua no puede volver a llenar la caché.
let generation = 0;

export const PUBLIC_CACHE = 'public';
export const userCacheScope = (uid: string): string => `user:${uid}`;

function fullKey(scope: string, key: string): string {
  return `${scope}:${key}`;
}

export async function cachedRead<T>({
  key,
  ttlMs,
  scope = PUBLIC_CACHE,
  force = false,
  persist = false,
  read,
}: CachedReadOptions<T>): Promise<T> {
  const id = fullKey(scope, key);
  const now = Date.now();
  const cached = entries.get(id) as CacheEntry<T> | undefined;
  const puedePersistir = persist && scope === PUBLIC_CACHE;

  if (!force && cached && cached.expiresAt > now) {
    recordCache('hit');
    return cached.value;
  }

  if (!force && puedePersistir) {
    const enDisco = await readPersistent<T>(id);
    if (enDisco) {
      entries.set(id, enDisco);
      recordCache('hit');
      return enDisco.value;
    }
  }

  if (!force) {
    const pending = inFlight.get(id) as Promise<T> | undefined;
    if (pending) {
      recordCache('shared');
      return pending;
    }
  }

  recordCache('miss');
  const startedGeneration = generation;
  const request = read()
    .then((value) => {
      if (generation === startedGeneration) {
        const expiresAt = Date.now() + ttlMs;
        entries.set(id, { value, expiresAt });
        if (puedePersistir) void writePersistent(id, value, expiresAt);
      }
      return value;
    })
    .finally(() => {
      if (inFlight.get(id) === request) inFlight.delete(id);
    });

  inFlight.set(id, request);
  return request;
}

/** Actualiza una entrada ya conocida tras una modificación local. */
export function setCached<T>(
  key: string,
  value: T,
  ttlMs: number,
  scope = PUBLIC_CACHE,
): void {
  entries.set(fullKey(scope, key), { value, expiresAt: Date.now() + ttlMs });
}

/** Invalida una clave exacta o todas las que empiezan por ese prefijo. */
export function invalidateCache(key: string, scope?: string): void {
  generation += 1;
  const prefix = scope ? fullKey(scope, key) : key;
  for (const id of entries.keys()) {
    if (id === prefix || id.startsWith(prefix)) entries.delete(id);
  }
  void deletePersistentPrefix(prefix);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('geekapoo:cache-invalidated', {
      detail: { key, scope },
    }));
  }
}

export function clearUserCache(uid: string): void {
  generation += 1;
  const prefix = `${userCacheScope(uid)}:`;
  for (const id of entries.keys()) {
    if (id.startsWith(prefix)) entries.delete(id);
  }
  for (const id of inFlight.keys()) {
    if (id.startsWith(prefix)) inFlight.delete(id);
  }
}

export function clearPrivateCaches(): void {
  generation += 1;
  for (const id of entries.keys()) {
    if (!id.startsWith(`${PUBLIC_CACHE}:`)) entries.delete(id);
  }
  for (const id of inFlight.keys()) {
    if (!id.startsWith(`${PUBLIC_CACHE}:`)) inFlight.delete(id);
  }
}

export function clearFirestoreCache(): void {
  generation += 1;
  entries.clear();
  inFlight.clear();
}
