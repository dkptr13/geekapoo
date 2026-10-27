// ======================================================
// AUDITORIA DE DISPONIBILIDAD REAL (JustWatch, por pais)
// ======================================================
//
//   node scripts/_tmp-jw-auditoria.mjs
//
// Lee las obras del catalogo, empareja cada una con su ficha de
// JustWatch (cotejando titulo en ingles, titulo original y anio) y
// consulta las ofertas reales de los 10 paises de la web.
//
// NO escribe en Firestore: guarda `scripts/_tmp-jw-auditoria.json`
// para revisarlo antes de sustituir los datos.

import { readFile, writeFile } from 'node:fs/promises';
import { coleccion, str, num } from './firestore-rest.mjs';

const URL_GQL = 'https://apis.justwatch.com/graphql';
const CABECERAS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
  Origin: 'https://www.justwatch.com',
  Referer: 'https://www.justwatch.com/',
};

const REGIONES = ['ES', 'MX', 'AR', 'CO', 'CL', 'US', 'JP', 'FR', 'DE', 'GB'];

const PLATAFORMAS = [
  'netflix',
  'crunchyroll',
  'amazon-prime-video',
  'disney-plus',
  'max',
  'hulu',
  'apple-tv-plus',
  'youtube',
  'filmin',
  'selecta-vision',
  'movistar-plus',
  'atresplayer',
  'rtve-play',
  'hidive',
  'u-next',
];

// Emparejamientos corregidos a mano cuando la busqueda no basta.
const FIJOS = {
  // La segunda temporada comparte ficha con la primera en JustWatch.
  'cyberpunk-edgerunners-season-2': 'ts250831',
};

const normaliza = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compacto = (texto) => normaliza(texto).replace(/\s+/g, '');

const fichas = (texto) => new Set(normaliza(texto).split(' ').filter(Boolean));

/**
 * Nombre que da JustWatch -> id del catalogo.
 * Devuelve '' cuando el servicio no es una plataforma que sigamos
 * (canales de Amazon, tiendas de alquiler, canales de Apple TV...).
 */
function plataformaDePaquete(nombre, moneda) {
  const n = normaliza(nombre);

  if (n === 'netflix' || n === 'netflix standard with ads' || n === 'netflix basic with ads') {
    return 'netflix';
  }
  if (n === 'crunchyroll' || n === 'crunchyroll amazon channel') return 'crunchyroll';
  if (n === 'amazon prime video' || n === 'prime video') return 'amazon-prime-video';
  if (n === 'disney plus' || n === 'disney+') return 'disney-plus';
  if (n === 'max' || n === 'hbo max') return 'max';
  if (n === 'apple tv plus' || n === 'apple tv+') {
    return moneda === 'FLATRATE' ? 'apple-tv-plus' : '';
  }
  if (n === 'apple tv') return moneda === 'FLATRATE' ? 'apple-tv-plus' : '';
  if (n === 'youtube' || n === 'youtube premium' || n === 'youtube free') return 'youtube';
  if (n === 'filmin' || n === 'filmin plus') return 'filmin';
  if (n === 'movistar plus' || n === 'movistar+' || n.startsWith('movistar plus ')) {
    return 'movistar-plus';
  }
  if (n === 'atres player' || n === 'atresplayer' || n === 'atresplayer premium') {
    return 'atresplayer';
  }
  if (n === 'rtve' || n === 'rtve play') return 'rtve-play';
  if (n === 'hidive') return 'hidive';
  if (n === 'u next' || n === 'u-next') return 'u-next';
  if (n === 'hulu') return 'hulu';

  return '';
}

// ── JUSTWATCH ─────────────────────────────────────────────

const gql = async (query, variables, intento = 0) => {
  let r;
  try {
    r = await fetch(URL_GQL, {
      method: 'POST',
      headers: CABECERAS,
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    if (intento < 4) {
      await new Promise((ok) => setTimeout(ok, 1500 * (intento + 1)));
      return gql(query, variables, intento + 1);
    }
    throw e;
  }

  if (r.status === 429 || r.status >= 500) {
    if (intento < 4) {
      await new Promise((ok) => setTimeout(ok, 2000 * (intento + 1)));
      return gql(query, variables, intento + 1);
    }
  }
  if (!r.ok) throw new Error(`JustWatch HTTP ${r.status}`);

  const d = await r.json();
  if (d.errors) throw new Error(JSON.stringify(d.errors).slice(0, 300));
  return d.data;
};

const buscar = async (texto, intento = 0) => {
  const Q = `query Buscar($filtrar: TitleFilter) {
    popularTitles(country: ES, first: 10, filter: $filtrar) {
      edges {
        node {
          ... on MovieOrShow {
            objectId
            objectType
            content(country: ES, language: es) { title originalReleaseYear }
          }
        }
      }
    }
  }`;
  try {
    const d = await gql(Q, { filtrar: { searchQuery: texto } });
    return d.popularTitles.edges.map((e) => e.node);
  } catch (e) {
    if (intento < 3) {
      await new Promise((ok) => setTimeout(ok, 2000 * (intento + 1)));
      return buscar(texto, intento + 1);
    }
    console.log(`  [aviso] busqueda "${texto}": ${e.message}`);
    return [];
  }
};

/** Datos de varios candidatos en una sola peticion (con alias). */
const detalles = async (ids) => {
  if (!ids.length) return [];
  const Q = `query Detalles {
${ids
  .map(
    (id, i) => `  c${i}: node(id: "${id}") {
    ... on MovieOrShow {
      objectId
      objectType
      en: content(country: US, language: en) { title originalTitle originalReleaseYear }
      es: content(country: ES, language: es) { title }
    }
  }`,
  )
  .join('\n')}
}`;
  const d = await gql(Q, {});
  return ids.map((id, i) => d[`c${i}`]).filter(Boolean);
};

const ofertas = async (id) => {
  const decl = REGIONES.map(
    (r) => `  ${r}: offers(country: ${r}, platform: WEB) {
      monetizationType
      standardWebURL
      package { clearName }
    }`,
  ).join('\n');

  const Q = `query Ofertas($id: ID!) {
  node(id: $id) {
    ... on MovieOrShow {
      en: content(country: US, language: en) { title originalReleaseYear }
${decl}
    }
  }
}`;
  return (await gql(Q, { id })).node;
};

// ── EMPAREJAMIENTO ────────────────────────────────────────

function numeros(t) {
  return (normaliza(t).match(/\b(i|ii|iii|iv|v|vi{0,3}|ix|x|\d+)\b/g) ?? []).sort().join(' ');
}

function similitud(a, b) {
  if (!a || !b) return 0;
  const ca = compacto(a);
  const cb = compacto(b);
  if (!ca || !cb) return 0;
  if (ca === cb) return 100;

  // Una secuela o una pelicula distinta de la saga no es la misma ficha.
  if (numeros(a) !== numeros(b)) return 0;

  if (ca.length >= 4 && cb.length >= 4) {
    const corto = ca.length <= cb.length ? ca : cb;
    const largo = ca.length <= cb.length ? cb : ca;
    if (largo.includes(corto) && corto.length / largo.length >= 0.6) return 60;
  }

  const ta = fichas(a);
  const tb = fichas(b);
  const inter = [...ta].filter((x) => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size;
  const jac = union ? inter / union : 0;
  if (jac >= 0.6) return 60;
  if (jac >= 0.5) return 40;
  return 0;
}

function puntua(c, obra) {
  const variantes = [obra.titulo, obra.japones, ...obra.alternativos].filter(Boolean);
  const en = c.en ?? {};
  let titulo = 0;
  for (const v of variantes) {
    titulo = Math.max(titulo, similitud(v, en.title), similitud(v, en.originalTitle), similitud(v, c.es?.title));
  }

  // Si la ficha del catalogo lleva numero de entrega (II, III, 2...),
  // un candidato con otro numero es otra pelicula/temporada.
  const numCandidato = numeros(en.title ?? '');
  const conflicto =
    titulo === 0 && numCandidato !== '' && variantes.some((v) => numeros(v) !== '' && numeros(v) !== numCandidato);

  const anio = en.originalReleaseYear ?? 0;
  let puntosAnio = 0;
  if (obra.anio && anio) {
    if (anio === obra.anio) puntosAnio = 30;
    else if (Math.abs(anio - obra.anio) <= 1) puntosAnio = 10;
    else puntosAnio = -60;
  }

  const tipoEsperado = obra.pelicula ? 'MOVIE' : 'SHOW';
  const tipoOk = c.objectType === tipoEsperado;
  const puntosTipo = tipoOk ? 20 : -40;
  const puntosRango = c.rango === 0 ? 25 : c.rango <= 2 ? 10 : 0;

  return {
    total: titulo + puntosAnio + puntosTipo + puntosRango,
    titulo,
    anio: puntosAnio,
    tipo: puntosTipo,
    rango: puntosRango,
    tipoOk,
    anioOk: puntosAnio >= 10,
    conflicto,
  };
}

/** ¿Se puede dar por buena esta ficha? */
function aceptable(p) {
  if (!p.anioOk || p.conflicto) return false;
  if (p.titulo >= 100) return true; // titulo exacto
  if (p.titulo >= 60) return p.tipoOk; // titulo casi exacto
  // Primer resultado de la busqueda, mismo anio y mismo tipo: aunque el
  // titulo este traducido o romanizado, es la ficha buena.
  if (p.titulo >= 40) return p.tipoOk && p.rango === 25;
  if (p.titulo === 0) return p.tipoOk && p.rango >= 10;
  return false;
}

// ── LEER CATALOGO ─────────────────────────────────────────

const animes = await coleccion('animes');
console.log(`Obras en el catalogo: ${animes.length}`);

const limite = Number(process.argv[2] ?? 0);
const lista = limite > 0 ? animes.slice(0, limite) : animes;

// Reanudable: si ya hay un volcado con la version nueva, se conserva.
let previas = [];
try {
  const guardado = JSON.parse(await readFile('scripts/_tmp-jw-auditoria.json', 'utf8'));
  if (guardado.version === 2) previas = guardado.obras ?? [];
} catch {
  previas = [];
}
const hechas = new Set(previas.map((o) => o.id));
const obras = [...previas];
if (previas.length) console.log(`Ya auditadas: ${previas.length}`);

const guardar = () =>
  writeFile('scripts/_tmp-jw-auditoria.json', JSON.stringify({ version: 2, obras }, null, 1), 'utf8');

for (const doc of lista) {
  if (hechas.has(doc.id)) continue;

  const id = doc.id;
  const titulo = str(doc, 'title');
  const japones = str(doc, 'japaneseTitle');
  const anio = num(doc, 'year');
  const pelicula = num(doc, 'episodesCount') <= 1;
  const alternativos = (doc.f.alternativeTitles?.arrayValue?.values ?? []).map((v) => v.stringValue);
  const legado = (doc.f.streaming?.arrayValue?.values ?? [])
    .map((v) => v.mapValue?.fields?.name?.stringValue)
    .filter(Boolean);

  const obra = { id, titulo, japones, anio, pelicula, alternativos, legado };

  // 1. Recopilar candidatos de varias busquedas.
  const variantes = [...new Set([titulo, japones, ...alternativos].filter(Boolean))].slice(0, 8);
  const candidatos = new Map();

  for (const texto of variantes) {
    const encontrados = await buscar(texto);
    encontrados.forEach((n, rango) => {
      const clave = `${n.objectType === 'SHOW' ? 'ts' : 'tm'}${n.objectId}`;
      const previo = candidatos.get(clave);
      if (!previo || rango < previo.rango) {
        candidatos.set(clave, { ...n, id: clave, rango });
      }
    });
    await new Promise((ok) => setTimeout(ok, 150));
  }

  // 2. Datos en ingles/original de cada candidato.
  const ids = [...candidatos.keys()].slice(0, 40);
  const datos = await detalles(ids);
  const evaluados = datos
    .map((c) => {
      const base = candidatos.get(`ts${c.objectId}`) ?? candidatos.get(`tm${c.objectId}`);
      const conRango = { ...c, rango: base?.rango ?? 9, id: base?.id };
      return { c: conRango, p: puntua(conRango, obra) };
    })
    // El tipo manda: una pelicula con el mismo titulo no es la serie.
    .sort((a, b) => Number(b.p.tipoOk) - Number(a.p.tipoOk) || b.p.total - a.p.total);

  const mejor = evaluados[0];

  const fila = {
    ...obra,
    elegido: null,
    dudosos: evaluados.slice(0, 3).map(({ c, p }) => ({
      id: c.id,
      tipo: c.objectType,
      title: c.en?.title,
      original: c.en?.originalTitle,
      es: c.es?.title,
      anio: c.en?.originalReleaseYear,
      puntos: p.total,
      titulo: p.titulo,
      tipoOk: p.tipoOk,
      anioOk: p.anioOk,
      conflicto: p.conflicto,
    })),
    regiones: {},
    plataformas: [],
    filas: [],
    estado: 'sin-emparejar',
  };

  let elegido = null;

  if (FIJOS[id]) {
    const forzado = (await detalles([FIJOS[id]]))[0];
    if (forzado) {
      elegido = { c: { ...forzado, id: FIJOS[id] }, p: { total: 999, tipoOk: true, anioOk: true } };
      fila.estado = 'fijado';
    }
  }

  const valido = evaluados.find((e) => aceptable(e.p));
  if (valido) {
    elegido = valido;
    fila.estado = 'emparejado';
  }

  if (!elegido) {
    obras.push(fila);
    await guardar();
    console.log(`  SIN EMPAREJAR  ${id} "${titulo}" (${anio})  [mejor: ${mejor?.c.en?.title ?? '-'} ${mejor?.p.total ?? ''}]`);
    continue;
  }

  const datosOfertas = await ofertas(elegido.c.id);
  fila.elegido = {
    id: elegido.c.id,
    tipo: elegido.c.objectType,
    title: elegido.c.en?.title,
    original: elegido.c.en?.originalTitle,
    es: elegido.c.es?.title,
    anio: elegido.c.en?.originalReleaseYear,
    puntos: elegido.p.total,
  };

  const vistos = new Set();
  for (const region of REGIONES) {
    const listaOfertas = (datosOfertas?.[region] ?? []).filter((o) =>
      ['FLATRATE', 'FREE', 'ADS'].includes(o.monetizationType),
    );
    const porPlataforma = {};
    for (const o of listaOfertas) {
      const pid = plataformaDePaquete(o.package?.clearName ?? '', o.monetizationType);
      if (!pid) continue;
      if (!porPlataforma[pid]) {
        porPlataforma[pid] = {
          accessType: o.monetizationType === 'FLATRATE' ? 'subscription' : 'free_ads',
          url: o.standardWebURL ?? '',
        };
      }
      vistos.add(pid);
    }
    fila.regiones[region] = porPlataforma;
  }

  const mapa = {
    netflix: 'netflix',
    crunchyroll: 'crunchyroll',
    hulu: 'hulu',
    'disney+': 'disney-plus',
    'disney plus': 'disney-plus',
    'amazon prime': 'amazon-prime-video',
    'amazon prime video': 'amazon-prime-video',
    'prime video': 'amazon-prime-video',
    max: 'max',
    'hbo max': 'max',
    'apple tv+': 'apple-tv-plus',
    'apple tv plus': 'apple-tv-plus',
    youtube: 'youtube',
    filmin: 'filmin',
    'selecta vision': 'selecta-vision',
    'movistar+': 'movistar-plus',
    'movistar plus+': 'movistar-plus',
    'movistar plus': 'movistar-plus',
    atresplayer: 'atresplayer',
    'atres player': 'atresplayer',
    'rtve play': 'rtve-play',
    rtve: 'rtve-play',
    hidive: 'hidive',
    'u-next': 'u-next',
    'u next': 'u-next',
  };
  const legadoIds = legado.map((n) => mapa[normaliza(n)]).filter(Boolean);

  // Selecta Vision no es un servicio de streaming (es distribuidora),
  // asi que su ficha se queda en "Sin verificar" en vez de inventar.
  fila.plataformas = [...new Set([...vistos, ...legadoIds])]
    .filter((p) => PLATAFORMAS.includes(p) && p !== 'selecta-vision')
    .sort();

  for (const platformId of fila.plataformas) {
    for (const region of REGIONES) {
      const oferta = fila.regiones[region][platformId];
      fila.filas.push({
        platformId,
        region,
        status: oferta ? 'available' : 'unavailable',
        accessType: oferta ? oferta.accessType : 'unknown',
        ...(oferta?.url ? { url: oferta.url } : {}),
      });
    }
  }

  obras.push(fila);
  await guardar();
  console.log(
    `  ${fila.estado.padEnd(12)} ${id.padEnd(42)} -> ${elegido.c.id} ` +
      `"${elegido.c.en?.title}" (${elegido.c.en?.originalReleaseYear}) ` +
      `${fila.filas.filter((f) => f.status === 'available').length} disp.`,
  );

  await new Promise((ok) => setTimeout(ok, 150));
}

// ── RESUMEN ───────────────────────────────────────────────

const conDatos = obras.filter((o) => o.elegido);
const filas = obras.flatMap((o) => o.filas);
const disponibles = filas.filter((f) => f.status === 'available');

console.log(`\nObras emparejadas: ${conDatos.length}/${obras.length}`);
console.log(`Filas: ${filas.length} (${disponibles.length} disponibles)`);
for (const region of REGIONES) {
  console.log(`  ${region}: ${disponibles.filter((f) => f.region === region).length} disponibles`);
}

await guardar();
console.log('\nGuardado scripts/_tmp-jw-auditoria.json');
