// Consultas REST selectivas para los scripts de mantenimiento.
//
// No hay caché ni estado global: cada llamada consulta Firestore y
// devuelve solo los documentos pedidos. Se apoya en el mismo cliente y
// las mismas credenciales que `firestore-rest.mjs`.

import { cliente, uno } from './firestore-rest.mjs';

export const LIMITE_POR_PAGINA = 300;
export const LIMITE_IN = 30;

const normalizar = (valor) => String(valor ?? '').trim();

/**
 * Construye la StructuredQuery de una igualdad o de un IN.
 *
 * `campos` se traduce a una proyección para no traer campos que el
 * script no va a usar. No reduce las lecturas facturables, pero sí el
 * tamaño de la respuesta.
 */
/**
 * @param {{coleccion:string, campo:string, valor:string|string[], campos?:string[]|null, startAfter?:string|null, limite?:number}} opciones
 * @returns {any}
 */
export function crearConsulta({
  coleccion,
  campo,
  valor,
  campos = null,
  startAfter = null,
  limite = LIMITE_POR_PAGINA,
}) {
  const valores = Array.isArray(valor)
    ? valor.map(normalizar).filter(Boolean)
    : [normalizar(valor)].filter(Boolean);

  if (valores.length === 0) {
    throw new Error(`La consulta de ${coleccion} no tiene valores.`);
  }
  if (valores.length > LIMITE_IN) {
    throw new Error(`La consulta de ${coleccion} supera el límite de ${LIMITE_IN}.`);
  }

  const structuredQuery = {
    from: [{ collectionId: coleccion }],
    where: {
      fieldFilter: {
        field: { fieldPath: campo },
        op: valores.length === 1 ? 'EQUAL' : 'IN',
        value:
          valores.length === 1
            ? { stringValue: valores[0] }
            : {
                arrayValue: {
                  values: valores.map((item) => ({ stringValue: item })),
                },
              },
      },
    },
    orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
    limit: limite,
  };

  if (campos && campos.length > 0) {
    structuredQuery.select = {
      fields: campos.map((fieldPath) => ({ fieldPath })),
    };
  }

  if (startAfter) {
    // REST no expone startAfter: `startAt` con before:false es el
    // cursor exclusivo equivalente.
    structuredQuery.startAt = {
      before: false,
      values: [{ referenceValue: startAfter }],
    };
  }

  return structuredQuery;
}

/** Lee páginas de 300 hasta que una devuelve menos documentos. */
/**
 * @param {(args:{startAfter:string|null,limite:number}) => Promise<any[]>} solicitar
 * @param {number} [limite]
 * @returns {Promise<{documentos:any[], consultas:number}>}
 */
export async function leerPaginas(solicitar, limite = LIMITE_POR_PAGINA) {
  const documentos = [];
  let consultas = 0;
  let startAfter = null;

  for (;;) {
    const pagina = await solicitar({ startAfter, limite });
    consultas += 1;
    documentos.push(...pagina);

    if (pagina.length < limite) break;

    const siguiente = pagina[pagina.length - 1]?.name ?? null;
    if (!siguiente || siguiente === startAfter) break;
    startAfter = siguiente;
  }

  return { documentos, consultas };
}

/**
 * Lee los documentos de una colección que cumplen un campo.
 *
 * Con varios valores parte en bloques de 30 y conserva la paginación
 * de cada bloque. Devuelve `{id,f,actualizado}` como `coleccion()`.
 */
export async function leerPorCampo({
  coleccion,
  campo,
  valor,
  campos = null,
  limite = LIMITE_POR_PAGINA,
  stats = null,
}) {
  const valores = Array.isArray(valor) ? valor : [valor];
  const limpios = [...new Set(valores.map(normalizar).filter(Boolean))];
  const salida = [];

  if (limpios.length === 0) return salida;

  const { cabeceras, BASE } = await cliente();

  for (let i = 0; i < limpios.length; i += LIMITE_IN) {
    const bloque = limpios.slice(i, i + LIMITE_IN);

    const { documentos, consultas } = await leerPaginas(async ({ startAfter }) => {
      const structuredQuery = crearConsulta({
        coleccion,
        campo,
        valor: bloque,
        campos,
        startAfter,
        limite,
      });

      const respuesta = await fetch(`${BASE}:runQuery`, {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify({ structuredQuery }),
      });

      if (!respuesta.ok) {
        const detalle = (await respuesta.text()).slice(0, 300);
        throw new Error(`${coleccion} (${bloque.length} valores): ${respuesta.status}: ${detalle}`);
      }

      const payload = await respuesta.json();
      return payload
        .filter((entrada) => entrada.document)
        .map((entrada) => entrada.document);
    }, limite);

    if (stats) {
      stats.consultas = (stats.consultas ?? 0) + consultas;
      stats.documentos = (stats.documentos ?? 0) + documentos.length;
      stats.paginas = (stats.paginas ?? 0) + consultas;
    }

    salida.push(
      ...documentos.map((doc) => ({
        id: doc.name.split('/').pop(),
        f: doc.fields ?? {},
        actualizado: doc.updateTime ?? '',
      })),
    );
  }

  return salida;
}

/** Lee un número pequeño de documentos por su id real. */
export async function leerPorIds({ coleccion, ids, stats = null }) {
  const salida = [];

  for (const id of [...new Set((ids ?? []).map(normalizar).filter(Boolean))]) {
    if (stats) {
      stats.consultas = (stats.consultas ?? 0) + 1;
      stats.documentos = (stats.documentos ?? 0) + 1;
      stats.paginas = (stats.paginas ?? 0) + 1;
    }

    const doc = await uno(coleccion, id);
    if (doc) salida.push(doc);
  }

  return salida;
}

/** Busca un anime por id de documento o slug, sin descargar la colección. */
export async function resolverAnime({ valor, stats = null }) {
  const buscado = normalizar(valor);
  if (!buscado) return null;

  const porId = await uno('animes', buscado);
  if (stats) {
    stats.consultas = (stats.consultas ?? 0) + 1;
    stats.documentos = (stats.documentos ?? 0) + 1;
  }
  if (porId) return porId;

  const [porSlug] = await leerPorCampo({
    coleccion: 'animes',
    campo: 'slug',
    valor: buscado,
    limite: 2,
    stats,
  });

  return porSlug ?? null;
}
