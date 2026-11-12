// Repara los `seasonIds`/`seasonKeys` de los personajes de serie que
// quedaron apuntando a temporadas que ya no existen después de sacar
// las películas embebidas.
//
// La fuente de verdad es `scripts/datos/<prefijo>-personajes.mjs`, que
// guarda la temporada original de cada personaje (1, 2, 3...). Se aplica
// el mismo mapa que la migración: las temporadas de película se tiran y
// las posteriores bajan tantas posiciones como películas había debajo.
//
//   node scripts/reparar-seasonids-peliculas.mjs            (simulación)
//   node scripts/reparar-seasonids-peliculas.mjs --escribir (aplica)

import { escribir, str } from './firestore-rest.mjs';
import { leerPorCampo } from './firestore-consultas.mjs';

const ESCRIBIR = process.argv.includes('--escribir');

const SERIES = [
  { animeId: 'blue-lock', datos: 'bl', quitadas: [2] },
  { animeId: 'chainsaw-man', datos: 'csm', quitadas: [2] },
  // DanMachi no tiene fichero de personajes en `datos`: sus fichas
  // siguen con la numeración original, así que se mapean todas.
  { animeId: 'danmachi', datos: null, quitadas: [2], forzar: true },
  { animeId: 'date-a-live', datos: 'dal', quitadas: [5, 7, 8] },
  { animeId: 'goblin-slayer', datos: 'gs', quitadas: [2] },
  { animeId: 'hunter-x-hunter', datos: 'hxh', quitadas: [2, 3] },
  { animeId: 'k-on', datos: 'kon', quitadas: [5] },
  { animeId: 'kabaneri-of-the-iron-fortress', datos: 'kbn', quitadas: [2] },
  { animeId: 'kimetsu-no-yaiba', datos: 'kny', quitadas: [2, 6] },
  { animeId: 'konosuba', datos: 'kns', quitadas: [5] },
  { animeId: 'las-quintillizas', datos: 'qq', quitadas: [3] },
  { animeId: 'love-chunibyo-and-other-delusions', datos: 'chb', quitadas: [5] },
  { animeId: 'made-in-abyss', datos: 'mia', quitadas: [2] },
  { animeId: 'neon-genesis-evangelion', datos: 'eva', quitadas: [3, 4, 5, 6] },
  { animeId: 'no-game-no-life', datos: 'ngl', quitadas: [2] },
  { animeId: 'overlord', datos: 'ol', quitadas: [3, 4, 8] },
  { animeId: 'psycho-pass', datos: 'pp', quitadas: [3, 7] },
  { animeId: 'puella-magi-madoka-magica', datos: 'mad', quitadas: [2, 3] },
  { animeId: 'saekano-how-to-raise-a-boring-girlfriend', datos: 'snk', quitadas: [3] },
  { animeId: 'seishun-buta-yaro-wa-bunny-girl-senpai-no-yume-wo-minai', datos: 'bg', quitadas: [2, 3, 4, 6] },
  { animeId: 'spy-family', datos: 'sxf', quitadas: [2] },
  { animeId: 'steins-gate', datos: 'sg', quitadas: [2] },
  { animeId: 'sword-art-online', datos: 'sao', quitadas: [4, 8, 9, 11] },
  { animeId: 'teasing-master-takagi-san', datos: 'tk', quitadas: [4] },
  { animeId: 'tensei-shitara-slime-datta-ken', datos: 'slime', quitadas: [4, 7] },
];

const listaDe = (doc, campo) => {
  const values = doc.f[campo]?.arrayValue?.values;
  return Array.isArray(values)
    ? values.map((v) => v.stringValue).filter((v) => typeof v === 'string' && v)
    : [];
};
const idsDe = (doc) => {
  const ids = listaDe(doc, 'seasonIds');
  if (ids.length) return ids;
  const antiguo = str(doc, 'seasonId');
  return antiguo ? [antiguo] : [];
};
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function mapaDe(quitadas) {
  const ordenadas = [...new Set(quitadas)].sort((a, b) => a - b);
  const set = new Set(ordenadas);
  return (n) => {
    if (set.has(n)) return null;
    return n - ordenadas.filter((q) => q < n).length;
  };
}

let totalCambios = 0;
let totalSinFicha = 0;
let totalSinDatos = 0;

for (const serie of SERIES) {
  const porNombre = new Map();
  if (serie.datos) {
    const modulo = await import(`./datos/${serie.datos}-personajes.mjs`);
    const datos = modulo.PERSONAJES ?? [];
    for (const fila of datos) {
      const nombre = Array.isArray(fila) ? fila[0] : fila?.nombre;
      const temporadas = Array.isArray(fila) ? fila[1] : fila?.temporadas;
      if (nombre) porNombre.set(normalizar(nombre), String(temporadas ?? ''));
    }
  }

  const personajes = await leerPorCampo({
    coleccion: 'characters',
    campo: 'animeId',
    valor: serie.animeId,
  });
  const mapa = mapaDe(serie.quitadas);
  const maxFinal = Math.max(
    ...personajes.flatMap((c) =>
      idsDe(c)
        .map((id) => Number(id.match(/-s(\d+)$/)?.[1] ?? 0))
        .filter(Boolean),
    ),
    0,
  );

  let cambios = 0;
  let sinFicha = 0;

  for (const c of personajes) {
    const nombre = str(c, 'name') || c.id;
    const original = porNombre.get(normalizar(nombre));
    let esperados;

    if (original !== undefined) {
      if (!original.trim()) {
        esperados = [];
      } else {
        esperados = [
          ...new Set(
            original
              .split(',')
              .map((x) => Number(x.trim()))
              .filter((n) => Number.isInteger(n) && n > 0)
              .map(mapa)
              .filter((n) => n !== null && n > 0)
              .map((n) => `${serie.animeId}-s${n}`),
          ),
        ].sort((a, b) => Number(a.match(/-s(\d+)$/)[1]) - Number(b.match(/-s(\d+)$/)[1]));
      }
    } else {
      // Sin ficha en los datos: solo se arreglan las referencias que ya
      // no existen. En una serie marcada como `forzar` (DanMachi) se
      // mapea la numeración entera, pero solo mientras quede alguna
      // referencia fuera de rango: así el script se puede repetir sin
      // volver a desplazar lo que ya está bien.
      sinFicha += 1;
      const ids = idsDe(c);
      const fueraDeRango = ids.some((id) => {
        const n = Number(id.match(/-s(\d+)$/)?.[1] ?? 0);
        return n > maxFinal;
      });
      const forzarAhora = serie.forzar && fueraDeRango;
      esperados = [
        ...new Set(
          ids
            .map((id) => {
              const m = id.match(/-s(\d+)$/);
              if (!m) return id;
              const n = Number(m[1]);
              if (!forzarAhora && n <= maxFinal) return id;
              const nuevo = mapa(n);
              return nuevo === null || nuevo <= 0 ? null : `${serie.animeId}-s${nuevo}`;
            })
            .filter(Boolean),
        ),
      ];
    }

    const actuales = idsDe(c);
    const keysActuales = listaDe(c, 'seasonKeys');
    const esperadasKeys = esperados.length ? esperados : ['*'];
    const igual =
      JSON.stringify([...actuales].sort()) === JSON.stringify([...esperados].sort()) &&
      JSON.stringify([...keysActuales].sort()) === JSON.stringify([...esperadasKeys].sort());
    if (igual) continue;

    cambios += 1;
    if (ESCRIBIR) {
      await escribir(
        'characters',
        c.id,
        {
          seasonIds: { arrayValue: { values: esperados.map((id) => ({ stringValue: id })) } },
          seasonKeys: {
            arrayValue: { values: esperadasKeys.map((id) => ({ stringValue: id })) },
          },
        },
        ['seasonIds', 'seasonKeys'],
      );
    }
  }

  totalCambios += cambios;
  totalSinFicha += sinFicha;
  console.log(
    `${serie.animeId.padEnd(60)} personajes=${String(personajes.length).padStart(3)} ` +
      `cambios=${String(cambios).padStart(3)} sinFichaDatos=${sinFicha}`,
  );
}

console.log(
  `\n${totalCambios} personajes ${ESCRIBIR ? 'actualizados' : 'a actualizar'}; ` +
    `${totalSinFicha} sin ficha en los datos.`,
);
if (totalSinFicha) {
  console.log('Los que no tienen ficha se han corregido solo si apuntaban a una temporada inexistente.');
}
if (!ESCRIBIR) console.log('Simulación. Usa --escribir para aplicar.');
