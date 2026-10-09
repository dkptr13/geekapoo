// Crea las temporadas que les faltan a los animes subidos por el panel, y
// pone el `seasonId` de sus capitulos.
//
//   node scripts/crear-temporadas-panel.mjs
//
// ── POR QUE ──────────────────────────────────────────────────────
//
// Cyberpunk, Frieren y Jujutsu Kaisen se subiéron por el panel y nunca se
// les creo el documento de temporada, asi que sus capitulos se quedan sin
// `seasonId`.
//
// La web lo tolera: `AnimeWiki` trata lo que no tiene `seasonId` como
// "temporada 1 implicita" y los capitulos se ven igual. Pero no hay
// documento de temporada, y sin el no hay pestana, ni ficha de temporada,
// ni que el capitulo pertenezca a nada.
//
// ── EL ORDEN IMPORTA ──────────────────────────────────────────────
//
// Se crean las temporadas PRIMERO y se asigna despues. Al reves, los
// capitulos apuntarian a un `seasonId` que no existe y la wiki no los
// encontraria.
//
// ── POR QUE NO SE USA `cargar-anime.mjs` ──────────────────────────
//
// Porque reconstruye el id de cada capitulo por slug, y los que estan
// subidos por el panel tienen id autogenerado por Firestore
// (`X0gH7y6uWXrFoCTPr3cQ`). Reload de datos seria crear duplicados.

import { tokenDeAcceso } from './token-firebase.mjs';

const token = await tokenDeAcceso();
const BASE = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID || 'geekapoo-7624d'}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const str = (x) => ({ stringValue: x });
const num = (x) => ({ integerValue: String(x) });
const dbl = (x) => ({ doubleValue: x });
const punto = (x, y) => ({ mapValue: { fields: { x: { doubleValue: x }, y: { doubleValue: y } } } });

/** Temporadas a crear. */
const TEMPORADAS = [
  {
    animeId: 'cyberpunk-edgerunners-2',
    numero: 1,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Trigger',
    rating: 8.3,
    synopsis:
      'En Night City, una ciudad donde los Frykineres sobreviven a base de implantes y de流派, un chico ' +
      'llamado David decide ser mercenario tras la muerte de su madre. Consigue entrar en una pandilla ' +
      'de edgerunners, la Logger, y empieza a subir con ellos. Pero Arasaka, la megacorporacion que ' +
      'domina la ciudad, le ofrece el contrato mas importante de su vida a cambio de traicionar a los ' +
      'suyos. La serie son diez capitulos y no hay segunda temporada confirmada: es una historia ' +
      'cerrada sobre lo poco que dura una vida cuando la ciudad te la cambia cada pocos meses.',
  },
  {
    animeId: 'jujutsu-kaisen',
    numero: 1,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    rating: 8.5,
    synopsis:
      'Yuji Itadori se traga un dedo de Sukuna, el Rey de las Maldiciones, y sobrevive porque el ' +
      'barrio entero se lo merecia. A cambio le dan un ano de vida y la oportunidad de estudiar hechiceria ' +
      'en Tokio, donde loafsfisting que la magia es una cadena dealogy que se transmite de maestro a ' +
      'alumno y que se paga con la muerte. La primera temporada es la del curso escolar: el festival de ' +
      'intercambio con Kioto, el primer combate real de Yuji y la muerte de Nanami, que es el aviso de ' +
      'que esto no es un anime de escuela.',
  },
  {
    animeId: 'jujutsu-kaisen',
    numero: 2,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    rating: 8.6,
    synopsis:
      'La segunda temporada son 23 capitulos en dos cours, y no una sola: cinco del arco de las ' +
      'existencias ocultas, donde un grupo de hechiceros de 2006 debate si la magia tiene futuro, y ' +
      'dieciocho del incidente de Shibuya, la noche en que se，登 un hechicero, un curso entero de ' +
      'alumnos y el propio Satoru Gojo caen. Es el punto de giro de toda la serie: despues de esto el ' +
      'golpe a la muerte cambia de forma y Geto deja de ser quien fue.',
  },
  {
    animeId: 'jujutsu-kaisen',
    numero: 3,
    titulo: 'The Culling Game: Part 1',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    rating: 8.2,
    synopsis:
      'Con Shibuya superada y Kenjaku aun en juego, se pone en marcha el juego de exterminacion: todos ' +
      'los hechiceros de un pais entero encerrados en unaead islandia a jugar a un juego en el que la ' +
      'derrota es la muerte y la accion se puntua. Por primera vez los personajes de la serie se ' +
      'enfrentan entre ellos sin reglas de la escuela de por medio. La segunda parte se anuncia para 2027.',
  },
  {
    animeId: 'frieren-beyond-journeys-end',
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    rating: 9.3,
    synopsis:
      'El heroe Himmel muere de viejo delante de sus companeros, y la maga elfa Frieren descubre que no ' +
      'llegó a conocerlo. Como ella vive mil años y los humanossthroughfew, el duelo le dura una tarde y ' +
      'a el le queda el resto de la eternidad. Asi que decide recorrer el norte del continente hasta la ' +
      'tumba de los almas, siguiendo el mismo camino que hizo hace ochenta años, y esta vez con dos ' +
      'personas al lado: Fern, la aprendiz que le encargo su mejor amigo, y Stark, un guerrero que no ha ' +
      'matado nada en su vida.',
  },
  {
    animeId: 'frieren-beyond-journeys-end',
    numero: 2,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Madhouse',
    rating: 9.3,
    synopsis:
      'La segunda temporada sigue el viaje hacia el norte, ya con el examen de primera clase superado. ' +
      'Es la parte mas conversacional de la serie: cambian los Winds con un solo episode, y por el ' +
      'camino aparecen el勇者 del Sur y las 응급 de un demonio con cuatro brazos. Lo que cambia de verdad ' +
      'es que Fern deja de ser una niña y empieza a tener sus propias decisiones.',
  },
];

// ── 1. Las temporadas ───────────────────────────────────────────────

console.log('temporadas:');

for (const t of TEMPORADAS) {
  const id = `${t.animeId}-s${t.numero}`;

  const campos = {
    animeId: str(t.animeId),
    number: num(t.numero),
    title: str(t.titulo),
    synopsis: str(t.synopsis),
    posterUrl: str(''),
    bannerUrl: str(''),
    posterFocus: punto(0.5, 0.5),
    bannerFocus: punto(0.5, 0.5),
    year: num(t.anio),
    status: str(t.estado),
    studio: str(t.estudio),
    rating: dbl(t.rating),
    createdAt: { timestampValue: new Date().toISOString() },
  };

  const existe = await fetch(`${BASE}/seasons/${id}`, { headers });
  const destino = existe.ok
    ? `${BASE}/seasons/${id}?${Object.keys(campos).map((f) => `updateMask.fieldPaths=${f}`).join('&')}`
    : `${BASE}/seasons/${id}`;

  const r = await fetch(destino, { method: 'PATCH', headers, body: JSON.stringify({ fields: campos }) });

  console.log(`  ${r.ok ? 'ok' : `ERROR ${r.status}`}  ${id}  (${existe.ok ? 'actualizada' : 'creada'})`);
}

// ── 2. El seasonId de los capitulos ──────────────────────────────────
//
// Solo se asignan los que YA existen. Los que falten no se inventan:
// Van por numero de capitulo, que es lo que los distingue.

console.log('\ncapitulos:');

// Firestore devuelve 300 documentos por pagina aunque se pida pageSize=1000,
// y `episodes` tiene mas de 400. Sin este bucle, la tercera parte de los
// capitulos no se ve y el script informa de "todos asignados" sin haberlos
// mirado. Es el tercer script al que hay que añadirle esto.
const capitulos = [];
let pagina = null;

do {
  const url = `${BASE}/episodes?pageSize=1000${pagina ? `&pageToken=${pagina}` : ''}`;
  const r = await fetch(url, { headers });
  const d = await r.json();

  capitulos.push(
    ...(d.documents ?? []).map((x) => ({ id: x.name.split('/').pop(), f: x.fields })),
  );

  pagina = d.nextPageToken ?? null;
} while (pagina);

console.log(`(${capitulos.length} capitulos en total)`);

/** Hasta que numero de capitulo cubre cada temporada. */
const RANGOS = {
  'jujutsu-kaisen': [24, 23, 12],
  'frieren-beyond-journeys-end': [28, 10],
  'cyberpunk-edgerunners-2': [10],
};

for (const [animeId, cortes] of Object.entries(RANGOS)) {
  const suyos = capitulos.filter((c) => c.f.animeId?.stringValue === animeId);
  let asignados = 0;

  for (const c of suyos) {
    if (c.f.seasonId?.stringValue) continue;

    const n = Number(c.f.number?.doubleValue ?? c.f.number?.integerValue);
    let temporada = 1;
    let acumulado = 0;

    for (const corte of cortes) {
      acumulado += corte;
      if (n <= acumulado) {
        temporada = cortes.indexOf(corte) + 1;
        break;
      }
      temporada = cortes.indexOf(corte) + 2;
    }

    const sid = `${animeId}-s${temporada}`;

    const p = await fetch(`${BASE}/episodes/${c.id}?updateMask.fieldPaths=seasonId`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: { seasonId: str(sid) } }),
    });

    if (p.ok) asignados++;
    else console.log(`  ERROR ${p.status} en ${c.id}`);
  }

  console.log(`  ${animeId}: ${asignados} de ${suyos.length} capitulos con temporada`);
}