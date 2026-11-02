// ======================================================
// CACHÉ PERSISTENTE DE DATOS PÚBLICOS
// ======================================================
//
// Solo se guardan lecturas con ámbito público (catálogo, configuración,
// disponibilidad...). Nunca perfiles, seguidores, chats, notificaciones
// ni preferencias privadas.
//
// IndexedDB se usa porque el catálogo completo puede superar de largo
// el límite de localStorage. Todos los errores se ignoran: si el
// navegador bloquea el almacenamiento, la app sigue funcionando con la
// caché en memoria.

const DB_NAME = 'geekapoo-public-firestore-cache';
const STORE = 'entries';
const DB_VERSION = 1;

interface PersistedEntry<T> {
  value: T;
  expiresAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export async function readPersistent<T>(key: string): Promise<PersistedEntry<T> | null> {
  const db = await getDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const entry = req.result as PersistedEntry<T> | undefined;
        if (!entry || entry.expiresAt <= Date.now()) {
          if (entry) void deletePersistent(key);
          resolve(null);
          return;
        }
        resolve(entry);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function writePersistent<T>(
  key: string,
  value: T,
  expiresAt: number,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ value, expiresAt }, key);
  } catch {
    // Cuota llena, modo privado o almacenamiento bloqueado.
  }
}

export async function deletePersistent(key: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
  } catch {
    // Sin persistencia disponible.
  }
}

export async function deletePersistentPrefix(prefix: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
  } catch {
    // Sin persistencia disponible.
  }
}
