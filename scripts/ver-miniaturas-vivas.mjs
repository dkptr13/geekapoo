// Comprueba que las miniaturas de capitulo siguen respondiendo.
//    node scripts/ver-miniaturas-vivas.mjs --full
//
// Un documento puede seguir teniendo `thumbnailUrl` y que la imagen ya no
// este: el enlace apunta a un bucket, a un servidor de Crunchyroll o a
// lo que sea, y eso caduca. En la interfaz eso se ve como una imagen
// rota, que es distinto de no tener imagen.
//
// Este script saca todas las que hay, pide cada una y dice cuales ya no
// responden, agrupadas por anime para que se vea si el problema es de
// una fuente entera o de documentos sueltos.

import { coleccion, str } from './firestore-rest.mjs';

if (!process.argv.includes('--full')) {
  console.error('  uso: node scripts/ver-miniaturas-vivas.mjs --full');
  console.error('  Es una auditoría global: requiere --full de forma explícita.');
  process.exit(1);
}

const CABECERAS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
};

const capitulos = await coleccion('episodes');

const conImagen = capitulos.filter((e) => str(e.f, 'thumbnailUrl').length > 0);

console.log(`\n${conImagen.length} capitulos con miniatura. Comprobando...\n`);

const rotas = [];
const lentas = [];

for (const e of conImagen) {
  const url = str(e.f, 'thumbnailUrl');

  const t0 = Date.now();

  try {
    const r = await fetch(url, { headers: CABECERAS, redirect: 'follow' });

    const ms = Date.now() - t0;

    if (!r.ok) {
      rotas.push({ id: e.id, anime: str(e.f, 'animeId'), estado: r.status, url });
    } else {
      if (ms > 3000) lentas.push({ id: e.id, anime: str(e.f, 'animeId'), ms, url });
    }
  } catch (err) {
    rotas.push({ id: e.id, anime: str(e.f, 'animeId'), estado: err.message, url });
  }
}

console.log(`responden: ${conImagen.length - rotas.length - lentas.length}`);
console.log(`rotas:     ${rotas.length}`);
console.log(`lentas:    ${lentas.length} (mas de 3 segundos)\n`);

if (rotas.length) {
  console.log('ROTAS:');

  for (const r of rotas) {
    console.log(`  ${String(r.estado).padEnd(22)} ${r.anime}`);
    console.log(`    ${r.id}`);
    console.log(`    ${r.url.slice(0, 130)}`);
  }
}

if (lentas.length) {
  console.log('\nLENTAS:');

  for (const r of lentas) console.log(`  ${String(r.ms).padStart(6)} ms  ${r.anime}  ${r.id}`);
}

// ── Las URLs deStorage propio ─────────────────────────────────────
//
// Si las del bucket propio son las unicas que fallan, el problema es de
// permisos o de que el bucket cambio, y eso se arregla de otra manera.

const propias = conImagen.filter((e) => str(e.f, 'thumbnailUrl').includes('storage.googleapis'));

console.log(`\nde las cuales ${propias.length} son del almacenamiento propio`);