// META - Las Quintillizas
//
// TVDB 355966 "五等分の花嫁" (2019, Ended).
// AniList 103572 (T1, 2019), 109261 (T2, 2021), 131520 (peli 2022),
// 163327 (especial 2023) y 177191 (especial 2024).
// IMDb tt9584920 (serie), tt15721650 (peli), tt28499296 y tt34691265.
//
// El titulo es el alias oficial en castellano, que AniList trae como
// sinonimo ("Las Quintillizas"). El ingles "The Quintessential
// Quintuplets" es la licencia.
//
// ── EL ORDEN ────────────────────────────────────────────────
//
// Las temporadas van en orden cronologico: dos series, la pelicula
// que cierra la historia y dos especiales posteriores. TVDB guarda
// peli y especiales en "Specials" (S0E1 a S0E5); el catalogo numera
// por fecha, igual que en Bunny Girl.

export const ANIME = {
  titulo: 'Las Quintillizas',

  japaneseTitle: '五等分の花嫁',

  synopsis:
    'Futaro Uesugi, estudiante pobre de matricula, acepta el encargo del rico Maruo Nakano: dar clases a sus cinco hijas quintillizas, que odian estudiar. ' +
    'Ichika, Nino, Miku, Yotsuba e Itsuki son identicas por fuera y opuestas por dentro, y Futaro tendra que aprender a distinguirlas para aprobarlas. ' +
    'Entre examenes, viajes, festival cultural y boda, la saga cuenta como cinco hermanas se pelean por el mismo chico sin romperse.',

  anio: 2019,
  estado: 'finished',
  estudio: 'Tezuka Productions',

  // Romance por Futaro y las cinco, y escolar por el instituto: los
  // dos cajones de la comedia romantica escolar, como Takagi.
  categorias: ['Romance & Comedia', 'Shojo & Escolar'],

  generos: ['Romance', 'Comedia', 'Drama', 'Escolar'],
};

export const ANIME_ID = 'las-quintillizas';

/**
 * Nota de la serie completa en IMDb, serie tt9584920: 7,7 con unos
 * 13.000 votos.
 *
 * La peli y los especiales puntuan aparte y no se mezclan: tt15721650
 * 7,5, tt28499296 8,8 y 9,3, y tt34691265 8,7 los dos.
 */
export const RATING_SERIE = 7.7;

/**
 * Capitulos en total, en orden cronologico.
 *
 *   T1  12  (enero - marzo de 2019, serie)
 *   T2  12  (enero - marzo de 2021, serie)
 *   T3   1  (mayo de 2022, pelicula final)
 *   T4   2  (septiembre de 2023, especial de verano)
 *   T5   2  (diciembre de 2024, luna de miel)
 *   --
 *       29
 */
export const EPISODIOS_TOTAL = 29;

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
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'Tezuka Productions',
    synopsis:
      'Doce capitulos entre el 11 de enero y el 29 de marzo de 2019. ' +
      'Futaro entra de profesor particular de cinco hermanas que no quieren estudiar y aprende a distinguirlas una a una. ' +
      'Examenes, dia libre y viaje escolar con leyenda de enamorados y baile de mascaras. ' +
      'Cierra con la promesa de los dos mil dias.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: '',
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Bibury Animation Studios',
    synopsis:
      'Doce capitulos entre el 8 de enero y el 26 de marzo de 2021, ya con Bibury. ' +
      'Viaje a Kioto, la despedida septuple de Nino, el examen final y la guerra abierta de hermanas en la misma clase. ' +
      'Aqui la serie sube de nivel y deja el festival a la vuelta.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: 'La película',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'Bibury Animation Studios',
    synopsis:
      'Ciento treinta y seis minutos estrenados el 20 de mayo de 2022. ' +
      'Festival cultural con Futaro eligiendo por fin, y salto al futuro con boda. ' +
      'La pelicula que cierra las cinco historias sin dejar a ninguna atras.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: 'Especial de verano',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Shaft',
    synopsis:
      'Dos capitulos del 2 y el 9 de septiembre de 2023, en Shaft. ' +
      'Historias del manga que el anime no habia adaptado, con unas vacaciones de verano donde nada es casualidad. ' +
      'Dos entregas sueltas para volver a verlas juntas.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: 'Luna de miel',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'Bibury Animation Studios',
    synopsis:
      'Dos capitulos del arco de la luna de miel, con estreno en cines el 20 de septiembre de 2024. ' +
      'Ya casados y adultos, Futaro y las quintillizas viajan a Hawái entre preparativos que se tuercen. ' +
      'Historia original que cierra la saga con la familia al completo.',
    capitulos: 'T5',
  },
];
