// LA FICHA DEL ANIME - Teasing Master Takagi-san
//
// Titulo oficial en ingles. Tres temporadas de costumbrismo escolar
// y una pelicula (2022) que va como cuarta temporada en orden
// cronologico, igual que las de Bunny Girl.

export const ANIME = {
  titulo: 'Teasing Master Takagi-san',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: 'からかい上手の高木さん',

  // Base: la lista de capitulos de la Wikipedia en ingles. Lo que
  // tiene que quedar claro: no pasa casi nada en 36 capitulos y
  // pasa de todo, porque cada segmento es una vacilada de Takagi a
  // Nishikata que el pierde siempre, y la gracia esta en verlo
  // intentarlo otra vez.
  synopsis:
    'Nishikata se sienta al lado de Takagi y lleva desde entonces intentando vacilarla una ' +
    'sola vez. Ella le lee la mente, le cambia las reglas a mitad del juego y se rie con ' +
    'carino, y el vuelve a caer manana. Gomas de borrar, paraguas compartidos, festivales, ' +
    'San Valentin y tres cursos enteros de tira y afloja en el instituto. Sin dramas ni ' +
    'villanos: la serie mas amable del catalogo, donde lo mas grave que pasa es sonrojarse.',
  anio: 2018,
  estado: 'finished',
  estudio: 'Shin-Ei Animation',

  // Comedia romantica escolar, igual que Makeine: los mismos dos
  // cajones del panel, porque es lo que son las dos.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Romance', 'Recuentos de la vida', 'Escolar'],
};

export const ANIME_ID = 'teasing-master-takagi-san';

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

/**
 * LAS CUATRO TEMPORADAS
 *
 * T1  13 capitulos  (enero-marzo de 2018, 12 de television + el OVA de julio)
 * T2  12 capitulos  (julio-septiembre de 2019)
 * T3  12 capitulos  (enero-marzo de 2022)
 * T4   1 pelicula   (junio de 2022)
 * --
 *     38
 *
 * Cada capitulo trae de 3 a 6 segmentos cortos, asi que los titulos
 * unen los segmentos con " / ". El OVA de 2018 va como capitulo 13
 * de la T1: es de la historia y tiene nota propia en IMDb.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2018,
    estado: 'Finalizado',
    estudio: 'Shin-Ei Animation',
    synopsis:
      'Primer curso: Takagi vacila a Nishikata con gomas, paraguas y caras raras, y el ' +
      'pierde todas. Entre clase y clase asoman Mina, Yukari y Sanae con sus cosas. Cierra ' +
      'con carta y cambio de sitio, y el OVA de julio los lleva al tobogan de agua.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Shin-Ei Animation',
    synopsis:
      'Segundo curso con mas punteria: hipnosis, San Valentin, campamento y festival de ' +
      'verano. Las vaciladas suben de nivel y Nishikata empieza a sospechar que perder no ' +
      'le disgusta tanto. El verano acaba con promesas bajo los fuegos.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Shin-Ei Animation',
    synopsis:
      'Tercer curso y tono mas romantico: festival cultural, Navidad, Ano Nuevo y San ' +
      'Valentin de verdad. Takagi afloja la burla y aprieta el carino; Nishikata, a su ' +
      'ritmo, empieza a corresponder. Cierra la serie antes de la pelicula.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'The Movie',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Shin-Ei Animation',
    synopsis:
      'Setenta y tres minutos de cine estrenados el 10 de junio de 2022. Ultimo verano ' +
      'de secundaria: Takagi y Nishikata encuentran una gatita abandonada en el santuario ' +
      'y la llaman Hana. Cuidarla a escondidas, con la tienda de Oota y su loro Katsuo de ' +
      'por medio, es su primera aventura de verdad juntos y el cierre que la serie debia.',
    capitulos: 'T4',
  },
];

/**
 * Nota de la serie en IMDb: 7,7 con unos 3.800 votos.
 *
 * Temporadas al alza: la tercera roza el 9 en varios capitulos y
 * tira de la media. La primera se mueve en el 7 largo, propia de
 * una serie que aun se esta presentando.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total, contando las tres temporadas y la pelicula.
 *
 *   T1  13  capitulos  (enero-marzo de 2018 + el OVA de julio)
 *   T2  12  capitulos  (julio-septiembre de 2019)
 *   T3  12  capitulos  (enero-marzo de 2022)
 *   T4   1  pelicula   (junio de 2022)
 *   --
 *       38
 */
export const EPISODIOS_TOTAL = 38;

// Sin plataformas verificadas en Espana: JustWatch dice que aqui no
// hay ninguna (Crunchyroll la lleva en Suiza y otros 26 paises,
// pero no Espana). Como con Plastic Memories y Ragna: no inventar
// es mejor que poner una.
