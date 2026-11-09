// META - Guardianes de la Noche: Tren Infinito
//
// AniList 112151 (peli, 2020, 117 minutos).
// IMDb tt11032374: 8,2 con unas 104.200 votos.
// JustWatch ES: tm842683. Disponible en Amazon Prime Video y en
// alquiler/compra en Apple TV.
//
// Es la película que continúa la primera temporada de Kimetsu no
// Yaiba. Va como ficha propia, igual que las películas de Fate, para
// que la wiki no mezcle el arco del tren con los capítulos de la serie.

export const ANIME = {
  titulo: 'Guardianes de la Noche: Tren Infinito',

  japaneseTitle: '鬼滅の刃 無限列車編',

  synopsis:
    'Tanjirou, Nezuko, Inosuke y Zenitsu suben al Tren Infinito para investigar la desaparición de decenas de pasajeros. ' +
    'Allí les espera Rengoku, el Pilar de la Llama, y un demonio que ha convertido los sueños de la tripulación en una trampa. ' +
    'Lo que empieza como una misión de rescate termina en una noche que ninguno de los cuatro va a olvidar.',

  anio: 2020,
  estado: 'finished',
  estudio: 'ufotable',

  categorias: ['Shonen & Acción', 'Fantasía & Magia'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Demonios', 'Drama', 'Sobrenatural'],
};

export const ANIME_ID = 'guardianes-de-la-noche-tren-infinito';

export const ALIASES = [
  'Demon Slayer: Mugen Train',
  'Kimetsu no Yaiba: Mugen Train',
  'Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train',
];

/**
 * Nota de IMDb para la película completa (tt11032374).
 */
export const RATING_SERIE = 8.2;

export const EPISODIOS_TOTAL = 1;

/**
 * Donde se emite en España. La lista completa de filas la escribe el
 * importador de JustWatch; aquí quedan las plataformas principales.
 */
export const STREAMING = [
  { name: 'Amazon Prime Video', url: 'https://www.primevideo.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
  { name: 'Apple TV (alquiler y compra)', url: 'https://tv.apple.com/es', badgeColor: 'bg-zinc-500/20 text-zinc-300' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'ufotable',
    synopsis:
      'La película continúa justo después de la primera temporada: el grupo sube al tren para investigar las desapariciones y Rengoku toma el mando. El demonio Enmu duerme a los pasajeros y les da un sueño del que no quieren salir, mientras Tanjirou busca la forma de despertar sin perder a su hermana. La segunda mitad es una pelea contra el reloj y contra un enemigo que no se cansa.',
    capitulos: 'T1',
  },
];
