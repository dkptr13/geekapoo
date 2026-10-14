// Pone dos titulos de capitulo en la misma forma para poder compararlos.
//    import { limpiar, mismoTitulo } from './normalizar-titulo.mjs';
//
// ── POR QUE HACE FALTA ──────────────────────────────────────────────
//
// Al emparejar por titulo japones, lo que se compara es una cadena de
// texto sacada de dos sitios distintos: el fichero de datos y TVDB. Los
// dos escriben lo mismo de forma distinta con frecuencia:
//
//   現実（ユメ）   frente a   現実(ユメ)      parentesis de ancho completo
//   渦                                                espacio que sobra
//
// Si no se quitan esas diferencias, el capitulo parece que no esta en
// TVDB cuando en realidad si, y el recuento de "cuantos titulos
// cuadran" — que es el que dice si los datos estan bien — sale mal.
//
// ── QUE NO HACE ─────────────────────────────────────────────────────
//
// No quita acentos ni pasa a minusculas a proposito: los titulos
// japoneses pueden llevar cualquiera de las dos cosas y hacerlo seria
// otra fuente de falsos negativos. Lo unico que se toca es lo que no
// cambia el titulo: espacios, parentesis y signos.

/**
 * Reduce un titulo a la forma en la que se compara.
 *
 * @param {string | null | undefined} s
 * @returns {string}
 */
export function limpiar(s) {
  if (!s) return '';

  return s
    // Parentesis y demas signos de ancho completo a la mitad.
    .replace(/[（）［］｛｝]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－〜～―‐–—ー]/g, '-')
    .replace(/／/g, '/')
    .replace(/、/g, ',')
    .replace(/。/g, '.')
    .replace(/・/g, '.')
    // Los corchetes 【】. TVDB los escribe siempre; el fichero de
    // datos los quita y pone un punto: 【三つ目の選択肢】 se guarda como
    // 三つ目の選択肢 con un punto delante, o como 三つ目の選択肢 a secas.
    // Son el mismo titulo.
    .replace(/[【】〔〕［］]/g, '')
    .replace(/[《》〈〉]/g, '')
    // Los corchetes 「」. TVDB los usa para el numero de capitulo:
    // 第1話「選ばれし者」 es el titulo 選ばれし者 con el numero
    // delante, como trae Kämpfer entera (TVDB 115991). El fichero de
    // datos guarda el titulo limpio, asi que aqui se quitan igual que
    // los de arriba.
    .replace(/[「」]/g, '')
    // El numero de capitulo delante del titulo (第1話, 第13話...).
    // Va con lo anterior: sin esto, 第1話選ばれし者 seguiria sin ser
    // 選ばれし者. Solo vale al principio, que es donde TVDB lo pone.
    .replace(/^第[0-9０-９一二三四五六七八九十百千]+話/g, '')
    // Los dos puntos y el punto medio, que en un titulo de capitulo
    // separan el subtitulo del original y no son parte de ninguno de los
    // dos: 【Mother and Children】 es "Mother and Children", no "Mother
    // and Children:".
    .replace(/[:：]/g, '')
    // El separador de dos titulos seguidos. TVDB escribe
    // "シャルピー衝撃試験／大人の林間学校" y en el fichero de datos estaba
    // como "シャルピー衝撃試験 + 大人の林間学校", con un mas y espacios.
    // Los dos titulos son los mismos; lo que cambia es como se juntan.
    .replace(/\s*\+\s*/g, '/')
    // Los espacios, incluidos los de ancho completo, no cuentan.
    .replace(/[\s　]+/g, '')
    .trim();
}

/**
 * Dice si dos titulos japoneses son el mismo. Va mas alla de comparar
 * cadenas: acepta que uno tenga un parentesis o un espacio de mas, que
 * es lo unico que se considera ruido.
 *
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @returns {boolean}
 */
export function mismoTitulo(a, b) {
  if (!a || !b) return false;

  const x = limpiar(a);
  const y = limpiar(b);

  if (x === y) return true;

  // Uno es el otro con un parentesis intercalado:
  // "誘導法(キリング・ジヤイアント)" frente a "誘導法".
  const sinParentesis = (s) => s.replace(/\([^)]*\)/g, '');

  const a2 = sinParentesis(x);
  const b2 = sinParentesis(y);

  return a2.length > 0 && a2 === b2;
}