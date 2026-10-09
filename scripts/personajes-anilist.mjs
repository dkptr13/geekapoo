// Empareja un personaje de la ficha con el de AniList.
//
//    import { elegirPersonaje } from './personajes-anilist.mjs';
//
// ── POR QUE HAY QUE COMPARAR CONTRA LAS DOS FORMAS ────────────────
//
// Las dos fuentes no escriben igual las vocales largas, y cada error
// tira a un lado distinto:
//
//   "Tōru Mutsuki"  (la ficha)   contra  "Toru Mutsuki"  (AniList)
//   "Saitō"         (la ficha)   contra  "Saitou"       (AniList)
//
// La primera se arregla QUITANDO el macron: "touru" contra "toru", que
// tampoco casan. La segunda se arregla EXPANDIENDOLO a "ou": "saitou"
// contra "saitou", si. Ninguna de las dos transformaciones sirve para
// los dos casos, asi que se generan las dos formas y se comparan
// contra las dos. Es un poco mas de trabajo que elegir una y ya.
//
// ── POR QUE EL KANJI MANA ──────────────────────────────────────────
//
// `japaneseName` es lo unico que se escribe igual en las dos fuentes.
// Cuando coincide no hay nada que decidir. Cuando no, se busca por
// nombre, y ahi es donde se cuelan los errores.

import { normalizar } from './temporadas-anilist.mjs';

/**
 * Las dos formas legibles del nombre: sin macron y con el macron
 * convertido a su vocal larga de dos letras.
 *
 * @returns {string[][]}  Una lista de listas de palabras.
 */
function formasDe(nombre) {
  const base = normalizar(nombre);

  if (!base.length) return [[]];

  // La forma "plana" ya viene de `normalizar`, que quita el macron. La
  // segunda se rehace desde el original expandiendo.
  const expandida = (nombre ?? '')
    .normalize('NFD')
    .replace(/o\u0304/g, 'ou')
    .replace(/u\u0304/g, 'uu')
    .replace(/e\u0304/g, 'ei')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{S}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return [base, expandida];
}

/** Distancia de Damerau-Levenshtein. */
function distancia(a, b) {
  const m = a.length;
  const n = b.length;

  if (!m) return n;
  if (!n) return m;

  let previo = Array.from({ length: n + 1 }, (_, j) => j);
  let actual = new Array(n + 1);

  for (let j = 0; j <= n; j++) actual[j] = j;

  for (let i = 1; i <= m; i++) {
    actual[0] = i;

    for (let j = 1; j <= n; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;

      actual[j] = Math.min(actual[j - 1] + 1, previo[j] + 1, previo[j - 1] + coste);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        actual[j] = Math.min(actual[j], previo[j - 2] + 1);
      }
    }

    [previo, actual] = [actual, previo];
  }

  return previo[n];
}

/** 1 menos la distancia, normalizada por el nombre más largo. */
function parecido(a, b) {
  const A = a.join('');
  const B = b.join('');

  if (!A.length || !B.length) return 0;

  return 1 - distancia(A, B) / Math.max(A.length, B.length);
}

/**
 * Cuanto se parecen dos nombres, de 0 a 1.
 *
 * ── POR QUE NO COMPARA SOLO EL APELLIDO ───────────────────────────
 *
 * Porque ya salió caro. "Aqua Hoshino" y "Ruby Hoshino" comparten
 * apellido, así que la versión que solo miraba el apellido les daba a
 * los dos 0,9 y el que aparecía primero se llevaba la ficha del otro.
 * Un personaje con la cara de otro no es un fallo visible: sale
 * "bonita" y nadie lo nota hasta que alguien conoce la serie.
 */
export function similitud(formasA, formasB) {
  if (!formasA.length || !formasB.length) return 0;

  let mejor = 0;

  for (const A of formasA) {
    for (const B of formasB) {
      if (!A.length || !B.length) continue;

      const puntos = similitudDeUnaForma(A, B);

      if (puntos > mejor) mejor = puntos;
    }
  }

  return mejor;
}

function similitudDeUnaForma(A, B) {
  // 1. Las mismas palabras en otro orden: "Ai Hoshino" / "Hoshino Ai".
  if ([...A].sort().join(' ') === [...B].sort().join(' ')) return 1;

  const apellidoA = A[A.length - 1];
  const apellidoB = B[B.length - 1];

  // 2. AniList a menudo se queda solo con el nombre de pila: a Levi
  //    Ackerman lo llama "Levi" y a Historia Reiss "Historia". Sin
  //    esta regla los protagonists principales se quedan sin imagen,
  //    que es justo lo que mas se nota.
  if (B.length === 1 && A.length > 1 && A[0] === B[0]) return 0.9;
  if (A.length === 1 && B.length > 1 && B[0] === A[0]) return 0.9;

  // 3. Apellido igual Y nombre de pila compatible.
  if (apellidoA === apellidoB) {
    const pilaA = A.slice(0, -1).join('');
    const pilaB = B.slice(0, -1).join('');

    if (!pilaA || !pilaB) return 0.85; // solo apellido: "Ozai" / "Zeke"

    const encaja = pilaA === pilaB || pilaA.includes(pilaB) || pilaB.includes(pilaA);

    if (encaja) return 0.9;

    // Mismo apellido, nombre de pila DISTINTO: son hermanos o dos
    // personajes distintos. No llega para emparejar.
    return 0.4;
  }

  return parecido(A, B);
}

/** Desde donde se acepta un emparejamiento por nombre. */
const UMBRAL = 0.85;

/**
 * Elige el personaje de AniList que corresponde a una ficha.
 *
 * @param {{nombre:string,nativo:string,imagen:string,id:number}[]} candidatos
 * @param {string} nombre  Nombre de la ficha.
 * @param {string} japones  `japaneseName` de la ficha, en kanji.
 *
 * @returns {{elegido:object|null, como:string}}
 */
export function elegirPersonaje(candidatos, nombre, japones) {
  // El kanji manda sobre cualquier parecido de texto: es el único
  // dato que se escribe igual en las dos fuentes.
  const porKanji = candidatos.find((c) => c.nativo && c.nativo === japones);

  if (porKanji) return { elegido: porKanji, como: 'kanji' };

  const mias = formasDe(nombre);

  const puntuados = candidatos
    .map((c) => ({
      c,
      puntos: Math.max(similitud(mias, formasDe(c.nombre)), 0),
    }))
    .filter((x) => x.puntos >= UMBRAL)
    .sort((a, b) => b.puntos - a.puntos);

  if (!puntuados.length) return { elegido: null, como: 'sin pareja' };

  const mejor = puntuados[0];

  // Un empate a la heads entre dos candidatos distintos NO se resuelve:
  // significa que el emparejador no sabe, y adivinar es justo el
  // error que hay que evitar.
  const empate = puntuados.find((x) => x.c.id !== mejor.c.id && x.puntos >= mejor.puntos - 0.01);

  if (empate) {
    return {
      elegido: null,
      como: `empate entre "${mejor.c.nombre}" y "${empate.c.nombre}"`,
    };
  }

  return { elegido: mejor.c, como: 'nombre' };
}