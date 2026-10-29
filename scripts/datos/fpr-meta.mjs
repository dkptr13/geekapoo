// META - Fate/Prototype
//
// AniList 12565 (OVA, 2011, 12 minutos).
// Estudio: Lerche, con Nasu en el guion y Takeuchi en el diseño.
//
// Es el primer borrador de Fate/stay night, el que Nasu escribio
// antes de cambiar a Ayaka por Shirou y a Arthur por Artoria. Solo
// existe esta version animada, de doce minutos, que se estreno con
// el lanzamiento de Carnival Phantasm.

export const ANIME = {
  titulo: 'Fate/Prototype',

  japaneseTitle: 'フェイト/プロトタイプ',

  synopsis:
    'El Santo Grial vuelve a Fuyuki y vuelve a pedir siete magos y siete sirvientes. Ayaka Sajyou, ' +
    'la hija menor de una familia de magos, no quiere saber nada de una guerra que ya se llevo a su ' +
    'padre y a su hermana, pero el destino la pone en el centro del conflicto con Saber, un caballero ' +
    'de armadura plateada que esta vez no es una mujer. Este es el primer borrador de Fate/stay night: ' +
    'el prototipo que Nasu escribio antes de cambiar a Shirou por Ayaka, con Arthur en lugar de Artoria ' +
    'y un final que no se parece al de la serie.',

  anio: 2011,
  estado: 'finished',
  estudio: 'Lerche',

  categorias: ['Shonen & Acción', 'Fantasía & Aventura'],

  generos: ['Acción', 'Fantasía', 'Romance'],
};

export const ANIME_ID = 'fate-prototype';

/**
 * Nota de AniList: 63 sobre 100, que es un 6,3.
 *
 * No hay ficha de IMDb suelta para este OVA, asi que se usa la nota
 * de la comunidad de AniList, que es la unica fuente publica con votos
 * suficientes.
 */
export const RATING_SERIE = 6.3;

/** Capitulos en total: el OVA, del 31 de diciembre de 2011. */
export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España.
 *
 * No hay licencia española del OVA. Se deja vacio en vez de inventar
 * una plataforma: la ficha saldra con "Sin verificar" hasta que se
 * compruebe una oferta real.
 */
export const STREAMING = [];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'Lerche',
    synopsis:
      'Corto de doce minutos que se estreno con el lanzamiento de Carnival Phantasm en 2011. Ayaka ' +
      'Sajyou hereda el papel de maestra de Saber en una guerra que ya le ha costado la familia, y se ' +
      'enfrenta a un rival que conoce su apellido. Lerche lo animo con el diseño de Takashi Takeuchi y ' +
      'el guion del propio Nasu, y es la unica version animada del primer borrador de la saga.',
    capitulos: 'T1',
  },
];
