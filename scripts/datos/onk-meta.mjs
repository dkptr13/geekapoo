// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────

export const ANIME = {
  // El titulo NO se traduce. "Oshi no Ko" es el nombre oficial y el que
  // usan las licencias, la web oficial y las tres seasonality de
  // Wikipedia. Escribirlo en castellano seria inventar un nombre que
  // nadie usa: "Mi estrella" existe como subtitulo en el mercado
  // hydrophonic pero no es como se conoce la serie.
  titulo: 'Oshi no Ko',

  // Con los corchetes, que son parte del logotipo oficial y no un
  // adorno. La propia wiki en japones explica que el simbolo tiene dos
// sentidos en el argumento, asi que tampoco es un capricho.
  japaneseTitle: '【推しの子】',

  // Sinopsis escrita en trozos con `+`, como en `ysa-meta.mjs`: escrita
  // de un tiron lo que se comprueba despues es que no haya quedado una
  // frase partida sin querer.
  //
  // Base: el resumen de "あらすじ" de la Wikipedia en japones y la
  // ficha de la serie en ingles, mas la nota de por que el titulo lleva
  // los corchetes.
  //
  // Lo que mas pesa aqui es una cosa que la sinopsis tiene que dejar
  // clara: el protagonista NO es un chico que descubre un secreto. Es un
  // hombre muerto que ha vuelto a nacer y que lleva toda la serie
  // buscando a quien le robo a su madre. Ese matiz es el que hace que la
  // serie no sea un thriller de idol.
  synopsis:
    'Un obstetra de pueblo es el fan numero uno de una idol que no sabe que tiene una ' +
    'enfermedad terminal que le va a matar. Cuando esa idol llega a su consulta embarazada ' +
    'de gemelos, el medico decide ayudarla en secreto y no contarselo a nadie. La noche de ' +
    'la entrega, un fan que lleva años persiguiéndola lo tira por un acantilado. Antes de ' +
    'morir resucita como uno de los bebes de la idol que adoraba, y su hermana gemela como ' +
    'la niña enferma que él cuidaba. Los dos crecen viendo a su madre en la television y creyendo ' +
    'que es una mujer feliz. A los doce años la idol vuelve a subirse a un escenario y esa noche ' +
    'un fan la apuñala delante de ellos. El chico decide que la va a vengar y que para eso tiene ' +
    'que meterse en la industria; su hermana decide que lo que quiere es ser idol como ella. ' +
    'Lo que ninguno de los dos sabe al empezar es que los dos vienen de antes, y que el chico ' +
    'lleva muerto toda una vida echándole de menos a su madre. Y lo que va preparando durante tres ' +
    'temporadas termina siendo una trampa para el público, no una venganza: una pelicula sobre ' +
    'la vida de su madre en la que su hermana va a tener que hacer de su madre. El parentesco es ' +
    'el giro que sostiene toda la serie: el hermano que miente protegiendo a la hermana que ' +
    'vive de mentir, y dos personas que se quieren mas de lo que admiten.',

  anio: 2023,
  estado: 'finished',
  estudio: 'Doga Kobo',

  // Seinen (lo dice la ficha de la wiki en japones) y de las pocas
  // series de idol que no son de lo ligero: la mitad del metraje va de
  // un idol golpeandola con una pala.
  categorias: ['Seinen & Psicológico', 'Thriller & Misterio'],

  generos: ['Psicológico', 'Drama', 'Sobrenatural', 'Thriller', 'Misterio', 'Venganza'],
};

export const ANIME_ID = 'oshi-no-ko';

/**
 * LAS TRES TEMPORADAS
 *
 * Oshi no Ko es de las pocas series del catalogo con un numero de
 * capitulos raro en cada temporada: 11, 13 y 11. Ni una son doce. Es lo
 * que dicen la ficha de la serie en la wikipedia en japones y la lista de
 * capitulos de IMDb, y conviene no "arreglarlo": el capitulo 1 de la
 * primera dura hora y media (hace de piloto) y el 11 de la tercera es un
 * especial de una hora, asi que los numeros redondos no salen.
 *
 * Hay una CUARTA TEMPORADA anunciada desde el 25 de marzo de 2026, el
 * mismo dia que termino la tercera. No entra aqui porque `cargar-anime.mjs`
 * calcula los capitulos desde el fichero `onk-t4.mjs`, y una temporada sin
 * capitulos se guardaria vacia en la wiki. Cuando tenga fecha, es anadir la
 * entrada aqui y crear el fichero.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Doga Kobo',
    synopsis:
      'Un obstetra es el fan numero uno de una idol y no sabe que se esta muriendo. Cuando ella le ' +
      'pide que no lo diga y le pide que la siga, el unico que sabe lo que pasa es el. Esa noche un ' +
      'hombre la mata delante de sus hijos y su alma entra en uno de los bebes: es el hermano, que ' +
      'desde los dos tiene un solo objetivo y lo guarda en secreto. La hermana, en cambio, quiere ser ' +
      'idol como era su madre. Doce anos mas tarde los dos ya estan dentro de la industria: ' +
      'ella en los escenarios y el en los despachos, con un secreto que le han hecho guardar ' +
      'para que nadie mas lo sepa. Lo que sale a la luz no es un secreto bonito, sino que la idol ' +
      'mintio en publico sobre su muerte, y que los dos hijos llevan doce anos viviendo sobre esa ' +
      'mentira sin haber decidido nunca si quieren quitarsela.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Doga Kobo',
    synopsis:
      'Dos anos despues Ruby es la idol mas famosa del pais y le ofrecen el proyecto que todo el ' +
      'mundo le habia dicho que no iba a hacer: una pelicula en Estados Unidos. Tendra que ' +
      'interpretar a una hoja de espada dibujada por autores desconocidos, con trece capitulos ' +
      'y un director que no manipula a nadie. La temporada tambien trae al hombre que dejo a Ai en ' +
      'la calle para salvarle la carrera, y a un rival de despacho que gana la guerra a base de ' +
      'ruido y de amenazas sin llegar nunca a lo ilegal. Es la temporada en la que ya no hay ' +
      'drama de adolescents: hay dos personas adultas tomando decisiones malas por trabajo, y ' +
      'cada escena va de lo que cuesta mantener una cara. Al final Ruby pide una sola cosa despues ' +
      'de haberlo tenido todo, y aparece una chica de pelo blanco que nadie de la serie conoce.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2026,
    estado: 'Finalizado',
    estudio: 'Doga Kobo',
    synopsis:
      'Ruby empieza a mirar donde no ha mirado nunca. Averigua que la muerte de su madre no fue lo ' +
      'que todo el mundo creia, que su hermano lleva doce anos mintiendole a todo el mundo para ' +
      'protegerla a ella y que hay gente que ha estado moviendo los hilos desde el principio. Es la ' +
      'temporada mas alta de las tres: sus capitulos hacen una media de 8,7, el capitulo 4 tiene un ' +
      '9,6, el 7 un 9,6 y el 8 un 9,2, y los capitulos flojos son los que cierran tratos de trabajo. ' +
      'La trama lleva a Ruby a hacer lo que ha estado evitando durante tres temporadas: subirse al ' +
      'escenario y ser su madre. Al final consigue el papel de protagonista en una pelicula sobre ' +
      'la vida de Ai, y ese es el final de temporada. La cuarta esta anunciada desde el 25 de marzo ' +
      'de 2026 y no se guarda aqui porque aun no tiene capitulos ni fecha.',
    capitulos: 'T3',
  },
];

/**
 * Nota de la serie en IMDb: 8,3 sobre unos 18.000 votos (la media NO
 * ponderada es 8,4).
 *
 * Es la mas alta del catalogo, y conviene decir por que: no es que
 * anime sobre idol sean buenos, es que esta en concreto no finge.
 *
 * ── POR QUE 8,3 Y NO MAS ─────────────────────────────────
 *
 * Las tres temporadas estan muy bien, pero el reparto de notas por
 * capitulo explica la nota:
 *
 *   · lo que mejor puntua es lo mas oscuro. El capitulo 6 de la T1 (el
 *     intento de suicidio de Akane) tiene un 9,4, el 7 un 8,9, y el 1
 *     un 9,5. Los capitulos de la T3 que destapan al padre de los
 *     gemelos andan por 9,6.
 *   · lo que peor puntua es lo de arranque. Los capitulos 2, 3 y 5 de la
 *     T1 se quedan en 7,7, 7,8 y 7,5, y son los de la vida escolar y
 *     los preparativos del festival.
 *
 * O sea, la gente que la ve coincide con lo que hace la serie: el
 * entertainment es lo de menos, y por eso puntua alto.
 */
export const RATING_SERIE = 8.3;

/**
 * Capitulos en total, contando las tres temporadas.
 *
 *   T1  11  capitulos  (abril-junio de 2023)
 *   T2  13  capitulos  (julio-octubre de 2024)
 *   T3  11  capitulos  (enero-marzo de 2026)
 *   --
 *      35
 *
 * ── POR QUE 11, 13 Y 11 Y NO 12, 12 Y 12 ─────────────────
 *
 * Porque es lo que dicen todas las fuentes y no hay ninguna que diga
 * otra cosa. Es una serie cuya primera temporada tiene once capitulos y
 * la segunda trece, y conviene no "arreglarlo" a los numeros redondos
 * que uno espera: el capitulo 1 dura hora y media, y el 11 de la T3 es
 * un especial de una hora.
 *
 * ── HAY UNA CUARTA TEMPORADA ANUNCIADA ───────────────────
 *
 * Se anuncio el 25 de marzo de 2026, el mismo dia que termino la
 * tercera. No hay fecha ni capitulos confirmados, asi que aqui NO esta:
 * la serie va como "Finalizado" porque las tres temporadas que existen
 * estan emitidas, y una temporada con cero capitulos no se puede
 * guardar en el modelo de datos (el cargador calcula los capitulos desde
 * el fichero y un cero ahi daria una temporada vacia en la wiki).
 *
 * Cuando se anuncie con fecha, es añadir una cuarta entrada en
 * `TEMPORADAS` y un fichero de capitulos mas.
 */
export const EPISODIOS_TOTAL = 35;

/**
 * Donde se emite, de la propia ficha de la serie.
 *
 *   · Crunchyroll -> lo compro en octubre de 2025, junto con la tercera
 *                    temporada, y en febrero de 2026 se llevo tambien
 *                    las dos primeras.
 *   · HIDIVE      -> fue el que llevo las dos primeras temporadas desde
 *                    el dia del estreno, en 2023.
 *   · Netflix     -> aparece en la lista de plataformas de MyAnimeList.
 *
 * HIDIVE y Crunchyroll se pone el primero el que tiene la serie entera,
 * que es Crunchyroll. Las tres plataformas son de la serie, no de cada
 * temporada, asi que van en el anime y no duplicadas en las tres.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'HIDIVE', url: 'https://www.hidive.com', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];
