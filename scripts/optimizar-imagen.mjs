// Convierte una imagen de public/img a webp y la deja a un ancho dado.
//    node scripts/optimizar-imagen.mjs <origen> <destino> [ancho] [calidad]
//
// ── PARA QUE ESTE SCRIPT ───────────────────────────────────────
//
// Las imagenes de `public/img` se suben tal cual vienen del generador:
// la de Chainsaw Man pesa 2,2 MB en PNG, y es una ilustracion
// decorativa que se ve en una sola pagina. Eso son dos megas para pintar
// una chica.
//
// En el repo ya hay cuatro imagenes en webp que pesan entre 100 y 300
// KB. Esta es la misma idea aplicada a una que se habia colado sin
// convertir.
//
// ── POR QUE UN SCRIPT Y NO UN ARCHIVO ───────────────────────────
//
// Porque el ancho hay que decidirlo aqui. La ilustracion va en una
// columna de 380 a 500 px segun el monitor, y con `srcset` no hace
// falta traer los 1792 px originales para pintar 500.
//
// El alto sale de la propia imagen: si solo se pasa el ancho, sharp
// respeta la proporcion. Forzar los dos a mano es como se deforman
// estas imagenes: la proportion original es 3:4, y ponerla en un
// cuadrado la deja estirada.
//
// ── QUE HACE CON LA TRANSPARENCIA ──────────────────────────────
//
// La conserva. Estas imagenes vienen de Photoroom con el fondo quitado,
// y el webp con alfa pesa menos que el PNG con alfa para el mismo
// dibujo, porque el PNG no comprime nada en ese caso.
//
// ── POR QUE webp Y NO AVIF ─────────────────────────────────────
//
// Porque el resto del repo ya usa webp y no hay ningun motivo para que
// esta imagen sea la unica en otro formato. Un navegador sin webp es
// un problema del navegador.

import { stat } from 'node:fs/promises';

import sharp from 'sharp';

const [origen, destino, anchoTxt, calidadTxt] = process.argv.slice(2);

if (!origen || !destino) {
  console.error('  uso: node scripts/optimizar-imagen.mjs <origen> <destino> [ancho] [calidad]');

  process.exit(1);
}

const ancho = Number(anchoTxt ?? 600);
const calidad = Number(calidadTxt ?? 82);

const antes = await stat(origen);
const meta = await sharp(origen).metadata();

console.log(`  origen:  ${origen}`);
console.log(`           ${meta.width}x${meta.height}  ${(antes.size / 1024).toFixed(0)} KB  ${meta.format}  alfa: ${meta.hasAlpha}`);

await sharp(origen)
  .resize({ width: ancho, withoutEnlargement: true })
  .webp({ quality: calidad, alphaQuality: 100 })
  .toFile(destino);

const despues = await stat(destino);
const nuevo = await sharp(destino).metadata();

console.log(`  destino: ${destino}`);
console.log(`           ${nuevo.width}x${nuevo.height}  ${(despues.size / 1024).toFixed(0)} KB  webp`);

const ratio = ((despues.size / antes.size) * 100).toFixed(0);

console.log(`  ${ratio}% del peso original  (${((antes.size - despues.size) / 1024).toFixed(0)} KB menos)`);