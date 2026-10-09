// Migra las imágenes del catálogo que están en NUESTRO Storage.
//
//   node scripts/migrar-encuadres.mjs              # simulación
//   node scripts/migrar-encuadres.mjs --aplicar    # escribe
//   node scripts/migrar-encuadres.mjs --aplicar --sin-copia
//
// ── QUÉ HACE ──────────────────────────────────────────────────────
//
// Para cada documento con imagen y encuadre guardado:
//
//   1. Se descarga la imagen.
//   2. Se recorta a la proporción del sitio donde se pinta, con el
//      encuadre que ya había.
//   3. Se sube el recorte ENCIMA, en la misma ruta.
//   4. Solo si la subida ha ido bien, se borra el campo de encuadre.
//
// ── POR QUÉ EN LA MISMA RUTA ──────────────────────────────────────
//
// Porque la URL ya está guardada en el documento. Si se subiera a una
// ruta nueva habría que cambiar la URL en cada documento, y mientras
// no se hiciera quedaría medio catálogo apuntando a lo viejo.
// Sobrescribir deja las URLs como estaban.
//
// ── POR QUÉ SOLO LAS QUE SON NUESTRAS ─────────────────────────────
//
// Porque las demás están fuera:
//
//   artworks.thetvdb.com    569
//   s4.anilist.co           553
//   img1.ak.crunchyroll.com   28
//   otros                    7
//
// Esas NO se tocan, y el motivo no es técnico: el proyecto ENLACA las
// imágenes, no las rehostea. Descargar la portada de una serie de su
// CDN y volver a subirla al nuestro sería rehostear obra con derechos
// de terceros.
//
// Para esas, `coverFocus` y compañía no son un sistema viejo que haya
// que retirar: son el ÚNICO mecanismo posible, porque el archivo no es
// nuestro y no se puede recortar al subirlo. Por eso display sigue
// leyéndolas, y por eso el `FocalField` del panel sigue existiendo.
//
// ── LAS COPIAS DE SEGURIDAD ───────────────────────────────────────
//
// Antes de sobrescribir, el original se copia a
// `content/_originales/<lo que hubiera>`, una sola vez. Son unos
// 40 MB y es lo que hace esto reversible: si un recorte sale mal, se
// vuelve a subir la copia.
//
// Con `--sin-copia` no se guarda nada y no hay vuelta atrás.
//
// ── EL ORDEN DE LAS DOS COSAS ─────────────────────────────────────
//
// Primero la imagen, y SOLO ENTONCES se borra el encuadre. Al revés,
// un fallo al subir dejaría la imagen sin recortar y sin encuadre, que
// es justo lo que hay que evitar: la foto se vería siempre por el
// centro y no habría forma de arreglarlo desde el panel.
//
// ── EL CÁLCULO DEL RECORTE ────────────────────────────────────────
//
// Se usa `rectanguloDeRecorte`, la MISMA geometría que el navegador.
// No una cuenta parecida: si aquí se calculara de otra manera, lo que se
// guardaría y lo que se enseñó en el panel serían recortes distintos,
// y el script no serviría para nada.
//
// El paso de las coordenadas de la geometría al recorte de sharp es:
//
//     left  = -x / escala
//     top   = -y / escala
//     width  = anchoCaja / escala
//     height = altoCaja / escala
//
// porque un píxel de la caja corresponde a `1/escala` de la original,
// y `x` e `y` son negativos o cero. Siempre caen dentro de la imagen:

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sharp from 'sharp';

import { cliente } from './firestore-rest.mjs';
import { ladoDeSalida, rectanguloDeRecorte } from '../src/services/imageCrop.ts';
const aplicar = process.argv.includes('--aplicar');
const sinCopia = process.argv.includes('--sin-copia');

/**
 * Las proporciones de destino.
 *
 * Las mismas que usa el editor de recorte del panel, para que una
 * imagen migrada y una recién subida se vean igual.
 */
const OBJETIVO = [
  { coleccion: 'animes', imagen: 'coverUrl', focos: ['coverFocus'], ratio: 3 / 4, maximo: 900 },
  { coleccion: 'seasons', imagen: 'coverUrl', focos: ['coverFocus', 'posterFocus'], ratio: 3 / 4, maximo: 900 },
  { coleccion: 'seasons', imagen: 'bannerUrl', focos: ['bannerFocus'], ratio: 16 / 9, maximo: 1600 },
  { coleccion: 'episodes', imagen: 'thumbnailUrl', focos: ['thumbnailFocus'], ratio: 16 / 9, maximo: 800 },
  { coleccion: 'characters', imagen: 'imageUrl', focos: ['imageFocus'], ratio: 2 / 3, maximo: 900 },
];

const PREFIJO_ORIGINALES = 'content/_originales/';

/** La ruta dentro del bucket de una URL de Storage de este proyecto, o null. */
function rutaDe(url) {
  if (typeof url !== 'string') return null;
  if (!url.includes('firebasestorage.googleapis.com')) return null;

  const m = /\/o\/(.+?)(?:\?|$)/.exec(url);

  if (!m) return null;

  try {
    const ruta = decodeURIComponent(m[1]);

    return ruta.startsWith('content/') ? ruta : null;
  } catch {
    return null;
  }
}

/** El punto de enfoque guardado, acotado, con el centro por defecto. */
function puntoDe(foco) {
  const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5);

  if (!foco || typeof foco !== 'object') return { x: 0.5, y: 0.5 };

  return { x: n(foco.x), y: n(foco.y) };
}

/** El nombre legible, para el informe. */
function nombreDe(doc) {
  if (doc.title) return doc.title.stringValue;
  if (doc.name) return doc.name.stringValue;
  if (doc.number) return `T${doc.number.stringValue}`;

  return doc.id;
}

/**
 * La caja de salida, SIN ampliar nunca.
 *
 * El lado sale de `ladoDeSalida`, acotado por la imagen original. Sin
 * esa cuenta, una imagen de 597x335 recortada a 2:3 daría un recorte
 * de 223x335 que se estiraría hasta 600x900: dos pixels y medio de
 * ampliación, con el resultado borroso.
 *
 * Es la misma función que usa el editor del panel, así que una imagen
 * migrada y una recién subida salen del mismo tamaño.
 */
function cajaDe(ratio, maximo, anchoFuente, altoFuente) {
  const lado = ladoDeSalida(anchoFuente, altoFuente, maximo);

  return ratio >= 1
    ? { ancho: lado, alto: Math.round(lado / ratio) }
    : { ancho: Math.round(lado * ratio), alto: lado };
}

async function main() {
  const { coleccion, cabecera } = await cliente();
  const temporal = await mkdtemp(join(tmpdir(), 'recorte-'));

  const copiados = new Set();
  let migradas = 0;
  let omitidas = 0;
  let fallos = 0;

  console.log(
    aplicar
      ? 'MIGRANDO (de verdad). Con --sin-copia esto no tiene vuelta atrás.'
      : 'SIMULACIÓN. Añade --aplicar para escribir de verdad.',
  );
  console.log('');

  for (const t of OBJETIVO) {
    let docs;

    try {
      docs = await coleccion(t.coleccion);
    } catch (e) {
      console.log(`  ${t.coleccion}: no se ha podido leer (${e.message})`);

      continue;
    }

    let deAqui = 0;
    let deFuera = 0;

    for (const doc of docs) {
      const url = doc.f[t.imagen]?.stringValue;
      const foco = t.focos.find((c) => doc.f[c]);

      if (!url || !foco) continue;

      const ruta = rutaDe(url);

      if (!ruta) {
        omitidas++;

        continue;
      }

      deAqui++;

      const ajustes = puntoDe(doc.f[foco]);
      const destino = doc.f[t.imagen]?.stringValue;

      if (!aplicar) {
        migradas++;

        continue;
      }

      try {
        const original = await descargar(url);

        // La copia va UNA vez por ruta, no una por documento: la misma
        // imagen puede estar referenciada desde varios sitios.
        if (!sinCopia && !copiados.has(ruta)) {
          const cabeceraCopia = {
            ...cabecera,
            'Content-Type': original.tipo,
          };

          const r = await fetch(
            `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}` +
              `.firebasestorage.app/o/${encodeURIComponent(PREFIJO_ORIGINALES + ruta)}?uploadType=media`,
            { method: 'POST', headers: cabeceraCopia, body: original.bytes },
          );

          if (r.ok) copiados.add(ruta);
        }

        const recortada = await recortar(original.bytes, ajustes, t.ratio, t.maximo, destino);

        const r = await subir(ruta, recortada.bytes, recortada.tipo);

        if (!r) throw new Error('la subida devolvió un error');

        // Solo ahora se borra el encuadre, y solo si la imagen ya está
        // subida. Si este paso falla, el original sigue intacto y el
        // encuadre sigue ahí: se puede reintentar sin perder nada.
        await borrarFoco(t.coleccion, doc.id, foco);

        await borrarFoco(t.coleccion, doc.id, foco);

        migradas++;
      } catch (e) {
        fallos++;

        console.log(`    FALLO ${t.coleccion}/${nombreDe(doc)}: ${e.message}`);
      }
    }

    console.log(
      `  ${(t.coleccion + '/' + t.imagen).padEnd(24)} ` +
        `de este proyecto: ${String(deAqui).padStart(4)}   ` +
        `enlazadas fuera: ${String(deFuera).padStart(4)}`,
    );
  }

  console.log('');
  console.log(`  ${aplicar ? 'migradas' : 'a migrar'}: ${migradas}`);
  console.log(`  enlazadas fuera, no se tocan: ${omitidas}`);
  if (copiados.size) console.log(`  originales copiados: ${copiados.size}`);


  await rm(temporal, { recursive: true, force: true });

  if (!aplicar && migradas > 0) {
    console.log('');
    console.log('  Para hacerlo de verdad:');
    console.log('    node scripts/migrar-encuadres.mjs --aplicar');
  }
}

/** La imagen de una URL, tal cual, sin tocar. */
async function descargar(url) {
  const r = await fetch(url);

  if (!r.ok) throw new Error(`descarga ${r.status}`);

  return { bytes: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get('content-type') ?? 'image/jpeg' };
}

/** Sube bytes a una ruta de Storage, sustituyendo lo que hubiera. */
async function subir(ruta, bytes, tipo) {
  const base =
    `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}` +
    `.firebasestorage.app/o/${encodeURIComponent(ruta)}`;

  const { cabecera } = await cliente();

  // Se usa una escritura con precondición de "no existe", salvo que
  // venga el parámetro de reemplazar. Así, si otra persona sube a la
  // vez, el script no le pisa la imagen sin querer.
  const r = await fetch(base, {
    method: 'PUT',
    headers: { ...cabecera, 'Content-Type': tipo },
    body: bytes,
  });

  if (!r.ok) {
    const texto = await r.text();

    throw new Error(`subida ${r.status}: ${texto.slice(0, 120)}`);
  }

  return true;
}

/**
 * El recorte de verdad, con `sharp`.
 *
 * El rectángulo NO se calcula aquí: lo da `rectanguloDeRecorte`, que
 * es la misma función que usa el navegador. Es lo único que garantiza
 * que lo que se sube es lo que el admin vio en el panel.
 */
async function recortar(bytes, ajustes, ratio, maximo, tipoOriginal) {
  const meta = await sharp(bytes).metadata();

  const caja = cajaDe(ratio, maximo, meta.width ?? 0, meta.height ?? 0);

  const r = rectanguloDeRecorte(meta.width ?? 0, meta.height ?? 0, caja.ancho, caja.alto, {
    aspectRatio: ratio,
    zoom: 1,
    x: ajustes.x,
    y: ajustes.y,
  });

  if (r.width < 1 || r.height < 1) {
    throw new Error('el recorte ha salido vacío');
  }

  // Un PNG con canal alfa se queda en PNG: guardado como WebP perdería
  // la transparencia y saldría con fondo negro. El resto, a WebP, que
  // pesa menos y es lo que ya se sirve en la web.
  const tipo = tipoOriginal?.includes('png') ? 'png' : 'webp';

  const tuberia = sharp(bytes).extract({
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  });

  const salida =
    tipo === 'png'
      ? await tuberia.png({ compressionLevel: 9 }).toBuffer()
      : await tuberia.webp({ quality: 90 }).toBuffer();

  return { bytes: salida, tipo: tipo === 'png' ? 'image/png' : 'image/webp' };
}

/** Borra el campo de encuadre del documento. */
async function borrarFoco(coleccion, id, campo) {
  const { cabecera } = await cliente();

  const base =
    `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}` +
    `/databases/(default)/documents/${coleccion}/${id}`;

  // Un PATCH con updateMask y SIN el campo en el cuerpo lo borra: así
  // es como se quita algo en Firestore sin traerse el documento
  // entero para reescribirlo.
  const p = new URLSearchParams();
  p.append('updateMask.fieldPaths', campo);

const r = await fetch(`${base}?${p.toString()}`, {
    method: 'PATCH',
    headers: { ...cabecera, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {} }),
  });

  if (!r.ok) {
    const texto = await r.text();

    throw new Error(`borrar encuadre ${r.status}: ${texto.slice(0, 120)}`);
  }
}

await main();