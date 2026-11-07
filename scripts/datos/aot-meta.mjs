// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────
//
// Los datos que van al documento `animes/{id}`, que es lo que escribe
// `crear-anime.mjs`. Van aqui y no en ese script porque ese script
// tambien lleva la ficha de Mushoku Tensei: si cada anime tuviera su
// propio script de creacion, el nombre del anime apareceria duplicado
// en cada uno y habria que actualizar todos a mano cada vez que se
// anade una serie.
//
// `categoria` guarda la primera de la lista porque es lo que leen las
// fichas antiguas de la wiki; `categorias` lleva la lista entera.

export const ANIME = {
  // El titulo oficial en castellano. El japones, 進撃の巨人, se queda
  // como `japaneseTitle`, que es donde lo busca la wiki.
  titulo: 'Ataque a los Titanes',
  japaneseTitle: '進撃の巨人',

  // Sinopsis del distribuidor en castellano (la que aparece en
  // Prime Video España y en Crunchyroll). No esta escrita por mi: una
  // sinopsis inventada seria una descripcion falsa de la serie en la
  // wiki, que es justo lo que la wiki no debe hacer.
  synopsis:
    'Hace más de 100 años, los Titanes, gigantescos seres carentes de inteligencia con un ' +
    'apetito insaciable de seres humanos, aparecieron de la nada y llevaron a la humanidad al ' +
    'borde de la extinción. Convertidos en alimento para los Titanes, los supervivientes ' +
    'construyeron muros gigantescos de 50 metros de alto tras los que se refugiaron renunciando ' +
    'así al mundo más allá de los muros.',

  anio: 2013,
  estado: 'finished',
  // El estudio va POR TEMPORADA en `TEMPORADAS`, porque aqui cambia a
  // mitad de serie: WIT Studio hace las tres primeras partes y MAPPA
  // las cuatro ultimas. El de aqui es el de la primera, que es el que
  // se ve en la ficha de la serie entera.
  estudio: 'WIT Studio',

  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],
  generos: ['Acción', 'Militar', 'Drama', 'Apocalipsis', 'Tragedia', 'Fantasía', 'Misterio', 'Monstruos', 'Venganza', 'Supervivencia'],
};

export const ANIME_ID = 'ataque-a-los-titanes';

/**
 * Nota de la serie completa en IMDb, ponderada: 9,1 sobre unos 752 mil
 * votos. Es la segunda serie mas valorada de IMDb, y con diferencia
 * la mas alta del catalogo.
 *
 * Un aviso sobre como leer ese numero: no dice nada sobre como son
 * los capitulos sueltos. La Third Impression de la tercera parte
 * puntúa 6,5, que es la nota mas baja de toda la serie, y hay dos
 * temporadas enteras por debajo de 9. La media de la serie sube
 * mucho porque la segunda mitad, y sobre todo la tercera parte, esta
 * por encima de 9,5 casi capitulo a capitulo.
 */
export const RATING_SERIE = 9.1;

/**
 * Capitulos en total: 94 emitidos por television y 8 extras de DVD.
 *
 * El desglose esta en `TEMPORADAS`, y el total se comprueba contra
 * esa suma en `tests/logica.atacan-titanes.ts`. Aqui solo se declara
 * para que la ficha de la serie tenga el numero: si uno de los dos
 * lados cambia sin el otro, la comprobacion lo dice.
 */
export const EPISODIOS_TOTAL = 102;

// ──────────────────────────────────────────────────────────
// LAS SIETE TEMPORADAS
// ──────────────────────────────────────────────────────────
//
// ── POR QUE SIETE Y NO CUATRO ─────────────────────────────
//
// Que haya cuatro temporadas oficiales no significa que haya cuatro
// bloques de capitulos. La cuarta son cuatro partes, y las dos
// ultimas se emitieron como especiales de dos horas que despues se
// repartieron en capitulos sueltos. Repartirlo por partes hace tres
// cosas que repartirlo por temporadas no:
//
//   · Cada parte tiene su PROPIO titulo oficial, y es por ese titulo
//     por el que la gente la llama. "The Final Season" y "The Final
//     Chapters" se buscan por su nombre; "temporada 4", no.
//
//   · El ESTUDIO cambia dentro de la cuarta: MAPPA entro en la
//     tercera parte. El campo `estudio` es por temporada, asi que
//     con cuatro temporadas el cambio de WIT a MAPPA solo se veria
//     dentro de un bloque de 35 capitulos.
//
//   · Los capitulos del final tienen NOMBRE y se buscan por el.
//     "Dedicate Your Heart" o "Toward the Tree on That Hill" no
//     existen como capitulos numerados si las partes van juntas.
//
// ── LOS TITULOS DE LAS TEMPORADAS ────────────────────────
//
// Las dos primeras no tienen subtitulo oficial: son "Temporada 1" y
// "Temporada 2", y la wiki ya enseña el numero. De las cinco
// siguientes si hay titulo oficial, y va en ingles porque es el
// oficial. Nadie dice "la temporada final" cuando puede decir "The
// Final Season", y traducirlo seria inventar un titulo que no
// existe.
//
// ── LA NOTA DE CADA TEMPORADA ────────────────────────────
//
// Es la MEDIA de las notas de sus capitulos, no una nota de IMDb:
// IMDb no publica una por temporada para esta serie. Cada capitulo
// lleva su nota real de IMDb y la media sale de ahi. Los capitulos
// EXTRA, que son los OAD de DVD y no se emitieron nunca por
// television, quedan fuera del promedio: sin nota no son ni buenos
// ni malos, y contarlos bajaria la nota de la temporada por un
// capitulo que no tiene nota.
//
// ── LA SINopsis ───────────────────────────────────────────
//
// Escrita para este catalogo, como la de Mushoku Tensei. Va en una
// sola plantilla y no partida en trozos con `+`: partida, un cambio
// de palabra obliga a mover el punto de corte de las lineas de al
// lado y es facil dejar media frase repetida o cortada. El limite
// de la sinopsis (`LIMITS.description`) es de sobra para una linea.

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2013,
    estado: 'Finalizado',
    estudio: 'WIT Studio',
    synopsis: `Hace un siglo la humanidad construyó tres muros enormes y se encerró dentro para sobrevivir a los titanes, que se comen a quien pican. En la aldea de Shiganshina, Eren Yeager ve morir a su madre en la boca de un titán y jura limpiarlos del mundo. Con Mikasa y Armin se gradúa del cuerpo de instrucción y entra en el cuerpo de exploración, el único que sale de los muros. Lo que empieza como una venganza acaba siendo una pregunta más incómoda: qué hay fuera, quién decidió que nadie salga, y por qué. El sótano de la casa de los Yeager, al que nadie baja durante cuatro años, es lo que cambia la pregunta.`,
    capitulos: 'A1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2017,
    estado: 'Finalizado',
    estudio: 'WIT Studio',
    synopsis: `La villa de Trost queda aislada por un muro roto y acaba siendo un campo de batalla dentro de la ciudad: de ahí sale la primera victoria de la humanidad contra los titanes. La calma dura poco. Tres años después una piedra de veinte metros derriba el Muro de Rosa y el cuerpo de exploración pierde a casi media brigada en una sola noche, incluida toda la escuadra de Levi. Lo que descubren los que sobreviven es que los titanes pueden hablar, y que dentro del cuerpo hay alguien dispuesto a matar de más para que no se haga la pregunta equivocada. Historia descubre que es la heredera de la familia que gobierna el interior, Ymir acepta dejar de fingir que vive para ella, y Zeke aparece al fondo con un plan que no es el de nadie más.`,
    capitulos: 'A2',
  },
  {
    numero: 3,
    titulo: 'Season 3 Part 1',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'WIT Studio',
    synopsis: `Rod Reiss manda al cuerpo de exploración a recuperar el Muro de María, y Erwin convierte la operación en un golpe de estado: la segunda autorización del rey, la declaración de guerra al interior y el nacimiento de una reina. Pero lo que arranca es una guerra entre ellos, porque el titán acorazado y el colosal son dos soldados de Marley infiltrados en el propio cuerpo de exploración. Nadie los para y nadie pregunta bien por qué. Armin cae antes de la batalla y Levi tiene que decidir, en la nuca de un hombre que se muere, a quién le inyecta el suero de titán: a Erwin o al chico.`,
    capitulos: 'A3',
  },
  {
    numero: 4,
    titulo: 'Season 3 Part 2',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis: `MAPPA entra aquí y se nota: lo que había sido una guerra de trincheras dentro de los muros se convierte en una persecución, por un carro, por un sótano, por el mar. En el sótano de los Yeager hay unos libros que Grisha escribió para su hijo y que dicen qué es el mundo exterior: hay mar, hay pueblos, hay ejércitos, y hay una nación que lleva un siglo encerrando a los eldianos en una zona cerrada. La campaña de recuperar el Muro María termina con esa habitación abierta, y con dos preguntas nuevas: por qué Grisha hizo lo que hizo, y qué están haciendo ahora dos de los que invadieron Paradis con una promesa de vuelta.`,
    capitulos: 'A4',
  },
  {
    numero: 5,
    titulo: 'The Final Season',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis: `Cuatro años después, Zeke ha pasado ese tiempo haciéndose imprescindible para Marley mientras planeaba exactamente lo contrario. Su guerra contra los estados vecinos nunca acaba de verdad, y para cuando vuelva, Marley envía una tanda de guerreros eldianos que, siendo todavía unos críos, heredan los titanes más fuertes que existen. En Liberio, una familia hace su teatro y anuncia una guerra, y el discurso es justo lo que la ciudad quería oír. Eren aparece a mitad de la función. Lo que empieza como una emboscada acaba siendo la primera vez que la historia se cuenta desde el otro lado de la pared.`,
    capitulos: 'A5',
  },
  {
    numero: 6,
    titulo: 'The Final Season Part 2',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis: `La guerra ha terminado para todo el mundo menos para Paradis. Mientras los supervivientes vuelven a casa y se marcan tres años de paz, en la isla se está decidiendo su futuro sin ellos, y Zeke sigue moviendo fichas. Eren regresa con un enemigo que ya no es un titán ni un soldado, sino una promesa que va a destruirlo todo. Las decisiones tomadas en Shiganshina se cobran ahora en cadena, empezando por una de la que nadie es responsable y todos son, y por fin la cosa tiene nombre cuando alguien lo dice en voz alta. Es la parte más lenta de la serie y también la que más llega a decir de dónde viene todo.`,
    capitulos: 'A6',
  },
  {
    numero: 7,
    titulo: 'The Final Chapters',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'MAPPA',
    synopsis: `Eren libera a los millones de titanes encerrados en los muros. La unión de los que le quedan se marcha hacia él sin saber todavía contra qué clase de enemigo va: no es un ejército al que derrotar, sino una idea del mundo que se quiere, y esa idea se defiende combatiendo contra todo lo que queda. Muere Hange, y después Levi cumple por fin la promesa que le hizo a Erwin. En el Retumbar Mikasa elige. Y en Shiganshina, bajo un árbol que ya tiene la forma del árbol donde empezó todo, entierran a un hermano.`,
    capitulos: 'A7',
  },
];
// A donde se puede ver Ataque a los Titanes en España.
//
// ── DE DONDE SALE ESTA LISTA ───────────────────────────────────
//
// De JustWatch España, que revisa las plataformas de cada pais y
// actualiza la ficha: en septiembre de 2026 da las tres de aqui para
// Espana, y ninguna mas.
//
// El anime lo licencia y distribuye Crunchyroll fuera de Asia, asi que
// estar en Crunchyroll no es casualidad sino que es la licencia.
//
// ── POR QUE ESTA A OTRA LISTA QUE EN EL RESTO ──────────────────
//
// Prime Video no es solo una plataforma: Amazon mete los animes que
// licencia en canales dentro de Prime Video ("Crunchyroll Amazon
// Channel", "Animebox Channel"). JustoWatch los cuenta aparte, asi
// que quedan mas de cuatro lineas si se Cuentan por canal. Se deja
// la plataforma.
//
// ── LO QUE NO SE PONE ──────────────────────────────────────────
//
// Amazon Prime Video con anuncios y Netflix con anuncios son el mismo
// servicio con otro plan: dos entradas con el mismo nombre y la misma
// pagina no aportan nada al que busca donde verla.
//
// Y el formato del DVD de Selecta Vision no cuenta: no es streaming.

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
  { name: 'Amazon Prime', url: 'https://www.amazon.es/prime-video', badgeColor: 'bg-sky-500/20 text-sky-300' },
];
