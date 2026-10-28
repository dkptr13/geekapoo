// META - Fate/Zero
//
// AniList 10087 (T1, 2011, 13 episodios) y 11741 (T2, 2012, 12).
// Estudio: ufotable. Novela de Gen Urobuchi, ilustrada por Takashi
// Takeuchi, precuela de Fate/stay night.
//
// Las notas de AniList son 81 y 84 sobre 100. La ficha usa la media
// de las dos temporadas.

export const ANIME = {
  titulo: 'Fate/Zero',

  japaneseTitle: 'フェイト/ゼロ',

  synopsis:
    'Diez años antes de Fate/stay night, siete magos se matan por un Grial que concede cualquier deseo. ' +
    'Kiritsugu Emiya, el asesino de magos, lo quiere para acabar con las guerras; Kirei Kotomine, ' +
    'sacerdote y ejecutor, lo quiere porque no sabe qué más le queda. Entre ellos se sientan Saber, ' +
    'un rey que fracasó en su propio reinado, y Gilgamesh, un rey que nunca dudó de nada. La precuela ' +
    'de Urobuchi convierte la guerra del Grial en un tablero donde cada maestro tiene un motivo ' +
    'razonable para hacer algo terrible.',

  anio: 2011,
  estado: 'finished',
  estudio: 'ufotable',

  categorias: ['Shonen & Acción', 'Seinen & Psicológico'],

  generos: ['Acción', 'Drama', 'Fantasía', 'Sobrenatural'],
};

export const ANIME_ID = 'fate-zero';

/**
 * Nota de AniList: 81 y 84 sobre 100. Media de las dos temporadas:
 * 8,25, que se deja en 8,3.
 */
export const RATING_SERIE = 8.3;

/** Capitulos en total: 13 de la primera temporada y 12 de la segunda. */
export const EPISODIOS_TOTAL = 25;

/**
 * No hay oferta española verificada de la serie completa. Se deja vacio
 * en vez de copiar la plataforma de otra entrega de la franquicia.
 */
export const STREAMING = [];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Trece episodios emitidos del 2 de octubre al 24 de diciembre de 2011. La guerra arranca en ' +
      'Alemania con la invocación de Saber y sigue en Fuyuki con el duelo del puerto, la cacería ' +
      'de Caster y el banquete de los tres reyes. Kiritsugu prefiere no pelear: deja que los demás ' +
      'se enseñen las cartas mientras él estudia cómo matarlos sin que se enteren.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2012,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'Doce episodios emitidos del 7 de abril al 23 de junio de 2012. La segunda mitad empieza con ' +
      'el demonio de Caster en el río Mion y ya no afloja: mueren maestros, se rompen alianzas y ' +
      'Kiritsugu y Kirei acaban frente a frente. El Grial por fin concede un deseo, y lo que enseña ' +
      'dentro es la razón por la que Kiritsugu lleva media vida matando.',
    capitulos: 'T2',
  },
];
