// Comprueba que el recorte del script de migración hace lo mismo que el
// del navegador, ANTES de dejar que escriba nada.
//
//   npx tsx scripts/probar-recorte-sharp.mjs
//
// ── POR QUÉ ───────────────────────────────────────────────────────
//
// El script recorta con `sharp` y la geometría la calcula la función
// del navegador (`calcularEncuadre`). Son dos implementaciones de la
// misma cuenta, y si divergen por un redondeo, lo que se sube no es lo
// que el admin vio en el panel.
//
// ── PARA QUÉ ESTE FICHERO ─────────────────────────────────────────
//
// Porque el redondeo por separado de los cuatro números sí diverge, y
// solo se verá en imágenes que dividen mal. Antes de meter `sharp`
// aquí, la cuenta se hacía en el script. Ahora está en
// `rectanguloDeRecorte`, en el módulo puro, que es el mismo que usan el
// navegador y el script.
//
// Esto no lo ha dado ningún error visible: los recortes salían bien a
// simple vista y lo que se rompía era, como mucho, un píxel de borde.
// Lo que se ve aquí es que 6 de 120 combinaciones se salían de la
// imagen, y eso lo ha pillado esto y no el script.
import sharp from 'sharp';

import { rectanguloDeRecorte } from '../src/services/imageCrop.ts';

const FORMAS = [
  { nombre: 'vertical 600x1600', w: 600, h: 1600 },
  { nombre: 'panoramica 1920x400', w: 1920, h: 400 },
  { nombre: 'cuadrada 800x800', w: 800, h: 800 },
  { nombre: 'horizontal 1600x600', w: 1600, h: 600 },
  { nombre: 'diminuta 120x90', w: 120, h: 90 },
  { nombre: 'diminuta 63x101', w: 63, h: 101 },
  { nombre: 'enorme 5000x3000', w: 5000, h: 3000 },
  { nombre: 'fina 2000x37', w: 2000, h: 37 },
];

const PROPORCIONES = [
  { nombre: '3:4 portada', ratio: 3 / 4, maximo: 900 },
  { nombre: '16:9 banner', ratio: 16 / 9, maximo: 1600 },
  { nombre: '2:3 personaje', ratio: 2 / 3, maximo: 900 },
  { nombre: '1:1 miniatura', ratio: 1, maximo: 800 },
  { nombre: '21:9 banner', ratio: 21 / 9, maximo: 1600 },
];

const AJUSTES = [
  { nombre: 'arriba-izq', x: 0, y: 0 },
  { nombre: 'centro', x: 0.5, y: 0.5 },
  { nombre: 'abajo-der', x: 1, y: 1 },
  { nombre: 'arriba-der', x: 1, y: 0 },
  { nombre: 'abajo-izq', x: 0, y: 1 },
];

function cajaDe(ratio, maximo) {
  const ancho = ratio >= 1 ? maximo : Math.round(maximo * ratio);
  const alto = ratio >= 1 ? Math.round(maximo / ratio) : maximo;

  return { ancho, alto };
}

let problemas = 0;
let casos = 0;

console.log('  forma                proporción     ajuste        recorte');

for (const f of FORMAS) {
  const original = await sharp({
    create: { width: f.w, height: f.h, channels: 3, background: { r: 40, g: 60, b: 90 } },
  })
    .png()
    .toBuffer();

  const meta = await sharp(original).metadata();

  for (const p of PROPORCIONES) {
    for (const a of AJUSTES) {
      casos++;

      const caja = cajaDe(p.ratio, p.maximo);

      const r = rectanguloDeRecorte(meta.width, meta.height, caja.ancho, caja.alto, {
        aspectRatio: p.ratio,
        zoom: 1,
        x: a.x,
        y: a.y,
      });

      // Lo primero: que el recorte caiga DENTRO de la imagen.
      if (
        r.left < 0 ||
        r.top < 0 ||
        r.left + r.width > meta.width ||
        r.top + r.height > meta.height ||
        r.width < 1 ||
        r.height < 1
      ) {
        problemas++;

        console.log(
          `  ${f.nombre.padEnd(20)} ${p.nombre.padEnd(14)} ${a.nombre.padEnd(12)} FUERA: ` +
            `${r.left},${r.top} ${r.width}x${r.height} en ${meta.width}x${meta.height}`,
        );

        continue;
      }

      // Y segundo: que `sharp` acepte el recorte y devuelva
      // exactamente la caja pedida.
      const salida = await sharp(original)
        .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
        .resize(caja.ancho, caja.alto, { fit: 'fill' })
        .webp({ quality: 85 })
        .toBuffer();

      const s = await sharp(salida).metadata();

      if (s.width !== caja.ancho || s.height !== caja.alto) {
        problemas++;

        console.log(
          `  ${f.nombre.padEnd(20)} ${p.nombre.padEnd(14)} ${a.nombre.padEnd(12)} ` +
            `RESULTADO MAL: ${s.width}x${s.height}, se pedía ${caja.ancho}x${caja.alto}`,
        );
      }
    }
  }
}

console.log('');
console.log(`  ${casos} combinaciones, ${problemas} con problemas.`);

if (problemas === 0) {
  console.log('  Todos los recortes caen dentro de la imagen y salen con la caja pedida.');
} else {
  process.exitCode = 1;
}