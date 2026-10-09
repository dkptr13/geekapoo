// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────

export const ANIME = {
  // El titulo NO se traduce, y aqui no hay ninguna duda posible: el
  // nombre en espanol y el japones son el mismo. La Wikipedia en
  // espanol titula la entrada "Tokyo Ghoul", la inglesa tambien, y
  // el logotipo japones es la transliteracion de esas mismas tres
  // palabras. Selecta Vision, que lo doblo para Espana, lo respeto
  // tal cual.
  titulo: 'Tokyo Ghoul',

  // Sin parentesis, que es como lo escribe la web oficial de la
  // serie (marv.jp). La forma entre parentesis aparece en las fichas
  // de mucho manga y tambien valdria; inventar una tercera no.
  japaneseTitle: '東京喰種トーキョーグール',

  // Base: el parrafo de "Sintesis" de la Wikipedia en espanol, que
  // explica correctamente que es un goul y que le pasa a Kaneki. Se
  // amplia con la pagina del anime y con la ficha de personajes en
  // ingles de esa misma wiki, para que la sinopsis sea la de la
  // SERIE y no solo la del primer capitulo.
  //
  // El catalogo escribe "goul" con una sola h, que es como se escribe
  // en castellano, y asi esta en el resto de estas fichas.
  synopsis: `Los goul son una especie que solo puede alimentarse de carne humana. Parecen personas, hablan como personas y llevan toda su vida mezclados con la gente de Tokio sin que nadie lo note. Kaneki es un estudiante de primero que vive de los libros y no mira las noticias; la unica chica que comparte esa misma obsesion es Rize, y quedan en una cita que no llega a ser una cita. Sobre los dos cae un andamio, Rize muere, y el hospital le trasplanta sus organos a Kaneki. Lo que sale de alli es un problema que nadie le pidio: ahora es humano y goul a la vez, y tiene que aprender a sobrevivir en un mundo donde dos especies llevan anos decidiendo a muerte cual se come a cual. A un lado esta la Comision contra los Gouls, que ve monstruos donde Kaneki ve gente. Al otro, Eto Yoshimura, que lleva anos intentando convertirlo en un arma. Y en medio, la cafeteria de Yoshimura, donde los goul intentan vivir como personas y donde Kaneki entra creyendo que solo va a trabajar una tarde.`,

  anio: 2014,
  estado: 'finished',
  estudio: 'Pierrot',

  // Seinen es la demografia del manga (la ficha de la wiki en espanol
  // lo dice), y "Seinen & Psicologico" es la categoria del catalogo
  // que mas se le parece. Las otras dos estan porque tambien se puede
  // buscar por ahi: la accion es media serie, y "Thriller & Misterio"
  // describe de que va, que es un misterio criminal con dos caras.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio', 'Shonen & Acción'],

  // Las de la pagina de Crunchyroll en espanol (Accion, Fantasía,
  // Seinen, Thriller) mas las que da la ficha de la wiki en espanol
  // (Horror, Drama). "Seinen" se deja fuera a proposito, igual que se
  // hizo con Kaguya: la demografia va en "categorias" y aqui van los
  // generos.
  generos: ['Acción', 'Psicológico', 'Horror', 'Drama', 'Sobrenatural', 'Fantasía Oscura'],
};

export const ANIME_ID = 'tokyo-ghoul';

/**
 * Nota de la serie entera en IMDb.
 *
 * Tokyo Ghoul NO es una sola ficha en IMDb: son tres (la de 2014, la
 * de Root A y la de :re), asi que no hay una nota de "la serie" que se
 * pueda copiar tal cual. Lo que hay son tres notas y tres numeros de
 * votos, y lo que se guarda es la MEDIA PONDERADA por los votos:
 *
 *   7,7 x 86.000  =  662.200
 *   7,5 x 21.000  =  157.500
 *   6,5 x 15.000  =   97.500
 *   -------------------------------
 *   917.200 / 122.000 votos = 7,5
 *
 * Ponderar tiene sentido y la media simple no: un voto no cuenta lo
 * mismo que otro. Con la media simple (7,2) el resultado bajaria casi
 * medio punto por culpa de la ficha menos votada de las tres, que es
 * ademas la peor, :re.
 *
 * Ojo con lo que esto significa al mirarlo. El 7,7 de la T1 es el de
 * una serie corta de doce capitulos. La T3 son 24 capitulos
 * repartidos en dos cursos, con tres meses de paron entre medias, y
 * ahi esta el 6,5. Una serie de 48 capitulos con la nota de la primera
 * mitad pesando mas parece mejor de lo que es; conviene acordarse de
 * que la nota de cada CAPITULO es real y va en su propia ficha.
 */
export const RATING_SERIE = 7.5;

/**
 * Capitulos en total, contando las tres temporadas y los dos OVA.
 *
 *   T1  12  capitulos de television
 *   T2  12  capitulos de television
 *   T3  24  capitulos de television (dos cursos de 12)
 *   OVA  2  peliculas sueltas
 *   --
 *      50
 *
 * ── POR QUE LOS OVA VAN COMO TEMPORADA 4 Y NO COMO EXTRA ──
 *
 * Tokyo Ghoul: Jack y Tokyo Ghoul: Pinto son peliculas sueltas de unos
 * 25 y 30 minutos, con ficha propia en IMDb, que cuentan hechos
 * anteriores a la serie. Meterlas como capitulos extra de la T2
 * diria dos cosas falsas: que :re no existe (la T2 quedaria con 14
 * capitulos y la serie con 2 temporadas) y que el OVA de Jack es la
 * continuacion de √A, que no lo es.
 *
 * Van como TEMPORADA 4 con dos capitulos. Es lo que deja la ficha
 * completa sin tocar lo que ya esta bien: las tres temporadas reales
 * se quedan con 12, 12 y 24, que es lo que dicen las fuentes.
 *
 * El precio de esa decision es que la temporada 4 sale la ultima en la
 * wiki aunque los OVA sean de 2015, porque el numero es el que da el
 * orden y no la fecha. Es un coste pequeno comparado con lo otro.
 */
export const EPISODIOS_TOTAL = 50;

/**
 * Donde se emite, de la ficha de la Wikipedia en espanol.
 *
 * Las tres plataformas viene de ahi:
 *
 *   · Crunchyroll tiene la licencia "mundial excepto Asia", que es la
 *     que lleva la serie desde 2014 y la que hizo que llegara a medio
 *     mundo. Es la que se pone la primera.
 *   · Selecta Vision es la que dobló al espanol y la que tiene el DVD.
 *     En la ficha aparece como el licenciador de Espana.
 *   · Netflix sale en la columna de "Otras cadenas" de esa misma ficha,
 *     que es donde se listan los paises donde se emite sin licencia
 *     propia.
 *
 * Las plataformas son de la SERIE entera, no de cada temporada: las
 * tres temporadas van en el mismo sitio y no tiene sentido duplicar la
 * lista en cada una.
 *
 * El color del distintivo es el que usa el resto del catalogo para cada
 * plataforma, para que las pastillas se vean iguales en todas las
 * fichas y no sea cada serie la que invente el suyo.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Selecta Vision', url: 'https://www.selectavision.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];

// ──────────────────────────────────────────────────────────
// LAS TEMPORADAS
// ──────────────────────────────────────────────────────────

/**
 * Tres temporadas de television y una de OVA.
 *
 * ── POR QUE ":re" ES UNA SOLA TEMPORADA DE 24 ─────────────
 *
 * Porque hay dos criterios validos y se ha cogido el de la fuente que
 * mas se cita: Wikipedia en ingles cuenta :re como una temporada de 24
 * capitulos, y sus dos mitades ("Part 1" y "Part 2") son partes de esa
 * misma temporada. Lo contrario es IMDb, que la parte en dos fichas de
 * 12. Entre las dos, la primera.
 *
 * El detalle que obliga a tener cuidado es la numeracion de IMDb: sus
 * capitulos de :re van T1.E1 a T1.E12 y T2.E1 a T2.E12, que NO son los
 * numeros de este catalogo. Aqui van como 13 a 24 de la tercera
 * temporada. Queda escrito en `_imdb-tokyo-ghoul.json`.
 *
 * ── LOS TITULOS ──────────────────────────────────────────
 *
 * Las tres tienen nombre propio y se respeta, en vez de inventar
 * "Parte 1" o "Temporada 2". La primera no lo tiene, y por eso su
 * `titulo` va vacio y la wiki enseña "Temporada 1".
 *
 * ── LA NOTA DE CADA TEMPORADA ────────────────────────────
 *
 * La calcula `cargar-anime.mjs` como la media de las notas de sus
 * capitulos. Aqui todas las notas son reales de IMDb: en esta serie no
 * hay ni un capitulo de television ni de OVA sin nota.
 *
 * ── EL ESTUDIO ───────────────────────────────────────────
 *
 * Pierrot las cuatro. En :re aparece "Pierrot + Pierrot Films", que es
 * lo mismo para estos efectos: la ficha en japones pone la produccion
 * en las tres.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis: `Kaneki es un estudiante de primero que lee demasiado y no fia ni de su propia sombra. La chica con la que comparte esa obsesion en la cafeteria donde trabaja queda con el para una cita que no llega a ser una cita: ella es un goul, el esta a punto de comerselo, y un andamio cae encima de los dos. Rize muere y el hospital le trasplanta sus organos. Cuando Kaneki sale, es humano y goul a la vez, y tiene el problema de un sitio que no es suyo del todo en ninguno de los dos bandos. La Comision contra los Gouls lo busca. El, solo quiere vivir. Y en medio esta la cafeteria de Yoshimura, donde se aprende a cazar sin parecer un monstruo, y una chica que se niega a enseñarle ni una sola cosa de como se hace.`,
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '√A',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis: `Esta temporada se aparta del manga y cuenta una historia propia, que es lo que hace despues que buena parte de ella se quede descolgada de lo que viene. Una organizacion de goul llamada Aogiri secuestra a Hinami y obliga a Yoshimura a entregarse; Kaneki cae tambien, y lo que le hacen durante diez dias lo deja peor de lo que ya estaba. Cuando sale, ya no es el mismo: se come a otros goul para hacerse mas fuerte, y eso le funciona hasta que se encuentra con Arima, el investigador que la Comision considera infalible y que parece saberlo todo. Al final del capitulo doce se le pregunta quien es, y la respuesta es una sola palabra: Ken. El nombre por el que todo el mundo empieza a llamarlo cuando deja de ser el monstruo de la ultima vez que lo vieron.`,
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 're',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis: `Esta es la que sigue el manga de verdad, y arranca donde termino la primera. Kaneki despierta en la Coclea, la prision mas cruel de la ciudad, sin un solo recuerdo y con otro nombre: Haise Sasaki. Ahora es agente de la Comision y su trabajo es ensenar a matar goul a un grupo de crias a las que les han injertado organos de goul para que peleen como ellos. El problema es que Haise sabe demasiado, que su cuerpo sigue siendo el de un monstruo, y que la Comision lo esta usando. Del otro lado esta Eto, que lo quiere para algo mucho mas grande, y una guerra de gouls que lleva anos organizandose para quedarse con la ciudad entera.`,
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'OVA',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Pierrot',
    synopsis: `Los dos OVA no son capitulos de ninguna de las tres temporadas, sino dos peliculas sueltas de unos 25 y 30 minutos que cuentan hechos anteriores a ellas. Jack es la historia de Kisho Arima y Taishi Fura, dos investigadores de la Comision que se cruzaron de ninos y que nunca congeniaron: uno es serio y metodo y el otro va por la vida sin un plan. Pinto es la historia de Shu Tsukiyama y Chie Hori, la chica que lo grabo matando a un corredor y que en vez de salir corriendo le pregunto por que lo hacia. Los dos cuentan el principio de relaciones que en la serie ya dan por hechas.`,
    capitulos: 'T4',
  },
];