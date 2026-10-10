// LA FICHA DEL ANIME - DanMachi
//
// Titulo corto oficial: es como se conoce la serie en todos lados,
// incluido el portal oficial (danmachi.com). El titulo largo en
// ingles no se usa porque el id tiene que ser el slug del titulo y
// un id de diez palabras no lo busca nadie.

export const ANIME = {
  titulo: 'DanMachi',

  // De TVDB, que lo trae de la ficha japonesa.
  japaneseTitle: 'ダンジョンに出会いを求めるのは間違っているだろうか',

  // Base: la ficha de la serie en la Wikipedia en ingles y el portal
  // oficial. Lo que tiene que quedar claro: Bell no es un elegido ni
  // un reencarnado, es un chico normal con una habilidad que crece
  // cuando siente algo fuerte, y la serie va de como Orario entera
  // acaba girando a su alrededor mientras el solo quiere alcanzar a
  // la espadachina que lo salvo.
  synopsis:
    'Bell Cranel, un chico de campo de catorce anos, llega a Orario, la ciudad construida sobre ' +
    'una mazmorra sin fondo, buscando fortuna como aventurero. La diosa Hestia, recien bajada del ' +
    'cielo y sin nada propio, lo acoge como primer miembro de su familia. En su primer dia en la ' +
    'mazmorra un minotauro casi lo mata y lo salva Ais Wallenstein, la espadachina mas famosa de ' +
    'la ciudad. Bell se propone alcanzarla cueste lo que cueste, y su habilidad crece a un ritmo ' +
    'que nadie entiende cada vez que siente algo con fuerza. A su alrededor se juntan una diosa ' +
    'celosa, una ladrona arrepentida, un herrero con orgullo y media ciudad con planes propios. ' +
    'Lo que empieza como la historia de un novato termina moviendo dioses, familias enteras y la ' +
    'mazmorra misma, porque en Orario hasta un encuentro casual puede cambiarlo todo.',

  anio: 2015,
  estado: 'finished',
  estudio: 'J.C.Staff',

  // AniList (Action, Adventure, Comedy, Fantasy, Romance) y la pagina
  // de Crunchyroll en espanol. Dos categorias, como pide la ficha.
  categorias: ['Acción & Aventura', 'Fantasía & Romance'],

  generos: ['Acción', 'Aventura', 'Comedia', 'Fantasía', 'Romance'],
};

export const ANIME_ID = 'danmachi';

/**
 * LAS SEIS ENTRADAS (cinco temporadas + pelicula)
 *
 * T1  13 capitulos  (abril-junio de 2015)
 * T2   1 capitulo   (pelicula Arrow of the Orion, febrero de 2019)
 * T3  12 capitulos  (julio-septiembre de 2019)
 * T4  12 capitulos  (octubre-diciembre de 2020)
 * T5  22 capitulos  (julio-octubre de 2022 y enero-marzo de 2023)
 * T6  15 capitulos  (octubre de 2024-marzo de 2025)
 * --
 *     75
 *
 * La pelicula va como T2 por orden cronologico (febrero de 2019,
 * antes que la segunda temporada de julio). Eso obligo a renumerar
 * las temporadas 2 a 5, que pasaron a T3-T6 con documentos e ids
 * nuevos: mantener los viejos habria dejado dos temporadas
 * distintas compartiendo numero. Cuando llegue la sexta temporada
 * de la serie ira a la T7.
 *
 * La quinta (antes cuarta) va como UNA temporada con 22 capitulos
 * aunque se emitio en dos partes: es como la lista TVDB y como la
 * cuenta la propia serie (DanMachi IV con arco final aparte).
 * Partirla en dos fichas dejaria dos temporadas cojas de 11
 * capitulos que nadie reconoce.
 *
 * Hay una SEXTA TEMPORADA anunciada el 7 de febrero de 2026, sin
 * fecha ni capitulos. No entra aqui porque una temporada sin
 * capitulos se guardaria vacia en la wiki. Cuando tenga fecha, es
 * anadir la entrada y crear el fichero.
 */
export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2015,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Bell entra en la familia Hestia y baja a la mazmorra con mas valor que nivel. Conoce a Ais, ' +
      'que lo salva de un minotauro, y desde entonces entrena para alcanzarla. Por el camino se le ' +
      'unen Lili, una ladrona de la familia Soma que lo traiciona y se arrepiente, y Welf, un herrero ' +
      'que reniega de las espadas magicas de su sangre. La temporada cierra con el festival de ' +
      'monstruos, el cuchillo que Hestia forja para el y el dios Apolo fijandose en el conejo blanco.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Arrow of the Orion',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Pelicula de 82 minutos: la diosa Artemisa encarga a Bell recuperar la lanza de Orion en ' +
      'un festival lejano. Lo que empieza como fiesta con concurso acaba en pelea contra algo ' +
      'anterior a Orario, con Hermes enredando al fondo. No hace falta haber visto la serie para ' +
      'seguirla, pero ayuda saber quien es cada dios.',
    capitulos: 'T2',
  },
  {
    numero: 3,
    titulo: '',
    anio: 2019,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Apolo obliga a Hestia a un Juego de Guerra apostando a Bell, y la familia pequena gana al ' +
      'gigante con ayuda de Takemikazuchi, Miach, Hermes y Ryu. Con casa nueva toca el rescate de ' +
      'Haruhime del distrito del placer de Ishtar, con Aisha cambiando de bando a mitad de fiesta. ' +
      'Cierra con el ejercito de Rakia llamando a la puerta y la cancion con la que Hestia levanta ' +
      'a la ciudad.',
    capitulos: 'T3',
  },
  {
    numero: 4,
    titulo: '',
    anio: 2020,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Bell encuentra en la mazmorra a Wiene, una chica dragon que habla y piensa: una Xenos, un ' +
      'monstruo con razon. La esconde y la defiende mientras la familia Ikelos los caza para el ' +
      'mercado negro y aparece Knossos, el laberinto artificial. Hasta la familia Loki, con Ais a ' +
      'la cabeza, se pone enfrente. Bell queda como el necio que protege monstruos, y lo asume.',
    capitulos: 'T4',
  },
  {
    numero: 5,
    titulo: '',
    anio: 2022,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Expedicion a los pisos profundos que nadie ha pisado. El Juggernaut, el desastre que la ' +
      'mazmorra escupe cuando se le hace dano, masacra al grupo y separa a Bell y Ryu del resto. ' +
      'Solos abajo sale el pasado de Ryu: su familia Astrea y su maestra Alise, muertas por el mismo ' +
      'desastre anos atras. Reagrupados en el palacio blanco, Bell lo vence con la espada Argo Vesta ' +
      'y las pociones de Fels, y Ryu elige la justicia de su maestra en vez de la venganza.',
    capitulos: 'T5',
  },
  {
    numero: 6,
    titulo: '',
    anio: 2024,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Syr, la camarera de siempre, invita a Bell a una cita. Pero Syr es Freya, la diosa de la ' +
      'belleza, que lo quiere para ella y encanta a Orario entera para arrebatarlo. Solo Hestia y ' +
      'los suyos resisten. Hay Juego de Guerra entre familias, con Hedin y Hogni entre los ' +
      'ejecutores de Freya. Bell gana, rompe el encanto y elige a la Syr mortal antes que a la ' +
      'diosa. Freya pierde su divinidad y la ciudad despierta.',
    capitulos: 'T6',
  },
];

/**
 * Nota de la serie en IMDb: 7,4 con unos 14.000 votos.
 *
 * No es una nota de obra maestra y conviene decir por que sigue
 * aqui: es la serie de aventuras de manual hecha con oficio, con
 * temporadas muy desiguales (la T4 roza el 9 en sus picos y la T2
 * se queda en el 7 raspado) y un protagonista que cae bien. El
 * capitulo 20 de la T4, el de la familia Astrea, tiene un 9,0 y es
 * con diferencia lo mejor puntuado del catalogo de esta serie.
 */
export const RATING_SERIE = 7.4;

/**
 * Capitulos en total, contando las cinco temporadas.
 *
 *   T1  13  capitulos  (abril-junio de 2015)
 *   T2  12  capitulos  (julio-septiembre de 2019)
 *   T3  12  capitulos  (octubre-diciembre de 2020)
 *   T4  22  capitulos  (julio-octubre de 2022 y enero-marzo de 2023)
 *   T5  15  capitulos  (octubre de 2024-marzo de 2025)
 *   T6   1  pelicula   (febrero de 2019)
 *   --
 *       75
 *
 * Sin OVAs ni especiales: TVDB los lista en la temporada 0 y aqui
 * no entran, igual que en el resto del catalogo.
 */
export const EPISODIOS_TOTAL = 75;

/**
 * Donde se emite, verificado uno por uno.
 *
 *   - Crunchyroll -> pagina de la serie en espanol, con las cinco
 *                    temporadas en catalogo.
 *   - Selecta Vision -> edita los Blu-ray en Espana (pack de las
 *                    cuatro primeras temporadas y edicion
 *                    coleccionista), asi que es quien la trae aqui.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
  { name: 'Selecta Vision', url: 'https://www.selectavision.com', badgeColor: 'bg-sky-500/20 text-sky-300' },
];
