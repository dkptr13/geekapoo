// META - Nisekoi
//
// TVDB 275670 "ニセコイ" (2014, Ended). Las dos series van en S1
// y S2; los OVAs en Specials (S0E1 a S0E3 los de 2014-2015 y S0E5
// y S0E7 los de 2016). El especial previo y el corto de un minuto
// no entran: programa y chibi, y aqui eso no entra.
// AniList 18897 (T1, 2014, 20), 20728 (T2 OVA, 3), 20876 (T3 ":",
// 2015, 12) y 119947 (T4 OVA, 2016, 2).
// IMDb tt3115338 (serie y OVAs con nota salvo el ultimo, que va
// con 0).
//
// El titulo corto es el oficial en todo el mundo ("False Love"
// es la licencia en ingles).

export const ANIME = {
  titulo: 'Nisekoi',

  japaneseTitle: 'ニセコイ',

  synopsis:
    'Raku, heredero yakuza con colgante de promesa, y Chitoge, heredera gangster con genio, fingen ser novios para evitar la guerra. ' +
    'Entre Kosaki y su llave, Tsugumi con pistola y Marika con anillo, el amor falso se llena de llaves de verdad. ' +
    'Dos series y dos OVAs de Shaft con enredos de llaves y colgantes.',

  anio: 2014,
  estado: 'finished',
  estudio: 'Shaft',

  // Comedia romantica escolar de harem con llaves: los dos cajones
  // de siempre, como las Quintillizas.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Comedia', 'Romance', 'Escolar', 'Harem', 'Recuentos de la vida'],
};

export const ANIME_ID = 'nisekoi';

/**
 * Nota de la serie completa en IMDb, serie tt3115338: 7,2 con unos
 * 5.200 votos. El T3 E10 es lo mejor con 8,3.
 */
export const RATING_SERIE = 7.2;

/**
 * Capitulos en total, en orden de emision.
 *
 *   T1   20  (enero - mayo de 2014, serie)
 *   T2    3  (octubre de 2014 - abril de 2015, OVA con tomos)
 *   T3   12  (abril - junio de 2015, ":")
 *   T4    2  (enero de 2016, OVA con el tomo 25)
 *   --
 *        37
 */
export const EPISODIOS_TOTAL = 37;

/**
 * Donde se emite en España.
 *
 *   · Crunchyroll -> licencia fuera de Japon, con subtitulos en castellano.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Veinte capitulos entre el 11 de enero y el 24 de mayo de 2014. ' +
      'Raku y Chitoge fingen amor entre mafias mientras Kosaki y su llave rondan. ' +
      'Cierra con Romeo y Julieta y beso fuera de guion.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'OVA',
    anio: 2014,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Tres capitulos entre octubre de 2014 y abril de 2015, salidos con los tomos 14, 16 y 17. ' +
      'Baños, curros y sentou con el reparto de tapadillo. ' +
      'Extras ligeros entre la serie y dos puntos.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: ':',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Doce capitulos entre el 10 de abril y el 26 de junio de 2015. ' +
      'Dos puntos con Haru, Paula y Hana nuevas entre madres, dietas y apoyos de verdad. ' +
      'Cierra buscando la llave de verdad.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'OVA 2016',
    anio: 2016,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Dos capitulos del 4 de enero de 2016, salidos con el tomo 25. ' +
      'Boda fingida y Kosaki magical otra vez con el reparto de tapadillo. ' +
      'El segundo no tiene nota en IMDb y va con 0.',
    capitulos: 'T4',
  },
];
