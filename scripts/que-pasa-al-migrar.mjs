// Dice, una por una, qué LE PASARÍA a cada imagen si se migrara.
//
//   npx tsx scripts/que-pasa-al-migrar.mjs
//
// ── PARA QUÉ ESTE ─────────────────────────────────────────────────
//
// `--aplicar` del script de migración SOBREESCRIBE archivos. Antes de
// dejar que eso pase hay que saber qué se gana y qué se pierde en cada
// caso, y contestarlo con números en vez de con intención.
//
// ── LO QUE MIDE ───────────────────────────────────────────────────
//
//   · Píxeles de antes y de después.
//   · Si hay que AMPLIAR (tirar resolución, no sirve de nada).
//   · Cuánta parte de la imagen se pierde y no se puede recuperar.
//
// ── LO QUE NO HACE ────────────────────────────────────────────────
//
// No escribe nada. Solo lee las cabeceras de las imágenes.
//
// ── POR QUÉ NO SE USA `limitInputPixels` ───────────────────────────
//
// Porque no es "leer solo la cabecera": es un LÍMITE, y con valor 1
// rechaza cualquier imagen de más de un píxel. Con eso, este script no
// encontraba NI UNA imagen y concluía que no había nada que migrar,
// cuando la simulación decía 110. Un comprobador que da cero sin
// decir por qué es peor que no tener comprobador.
//
// `metadata()` ya lee solo la cabecera: no decodifica los píxeles.

import sharp from 'sharp';

import { cliente } from './firestore-rest.mjs';
import { ladoDeSalida, rectanguloDeRecorte } from '../src/services/imageCrop.ts';

const OBJETIVO = [
  { etiqueta: 'portada', coleccion: 'animes', imagen: 'coverUrl', focos: ['coverFocus'], ratio: 3 / 4, maximo: 900 },
  { etiqueta: 'portada', coleccion: 'seasons', imagen: 'coverUrl', focos: ['coverFocus', 'posterFocus'], ratio: 3 / 4, maximo: 900 },
  { etiqueta: 'banner', coleccion: 'seasons', imagen: 'bannerUrl', focos: ['bannerFocus'], ratio: 16 / 9, maximo: 1600 },
  { etiqueta: 'miniatura', coleccion: 'episodes', imagen: 'thumbnailUrl', focos: ['thumbnailFocus'], ratio: 16 / 9, maximo: 800 },
  { etiqueta: 'imagen', coleccion: 'characters', imagen: 'imageUrl', focos: ['imageFocus'], ratio: 2 / 3, maximo: 900 },
];

function rutaDe(url) {
  if (typeof url !== 'string' || !url.includes('firebasestorage.googleapis.com')) return null;

  const m = /\/o\/(.+?)(?:\?|$)/.exec(url);

  if (!m) return null;

  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

/**
 * La caja de salida, SIN ampliar nunca.
 *
 * ── POR QUÉ NO ES SOLO `maximo` ───────────────────────────────────
 *
 * Una ficha de personaje de 597x335 recortada a 2:3 da un recorte de
 * 223x335. Si la salida fuera a 600x900, habría que estirar 2,7 veces:
 * el resultado se vería borroso y se estarían inventando píxeles que
 * no existen.
 *
 * Por eso el lado sale de `ladoDeSalida`, que ya está acotado por la
 * imagen original. Es la MISMA función que usa el editor del panel, y
 * por eso una imagen migrada y una recién subida salen del mismo
 * tamaño.
 */
function cajaDe(ratio, maximo, anchoFuente, altoFuente) {
  const lado = ladoDeSalida(anchoFuente, altoFuente, maximo);

  return ratio >= 1
    ? { ancho: lado, alto: Math.round(lado / ratio) }
    : { ancho: Math.round(lado * ratio), alto: lado };
}

const { coleccion } = await cliente();

const vistas = new Map();
const informe = [];

console.log('  leyendo las cabeceras de las imágenes...');

for (const t of OBJETIVO) {
  let docs;

  try {
    docs = await coleccion(t.coleccion);
  } catch {
    continue;
  }

  for (const doc of docs) {
    const url = doc.f[t.imagen]?.stringValue;
    const foco = t.focos.find((c) => doc.f[c]);

    if (!url || !foco) continue;

    const ruta = rutaDe(url);

    if (!ruta || vistas.has(ruta)) continue;

    let antes;

    try {
      const r = await fetch(url);

      if (!r.ok) continue;

      const meta = await sharp(Buffer.from(await r.arrayBuffer())).metadata();

      antes = { w: meta.width ?? 0, h: meta.height ?? 0 };
    } catch {
      continue;
    }

    if (!antes.w || !antes.h) continue;

    vistas.set(ruta, antes);

    const caja = cajaDe(t.ratio, t.maximo, antes.w, antes.h);
    const p = doc.f[foco];
    const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0.5);

    const r = rectanguloDeRecorte(antes.w, antes.h, caja.ancho, caja.alto, {
      aspectRatio: t.ratio,
      zoom: 1,
      x: n(p.x),
      y: n(p.y),
    });

    informe.push({
      etiqueta: t.etiqueta,
      coleccion: t.coleccion,
      nombre: doc.title?.stringValue ?? doc.name?.stringValue ?? doc.id,
      antes,
      caja,
      recorte: r,
      // Ampliaría si la salida es MAYOR que el recorte de origen.
      // Esta es la comprobación que importa, y no la de comparar el
      // recorte con la imagen entera: con la otra, un recorte de
      // 223x335 que se estira a 600x900 pasaba por bueno.
      amplia: caja.ancho > r.width + 1 || caja.alto > r.height + 1,
      // Lo que se sale del recorte y ya no se puede recuperar.
      perdido: 1 - (r.width * r.height) / (antes.w * antes.h),
      peso: (caja.ancho * caja.alto) / (antes.w * antes.h),
    });
  }
}

console.log(`  ${informe.length} imágenes de nuestro Storage con encuadre guardado.\n`);

const ampliadas = informe.filter((i) => i.amplia);
const sinPerdida = informe.filter((i) => i.perdido <= 0.001);

console.log(`  Habría que AMPLIAR (se inventan píxeles):  ${ampliadas.length}`);
console.log(`  No se pierde nada (ya están en la forma):  ${sinPerdida.length}`);
console.log(`  Se pierde parte, sin vuelta atrás:        ${informe.length - sinPerdida.length}`);

const mediaPeso = informe.reduce((a, i) => a + i.peso, 0) / (informe.length || 1);

console.log('');
console.log(`  Píxeles de media: se queda en el ${Math.round(mediaPeso * 100)}%`);

const perfil = new Map();

for (const i of informe) {
  const clave = i.etiqueta;

  const prev = perfil.get(clave) ?? { n: 0, perdido: 0 };

  perfil.set(clave, { n: prev.n + 1, perdido: prev.perdido + i.perdido });
}

console.log('');
console.log('  por tipo:            n    parte que se pierde de media');

for (const [tipo, v] of [...perfil].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${tipo.padEnd(20)} ${String(v.n).padStart(3)}   ${Math.round((v.perdido / v.n) * 100)}%`);
}

const peores = [...informe].sort((a, b) => b.perdido - a.perdido).slice(0, 5);

console.log('');
console.log('  las que más pierden:');
console.log('  tipo        nombre                  era          sale de       queda');

for (const i of peores) {
  console.log(
    `  ${i.etiqueta.padEnd(11)} ${String(i.nombre).slice(0, 20).padEnd(22)} ` +
      `${(i.antes.w + 'x' + i.antes.h).padEnd(12)} ` +
      `${(i.recorte.width + 'x' + i.recorte.height).padEnd(13)} ` +
      `${Math.round((1 - i.perdido) * 100)}%`,
  );
}