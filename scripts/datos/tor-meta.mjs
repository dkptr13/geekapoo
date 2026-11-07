// META - Toradora!
//
// ── EL TITULO ─────────────────────────────────────────────────────
//
// "Toradora!" con admiracion y todo, que es como lo escribe la propia
// serie: el nombre viene de "Tora" (de "Tiger") y "Dora" (de "Palomera"),
// los dos motes de Taiga, y el bang final va en la version original.
//
// El japones es "とらドラ!", con los dos motes en hiragana.
//
// ── LO QUE ES ESTA SERIE ─────────────────────────────────────────
//
// Una historia de odio mutuo que se disfraza de todo lo demas. Ryuuji y
// Taiga se golpean, Taiga amenaza a Ryuuji con matarlo, y poco despues
// Ryuuji le explica a su amigo que la va a "...para" interpretarla. Todo
// lo que hacen por el otro lo hacen diciendo que no lo hacen por el otro, y
// la serie entera consiste en que los dos acaban diciendo eso.
//
// Que los dos tienen problemas de casa, que no son privados, no es un
// adorno: el capitolo 6 se dedica entero a la familia de Ryuuji y es el
// que dice que el chaval no esta bien.
//
// ── LOS CAPITULOS QUE MANDAN ─────────────────────────────────────
//
//   · El 9, la playa. Es donde los dos mienten de verdad.
//   · El 13, el desenlace del festival cultural.
//   · El 16, el mejor capitulo de la temporada segun IMDb (8,6).
//   · El 19, el mejor de todos (8,9).
//   · El 24, la confesion. Que no resuelve nada, y a proposito.
//
// ── LAS DOS TEMPORADAS ────────────────────────────────────────────
//
//   T1  2008  la serie de television, 25 capitulos
//   T2  2011  la OVA de la graduacion
//
// La OVA va aparte porque lo es: es una pelicula de 26 minutos con su
// fecha y su nota, y casi tres años despues. Ponerla como capitulo 26
// haria que la serie pareciera de 26 capitulos, que no es lo que se emitio.

export const ANIME = {
  titulo: 'Toradora!',

  japaneseTitle: 'とらドラ!',

  synopsis:
    'Ryuuji Takasu es el presidente del consejo estudiantil de un instituto normal, le va bien ' +
    'todo y no se queja de nada, que es exactamente el problema. Taiga Aisaka es lo contrario: ' +
    'la casa esta en bancarrota, su padre es un fechero y su hermano pequeno le esta arruinando la ' +
    'vida. Un dia Ryuuji le pega una paliza sin saber quien es, y Taiga le contesta rompiéndole una ' +
    'costilla en la puerta de su casa. A partir de ahi los dos se apoyan el uno al otro haciendo ' +
    'exactamente lo contrario de apoyarse: Taiga se sirve de la herida como excusa para acercarse, y ' +
    'Ryuuji aprovecha lo mismo para arreglar su propia familia sin querer arreglar la de ella. ' +
    'Lo que hay debajo es muy serio. Ryuuji no habla con su padre desde que era pequeño y va a ' +
    'descubrir por que; Taiga tiene una madre que se muere poco a poco y un hermano al que no puede ' +
    'proteger de lo que es su padre. Los dos tienen la impression de estar haciendo un favor al otro ' +
    'y los dos se equivocarían los dos. Lo que la serie hace con eso, capitulo a capitulo, es la ' +
    'cosa mas rara que ha hecho una serie deschool romantic en mucho tiempo: cuenta un ' +
    'enredo amoroso en el que casi nadie se esta mintiendo sobre lo que siente, y cuenta al mismo ' +
    'tiempo dos familias que se hacen pedazos. Cuando por fin se dicen lo que se dicen, ya no ' +
    'queda nada que arreglar y no intenta arreglarlo.',

  anio: 2008,
  estado: 'finished',
  estudio: 'J.C.Staff',

  categorias: ['Romance', 'Comedia'],

  generos: ['Romance', 'Comedia', 'Drama', 'Escolar', 'Recuentos de la vida'],
};

export const ANIME_ID = 'toradora';

/**
 * Media de los 26 capitulos emitidos en IMDb (25 de television mas la OVA):
 * la de la serie tt1279024 es 7,9 con 24.089 votos, y la OVA tt5206584 es
 * 7,1 con 511. La media ponderada da 7,8.
 */
export const RATING_SERIE = 7.8;

/**
 * Capitulos en total.
 *
 *   T1  25  (octubre 2008 - marzo 2009)
 *   T2   1  (diciembre 2011, la OVA)
 *   --
 *       26
 */
export const EPISODIOS_TOTAL = 26;

/**
 * Donde se emite.
 *
 *   · Crunchyroll -> fuera de Japon, desde 2015.
 */
export const STREAMING = [
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', badgeColor: '#f47521' },
];

export const TEMPORADAS = [
  {
    numero: 1,
    titulo: '',
    anio: 2008,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Ryuuji le pega una paliza a Taiga sin saber quien es. Taiga le devuelve el golpe en la puerta ' +
      'de su casa y, en vez de seguir, encuentra en Ryuuji a alguien al que puede ' +
      'incumplir sus problemas. Empieza el acuerdo: Taiga se sirve de la vieja herida ' +
      'y Ryuuji hace lo mismo con la suya. Poco a poco los dos acaban manteniendo la ' +
      'fachada tan bien que el resto del grupo la da por buena y nadie se atreve a preguntar. ' +
      'En medio entran los otros: Minori, que es la unica que ve el conjunto desde el ' +
      'principio; Ami, que es todo lo contrario de lo que parece; Yusaku, Koji, Inage y el ' +
      'resto, que son el grupo con el que se decide lo que pasa. Los doce primeros capitulos ' +
      'son el montaje. A partir del trece el festival cultural lo pone todo a prueba, el 16 ' +
      'es el que mas duele y el 19 el mejor puntuado de la temporada, y el final deja la ' +
      'pregunta abierta sin responderla. La ultima escena es una promesa que los dos hacen ' +
      'sabiendo que no van a poder cumplir.',
    capitulos: 'T1',
  },
  {
    numero: 2,
    titulo: 'Bentou no Gokui',
    anio: 2011,
    estado: 'Finalizado',
    estudio: 'J.C.Staff',
    synopsis:
      'Tres años y pico después de la última escena de la serie, en el blister de Blu-ray. Todo el ' +
      'grupo está en la graduación de secundaria y tiene que decidir a qué se va a dedicar, y las ' +
      'decisiones que se toman son la consecuencia directa de todo lo que había pasado antes. Nadie ' +
      'repite los errores de la serie y eso es lo que hace que duela:Taiga sigue con la casa, Ryuuji ' +
      'sigue sin hablar con su padre, y los dos han tenido tres años para pensar en lo que no se ' +
      'dijeron. No es una temporada nueva: es el epílogo que la serie de televisión no se atrevia a rodarse.',
    capitulos: 'T2',
  },
];