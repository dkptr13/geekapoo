// Enseña por que se ha rechazado cada capitulo.
//    $env:TVDB_KEY='...'
//    node scripts/ver-rechazados-fecha.mjs <animeId>
//
// El emparejado por fecha tiene tres filtros y cualquiera de los tres
// puede rechazar un capitulo. Sin ver cual ha sido, un "45 puestas, 3 sin
// fecha o sin counterpart" no dice nada: puede que tres capitulos no
// tengan fecha en el catalogo, o que sus imagenes ya esten puestas en otro
// capitulo, o que sean los siete de Ataque que se emitieron el mismo dia.
//
// Y esos tres casos son muy distintos. El primero es un dato que falta.
// El segundo, un dato que esta mal puesto. El tercero es el filtro
// haciendo su trabajo, y no hay que hacer nada.

import { coleccion, escribir, str, num } from './firestore-rest.mjs';
import { comoBuscarTvdb } from './busquedas-anime.mjs';
import { capituloEnTvdb } from './temporadas-tvdb.mjs';

const clave = process.env.TVDB_KEY;

if (!clave) {
  console.error('  falta TVDB_KEY');
  process.exit(1);
}

const animeId = process.argv[2];

if (!animeId) {
  console.error('  uso: node scripts/ver-rechazados-fecha.mjs <animeId>');
  process.exit(1);
}

let token = null;

async function pedir(ruta) {
  if (!token) {
    const r = await fetch('https://api4.thetvdb.com/v4/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ apikey: clave }),
    });

    token = (await r.json())?.data?.token;
  }

  const r = await fetch(`https://api4.thetvdb.com/v4${ruta}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });

  return (await r.json())?.data ?? {};
}

const animes = await coleccion('animes');
const capitulos = await coleccion('episodes');

const anime = animes.find((a) => a.id === animeId);

if (!anime) {
  console.log(`no esta el anime "${animeId}"`);
  process.exit(1);
}

const mios = capitulos.filter((c) => str(c.f, 'animeId') === animeId);

const conImagen = new Set(mios.filter((c) => str(c.f, 'thumbnailUrl')).map((c) => c.id));

// Las imagenes que ya hay, para el filtro 2.
const usadas = new Set(
  capitulos
    .filter((c) => !conImagen.has(c.id))
    .map((c) => str(c.f, 'thumbnailUrl'))
    .filter(Boolean),
);

const termino = comoBuscarTvdb(animeId, str(anime.f, 'title'));

const candidatas = await pedir(
  `/search?query=${encodeURIComponent(termino)}&type=series&limit=8`,
);

let eps = [];

for (const s of candidatas ?? []) {
  const salida = [];

  for (let pagina = 0; pagina < 20; pagina++) {
    const datos = await pedir(`/series/${s.tvdb_id}/episodes/default?page=${pagina}`);

    const lista = datos?.episodes ?? [];

    if (!lista.length) break;

    salida.push(...lista);
  }

  eps = salida;

  break;
}

if (!eps.length) {
  console.log('no hay capitulos en TVDB');
  process.exit(1);
}

console.log(`\n${animeId}: ${mios.length} capitulos, ${conImagen.size} con imagen`);
console.log(`TVDB: ${eps.length} capitulos\n`);

for (const c of mios) {
  if (conImagen.has(c.id)) continue;

  const temporada = Number(String(str(c.f, 'seasonId')).split('-s')[1] ?? 0);
  const numero = num(c.f, 'number') ?? 0;
  const fecha = str(c.f, 'airDate') ?? '';

  const destino = capituloEnTvdb(animeId, temporada, numero);

  let motivo;

  if (!fecha) {
    motivo = 'el capitulo del catalogo no tiene fecha';
  } else {
    const conEsaFecha = eps.filter(
      (e) => e.aired === fecha && Number(e.seasonNumber) === destino.temporada,
    );

    if (conEsaFecha.length > 1) {
      motivo =
        `hay ${conEsaFecha.length} capitulos de TVDB el ${fecha}: ` +
        conEsaFecha.map((e) => `S${e.seasonNumber}E${e.number} "${e.name}"`).join(', ');
    } else if (conEsaFecha.length === 0) {
      const enOtra = eps.filter((e) => e.aired === fecha);

      if (enOtra.length === 0) {
        const eseDia = eps.filter((e) => String(e.aired ?? '').startsWith(fecha.slice(0, 7)));

        motivo =
          `TVDB no tiene nada el ${fecha}` +
          (eseDia.length ? ` (ese mes tiene ${eseDia.length}, del ${eseDia[0].aired} al ${eseDia.at(-1).aired})` : '');
      } else if (enOtra.length > 1) {
        motivo = `${enOtra.length} capitulos el ${fecha} en otras temporadas`;
      } else {
        const e = enotra0(enOtra);
        const url = e.image || e.thumbnail;

        motivo = url
          ? `esta el ${fecha} pero en S${e.seasonNumber}E${e.number}` +
            (usadas.has(url) ? ` y su imagen ya la tiene otro capitulo` : ` (con imagen)`)
          : `esta el ${fecha} pero sin imagen`;
      }
    } else {
      const e = conEsaFecha[0];

      const url = e.image || e.thumbnail;

      if (!url) motivo = `S${e.seasonNumber}E${e.number} existe pero TVDB no tiene imagen`;
      else if (usadas.has(url)) motivo = `S${e.seasonNumber}E${e.number} tiene imagen pero ya la tiene otro capitulo`;
      else motivo = `S${e.seasonNumber}E${e.number} deberia entrar`;
    }
  }

  console.log(`  T${temporada} ${String(numero).padStart(3)}  ${fecha || '(sin fecha)'}  ${motivo}`);
}

function enotra0(lista) {
  return lista[0];
}