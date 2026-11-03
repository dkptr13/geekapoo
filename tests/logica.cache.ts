/**
 * Comprobaciones de la caché compartida de Firestore, sin navegador.
 *
 * Lo importante aquí no es el TTL exacto: es que dos componentes no
 * dupliquen la misma lectura, que una cuenta no vea datos de otra y
 * que una invalidación no deje una respuesta antigua repoblando la
 * caché.
 */
import assert from 'node:assert/strict';

import {
  cachedRead,
  clearFirestoreCache,
  clearPrivateCaches,
  clearUserCache,
  invalidateCache,
  patchCached,
  setCached,
  userCacheScope,
} from '../src/lib/firestoreCache';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolver!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promise, resolve: resolver };
}

async function main(): Promise<void> {
  clearFirestoreCache();

  let lecturas = 0;
  const valor = await cachedRead({
    key: 'wiki:animes',
    ttlMs: 60_000,
    read: async () => {
      lecturas += 1;
      return ['uno'];
    },
  });
  assert.deepEqual(valor, ['uno']);

  const reutilizado = await cachedRead({
    key: 'wiki:animes',
    ttlMs: 60_000,
    read: async () => {
      lecturas += 1;
      return ['otro'];
    },
  });
  assert.deepEqual(reutilizado, ['uno']);
  assert.equal(lecturas, 1, 'la segunda visita reutiliza la entrada');

  // Dos peticiones simultáneas de la misma clave comparten promesa.
  clearFirestoreCache();
  lecturas = 0;
  const pendiente = deferred<string[]>();
  const a = cachedRead({
    key: 'wiki:episodios',
    ttlMs: 60_000,
    read: async () => {
      lecturas += 1;
      return pendiente.promise;
    },
  });
  const b = cachedRead({
    key: 'wiki:episodios',
    ttlMs: 60_000,
    read: async () => {
      lecturas += 1;
      return ['duplicado'];
    },
  });
  pendiente.resolve(['compartido']);
  assert.deepEqual(await Promise.all([a, b]), [['compartido'], ['compartido']]);
  assert.equal(lecturas, 1, 'no se lanza una segunda lectura en paralelo');

  // Una invalidación impide que la respuesta antigua vuelva a entrar.
  clearFirestoreCache();
  const pendienteViejo = deferred<string[]>();
  const viejo = cachedRead({
    key: 'wiki:personajes',
    ttlMs: 60_000,
    read: async () => pendienteViejo.promise,
  });
  invalidateCache('wiki:personajes');
  pendienteViejo.resolve(['viejo']);
  await viejo;

  const nuevo = await cachedRead({
    key: 'wiki:personajes',
    ttlMs: 60_000,
    read: async () => ['nuevo'],
  });
  assert.deepEqual(nuevo, ['nuevo'], 'la respuesta en vuelo no repuebla tras invalidar');

  // Perfiles privados: separados por uid y borrados al cerrar sesión.
  clearFirestoreCache();
  const ana = userCacheScope('ana');
  const luis = userCacheScope('luis');
  setCached('auth:following', ['bob'], 60_000, ana);
  setCached('auth:following', ['carla'], 60_000, luis);

  assert.deepEqual(
    await cachedRead({
      key: 'auth:following',
      scope: ana,
      ttlMs: 60_000,
      read: async () => ['no-deberia-leerse'],
    }),
    ['bob'],
  );
  assert.deepEqual(
    await cachedRead({
      key: 'auth:following',
      scope: luis,
      ttlMs: 60_000,
      read: async () => ['no-deberia-leerse'],
    }),
    ['carla'],
  );

  clearUserCache('ana');
  const anaTrasLimpiar = await cachedRead({
    key: 'auth:following',
    scope: ana,
    ttlMs: 60_000,
    read: async () => ['limpio'],
  });
  assert.deepEqual(anaTrasLimpiar, ['limpio']);
  assert.deepEqual(
    await cachedRead({
      key: 'auth:following',
      scope: luis,
      ttlMs: 60_000,
      read: async () => ['no-deberia-leerse'],
    }),
    ['carla'],
    'limpiar una cuenta no borra la de otra',
  );

  setCached('site:settings', ['publico'], 60_000);
  clearPrivateCaches();
  assert.deepEqual(
    await cachedRead({
      key: 'site:settings',
      ttlMs: 60_000,
      read: async () => ['no-deberia-leerse'],
    }),
    ['publico'],
    'los datos públicos sobreviven al cierre de sesión',
  );

  // Un "me gusta" parchea las copias ya cacheadas sin invalidar la
  // ficha entera ni volver a leer Firestore.
  clearFirestoreCache();
  type Fila = { id: string; likedBy: string[]; likesCount: number };
  const episodio: Fila = { id: 'ep1', likedBy: [], likesCount: 0 };
  setCached<Fila[]>('community:episodes:anime1', [episodio], 60_000);
  setCached<Fila[]>('community:episodes:filtrados:anime1', [episodio], 60_000);

  patchCached<Fila[]>('community:episodes', (lista) =>
    lista.map((fila) =>
      fila.id === 'ep1'
        ? { ...fila, likedBy: ['ana'], likesCount: 1 }
        : fila,
    ),
  );

  assert.deepEqual(
    await cachedRead({
      key: 'community:episodes:anime1',
      ttlMs: 60_000,
      read: async () => {
        throw new Error('no debería leer');
      },
    }),
    [{ id: 'ep1', likedBy: ['ana'], likesCount: 1 }],
  );
  assert.deepEqual(
    await cachedRead({
      key: 'community:episodes:filtrados:anime1',
      ttlMs: 60_000,
      read: async () => {
        throw new Error('no debería leer');
      },
    }),
    [{ id: 'ep1', likedBy: ['ana'], likesCount: 1 }],
  );

  console.log('OK · caché compartida y separación por cuenta');
}

void main();
