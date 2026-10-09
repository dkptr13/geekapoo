/**
 * Comprobaciones de las NOTICIAS RSS, sin Internet y sin Firebase.
 *
 * Aquí está lo que no se ve leyendo el código, y que se equivoca de
 * formas que en pantalla no se distinguen:
 *
 *   · que el HTML del resumen se quita entero, y que un `<script>` no se
 *     queda sin etiquetas sino que desaparece con lo que hay dentro;
 *   · que el resumen se corta donde se puede leer, no a mitad de palabra;
 *   · que el id sale siempre igual para el mismo enlace, que es lo único
 *     que impide que la función cree 137 duplicados cada dos horas;
 *   · que un item sin enlace o sin fecha se descarta, y que un item con
 *     la fecha mal puesta no rompe la sincronización.
 *
 * ── POR QUÉ `leerFeed` SE PRUEBA CON UN SERVIDOR LOCAL ──────────────
 *
 * Porque `leerFeed` hace un `fetch`, y una prueba que necesita
 * Internet falla en cuanto el wifi falla y no comprueba nada el resto
 * del tiempo. Levantando un servidor diminuto en el propio proceso, se
 * prueba el camino entero —descargar, parsear, filtrar, convertir
 * fechas— sin salir a la red y en milisegundos.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  FUENTES_RSS,
  MAX_NOTICIAS_GUARDADAS,
  RESUMEN_MAX,
  idDeNoticia,
  leerFeed,
  limpiarResumen,
  recortarResumen,
} from '../functions/src/rss';

// ======================================================
// QUITAR EL HTML
// ======================================================

assert.equal(limpiarResumen('Hola'), 'Hola', 'un texto sin etiquetas pasa tal cual');
assert.equal(limpiarResumen(''), '', 'nada no es nada');

assert.equal(
  limpiarResumen('<p>Hola <b>mundo</b></p>'),
  'Hola mundo',
  'las etiquetas se van y el texto se queda',
);

assert.equal(
  limpiarResumen('  Hola \n\n  mundo \t '),
  'Hola mundo',
  'los espacios de mas se juntan a uno',
);

// ── EL CASO QUE IMPORTA ─────────────────────────────────
//
// Un feed es contenido de otra web. Si su resumen trae un script y
// este se guarda sin limpiar, el texto del script acaba pintado en la
// tarjeta. Y si alguien lo pinta como HTML, es un XSS servido desde un
// RSS ajeno. Por eso `<script>` se quita CON lo de dentro y no solo las
// etiquetas: `<script>alert(1)</script>` tiene que quedar vacío, no
// "alert(1)".
assert.equal(
  limpiarResumen('<script>alert(1)</script>Hola'),
  'Hola',
  'un script desaparece entero, con su contenido dentro',
);

assert.equal(
  limpiarResumen('Antes<script>fetch("/robar")</script>Despues'),
  'Antes Despues',
  'lo de entre medias se va, lo de los lados se queda',
);

assert.equal(
  limpiarResumen('<style>body{display:none}</style>Titular'),
  'Titular',
  'un style tambien desaparece entero',
);

assert.equal(
  limpiarResumen('<img src=x onerror="alert(1)">Texto'),
  'Texto',
  'una etiqueta suelta sin cerrar tambien se va',
);

// ── LAS ENTIDADES ───────────────────────────────────────
//
// Los feeds traen el texto con entidades HTML. Si no se convierten,
// en la tarjeta sale un "Vogue&apos;s" que es feo pero inofensivo, y un
// "&lt;script&gt;" que es feo y, si alguien lo pinta como HTML,
// ejecutable.
assert.equal(limpiarResumen('Tom &amp; Jerry'), 'Tom & Jerry', 'el ampersand');
assert.equal(limpiarResumen('&lt;div&gt;'), '<div>', 'los signos de menor y mayor');
assert.equal(limpiarResumen('&quot;entre comillas&quot;'), '"entre comillas"', 'las comillas');
assert.equal(limpiarResumen('It&#39;s here'), "It's here", 'el apostrofo numerico');
assert.equal(limpiarResumen('It&#x27;s here'), "It's here", 'el apostrofo hexadecimal');
assert.equal(limpiarResumen('a&nbsp;b'), 'a b', 'el espacio que no existe se vuelve espacio');
assert.equal(limpiarResumen('&#8212;guion'), '—guion', 'un guion largo por su numero');

// ======================================================
// CORTAR EL RESUMEN
// ======================================================

assert.equal(
  recortarResumen('Corto.'),
  'Corto.',
  'lo que ya cabe no se toca',
);

assert.equal(
  recortarResumen(''),
  '',
  'nada sigue sin ser nada',
);

const largo = 'Frase larga. '.repeat(60).trim();

const cortado = recortarResumen(largo);

assert.ok(
  cortado.length <= RESUMEN_MAX,
  `el resumen se corta a ${RESUMEN_MAX} y mide ${cortado.length}`,
);

assert.ok(cortado.endsWith('…'), 'un resumen cortado avisa con los tres puntos');
assert.ok(cortado.startsWith('Frase larga.'), 'empieza por el principio, que es lo importante');

// ── DÓNDE CORTA ─────────────────────────────────────────
//
// Cortar "Season 2 Anime Seri" por el medio y poner "..." encima no
// dice nada. Cortar en el último punto dice algo entero. Se comprueba
// que el punto gana cuando hay uno, y que el texto que se queda no
// acaba a mitad de una palabra.
// Con puntos repartidos por todo el texto, para que haya alguno DENTRO
// de la parte que se conserva. Con un solo punto al final del todo el
// corte no lo encuentra y cae al de palabras, que tambien esta bien
// pero no es lo que se quiere comprobar aqui.
const conPunto = 'Frase de prueba. '.repeat(20) + 'Y esta se queda fuera.';

const enPunto = recortarResumen(conPunto);

assert.ok(enPunto.endsWith('…'), 'con punto, también acaba en puntos suspensivos');

assert.ok(
  enPunto.replace('…', '').trimEnd().endsWith('.'),
  'con punto, lo que se ve termina en un punto: se cortó en una frase entera',
);

assert.ok(
  enPunto.includes('Frase de prueba.'),
  'con punto, la primera frase se conserva entera',
);

assert.ok(
  enPunto.length < conPunto.length,
  'con punto, se ha quitado una parte de verdad, no solo se ha añadido la cola',
);

// Sin ningún punto en todo el texto, el corte tiene que caer entre
// palabras, no en mitad de una.
const sinPunto = 'palabra '.repeat(60).trim();

const enPalabra = recortarResumen(sinPunto);

assert.ok(enPalabra.length <= RESUMEN_MAX, 'sin punto, también cabe');
assert.ok(enPalabra.endsWith('…'), 'sin punto, también avisa');
assert.ok(
  !enPalabra.replace('…', '').endsWith('palabr'),
  'sin punto, no corta por dentro de una palabra',
);

// Un texto enorme sin espacios: no hay palabra donde cortar, y aun
// así tiene que caber.
const sinEspacios = 'a'.repeat(5000);

const aTrozitos = recortarResumen(sinEspacios);

assert.ok(aTrozitos.length <= RESUMEN_MAX, 'un texto sin espacios se corta igual');
assert.ok(aTrozitos.endsWith('…'), 'y avisa de que está cortado');

// ======================================================
// EL ID DEL DOCUMENTO
// ======================================================

const enlace = 'https://www.animenewsnetwork.com/news/2026-10-08/algo/.242639';

const uno = idDeNoticia('Anime News Network', enlace);
const otro = idDeNoticia('Anime News Network', enlace);

assert.equal(uno, otro, 'el mismo enlace da siempre el mismo id: es lo que evita los duplicados');

assert.notEqual(
  idDeNoticia('Anime News Network', `${enlace}x`),
  uno,
  'otro enlace es otra noticia',
);

assert.notEqual(
  idDeNoticia('Otro Sitio', enlace),
  uno,
  'la misma URL en otra fuente es otra noticia, y no se pisan',
);

assert.ok(!uno.includes('/'), 'el id no puede llevar barras: Firestore no las admite en el id');
assert.ok(!uno.includes(' '), 'el id no puede llevar espacios');
assert.ok(uno.length <= 128, 'el id no se dispara de largo');
assert.ok(uno.startsWith('animenewsnet'), 'lleva el nombre de la fuente por delante, para reconocerlo');

// Que dependa también del nombre de la fuente y no solo del enlace es
// lo que impide que dos feeds con la misma URL se pisen entre ellos.
assert.notEqual(
  idDeNoticia('Anime News Network', enlace),
  idDeNoticia('animenewsnetwork', enlace),
  'el nombre cuenta tal cual viene, sin normalizar a mano',
);

// Con muchos caracteres raros, el prefijo tiene que quedar limpio.
const raro = idDeNoticia('Fuente Ñoño & Cía!!!', enlace);

assert.ok(/^[a-z0-9-]+$/.test(raro), `el id solo lleva letras, números y guiones: ${raro}`);

// ======================================================
// LEER UN FEED DE VERDAD
// ======================================================
//
// Con un servidor en el propio proceso, para probar el camino entero
// sin depender de Internet ni de que el feed de nadie esté en pie.

const XML = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Feed de prueba</title>
    <item>
      <title>La primera noticia</title>
      <link>https://ejemplo.com/primera</link>
      <description>Resumen &amp; con &lt;etiquetas&gt;</description>
      <pubDate>Thu, 08 Oct 2026 12:00:00 -0400</pubDate>
    </item>
    <item>
      <title>La segunda, más nueva</title>
      <link>https://ejemplo.com/segunda</link>
      <description>Otro resumen</description>
      <pubDate>Thu, 08 Oct 2026 18:30:00 -0400</pubDate>
    </item>
    <item>
      <title>Sin enlace, no sirve</title>
      <description>Ni título ni nada</description>
      <pubDate>Thu, 08 Oct 2026 19:00:00 -0400</pubDate>
    </item>
    <item>
      <title>Sin fecha, no se puede ordenar</title>
      <link>https://ejemplo.com/sin-fecha</link>
    </item>
    <item>
      <title>Con la fecha rota</title>
      <link>https://ejemplo.com/fecha-rota</link>
      <pubDate>no es una fecha</pubDate>
    </item>
    <item>
      <title>Enlace que no es un enlace</title>
      <link>javascript:alert(1)</link>
      <pubDate>Thu, 08 Oct 2026 20:00:00 -0400</pubDate>
    </item>
  </channel>
</rss>`;

const servidor = createServer((peticion, respuesta) => {
  // Solo un camino devuelve el feed. El resto es un 404 de verdad, para
  // poder probar lo que pasa cuando la fuente ha cambiado de direccion
  // y ya no esta donde decia.
  if (peticion.url === '/rss') {
    respuesta.writeHead(200, { 'Content-Type': 'application/rss+xml' });
    respuesta.end(XML);

    return;
  }

  respuesta.writeHead(404, { 'Content-Type': 'text/plain' });
  respuesta.end('no esta aqui');
});

await new Promise<void>((resolver) => {
  servidor.listen(0, '127.0.0.1', resolver);
});

const puerto = (servidor.address() as AddressInfo).port;

try {
  const leidas = await leerFeed({ nombre: 'Feed de prueba', url: `http://127.0.0.1:${puerto}/rss` });

  assert.equal(leidas.length, 2, 'solo pasan los items que tienen título, enlace y fecha');

  const titulos = leidas.map((n) => n.titulo);

  assert.ok(titulos.includes('La primera noticia'), 'la primera entra');
  assert.ok(titulos.includes('La segunda, más nueva'), 'la segunda entra');

  assert.ok(
    !titulos.some((t) => t.includes('Sin enlace')),
    'un item sin enlace se descarta: no se podría abrir en ningún sitio',
  );

  assert.ok(
    !titulos.some((t) => t.includes('Sin fecha')),
    'un item sin fecha se descarta: en una lista ordenada por fecha no sabría donde ponerlo',
  );

  assert.ok(
    !titulos.some((t) => t.includes('fecha rota')),
    'una fecha que no se puede leer se descarta, y no rompe la lectura entera',
  );

  assert.ok(
    !leidas.some((n) => n.enlace.startsWith('javascript:')),
    'un enlace que no es http se descarta',
  );

  // La fecha sale en ISO y en UTC, que es lo que permite ordenar por
  // texto y comparar fechas de dos fuentes distintas.
  const primera = leidas.find((n) => n.titulo === 'La primera noticia');

  assert.ok(primera, 'la primera noticia está');

  assert.equal(
    primera.fecha,
    '2026-10-08T16:00:00.000Z',
    'el -0400 del feed se convierte a UTC: 12:00 de allí son las 16:00 de aquí',
  );

  assert.ok(
    leidas.every((n) => n.enlace.startsWith('https://')),
    'los enlaces guardados son los del feed',
  );

  assert.equal(primera.fuente, 'Feed de prueba', 'cada noticia guarda de qué fuente vino');

  // ── EL RESUMEN VIENE LIMPIO ─────────────────────────
  //
  // Es la última barrera: aunque el widget lo pinte como texto, aquí ya
  // no queda nada de HTML en Firestore.
  assert.ok(
    !primera.resumen.includes('<'),
    `el resumen no puede quedar con etiquetas: "${primera.resumen}"`,
  );

  // ── LAS ENTIDADES SE CONVIERTEN, NO SE OLVIDAN ───────
  //
  // Lo que no puede pasar es que quede la entidad escrita. Un `&amp;`
  // sin convertir sale en pantalla tal cual, y lo que se busca aquí es
  // precisamente que se convierta: el feed traía `Resumen &amp; con` y en
  // Firestore tiene que quedar `Resumen & con`.
  assert.ok(
    !/&(amp|lt|gt|quot|apos|nbsp);/i.test(primera.resumen),
    `el resumen no puede quedar con entidades sin convertir: "${primera.resumen}"`,
  );

  assert.ok(
    !/&#(x?[0-9a-f]+);/i.test(primera.resumen),
    `ni con entidades numericas: "${primera.resumen}"`,
  );

  assert.ok(
    primera.resumen.includes('&'),
    'pero el ampersand de verdad sí se queda: "Resumen & con"',
  );

  // ── EL `<etiquetas>` DEL FEED DESAPARECE, Y ES LO CORRECTO ───────
  //
  // El feed traía `Resumen &amp; con &lt;etiquetas&gt;`, pero eso es
  // XML: el parser lo decodifica ANTES de que nadie lo toque, y lo que
  // llega a limpiar es `Resumen & con <etiquetas>`. Que `<etiquetas>`
  // desaparezca es justo lo que se busca, porque a partir de ese punto
  // ya no se distingue un signo de menor de una etiqueta.
  //
  // Lo peligroso sería lo contrario: que un `&lt;script&gt;` en el feed
  // se quedara en Firestore como `<script>` y alguien lo pintara como
  // HTML. Aquí no queda ni el signo.
  assert.equal(
    primera.resumen,
    'Resumen & con',
    'el <etiquetas> era una etiqueta, y como etiqueta se quita',
  );

  assert.ok(
    !leidas.some((n) => n.resumen.length > RESUMEN_MAX),
    'ningún resumen pasa del tope',
  );

  // ── UN FEED QUE CAE ──────────────────────────────────
  //
  // Si el feed devuelve un 404, `leerFeed` lo dice con un error que se
  // puede enseñar en un registro, y no devuelve una lista vacía que
  // parecería "no hay noticias" y dejaría el widget medio vacío sin
  // explicación.
  await assert.rejects(
    () => leerFeed({ nombre: 'Roto', url: `http://127.0.0.1:${puerto}/no-existe` }),
    /Roto respondió 404/,
    'un feed que responde 404 avisa con el código, no con una lista vacía',
  );

  // ── UN SERVIDOR QUE NO CONTESTA ──────────────────────
  //
  // Sin el temporizador, un feed que se queda colgado dejaría la
  // función esperando para siempre y la sincronización no terminaría
  // nunca. Se comprueba que tarda, pero vuelve.
  await assert.rejects(
    () => leerFeed({ nombre: 'Colgado', url: 'http://10.255.255.1:9/nada' }),
    /tardando|conectar|fetch|Network|socket|EAI|ECONN|ETIMEDOUT/i,
    'un feed que no contesta da un error en vez de colgarse',
  );
} finally {
  await new Promise<void>((resolver) => {
    servidor.close(() => resolver());
  });
}

// ======================================================
// LAS FUENTES
// ======================================================

assert.ok(FUENTES_RSS.length > 0, 'tiene que haber al menos una fuente configurada');

for (const fuente of FUENTES_RSS) {
  assert.ok(fuente.nombre.length > 0, 'una fuente sin nombre sale en blanco en el widget');
  assert.ok(
    /^https:\/\//.test(fuente.url),
    `la URL de "${fuente.nombre}" tiene que ser https: ${fuente.url}`,
  );
}

// ── DOS FUENTES, Y QUE NO SE PISEN ────────────────────────
//
// Se configuran dos porque el widget enseña las 5 más recientes de
// todas, no 5 de cada una. Si las dos traen lo mismo, la mitad del
// widget sería la misma noticia repetida.
assert.ok(
  FUENTES_RSS.length >= 2,
  'hacen falta al menos dos fuentes para que el widget no se llene de lo mismo',
);

const nombres = new Set(FUENTES_RSS.map((f) => f.nombre));

assert.equal(
  nombres.size,
  FUENTES_RSS.length,
  'dos fuentes con el mismo nombre se confundirían en la tarjeta',
);

const urls = new Set(FUENTES_RSS.map((f) => f.url));

assert.equal(urls.size, FUENTES_RSS.length, 'no puede haber dos veces la misma dirección');

assert.ok(MAX_NOTICIAS_GUARDADAS > 5, 'hay que guardar más de las que se pintan');

// Que la fuente en español siga estando, porque el widget se titula en
// español y lo primero que se miraría es que se note.
assert.ok(
  FUENTES_RSS.some((f) => /areajugones/i.test(f.url)),
  'la fuente en español se ha ido de la lista sin que nadie se avise',
);

console.log('  noticias (RSS): OK');
