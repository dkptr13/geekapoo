// METADATOS DE LAS TEMPORADAS
//
// Sinopsis de temporada, escritas para este catalogo. Van aqui y
// no junto a los capitulos porque son tres frases largas y
// separarlas evita tener el fichero de la T1 ocupado con algo que
// no es suyo.
//
// El `title` de la temporada va VACIO en las tres. Ni la T1 ni la
// T2 tienen subtitulo oficial (son "Temporada 1" y "Temporada 2"),
// y la T3 solo tiene el nombre del arco que adapta ("el
// entrenamiento de Eris"), que es una descripcion del argumento y
// no un titulo. Ponerle un nombre inventado seria fabricar un dato
// que no existe; la wiki ya enseña "Temporada N" cuando no hay
// titulo.
//
// El `rating` de la temporada es la MEDIA de las notas de sus
// capitulos, no una nota de IMDb. IMDb no publica una por temporada
// para esta serie: solo la de la serie completa (8,2) y las de cada
// capitulo.
//
// Que sea la media no significa que sea inventada: cada capitulo
// lleva su nota real de IMDb, y la media sale de ahi. Lo que no
// existe es una nota de temporada que venga de IMDb.
//
// Los capitulos EXTRA, que no se emitieron por television y por tanto
// no estan en la lista de IMDb (la OVA), quedan fuera del promedio:
// sin nota no son ni buenos ni malos.
// ──────────────────────────────────────────────────────────
// LA FICHA DEL ANIME
// ──────────────────────────────────────────────────────────
//
// Los datos que van al documento `animes/{id}`, que es lo que escribe
// `crear-anime.mjs`. Van aqui y no en ese script porque ese script
// tambien lleva la ficha de Ataque a los Titanes: si cada anime
// tuviera su propio script de creacion, el nombre del anime
// apareceria duplicado en cada uno y habria que actualizar todos a
// mano cada vez que se anade una serie.
//
// `categoria` guarda la primera de la lista porque es lo que leen las
// fichas antiguas de la wiki; `categorias` lleva la lista entera para
// las que encajan en varias. Los dos campos existen porque los dos se
// leen, y por eso los pone el panel.
//
// La sinopsis es la de Netflix España, que es el distribuidor en
// castellano. No esta escrita por mi: una sinopsis inventada seria una
// descripcion falsa de la serie en la wiki.

export const ANIME = {
  titulo: 'Mushoku Tensei: Reencarnación desde cero',
  japaneseTitle: '無職転生 〜異世界行ったら本気だす〜',
  synopsis:
    'Un hombre en paro y sin rumbo muere y despierta en un mundo mágico lleno de ' +
    'aventuras, donde decide vivir su nueva vida al máximo.',
  anio: 2021,
  // 'emitiendo' y no 'Finalizado': el capulo de Shamap, que es la que
  // se emite ahora mismo. El vocabulario corto es el que leen el
  // filtro del panel y `estadoCorto`.
  estado: 'emitiendo',
  // Studio Bind, no Trigger: es el estudio que se creo en 2019
  // expresamente para adaptar Mushoku Tensei (White Fox + Egg Firm) y
  // el que lleva las tres temporadas.
  estudio: 'Studio Bind',
  categorias: ['Fantasía & Aventura', 'Seinen & Psicológico'],
  generos: ['Isekai', 'Aventura', 'Fantasía', 'Drama', 'Romance', 'Ecchi', 'Magia', 'Coming-of-age'],
};

/** El id es el slug del título, que es lo que construye el panel. */
export const ANIME_ID = 'mushoku-tensei-reencarnacion-desde-cero';


/** Nota de la serie completa en IMDb, ponderada. */
export const RATING_SERIE = 8.2;

// Capitulos en total, contando los dos especiales.
//
//   T1  24  (23 de television + el 15.5, que solo salio en el Blu-ray 4)
//   T2  25  (24 de television + el 0.5, "Guardian Fitz")
//   T3  14
//   --
//      63
//
// Antes eran 61 y despues 62: faltaba el especial de la T2, que si cuenta
// IMDb (como T2.E0) y que ya estaba en Firestore. El contador de la ficha
// tiene que ser el de los capitulos que de verdad hay, no el que cuenta
// IMDb como "serie principal".
export const EPISODIOS_TOTAL = 63;

export const TEMPORADAS = [
  {
    numero: 1,
    anio: 2021,
    estado: 'Finalizado',
    estudio: 'Studio Bind',
    synopsis:
      'Rudeus, un hombre de 34 años sin trabajo y sin rumbo, muere atropellado al salir corriendo a ' +
      'avisar a un grupo de alumnos que se saltan un semáforo. Despierta reencarnado como un bebé en un ' +
      'mundo de magia y espadas, con todos sus recuerdos intactos, y se promete no repetir su vida ' +
      'anterior. Antes de cumplir el año ya lanza hechizos sin recitar; a los diez, su padre lo lleva al ' +
      'continente mágico en busca de la legendaria maga Roxy. Lo que encuentra allí no es una soya: se ' +
      'convierte en un mago de leyenda en Millishion, entra en la Universidad de Magia de Ranoa y ' +
      'termina volviendo a casa, donde se reencuentra con Eris, la niña que de pequeña le pegaba a ' +
      'los juguetes, ya convertida en una espadachina que golpea a todo el que se le acerca. Años ' +
      'después le pide que sea su esposa y ella se marcha al otro lado del continente sin decir una ' +
      'palabra.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    anio: 2023,
    estado: 'Finalizado',
    estudio: 'Studio Bind',
    synopsis:
      'Rudeus ya es adulto: vive en Millishion con Sylphiette, su hija Lucy y una tienda de magia que ' +
      'funciona. Lo que rompe esa vida es el regreso de su padre Paul, veinte años después y ' +
      'convertido en un borracho, y la tensión entre los dos va a estar a punto de costarle lo que más ' +
      'le importa. En paralelo, Rudeus vuelve a Ranoa como profesor, conoce a Zanoba y su obsesión por ' +
      'las muñecas, y se topa con la tribu demoníaca y con Kishirika. Se casa con Roxy, recibe a Eris ' +
      'de vuelta en casa a petición de Ghislaine, y con Aisha recorre el laberinto de la universidad. ' +
      'La temporada termina con la llegada de otro hijo y con Rudeus entendiendo, por fin y a la fuerza, ' +
      'lo que su padre hizo y lo que le costó.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    anio: 2026,
    estado: 'En emisión',
    estudio: 'Studio Bind',
    synopsis:
      'La historia se aleja de Rudeus y se queda con Eris. La vemos llegar a la Tierra Santa de la ' +
      'Espada con Ghislaine, declarar ante el Espada Dios que su único objetivo es matar a Orsted, y ' +
      'entrenar sin descanso hasta que sus compañeros de pupilaje le ponen el apodo de la Fiera. En ' +
      'Ranoa, Rudeus tiene que quedarse con una invasión de alumnos de otra raza que piden casarse entre ' +
      'ellos, se cruza con Badigadi y acaba enfrentándose a la fortaleza volante del Rey Dragón Acorazado. ' +
      'Eris progresa hasta convertirse en Espada Rey, Nina Farion pasa de rival a compañera, y el Agua Dios ' +
      'Reida Lia trae a su aprendiz Isolte Cruel para que el trio mida sus fuerzas. Al final, Rudeus ' +
      'lee un diario que le muestra la vida que pudo tener, y decide no repetir los errores de la otra.',
    capitulos: 'T3',
  },
];
/**
 * Donde se emite.
 *
 * La lista va en el fichero de datos y no en Firestore a mano, porque
 * `crear-anime.mjs` deja el campo `streaming` vacio a proposito y lo
 * escribe `anadir-plataformas.mjs`. Un anime con la lista en la base
 * pero no en el fichero se pierde en cuanto se vuelve a crear el
 * anime en otra base de pruebas: el fichero es la fuente.
 *
 * Lo que hay en la base es lo de aqui: Crunchyroll y Netflix.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Netflix', url: 'https://www.netflix.com/es', badgeColor: 'bg-red-500/20 text-red-300' },
];
