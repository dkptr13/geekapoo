// Lógica pura del importador de JustWatch.
//
// Aquí no se habla con Firestore ni con JustWatch: solo se construyen
// consultas, se comparan filas y se clasifican los cambios. Así las
// pruebas pueden cubrir los casos delicados (nuevos, modificados,
// repetidos, obsoletos y protegidos) sin tocar producción.
//
// El importador usa estas funciones para decidir qué leer y qué
// escribir. La fuente de verdad sigue siendo Firestore: el índice local
// de `public/busqueda/streaming.json` no se usa para borrar ni para
// pisar datos, porque puede estar desactualizado.

export const LIMITE_ANIME_POR_CONSULTA = 30;
export const LIMITE_DOCUMENTOS_POR_PAGINA = 300;

const texto = (valor) => String(valor ?? '').trim();

/**
 * Ids sin vacíos, sin repetidos y ordenados para que la consulta sea estable.
 * @param {Iterable<string>} ids
 * @returns {string[]}
 */
export function normalizarIds(ids) {
  const unicos = new Set();

  for (const id of ids ?? []) {
    const limpio = texto(id);
    if (limpio) unicos.add(limpio);
  }

  return [...unicos].sort();
}

/**
 * Bloques de como máximo 30 animeId, que es el límite real de un `IN`.
 * @param {Iterable<string>} ids
 * @param {number} [tamano]
 * @returns {string[][]}
 */
export function bloquesDe(ids, tamano = LIMITE_ANIME_POR_CONSULTA) {
  const lista = normalizarIds(ids);
  const bloques = [];

  for (let i = 0; i < lista.length; i += tamano) {
    bloques.push(lista.slice(i, i + tamano));
  }

  return bloques;
}

/**
 * Normaliza una fila de disponibilidad para comparar sin falsos cambios.
 * @param {any} fila
 * @returns {{id:string,animeId:string,platformId:string,region:string,status:string,accessType:string,url:string}}
 */
export function normalizarFila(fila) {
  return {
    id: texto(fila?.id),
    animeId: texto(fila?.animeId),
    platformId: texto(fila?.platformId),
    region: texto(fila?.region).toUpperCase(),
    status: texto(fila?.status).toLowerCase(),
    accessType: texto(fila?.accessType).toLowerCase() || 'unknown',
    url: texto(fila?.url),
  };
}

/** Clave estable de una fila: obra + plataforma + país. */
export function claveDisponibilidad(fila) {
  const normalizada = normalizarFila(fila);

  return `${normalizada.animeId}__${normalizada.platformId}__${normalizada.region}`;
}

/** ¿Los campos de negocio son los mismos? `verifiedAt`/`updatedAt` no cuentan. */
export function mismaDisponibilidad(a, b) {
  const izquierda = normalizarFila(a);
  const derecha = normalizarFila(b);

  return (
    izquierda.animeId === derecha.animeId &&
    izquierda.platformId === derecha.platformId &&
    izquierda.region === derecha.region &&
    izquierda.status === derecha.status &&
    izquierda.accessType === derecha.accessType &&
    izquierda.url === derecha.url
  );
}

/**
 * Índice en memoria: clave de disponibilidad -> fila existente.
 * @param {Iterable<any>} filas
 * @returns {Map<string, any>}
 */
export function indiceExistente(filas) {
  const indice = new Map();

  for (const fila of filas ?? []) {
    const normalizada = normalizarFila(fila);
    if (!normalizada.animeId || !normalizada.platformId || !normalizada.region) {
      continue;
    }

    const clave = claveDisponibilidad(normalizada);
    indice.set(clave, { ...fila, ...normalizada });
  }

  return indice;
}

/**
 * Una fila obsoleta solo se puede borrar si pertenece a una plataforma y
 * una región que este importador conoce. Las filas manuales (plataformas
 * nuevas, regiones no soportadas o estados sin verificar) quedan intactas.
 */
/**
 * @param {any} fila
 * @param {string[]} regionesPermitidas
 * @param {string[]} plataformasConocidas
 * @returns {boolean}
 */
export function esFilaProtegida(fila, regionesPermitidas, plataformasConocidas) {
  const normalizada = normalizarFila(fila);

  if (normalizada.status !== 'available' && normalizada.status !== 'unavailable') {
    return true;
  }
  if (!normalizada.platformId || !normalizada.region) return true;
  if (!regionesPermitidas.includes(normalizada.region)) return true;
  if (!plataformasConocidas.includes(normalizada.platformId)) return true;

  return false;
}

/**
 * Clasifica las filas generadas contra las que ya existen.
 *
 * - nuevas: la clave no estaba.
 * - modificadas: la clave estaba, pero status/accessType/url cambian.
 * - sinCambios: misma clave y mismos campos de negocio.
 * - repetidas: la misma fila generada dos veces; se conserva la primera.
 * - obsoletas: existen en Firestore, pertenecen a los animes seleccionados
 *   y ya no las genera JustWatch; solo se borran si el llamador lo decide.
 * - protegidas: filas manuales o raras (sin verificar, plataforma/región
 *   desconocida) que no se deben pisar ni borrar.
 *
 * @param {{generadas?: any[], existentes?: Map<string, any>|any[], animeIds?: Set<string>|Iterable<string>, regionesPermitidas?: string[], plataformasConocidas?: string[]}} [opciones]
 * @returns {{nuevas:any[], modificadas:any[], sinCambios:any[], repetidas:any[], obsoletas:any[], protegidas:any[]}}
 */
export function clasificarDisponibilidad({
  generadas = [],
  existentes = new Map(),
  animeIds = new Set(),
  regionesPermitidas = [],
  plataformasConocidas = [],
} = {}) {
  const seleccion = animeIds instanceof Set ? animeIds : new Set(animeIds ?? []);
  const indice = existentes instanceof Map ? existentes : indiceExistente(existentes);
  const vistas = new Set();

  const nuevas = [];
  const modificadas = [];
  const sinCambios = [];
  const repetidas = [];
  const protegidas = [];

  for (const fila of generadas) {
    const normalizada = normalizarFila(fila);
    const clave = claveDisponibilidad(normalizada);

    if (!normalizada.animeId || !normalizada.platformId || !normalizada.region) {
      continue;
    }
    if (!seleccion.has(normalizada.animeId)) {
      continue;
    }

    if (vistas.has(clave)) {
      repetidas.push(fila);
      continue;
    }
    vistas.add(clave);

    const existente = indice.get(clave);

    if (!existente) {
      nuevas.push(fila);
    } else if (esFilaProtegida(existente, regionesPermitidas, plataformasConocidas)) {
      // Una fila manual sin verificar no se pisa aunque JustWatch
      // tenga una fila para la misma plataforma y región.
      protegidas.push(existente);
    } else if (mismaDisponibilidad(normalizada, existente)) {
      sinCambios.push(fila);
    } else {
      modificadas.push(fila);
    }
  }

  const obsoletas = [];

  for (const [clave, existente] of indice) {
    const normalizada = normalizarFila(existente);

    if (!seleccion.has(normalizada.animeId)) continue;
    if (vistas.has(clave)) continue;

    if (esFilaProtegida(existente, regionesPermitidas, plataformasConocidas)) {
      protegidas.push(existente);
    } else {
      obsoletas.push(existente);
    }
  }

  return { nuevas, modificadas, sinCambios, repetidas, obsoletas, protegidas };
}

/**
 * Consulta REST para Firestore.
 *
 * Un solo anime usa `EQUAL`; varios usan `IN`, siempre en bloques de 30.
 * Se ordena por `__name__` y se pagina con `startAt` + `before: false`
 * (el equivalente REST de `startAfter`) y `referenceValue`.
 */
/**
 * @param {Iterable<string>} ids
 * @param {string|null} [startAfter]
 * @param {number} [limite]
 * @returns {any}
 */
export function crearConsultaDisponibilidad(
  ids,
  startAfter = null,
  limite = LIMITE_DOCUMENTOS_POR_PAGINA,
) {
  const limpios = normalizarIds(ids);

  if (limpios.length === 0) {
    throw new Error('La consulta de disponibilidad necesita al menos un animeId.');
  }
  if (limpios.length > LIMITE_ANIME_POR_CONSULTA) {
    throw new Error(
      `La consulta de disponibilidad admite como máximo ${LIMITE_ANIME_POR_CONSULTA} animeId.`,
    );
  }

  const valor =
    limpios.length === 1
      ? { stringValue: limpios[0] }
      : {
          arrayValue: {
            values: limpios.map((id) => ({ stringValue: id })),
          },
        };

  const structuredQuery = {
    from: [{ collectionId: 'streamingAvailability' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'animeId' },
        op: limpios.length === 1 ? 'EQUAL' : 'IN',
        value: valor,
      },
    },
    // `startAfter` con `referenceValue` necesita un orden explícito;
    // `__name__` es el orden natural y no exige un índice compuesto
    // adicional para la igualdad/IN por animeId.
    orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
    limit: limite,
  };

  if (startAfter) {
    // REST no tiene `startAfter`: el cursor exclusivo se expresa con
    // `startAt` y `before: false`.
    structuredQuery.startAt = {
      before: false,
      values: [{ referenceValue: startAfter }],
    };
  }

  return structuredQuery;
}

/**
 * Lee páginas hasta que una devuelve menos de `limite`.
 *
 * `solicitar` recibe `{ startAfter, limite }` y devuelve o un array de
 * documentos (con `name`) o `{ documentos, siguiente }`. Se conserva el
 * `nextPageToken` lógico de Firestore mediante el nombre del último
 * documento.
 */
/**
 * @param {(args: {startAfter: string|null, limite: number}) => Promise<any[]|{documentos:any[], siguiente?: string|null}>} solicitar
 * @param {number} [limite]
 * @returns {Promise<{documentos:any[], consultas:number}>}
 */
export async function leerPaginado(
  solicitar,
  limite = LIMITE_DOCUMENTOS_POR_PAGINA,
) {
  const documentos = [];
  let consultas = 0;
  let startAfter = null;

  for (;;) {
    const respuesta = await solicitar({ startAfter, limite });
    consultas += 1;

    const pagina = Array.isArray(respuesta)
      ? respuesta
      : respuesta?.documentos ?? [];

    documentos.push(...pagina);

    if (pagina.length < limite) break;

    const siguiente = Array.isArray(respuesta)
      ? pagina[pagina.length - 1]?.name ?? null
      : respuesta?.siguiente ?? pagina[pagina.length - 1]?.name ?? null;

    if (!siguiente || siguiente === startAfter) break;

    startAfter = siguiente;
  }

  return { documentos, consultas };
}
