// Acceso a Firestore por REST para los scripts, con la paginación bien.
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ───────────────────────────────────
//
// Los scripts habla con Firestore por el API de REST porque es lo
// simple: `fetch` y ya. Pero REST tiene una trampa que haFastidado a
// medio catalogo:
//
//   Pedir `?pageSize=1000` NO devuelve 1000 documentos. Devuelve 300,
//   como maximo, y mete un `nextPageToken`. Los que se saltan ese token
//   se creen que tienen el catalogo entero.
//
// No es una hipotesis: `characters` tiene 382 y `episodes` 486, y las
// dos-collectiones devuelven 300 en la primera pagina. Un script sin
// paginar informa "300 personajes" y se lleva por delante 82 silenciosos.
//
// Ademas el bucle de paginacion hay que escribirlo bien: la URL se
// monta con `?pageSize=...`, asi que despues el token va con `&`, no
// con `&` pegado antes del `?`. Montado al reves, la segunda pagina es
// una peticion invalida que responde 0 documentos y sin token, y el
// bucle termina creyendo que ya no hay nada mas. Es justo el fallo que
// hizo pasar por buenos los numeros de arriba.
//
// Uso:
//
//   const { coleccion, documentos, escribir, token } = await cliente();
//
//   const animes = await coleccion('animes');
//   await escribir('characters', docId, { imageUrl: 'https://...' });

import { tokenDeAcceso } from './token-firebase.mjs';

const PROYECTO = process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`;

/** Formatea un error de Firestore para que se sepa de quien es. */
async function fallo(que, r) {
  const texto = await r.text();
  const motivo = texto.slice(0, 400);

  if (r.status === 401) {
    throw new Error(
      `401 en ${que}: el token de acceso ha caducado o no vale.\n` +
        `Vuelve a ejecutar el script: token-firebase.mjs lo renueva solo.`,
    );
  }

  throw new Error(`${r.status} en ${que}: ${motivo}`);
}

/** Token y cabeceras comunes. Se renueva una vez por proceso. */
let cacheToken = null;

export async function cliente() {
  if (!cacheToken) cacheToken = await tokenDeAcceso();

  const cabeceras = {
    Authorization: `Bearer ${cacheToken}`,
    'Content-Type': 'application/json',
  };

  /**
   * TODOS los documentos de una colección, paginados de verdad.
   *
   * @param {string} col  Nombre de la colección.
   * @param {object} [op]  `select` para traer solo algunos campos.
   * @returns {Promise<{id:string,f:object}[]>}
   */
  async function coleccion(col, op = {}) {
    const out = [];
    let pageToken;
    let pagina = 0;

    for (;;) {
      const p = new URLSearchParams({ pageSize: '1000' });

      if (pageToken) p.set('pageToken', pageToken);
      if (op.select) p.set('mask.fieldPaths', op.select.join(','));

      const r = await fetch(`${BASE}/${col}?${p.toString()}`, {
        headers: cabeceras,
      });

      if (!r.ok) await fallo(`listar ${col}`, r);

      const d = await r.json();

      for (const doc of d.documents || []) {
        out.push({ id: doc.name.split('/').pop(), f: doc.fields || {} });
      }

      pagina++;

      // Si no hay token, se acabo. Da igual cuantas paginas: la ultima
      // puede traer menos de 300.
      if (!d.nextPageToken) break;
      pageToken = d.nextPageToken;
    }

    // Traza solo si hay varias paginas: si no, no informa nada.
    if (pagina > 1) console.log(`  (${col}: ${pagina} paginas, ${out.length} docs)`);

    return out;
  }

  /** Un documento suelto, o null si no existe. */
  async function uno(col, id) {
    const r = await fetch(`${BASE}/${col}/${id}`, { headers: cabeceras });

    if (r.status === 404) return null;
    if (!r.ok) await fallo(`leer ${col}/${id}`, r);

    const d = await r.json();

    return { id: d.name.split('/').pop(), f: d.fields || {} };
  }

  /**
   * PATCH de un documento, con la mascara de campos que se le pase.
   *
   * La mascara es lo importante: sin ella Firestore BORRA el documento
   * entero y lo recrea con solo los campos enviados. Con `updateMask`
   * solo se tocan los indicados.
   */
  async function escribir(col, id, campos, mascara) {
    if (!mascara || !mascara.length) {
      throw new Error('escribir() necesita la mascara de campos: sin ella se borra el doc');
    }

    const p = new URLSearchParams();
    for (const c of mascara) p.append('updateMask.fieldPaths', c);

    const r = await fetch(`${BASE}/${col}/${id}?${p.toString()}`, {
      method: 'PATCH',
      headers: cabeceras,
      body: JSON.stringify({ fields: campos }),
    });

    if (!r.ok) await fallo(`escribir ${col}/${id}`, r);
  }

  /** Borra un documento entero. */
  async function borrar(col, id) {
    const r = await fetch(`${BASE}/${col}/${id}`, {
      method: 'DELETE',
      headers: cabeceras,
    });

    if (!r.ok && r.status !== 404) await fallo(`borrar ${col}/${id}`, r);
  }

  /** Crea un documento, fallando si ya existe. */
  async function crear(col, id, campos) {
    const r = await fetch(`${BASE}/${col}/${id}`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify({ fields: campos }),
    });

    if (!r.ok) await fallo(`crear ${col}/${id}`, r);
  }

  return { coleccion, uno, escribir, borrar, crear, token: cacheToken, cabeceras, BASE };
}

// Atajos de nivel de modulo, para no tener que hacer
// `const { coleccion } = await cliente()` en cada script. El cliente se
// memoiza: el token se pide una sola vez por proceso.
let memo = null;

const pedirCliente = () => (memo ??= cliente());

// OJO: `cliente()` es async, asi que `memo` guarda una PROMESA. Sin el
// `await` de debajo, `(await pedirCliente()).coleccion` seria
// `undefined` y el error sale como "coleccion is not a function", que
// no dice nada de que el problema sea una promesa sin esperar.
export const coleccion = async (...a) => (await pedirCliente()).coleccion(...a);
export const uno = async (...a) => (await pedirCliente()).uno(...a);
export const escribir = async (...a) => (await pedirCliente()).escribir(...a);
export const borrar = async (...a) => (await pedirCliente()).borrar(...a);
export const crear = async (...a) => (await pedirCliente()).crear(...a);

// ── Traducir entre los valores de Firestore y los de JS ───────────
//
// El API de REST no acepta JSON normal: cada campo lleva la envoltura
// que dice su tipo (`stringValue`, `integerValue`, `arrayValue`...).
// Traducir a mano en cada script es donde aparecen los bugs, asi que
// va aqui una vez.

/** Un string de JS al campo de Firestore. */
export const s = (v) => ({ stringValue: String(v) });

/** Un numero entero de JS al campo de Firestore. */
export const i = (v) => ({ integerValue: String(Math.round(v)) });

/** Un numero decimal de JS al campo de Firestore. */
export const d = (v) => ({ doubleValue: v });

/** Un array de strings de JS al campo de Firestore. */
export const arrayDe = (lista) => ({
  arrayValue: { values: lista.map((x) => ({ stringValue: String(x) })) },
});

/** Un objeto plano de JS al mapa de Firestore. */
export const mapaDe = (obj) => ({
  mapValue: {
    fields: Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'number' ? d(v) : s(v)]),
    ),
  },
});

/** Fecha de JS al timestamp de Firestore. */
export const momento = (fecha) => ({ timestampValue: new Date(fecha).toISOString() });

/**
 * Quita el envoltorio `{ id, f }` que devuelven `coleccion()` y `uno()`.
 *
 * Hace falta porque es facil pasar el documento entero en vez de `.f`,
 * y entonces todo se lee como vacio sin que salte ningun error: es el
 * fallo mas silencioso que hay aqui. `num(doc,'number')` devolvia null
 * sobre documentos que si tenian el numero.
 */
const camposDe = (doc) => (doc && doc.f && typeof doc.f === 'object' ? doc.f : doc);

/** Lee un string del documento, o cadena vacia. */
export const str = (doc, campo) => camposDe(doc)?.[campo]?.stringValue ?? '';

/**
 * Lee un numero del documento (episodios y temporadas lo guardan como
 * `integerValue`, no como string).
 *
 * Hace falta porque `str()` sobre un campo numerico devuelve cadena
 * vacia: compara todos los numeros de episodio como si fueran el mismo
 * y sale que estan todos duplicados.
 */
export const num = (doc, campo) => {
  const v = camposDe(doc)?.[campo];

  if (!v) return null;

  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.stringValue !== undefined) return Number(v.stringValue) || 0;

  return null;
};