// Prueba de `emparejar-capitulo.mjs`: comprueba que el emparejador
// descarta el capitulo equivocado cuando hay titulos repetidos.
//    node scripts/probar-emparejar-capitulo.mjs
//
// Sin esto, el emparejador solo se ha probado con el caso bueno: una
// serie en la que cada titulo aparece una vez. El fallo que justifica el
// fichero —el mismo titulo en otra parte de la serie— no sale nunca en un
// anime normal, asi que sin una prueba a proposito no se sabe si
// funciona.
//
// Son dos series distintas:
//
//   · Toradora, con sus capitulos sueltos de la temporada 0 en TVDB. Su
//     temporada 2 es la OVA, y el mapeo lo dice `temporadas-tvdb.mjs`.
//
//   · Una serie tipo Ataque a los Titanes, donde TVDB repite la lista de
//     la primera parte en todas las demas. No hay mapeo, porque las
//     temporadas del catalogo y las de TVDB coinciden, y aun asi el
//     emparejador tiene que coger la imagen de cada parte y no la de la
//     primera.

import { capituloDe } from './emparejar-capitulo.mjs';

// Toradora, serie 83277.
const TORADORA = [
  // Los capitulos sueltos que TVDB mete en la temporada 0.
  { seasonNumber: 0, number: 1, name: 'とらドラSOS！食いしん坊万々歳', image: 's0e1.jpg' },
  { seasonNumber: 0, number: 5, name: '弁当の極意', image: 'ova.jpg' },

  // Temporada 1, la serie.
  { seasonNumber: 1, number: 1, name: '虎と竜', image: 't1e1.jpg' },
  { seasonNumber: 1, number: 2, name: '竜児と大河', image: 't1e2.jpg' },
  { seasonNumber: 1, number: 3, name: '君の歌', image: 't1e3.jpg' },
];

// Una serie partida en partes, con la lista repetida en cada una.
const PARTIDAS = [
  { seasonNumber: 1, number: 1, name: '始まりの章', image: 'p1e1.jpg' },
  { seasonNumber: 1, number: 2, name: '続きの章', image: 'p1e2.jpg' },

  // Estas dos temporadas repiten los titulos de la primera, con otras
  // imagenes. Es el caso peligroso.
  { seasonNumber: 2, number: 1, name: '始まりの章', image: 'p2e1.jpg' },
  { seasonNumber: 2, number: 2, name: '続きの章', image: 'p2e2.jpg' },
  { seasonNumber: 3, number: 1, name: '始まりの章', image: 'p3e1.jpg' },
  { seasonNumber: 3, number: 2, name: '続きの章', image: 'p3e2.jpg' },
];

const casos = [
  {
    nombre: 'Toradora T1: titulo unico, en su sitio',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 1, numero: 2, japones: '竜児と大河' },
    esperar: 't1e2.jpg',
  },
  {
    nombre: 'Toradora: la OVA esta en S0 y es la T2 del catalogo',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 2, numero: 1, japones: '弁当の極意' },
    esperar: 'ova.jpg',
  },
  {
    // Toradora tiene cuatro capitulos "S.O.S" de cinco minutos, listados
    // en AniList como una serie aparte, y tambien en el season 0 de TVDB.
    // El catalogo no los tiene como capitulos de T2, asi que no hay nada
    // que emparejar. Lo que se comprueba aqui es lo contrario: que si
    // alguien los pidiera como si fueran un capitulo de la T2, con el
    // season 0 lleno de cosas, no le cuela una imagen por el numero.
    //
    // La T2 del catalogo es la OVA, que en TVDB esta en el season 0 con
    // el numero 5. El corto esta en el season 0 con el numero 1. Como el
    // season 0 es un cajon y no se mira el numero, el emparejador coje
    // el que tiene el titulo pedido, que es el correcto.
    nombre: 'Toradora: el corto de la T0 no se cuela en la T2',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 2, numero: 1, japones: 'とらドラSOS！食いしん坊万々歳' },
    esperar: 's0e1.jpg',
  },
  {
    nombre: 'Toradora: temporada que no existe, titulo generico',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 5, numero: 1, japones: '虎と竜' },
    esperar: null,
  },
  {
    nombre: 'Partidas T1: coge su imagen',
    animeId: 'ataque-a-los-titanes',
    capitulos: PARTIDAS,
    nuestro: { temporada: 1, numero: 1, japones: '始まりの章' },
    esperar: 'p1e1.jpg',
  },
  {
    nombre: 'Partidas T2: NO coge la imagen de T1',
    animeId: 'ataque-a-los-titanes',
    capitulos: PARTIDAS,
    nuestro: { temporada: 2, numero: 1, japones: '始まりの章' },
    esperar: 'p2e1.jpg',
  },
  {
    nombre: 'Partidas T2 capitulo 2: NO coge la de T1',
    animeId: 'ataque-a-los-titanes',
    capitulos: PARTIDAS,
    nuestro: { temporada: 2, numero: 2, japones: '続きの章' },
    esperar: 'p2e2.jpg',
  },
  {
    nombre: 'Partidas T3: coge la suya, no la de T1 ni la de T2',
    animeId: 'ataque-a-los-titanes',
    capitulos: PARTIDAS,
    nuestro: { temporada: 3, numero: 1, japones: '始まりの章' },
    esperar: 'p3e1.jpg',
  },
  {
    nombre: 'Parentesis de ancho completo: mismo titulo',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 1, numero: 1, japones: '虎と竜' },
    esperar: 't1e1.jpg',
  },
  {
    nombre: 'Titulo que no existe en TVDB',
    animeId: 'toradora',
    capitulos: TORADORA,
    nuestro: { temporada: 1, numero: 9, japones: 'タイトルinventado' },
    esperar: null,
  },
  {
    // Grand Blue: el fichero de datos juntaba los dos titulos con un mas
    // y TVDB con una barra. Son los mismos dos titulos.
    nombre: 'Dos titulos juntos: + en vez de barra',
    animeId: 'grand-blue',
    capitulos: [
      {
        seasonNumber: 2,
        number: 7,
        name: 'シャルピー衝撃試験／大人の林間学校',
        image: 'gbd-s2e7.jpg',
      },
    ],
    nuestro: { temporada: 2, numero: 7, japones: 'シャルピー衝撃試験 + 大人の林間学校' },
    esperar: 'gbd-s2e7.jpg',
  },
  {
    // Mushoku: el capitulo 15.5 no es de una temporada, va intercalado, y
    // TVDB lo deja en la temporada 0 con otro numero.
    nombre: 'Capitulo intercalado (15.5) en el cajon de la T0',
    animeId: 'mushoku-tensei-reencarnacion-desde-cero',
    capitulos: [
      { seasonNumber: 0, number: 1, name: 'エリスのゴブリン討伐', image: 'mt-15-5.jpg' },
      { seasonNumber: 1, number: 15, name: '十五の出色', image: 'mt-15.jpg' },
    ],
    nuestro: { temporada: 1, numero: 15.5, japones: 'エリスのゴブリン討伐' },
    esperar: 'mt-15-5.jpg',
  },
];

let fallos = 0;

for (const caso of casos) {
  const r = capituloDe({
    animeId: caso.animeId,
    nuestro: caso.nuestro,
    capitulos: caso.capitulos,
    usadas: new Set(),
  });

  const obtenida = r?.url ?? null;

  const bien = obtenida === caso.esperar;

  if (!bien) fallos++;

  console.log(
    `${bien ? 'OK   ' : 'FALLA'}  ${caso.nombre.padEnd(52)} ` +
      `${obtenida ?? 'nada'}${r?.aviso ? `  (${r.aviso})` : ''}`,
  );
}

// El caso que mas importa, dicho con sus palabras: si la comprobacion de
// posicion no estuviera, el capitulo 1 de T2 recibiria la imagen del
// capitulo 1 de T1, que es una imagen que carga y se ve bien.
const SIN_COMPROBAR = PARTIDAS[0];

const conComprobacion = capituloDe({
  animeId: 'ataque-a-los-titanes',
  nuestro: { temporada: 2, numero: 1, japones: SIN_COMPROBAR.name },
  capitulos: PARTIDAS,
  usadas: new Set(),
});

if (conComprobacion?.url === SIN_COMPROBAR.image) {
  console.log(`\nFALLA  T2 capitulo 1 ha cogido la imagen de T1 (${SIN_COMPROBAR.image})`);

  fallos++;
} else {
  console.log(`\nOK    T2 capitulo 1 coge ${conComprobacion?.url}, no la de T1 (${SIN_COMPROBAR.image})`);
}

console.log(fallos ? `\n${fallos} casos fallan` : '\ntodos los casos pasan');

process.exit(fallos ? 1 : 0);