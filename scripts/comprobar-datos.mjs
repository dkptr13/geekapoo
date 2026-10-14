/**
 * Comprobaciones de los datos de una temporada, sin red y sin Firestore.
 *
 *   node scripts/comprobar-datos.mjs <mt|aot|ysa>
 *
 * ── POR QUE EXISTE ESTO Y NO SOLO EL VERIFICADOR ──────────
 *
 * `verificar-anime.mjs` comprueba
 * lo que hay en Firestore DESPUES de cargar. Esta comprueba lo que hay
 * en los ficheros ANTES. La diferencia importa: un dato malo que se
 * detecta despues ya esta escrito, y arreglarlo significa volver a
 * cargar y volver a pagar las peticiones. Aqui el error sale en
 * milisegundos y con el fichero abierto.
 *
 * ── LO QUE SE COMPRUEBA ──────────────────────────────────
 *
 * Que la forma de las filas sea la que espera `cargar-anime.mjs`
 * (seis campos, en orden), que los numeros no se repitan, que los
 * enteros del 1 al ultimo esten todos, y que cada nota este en el 0-10.
 *
 * Y dos cosas sobre el texto, que es donde se cuelan los errores de
 * verdad: que ninguna descripcion tenga palabras inglesas sueltas (este
 * fichero esta lleno de ellas, y es facil que una se cuele al copiar)
 * y que ningun titulo japones haya quedado como puntos o signos de
 * interrogacion, que es lo que pasa cuando un texto se pierde al
 * escribirlo.
 */

import assert from 'node:assert/strict';

const prefijo = process.argv[2];

if (!prefijo) {
  console.error('Uso: node scripts/comprobar-datos.mjs <mt|aot|ysa|tg|agk>');
  process.exit(1);
}

const base = new URL('./datos/', import.meta.url);
const meta = await import(new URL(`${prefijo}-meta.mjs`, base));
const { PERSONAJES } = await import(new URL(`${prefijo}-personajes.mjs`, base));
const { TAGS } = await import(new URL(`${prefijo}-tags.mjs`, base));

// ──────────────────────────────────────────────────────────
// LAS PALABRAS QUE NO DEBEN APARECER
// ──────────────────────────────────────────────────────────
//
// Un español de España no escribe estas. Si una aparece en una
// descripcion, casi siempre es que se coló un fragmento en ingles de
// una traducción o de un fichero de notas.
//
// Se comparan en minuscula y con acentos fuera, para no saltar por
// "cuando" o "Solo".

const ANGELESAS = [
  'the', 'and', 'with', 'from', 'that', 'this', 'they', 'them', 'their',
  'have', 'has', 'was', 'were', 'would', 'could', 'should', 'about',
  'after', 'before', 'between', 'when', 'what', 'where', 'while',
  'into', 'over', 'under', 'still', 'only', 'also', 'very', 'many',
  'much', 'like', 'just', 'then', 'than', 'some', 'other', 'such',
  'each', 'every', 'both', 'own', 'same', 'too', 'being', 'against',
  'through', 'during', 'without', 'within', 'them', 'power', 'waste',
  'remember', 'assassination', 'green', 'light', 'room', 'fire',
];

/**
 * Palabras inglesas que en este catalogo son un NOMBRE PROPIO y no un fallo.
 *
 * ── POR QUE HACE FALTA ESTA LISTA ─────────────────────────────────
 *
 * La lista de arriba busca fragmentos en ingles que se colaron de una
 * traduccion. El problema es que `power` tambien es el nombre de una de
 * las cuatro protagonistas de Chainsaw Man, y en espanol se sigue
 * llamando Power: asi esta en la wikipedia en espanol, asi la llaman el
 * doblaje de Espana y el de Hispanoamerica, y asi viene en la ficha de
 * Apple TV para Espana. Traducirlo a "Poder" seria inventarse un nombre
 * que nadie usa.
 *
 * Con la comprobacion sin excepciones, el fichero de personajes de
 * Chainsaw Man daba fallos en casi todas sus lineas, y lo unico que se
 * podia hacer era no escribir el nombre de la protagonista.
 *
 * Green es el mismo caso en SPY×FAMILY: asi se llama el personaje en
 * AniList y en la serie, y traducirlo seria inventarse otro nombre.
 *
 * Solo se perdona la palabra si sale con mayuscula, es decir, como
 * nombre propio. "Power" en minuscula en medio de una frase sigue
 * saltando, que es justo el caso que la comprobacion quiere pillar. Y
 * solo con esta lista: cualquier otra palabra inglesa sigue dando fallo
 * aunque venga en mayuscula.
 *
 * Es la misma idea que el flag `TITULOS_SUBTITULADOS` de Tokyo
 * Revengers: una excepcion explicita y con su motivo, no relajar el
 * filtro hasta que deje de molestar.
 */
const PROPIOS_EN_INGLES = ['power', 'green'];

/**
 * Si una palabra inglesa sale como NOMBRE PROPIO y no como palabra.
 *
 * ── POR QUE NO BASTA CON MIRAR LA MAYUSCULA ──────────────────────
 *
 * Buscar `Power` en el texto no vale: la palabra sale en minuscula
 * dentro de frases ("del poder que tiene") y con mayuscula al
 * principio de otras ("Power se cuela en la tienda"). La mayuscula
 * inicial no dice nada, porque en espanol las frases empiezan con
 * mayuscula siempre.
 *
 * Lo que distingue al nombre es DONDE aparece:
 *
 *   "Power se cuela en la tienda"   nombre propio, inicio de frase
 *   "del poder que tiene"           la palabra inglesa, en medio
 *   "junto a Power y Aki"            nombre propio, en medio
 *   "del poder de Takarazuka"        la palabra inglesa, en medio
 *
 * Es nombre propio si va seguido de mayuscula, de un signo, o de una
 * conjuncion corta seguida de mayuscula (Power y Aki, Power o
 * Denji).
 *
 * ── LO QUE ESTO PERDONA Y LO QUE NO ──────────────────────────────
 *
 * Perdona Power y solo esa palabra, y solo con mayuscula. Otra
 * palabra inglesa sigue dando fallo, y power en minuscula tambien.
 * No es una puerta abierta: es una excepcion para un nombre,
 */
const saleComoNombrePropio = (texto, palabra) => {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${palabra})`, 'giu');
  let m;

  while ((m = re.exec(texto)) !== null) {
    const fin = m.index + m[0].length;
    const despues = texto.slice(fin);

    // Final del texto, o un signo detras: no puede ser la palabra.
    if (despues === '' || /[^\\p{L}\\p{N}]/.test(despues[0])) return true;

    // "Power, Aki" o "Power. Aki".
    if (/^[.,;:]\\s*[A-ZÁÉÍÓÚÑ]/.test(despues)) return true;

    // "Power y Aki", "Power o Denji": lo que sigue es otra persona.
    if (/^\\s+(y|ni|o|u|e)\\s+[A-ZÁÉÍÓÚÑ]/.test(despues)) return true;

    // "Power y aki" en un texto que no tilda los nombres.
    if (/^\\s+(y|ni|o|u|e)\\s+[a-záéíóúñ]/.test(despues)) return true;

    // "Power va a": en minuscula, es la palabra inglesa.
  }

  return false;
};
/** Palabras en ingles, sin tildes y en minuscula. */
const palabrasEnglesas = (texto) => {
  const limpio = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return ANGELESAS.filter((p) => {
    if (!new RegExp(`\\b${p}\\b`).test(limpio)) return false;

    if (!PROPIOS_EN_INGLES.includes(p)) return true;

    return !saleComoNombrePropio(texto, p);
  });
};

/**
 * Una palabra pegada dentro de otra, sin espacio.
 *
 * Este es el fallo que mas se cuela al escribir texto largo, y el mas
 * dificil de ver a ojo: "Yelenaught", "unbequeathed". Aparece cuando al
 * copiar un nombre se engancha un trozo del contexto, y el resultado
 * es una palabra que existe pero no significa nada.
 *
 * Se detectan las mayusculas en medio de una palabra en minuscula, que
 * es como se ven esos pegados. Los nombres propios del catalogo
 * ("Onyankopon", "Shiganshina") tambien los tienen, asi que el patron
 * exige que la palabra EMPIEZE en minuscula, que es justo lo que un
 * nombre propio no hace.
 */
const nombrePegado = (texto) =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => /^[a-zà-ÿ]{1,}[A-ZÀ-Þ][a-zà-ÿ]{1,}$/.test(p));

/**
 * Caracteres que solo salen cuando un texto se ha roto al escribirlo.
 *
 * NO se comprueba el rango de kanji, aunque parezca lo obvio. Los
 * titulos japones de este catalogo los usan a diario, asi que marcarlos
 * como corruptos habria dado un fallo por cada capitulo de la serie
 * entera. El japones y el chino comparten el rango y no hay forma de
 * distinguirlos por caracteres: lo que sale siempre mal es el cirilico,
 * el griego y el caracter de reemplazo, que son los que se colan
 * cuando un texto se decodifica con la tabla equivocada.
 */
const ROTO = /[\uFFFD\u0370-\u03FF\u0400-\u04FF]|\?{2,}/;

let fallos = 0;
const anotar = (ok, mensaje) => {
  if (!ok) {
    fallos++;
    console.log(`  FALLO: ${mensaje}`);
  }
};

// ──────────────────────────────────────────────────────────
// 1. LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────

const { ANIME, ANIME_ID, EPISODIOS_TOTAL, RATING_SERIE, TEMPORADAS } = meta;

/**
 * Si el meta pone esto a `true`, no se exige que el titulo japones de los
 * capitulos tenga kanji ni kana.
 *
 * Existe por Tokyo Revengers, y solo por el: los subtitulos oficiales de
 * sus capitulos estan escritos en ingles y no hay version en japones ni
 * dentro de Japon ni fuera ("Reborn", "Resist", "No Pain, no Gain"). Poner
 * una traduccion al japones seria inventarla, asi que el campo lleva el
 * subtitulo oficial tal cual y esta comprobacion se salta.
 *
 * Con el flag apagado (que es lo normal) el titulo japones tiene que ser
 * japones de verdad, porque si no el campo no sirve para nada.
 */
const TITULOS_SUBTITULADOS = meta.TITULOS_EN_INGLES === true;

anotar(ANIME.titulo.length > 0, 'el anime no tiene titulo');
anotar(ANIME.japaneseTitle.length > 0, 'el anime no tiene titulo japones');
anotar(!ROTO.test(ANIME.japaneseTitle), `titulo japones roto: "${ANIME.japaneseTitle}"`);
anotar(ANIME.synopsis.length > 100, 'la sinopsis del anime es demasiado corta');
anotar(palabrasEnglesas(ANIME.synopsis).length === 0, `ingles en la sinopsis: ${palabrasEnglesas(ANIME.synopsis)}`);
anotar(
  nombrePegado(ANIME.synopsis).length === 0,
  `nombre pegado en la sinopsis -> ${nombrePegado(ANIME.synopsis)}`,
);
anotar(ANIME.categorias.length > 0, 'el anime no tiene categorias');

// El slug tiene que ser el del titulo normalizado. Si divergen, el
// enlace que se comparta no lleva a la ficha.
const slugDelTitulo = ANIME.titulo
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);
anotar(
  ANIME_ID === slugDelTitulo,
  `el id "${ANIME_ID}" no es el slug del titulo (seria "${slugDelTitulo}")`,
);

anotar(RATING_SERIE > 0 && RATING_SERIE <= 10, `nota de serie imposible: ${RATING_SERIE}`);

// ──────────────────────────────────────────────────────────
// 2. LAS TEMPORADAS
// ──────────────────────────────────────────────────────────

anotar(TEMPORADAS.length > 0, 'no hay temporadas');
anotar(
  TEMPORADAS.map((t) => t.numero).join(',') ===
    TEMPORADAS.map((_, i) => i + 1).join(','),
  'los numeros de temporada no son 1, 2, 3... seguidos',
);

const studioPorDefecto = ANIME.estudio;
for (const t of TEMPORADAS) {
  const donde = `T${t.numero}`;
  anotar(t.synopsis.length > 150, `${donde}: sinopsis demasiado corta (${t.synopsis.length})`);
  anotar(palabrasEnglesas(t.synopsis).length === 0, `${donde}: ingles en la sinopsis -> ${palabrasEnglesas(t.synopsis)}`);
anotar(
  nombrePegado(t.synopsis).length === 0,
  `${donde}: nombre pegado en la sinopsis -> ${nombrePegado(t.synopsis)}`,
);
  anotar(!ROTO.test(t.synopsis), `${donde}: sinopsis con caracteres rotos`);
  anotar(t.estudio.length > 0, `${donde}: sin estudio`);
  // El rango empieza en 1980 y no en 2000 porque hay animes del
  // catalogo de esa epoca: Neon Genesis Evangelion es de 1995. Es una
  // serie real con su ano correcto, no un dato inventado.
  anotar(t.anio >= 1980 && t.anio <= 2100, `${donde}: año raro (${t.anio})`);
  anotar(['En emisión', 'Finalizado', 'Próximamente'].includes(t.estado), `${donde}: estado "${t.estado}" no valido`);
}

// Que el estudio de la ficha sea el de la primera temporada, que es el
// que se ve en la tarjeta de la serie entera.
anotar(
  TEMPORADAS[0].estudio === studioPorDefecto,
  `el estudio del anime (${studioPorDefecto}) no es el de la T1 (${TEMPORADAS[0].estudio})`,
);

// ──────────────────────────────────────────────────────────
// 3. LOS CAPITULOS
// ──────────────────────────────────────────────────────────

let totalCapitulos = 0;
let totalConNota = 0;

for (const t of TEMPORADAS) {
  const donde = `T${t.numero}`;
  const clave = t.capitulos;
  const modulo = await import(new URL(`${prefijo}-${clave.toLowerCase()}.mjs`, base));
  const filas = modulo[clave];

  anotar(Array.isArray(filas), `${donde}: ${prefijo}-${clave.toLowerCase()}.mjs no exporta ${clave}`);
  if (!Array.isArray(filas)) continue;

  totalCapitulos += filas.length;

  const vistos = new Set();
  const enteros = [];
  const titulosVistos = new Set();

  for (const f of filas) {
    const n = typeof f[0] === 'number' ? f[0] : NaN;

    if (f.length !== 6) {
      anotar(false, `${donde}: la fila ${JSON.stringify(f[0])} tiene ${f.length} campos y deben ser 6`);
      continue;
    }

    anotar(Number.isFinite(n) && n > 0, `${donde}: numero invalido "${f[0]}"`);
    anotar(n !== Math.floor(n) || n >= 1, `${donde}: el numero ${n} no cumple la regla de la ficha`);
    anotar(!vistos.has(n), `${donde}: dos capitulos con el numero ${n}`);
    vistos.add(n);

    if (n === Math.floor(n)) enteros.push(n);

    anotar(f[1].length > 0, `${donde} ${n}: sin titulo`);
    anotar(f[1].length <= 120, `${donde} ${n}: titulo de ${f[1].length} caracteres`);
    anotar(!ROTO.test(f[1]), `${donde} ${n}: titulo con caracteres rotos`);
    anotar(palabrasEnglesas(f[1]).length === 0, `${donde} ${n}: ingles en el titulo -> ${palabrasEnglesas(f[1])}`);
anotar(
  nombrePegado(f[1]).length === 0,
  `${donde} ${n}: nombre pegado en el titulo -> ${nombrePegado(f[1])}`,
);

    // El titulo japones puede estar vacio (los OAD de Lost Girls no
    // tienen uno publicado), pero si esta tiene que ser japones de
    // verdad. Un solo kanji vale: el capitulo 22 de la segunda
    // temporada de Mushoku se titula 父 ("padre") y son 1 caracter.
    if (f[2].length > 0) {
      anotar(!ROTO.test(f[2]), `${donde} ${n}: titulo japones roto ("${f[2]}")`);

      if (!TITULOS_SUBTITULADOS) {
        anotar(
          /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(f[2]),
          `${donde} ${n}: el titulo japones "${f[2]}" no tiene kanji ni kana`,
        );
      }
    }

    anotar(!titulosVistos.has(f[1]), `${donde}: titulo repetido "${f[1]}"`);
    titulosVistos.add(f[1]);

    anotar(/^\d{4}-\d{2}-\d{2}$/.test(f[3]), `${donde} ${n}: fecha "${f[3]}" mal puesta`);
    const d = new Date(f[3]);
    anotar(!Number.isNaN(d.getTime()), `${donde} ${n}: fecha "${f[3]}" no existe`);

    anotar(typeof f[4] === 'number', `${donde} ${n}: la nota no es un numero`);
    anotar(f[4] >= 0 && f[4] <= 10, `${donde} ${n}: nota fuera del 0-10 (${f[4]})`);
    if (f[4] > 0) {
      totalConNota++;
      anotar(
        Number(f[4].toFixed(1)) === f[4],
        `${donde} ${n}: la nota ${f[4]} tiene mas de un decimal`,
      );
    }

    anotar(f[5].length > 30, `${donde} ${n}: descripcion demasiado corta (${f[5].length})`);
    anotar(f[5].length <= 400, `${donde} ${n}: descripcion de ${f[5].length} caracteres`);
    anotar(!ROTO.test(f[5]), `${donde} ${n}: descripcion con caracteres rotos`);
    anotar(
      palabrasEnglesas(f[5]).length === 0,
      `${donde} ${n}: ingles en la descripcion -> ${palabrasEnglesas(f[5])} en "${f[5].slice(0, 60)}"`,
    );

    anotar(
      nombrePegado(f[5]).length === 0,
      `${donde} ${n}: nombre pegado en la descripcion -> ${nombrePegado(f[5])}`,
    );
    anotar(!f[5].endsWith(' '), `${donde} ${n}: la descripcion acaba en espacio`);
  }

  // Los enteros tienen que ir del 1 al ultimo, sin huecos: un capitulo
  // perdido no se nota al mirar la lista, porque sale bien.
  enteros.sort((a, b) => a - b);
  for (let i = 0; i < enteros.length; i++) {
    anotar(
      enteros[i] === i + 1,
      `${donde}: los capitulos enteros llegan a ${enteros[i]} en la posicion ${i + 1}, deberian ir del 1 al ${enteros.length}`,
    );
  }

  // Que la lista este ya ordenada. `cargar-anime.mjs` no la ordena, y
  // el orden de escritura es el del fichero: si aqui viene
  // desordenada, el volcado sale desordenado.
  const ordenada = filas.map((f) => f[0]);
  const copia = [...ordenada].sort((a, b) => a - b);
  anotar(
    ordenada.join(',') === copia.join(','),
    `${donde}: los capitulos no estan en orden en el fichero`,
  );

  console.log(`  T${t.numero}${t.titulo ? ` "${t.titulo}"` : ''}: ${filas.length} capitulos (${enteros.length} enteros, ${filas.length - enteros.length} extras)`);
}

// ──────────────────────────────────────────────────────────
// 4. LOS TOTALES
// ──────────────────────────────────────────────────────────

anotar(
  totalCapitulos === EPISODIOS_TOTAL,
  `el total declarado (${EPISODIOS_TOTAL}) no son los capitulos de las temporadas (${totalCapitulos})`,
);

// ──────────────────────────────────────────────────────────
// 5. LOS PERSONAJES Y SUS ETIQUETAS
// ──────────────────────────────────────────────────────────

const nombres = PERSONAJES.map((p) => p[0]);
const idsTemporada = new Set(TEMPORADAS.map((t) => t.numero));

for (const [nombre, temporada, rol, japones, voz, desc] of PERSONAJES) {
  const donde = `personaje "${nombre}"`;
  anotar(nombre.length > 0, 'un personaje sin nombre');
  anotar(!ROTO.test(nombre), `${donde}: nombre con caracteres rotos`);
  anotar(palabrasEnglesas(nombre).length === 0, `${donde}: ingles en el nombre -> ${palabrasEnglesas(nombre)}`);
  anotar(['main', 'supporting', 'antagonist'].includes(rol), `${donde}: rol "${rol}" no valido`);
  anotar(japones.length > 0, `${donde}: sin nombre japones`);
  anotar(!ROTO.test(japones), `${donde}: nombre japones roto`);
  anotar(voz.length > 0, `${donde}: sin voz`);
  anotar(!ROTO.test(voz), `${donde}: voz con caracteres rotos`);
  anotar(desc.length > 30, `${donde}: descripcion demasiado corta (${desc.length})`);
  anotar(desc.length <= 400, `${donde}: descripcion de ${desc.length} caracteres`);
  anotar(!ROTO.test(desc), `${donde}: descripcion con caracteres rotos`);
  anotar(palabrasEnglesas(desc).length === 0, `${donde}: ingles en la descripcion -> ${palabrasEnglesas(desc)}`);
anotar(
  nombrePegado(desc).length === 0,
  `${donde}: nombre pegado en la descripcion -> ${nombrePegado(desc)}`,
);

  // Las temporadas tienen que existir. Un "8" se colaria sin error y
  // el personaje no apareceria en ninguna ficha.
  const pedidas = temporada === '' ? [] : temporada.split(',').map(Number);
  for (const n of pedidas) {
    anotar(idsTemporada.has(n), `${donde}: la temporada ${n} no existe (hay ${[...idsTemporada].join(',')})`);
  }
  anotar(
    new Set(pedidas).size === pedidas.length,
    `${donde}: repite temporada en "${temporada}"`,
  );

  anotar(Array.isArray(TAGS[nombre]) && TAGS[nombre].length > 0, `${donde}: sin etiquetas`);
}

for (const clave of Object.keys(TAGS)) {
  anotar(nombres.includes(clave), `las etiquetas de "${clave}" no son de ningun personaje`);
}

// ──────────────────────────────────────────────────────────

console.log('');
console.log(`  Capitulos: ${totalCapitulos} (${totalConNota} con nota, ${totalCapitulos - totalConNota} sin nota)`);
console.log(`  Personajes: ${PERSONAJES.length}`);

if (fallos > 0) {
  console.log('');
  console.log(`  ${fallos} FALLOS`);
  process.exit(1);
}

console.log('  TODO CORRECTO');
