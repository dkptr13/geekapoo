// LA FICHA DEL ANIME - Ragna Crimson
//
// Titulo oficial tal cual. Del manga de Daiki Kobayashi (Gangan
// Joker, 2017), adaptado por SILVER LINK en 24 capitulos seguidos.

export const ANIME = {
  titulo: 'Ragna Crimson',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: 'ラグナクリムゾン',

  // Base: la ficha y la lista de capitulos de la Wikipedia en
  // ingles. Lo que tiene que quedar claro: no es fantasia heroica
  // al uso, es fantasia oscura donde los dragones ganan casi
  // siempre, el protagonista viene del futuro derrotado y su aliado
  // es un monarca dragon traidor que planea matar hasta a el.
  synopsis:
    'En un mundo donde los dragones gobiernan cielo, mar y tierra, Ragna es un cazador sin ' +
    'talento que vive a la sombra de Leonica, la genio que lo protege. Cuando suena con la ' +
    'muerte de ella, aparece su yo del futuro: cuarenta anos de derrotas despues le pasa sus ' +
    'recuerdos y un cuerpo capaz de matar dragones al tacto. Aliado con Crimson, un monarca ' +
    'dragon traidor que quiere exterminarlos a todos empezando por su propio dios, Ragna ' +
    'persigue a los seis linajes mientras el reino cae. Victoria tras victoria con sabor a ' +
    'derrota, porque cada monarca muerto cuesta una ciudad y cada plan de Crimson esconde ' +
    'otro plan.',
  anio: 2023,
  estado: 'finished',
  estudio: 'SILVER LINK',

  // Fantasia oscura de accion: los dos cajones del panel que le
  // tocan, con Shonen delante porque el manga es de Gangan Joker.
  categorias: ['Fantasía & Aventura', 'Shonen & Acción'],

  generos: ['Acción', 'Aventura', 'Fantasía', 'Misterio', 'Dragones', 'Venganza', 'Shonen', 'Magia'],
};

export const ANIME_ID = 'ragna-crimson';

export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

/**
 * UNA SOLA TEMPORADA
 *
 * T1  24 capitulos  (octubre de 2023-marzo de 2024)
 *
 * Se emitio del tiron en dos partes pero TVDB la lista como una
 * sola temporada de 24, y es como la cuenta todo el mundo. Partirla
 * dejaria dos medias temporadas que nadie reconoce.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'SILVER LINK',
    synopsis:
      'Ragna recibe el poder de su yo futuro y se alia con Crimson para cazar a los seis ' +
      'linajes de monarcas dragon: Grymwelte, Disas, Ultimatia y compania. Por en medio, ' +
      'la princesa Starlia y su cuerpo franco plantan cara con plata, y cada victoria ' +
      'cuesta una ciudad. Cierra con Ragna peleando en el espacio contra el dios del ' +
      'rayo y la luz volviendo despues de tanta muerte.',
    capitulos: 'T1',
  },
];

/**
 * Nota de la serie en IMDb: 7,2 con unos 2.900 votos.
 *
 * Serie de notable raspado con picos altos: el primer capitulo
 * (8,2) y varios ochos largos en la segunda parte. El arranque
 * doble y el final tiran de la media hacia arriba.
 */
export const RATING_SERIE = 7.2;

/**
 * Capitulos en total: los 24 de la unica temporada, del 1 de octubre
 * de 2023 al 31 de marzo de 2024.
 */
export const EPISODIOS_TOTAL = 24;

// Sin plataformas verificadas en Espana: JustWatch dice que aqui no
// hay ninguna (HIDIVE es de USA e Italia y otros 12 paises, pero no
// Espana). Igual que con Plastic Memories: no inventar es mejor que
// poner una, asi que se queda vacio.
