// ======================================================
// DIAGNÓSTICO DE FIRESTORE (SOLO DESARROLLO)
// ======================================================
//
// Cuenta llamadas y documentos que devuelve el SDK. NO son cifras de
// facturación: las reglas, la caché de Firestore y los listeners pueden
// cambiar el número de lecturas que Firebase cobra realmente.

export interface ReadMetric {
  name: string;
  collection: string;
  origin: string;
}

interface OperationStats extends ReadMetric {
  calls: number;
  documentsReturned: number;
  estimatedReads: number;
  totalMs: number;
  snapshots: number;
  listenersCreated: number;
  listenersRemoved: number;
  activeListeners: number;
}

export interface DiagnosticsSnapshot {
  calls: number;
  documentsReturned: number;
  estimatedReads: number;
  listenersCreated: number;
  listenersRemoved: number;
  activeListeners: number;
  cacheHits: number;
  cacheMisses: number;
  sharedInFlight: number;
  operations: OperationStats[];
  note: string;
}

const enabled =
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
const operations = new Map<string, OperationStats>();
let cacheHits = 0;
let cacheMisses = 0;
let sharedInFlight = 0;

function operationOf(meta: ReadMetric): OperationStats {
  const key = `${meta.origin}|${meta.collection}|${meta.name}`;
  const actual = operations.get(key);
  if (actual) return actual;

  const nuevo: OperationStats = {
    ...meta,
    calls: 0,
    documentsReturned: 0,
    estimatedReads: 0,
    totalMs: 0,
    snapshots: 0,
    listenersCreated: 0,
    listenersRemoved: 0,
    activeListeners: 0,
  };
  operations.set(key, nuevo);
  return nuevo;
}

export function recordRead(meta: ReadMetric, documents: number, durationMs: number): void {
  if (!enabled) return;
  const op = operationOf(meta);
  op.calls += 1;
  op.documentsReturned += documents;
  op.estimatedReads += documents;
  op.totalMs += durationMs;
}

/** Mide una consulta puntual sin registrar documentos ni argumentos. */
export async function measureRead<T>(
  meta: ReadMetric,
  documents: (result: T) => number,
  read: () => Promise<T>,
): Promise<T> {
  if (!enabled) return read();
  const started = performance.now();
  try {
    const result = await read();
    recordRead(meta, documents(result), performance.now() - started);
    return result;
  } catch (error) {
    recordRead(meta, 0, performance.now() - started);
    throw error;
  }
}

export function recordListenerSnapshot(
  meta: ReadMetric,
  documentsReturned: number,
  changedDocuments: number,
): void {
  if (!enabled) return;
  const op = operationOf(meta);
  op.snapshots += 1;
  op.documentsReturned += documentsReturned;
  // En el primer snapshot docChanges contiene todos los documentos;
  // después, solo los cambios. Es una mejor aproximación que volver a
  // sumar toda la página en cada actualización, pero sigue sin ser una
  // cifra oficial de facturación.
  op.estimatedReads += changedDocuments;
}

export function trackListener(meta: ReadMetric, unsubscribe: () => void): () => void {
  if (!enabled) return unsubscribe;
  const op = operationOf(meta);
  op.listenersCreated += 1;
  op.activeListeners += 1;
  let stopped = false;

  return () => {
    if (stopped) return;
    stopped = true;
    op.listenersRemoved += 1;
    op.activeListeners = Math.max(0, op.activeListeners - 1);
    unsubscribe();
  };
}

export function recordCache(event: 'hit' | 'miss' | 'shared'): void {
  if (!enabled) return;
  if (event === 'hit') cacheHits += 1;
  if (event === 'miss') cacheMisses += 1;
  if (event === 'shared') sharedInFlight += 1;
}

export function snapshotDiagnostics(): DiagnosticsSnapshot {
  const ops = [...operations.values()].map((op) => ({ ...op }));
  return {
    calls: ops.reduce((n, op) => n + op.calls, 0),
    documentsReturned: ops.reduce((n, op) => n + op.documentsReturned, 0),
    estimatedReads: ops.reduce((n, op) => n + op.estimatedReads, 0),
    listenersCreated: ops.reduce((n, op) => n + op.listenersCreated, 0),
    listenersRemoved: ops.reduce((n, op) => n + op.listenersRemoved, 0),
    activeListeners: ops.reduce((n, op) => n + op.activeListeners, 0),
    cacheHits,
    cacheMisses,
    sharedInFlight,
    operations: ops,
    note: 'Estimación del SDK en desarrollo; no equivale a lecturas facturables reales.',
  };
}

export function resetDiagnostics(): void {
  operations.clear();
  cacheHits = 0;
  cacheMisses = 0;
  sharedInFlight = 0;
}

// Acceso manual desde la consola de desarrollo. No expone contenido,
// tokens, mensajes ni identificadores de documentos.
if (enabled && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__geekapooFirestore = {
    snapshot: snapshotDiagnostics,
    reset: resetDiagnostics,
  };
}
