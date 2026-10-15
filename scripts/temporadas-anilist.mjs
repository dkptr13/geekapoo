// Decide que media de AniList es cada temporada del catalogo.
//
//    import { elegirTemporadas } from './temporadas-anilist.mjs';
//
// ── POR QUE NO BASTA CON EL NUMERO DE TEMPORADA ────────────────────
//
// El numero de AniList y el nuestro no son el mismo numero. Ataque a
// los Titanes tiene 7 temporadas aqui y ahi son otras: las dos
// ultimas se llaman "The Final Season" y "The Final Chapters", que no
// llevan numero ninguno. Un emparejamiento por numero las deja sin
// portada.
//
// Y el numero solo tampoco vale: Tokyo Ghoul tiene T2 ("√A") y T4
// ("OVA") las dos de 2015, asi que el año no las distingue.
//
// ── LA REGLA DE ORO ────────────────────────────────────────────────
//
// Ante la duda, se deja la temporada SIN portada. Una portada
// equivitada se nota; una sin portada no, porque la wiki hereda la de
// la serie cuando la temporada no tiene la suya (ver `fichaDe` en
// `utils/seasonData.ts`). Ante la duda es no poner nada.

import { numeroDeTemporada } from './anilist.mjs';

/**
 * Pone un nombre en forma comparable.
 *
 * Vive aquí y no en el script principal para que no haya dos copias
 * que se puedan quedar desincronizadas: ya pasó, cuando el filtro de
 * títulos usaba una versión y el emparejamiento de personajes otra.
 *
 * Lo de la vocal larga es lo importante: las dos fuentes no escriben
 * igual la "o" de "Saito". La tabla de personajes usa la forma
 * japonesa con macron ("Saitō") y AniList la forma sin ("Saitou").
 * Si quitas el macron a pelo, comparan "saito" con "saitou" y no son
 * el mismo nombre, y se pierde ese emparejamiento.
 *
 * Por eso la vocal larga se EXPANDE a su equivalente de dos letras en
 * lugar de desaparecer: es el paso que convierte "saito" en "saitou".
 */
export function normalizar(nombre) {
  if (!nombre) return [];

  const conVocalLarga = nombre
    .normalize('NFD')
    .replace(/o\u0304/g, 'ou') // ō -> ou
    .replace(/u\u0304/g, 'uu') // ū -> uu
    .replace(/e\u0304/g, 'ei'); // ē -> ei

  return conVocalLarga
    .replace(/[\u0300-\u036f]/g, '') // el resto de tildes
    .toLowerCase()
    // Se queda con letras, números y SÍMBOLOS de cualquier alfabeto.
    // Con `[a-z0-9]` el "√" de "Tokyo Ghoul √A" desaparecía y el
    // título se quedaba en una letra suelta, que ya no casaba con
    // nada. Los símbolos se conservan porque en varios títulos forman
    // parte del nombre de la temporada.
    .replace(/[^\p{L}\p{N}\p{S}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Formatos de AniList que son una temporada emitida.
 *
 * Incluye ONA porque hay series que AniList clasifica así: Cyberpunk:
 * Edgerunners y Witch Hat Atelier son ONA, no TV, y con una lista
 * más corta se quedaban sin portada.
 */
const FORMATO_DE_TEMPORADA = new Set(['TV', 'TV_SHORT', 'MOVIE', 'ONA']);

/**
 * Palabras que no distinguen una temporada de otra.
 *
 * Antes el filtro era "más de dos letras", y eso tiraba por la
 * ventana justo los títulos que más necesitaban compararse: "√A" se
 * normaliza a una sola letra y "re" a dos, y los dos se quedan sin
 * puntos de título. Una lista de palabras es más precisa que la
 * longitud.
 *
 * "no" está porque en los títulos japoneses es una partícula
 * ("Shingeki no Kyojin"), no la negación.
 */
const VACIAS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into',
  'una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'por', 'para',
  'con', 'sin', 'sobre',
  'no',
]);

/** Deja solo las palabras que aportan algo. */
function conSignificado(palabras) {
  const utiles = palabras.filter((p) => !VACIAS.has(p));

  return utiles.length ? utiles : palabras;
}

/**
 * Un "teaser PV" o una "collaboration MV" no es una temporada, aunque
 * su título contenga el nombre de la serie y su año cuadre. Se
 * descartan de entrada.
 */
const NO_ES_TEMPORADA = /\b(teaser|pv|pvs|trailer|promotional|collaboration|mv|omake|special)\b/i;

/** Cuántas palabras con significado del título aparecen en el otro. */
function coincidencias(tituloNuestro, tituloSuyo) {
  const mias = conSignificado(normalizar(tituloNuestro));
  const suyas = normalizar(tituloSuyo);

  return {
    total: mias.length,
    comunes: mias.filter((p) => suyas.includes(p)).length,
  };
}

/**
 * Puntos a partir de los cuales se da por buena la portada.
 *
 * Con 4 se acepta casi sin comprobar nada mas. Con 3 solo se acepta
 * si el año es exacto, si es el unico de ese año y si es formato de
 * temporada, que es lo que cubre los titulos que no encajan con
 * ninguno de los de AniList ("The Culling Game: Part 1" frente a
 * "Jujutsu Kaisen: Shimetsu Kaiyuu - Zenpen").
 */
const UMBRAL_SEGURO = 4;

/**
 * Puntua una candidata de AniList para una temporada del catalogo.
 *
 * @returns {null | {m:object, puntos:number, porQue:string[]}}
 *   `null` si el año la descarta de entrada.
 */
function puntuar(m, temporada, laBase) {
  const { numero, anio, titulo } = temporada;

  // Una temporada no puede ser de un año que no es el suyo. Esto
  // descarta de golpe la mayoria y es lo que evita que la T7 de 2023
  // acabe con la portada de la T1 de 2013.
  if (anio && m.anio && Math.abs(m.anio - anio) > 1) return null;

  let puntos = 0;
  const porQue = [];

  // El año va POR ESCALONES, no con penalización. Si el año vecino no
  // puntúa nada, cualquier coincidencia exacta le gana, y así
  // "Shingeki no Kyojin: Chronicle" (un resumen de 2020) le ganaba
  // a "The Final Season", que AniList fecha 2021.
  if (anio && m.anio === anio) {
    puntos += 3;
    porQue.push(`año ${m.anio}`);
  } else if (anio && m.anio) {
    const d = m.anio - anio;

    puntos += 1;
    porQue.push(`año ${m.anio} (${d >= 0 ? '+' : ''}${d})`);
  }

  const numAniList = numeroDeTemporada(m.titulo);

  if (numAniList !== null && numAniList === numero) {
    puntos += 3;
    porQue.push(`"temporada ${numero}"`);
  }

  // La T1 es el anime base aunque su titulo no lo diga.
  if (numero === 1 && laBase && m.id === laBase.id) {
    puntos += 3;
    porQue.push('es el anime base');
  }

  // El título es la señal más concreta que hay. Se puntúa por
  // PROPORCIÓN de palabras presentes y no por parecido de texto: la
  // nuestra dice "re" y la de AniList "Tokyo Ghoul:re", y comparar
  // "re" con la cadena entera no da ningún parecido.
  if (titulo) {
    const { total, comunes } = coincidencias(titulo, m.titulo);

    if (total && comunes / total >= 0.6) {
      puntos += 3;
      porQue.push(`título "${titulo}"`);
    } else if (comunes) {
      puntos += 1;
      porQue.push(`título "${titulo}" (a medias)`);
    }
  }

  // Un SPECIAL de AniList es un recap o una compilación, no una
  // temporada. Es lo que le cae al "Chronicle", que es de 2020 y por
  // año le ganaba a la temporada que de verdad es.
  //
  // La penalización es de DOS, no de tres: con tres se comía el punto
  // del título y "The Final Season - Kanketsu-hen Zenpen", que es la
  // T7 de Ataque a los Titanes, se quedaba sin portada.
  if (m.formato === 'SPECIAL') {
    puntos -= 2;
    porQue.push('es un resumen (SPECIAL)');
  }

  // Un PV, un teaser o una colaboración con otra serie comparten
  // nombre y año con la temporada de verdad, asi que el año y el título
  // los dan por buenos. No lo son.
  if (NO_ES_TEMPORADA.test(m.titulo)) {
    puntos -= 6;
    porQue.push('es un PV o teaser, no una temporada');
  }

  // Números de parte. "Tokyo Ghoul:re 2" no es nuestra T3, que se
  // titula solo "re". Y al revés también choca.
  //
  // El reverso lo puso Psycho-Pass: sus temporadas se titulan con el
  // número pelado ("PSYCHO-PASS 2", "PSYCHO-PASS 3"), que aquí no da
  // número de temporada y además penaliza por dígito ajeno. Por eso
  // sus T2 y T5 declaran el título oficial en el catálogo: con él, el
  // dígito suma en vez de restar ("mismo número de parte").
  const mios = normalizar(titulo).filter((p) => /^\d+$/.test(p));
  const suyos = normalizar(m.titulo).filter((p) => /^\d+$/.test(p));

  if (suyos.some((x) => !mios.includes(x))) {
    puntos -= 2;
    porQue.push('trae número de parte que nuestro título no tiene');
  } else if (mios.length && suyos.some((x) => mios.includes(x))) {
    puntos += 2;
    porQue.push('mismo número de parte');
  }

  return { m, puntos, porQue };
}

/**
 * Elige una media para cada temporada.
 *
 * @param {object[]} temporadas  Del catalogo, con `numero`, `anio` y
 *   `titulo` ya leidos.
 * @param {Map<number,object>} todos  Medias de la franquicia.
 * @param {object|null} laBase  El anime base, que es la T1.
 *
 * @returns {{elegido:object|null, explicacion:string, empateCon:string|null}[]}
 */
export function elegirTemporadas(temporadas, todos, laBase) {
  return temporadas.map((temporada) => {
    const { numero, anio, titulo } = temporada;

    const puntuadas = [...todos.values()]
      .map((m) => puntuar(m, temporada, laBase))
      .filter(Boolean)
      .filter((x) => x.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos || a.m.id - b.m.id);

    if (!puntuadas.length) {
      return {
        elegido: null,
        explicacion: 'AniList no tiene esa temporada',
        empateCon: null,
      };
    }

    const mejor = puntuadas[0];

    // Cuantas candidatas comparten ese año exacto. Si hay varias y
    // ninguna llega al umbral, no hay manera de saber cual es: es el
    // caso de la T4 de Tokyo Ghoul, que se titula "OVA" y en 2015
    // AniList solo tiene "[PINTO]", "√A" y "[JACK]".
    const delAnio = puntuadas.filter((x) => anio && x.m.anio === anio);
    const unicaEnSuAnio = delAnio.length === 1;

    const segura = mejor.puntos >= UMBRAL_SEGURO;
    const conMargen =
      mejor.puntos === UMBRAL_SEGURO - 1 &&
      unicaEnSuAnio &&
      FORMATO_DE_TEMPORADA.has(mejor.m.formato);

    const detalle = mejor.porQue.join(', ') || 'solo portada';

    if (!segura && !conMargen) {
      return {
        elegido: null,
        explicacion: `mejor candidata "${mejor.m.titulo}" con ${mejor.puntos} pts, sin margen`,
        empateCon: null,
      };
    }

    const empatada = puntuadas.find((x) => x !== mejor && x.puntos === mejor.puntos);

    return {
      elegido: mejor.m,
      explicacion: `${mejor.puntos} pts: ${detalle}`,
      empateCon: empatada ? empatada.m.titulo : null,
    };
  });
}