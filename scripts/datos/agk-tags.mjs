// ETIQUETAS DE LOS PERSONAJES DE AKAME GA KILL!
//
// Van en un fichero aparte, y no dentro de `agk-personajes.mjs`, por
// las dos razones que se explican en `ysa-tags.mjs`: las etiquetas son
// texto libre y cambian mucho mas que el resto, y separadas se pueden
// COMPROBAR que no se separan entre si (`comprobar-datos.mjs` avisa si
// un personaje se queda sin ninguna).
//
// ── EL VOCABULARIO ───────────────────────────────────────
//
// Se reutilizan tal cual las etiquetas que ya usan otros animes del
// catalogo. Las de aqui que ya existian:
//
//   Destacados, Más Me gusta, Antagonistas, Protagonista, Amistad,
//   Genio, Estudiante, Consejo Estudiantil, Hermano menor, Hermanos,
//   Hermana menor, Madre, Padre, Fría, Raro, Severo, Silencioso,
//   Trabajador, Líder, Chef (no existe, ver mas abajo), Presumido,
//   Soldado, Detective, Príncipe, Princesa, Maestro, Genio
//
// ── POR QUE EL EJE SON LOS DOS BANDOS ─────────────────────
//
// Es lo unico que se pregunta uno al ver a un personaje de esta serie:
// de Night Raid o del Imperio. Por eso casi todos llevan "Night Raid" o
// "Imperio", y por eso la etiqueta "Teigu" la llevan los que de verdad
// portan uno (no el que se lo han NEVER'.
//
// ── EL LÍMITE ─────────────────────────────────────────────
//
// 40 caracteres por etiqueta (`MAX_TAG`), y todas estas entran de
// sobra. "Fraternidad de los rakshasa" es la mas larga, con 25.
//
// ── POR QUE NO HAY "COOK" ─────────────────────────────────
//
// Bulat es el que cocina, pero en este catalogo "Cocina" ya existe como
// etiqueta de la pagina de Sasha. Reutilizarla aqui separaria a Sasha
// de Bulat en el buscador, que es justo lo que se quiere evitar, asi
// que se deja la de la pagina y se anade "Cocina" tambien a Sasha.
//
// ── "TEIGU" Y QUIEN LO PORTA ──────────────────────────────
//
// No todo el mundo lleva Teigu en esta serie, y hay gente que lleva el
// arma de su bando sin Teigu (los rakshasa, el capitan Ogre). La
// etiqueta va solo en quien de verdad porta uno, que es lo que hace que
// la etiqueta sirva para algo.

export const TAGS = {
  // ── Night Raid ─────────────────────────────────────────
  'Tatsumi': ['Destacados', 'Protagonista', 'Night Raid', 'Más Me gusta', 'Principiante'],
  'Akame': ['Destacados', 'Protagonista', 'Night Raid', 'Más Me gusta', 'Teigu', 'Hermanas'],
  'Mine': ['Destacados', 'Night Raid', 'Teigu', 'Fría', 'Más Me gusta'],
  'Leone': ['Destacados', 'Night Raid', 'Teigu', 'Más Me gusta', 'Hermana mayor'],
  'Najenda': ['Night Raid', 'Líder', 'Teigu', 'Jefa', 'Veterana'],
  'Bulat': ['Night Raid', 'Teigu', 'Cocina', 'Grande', 'Generoso'],
  'Sheele': ['Night Raid', 'Teigu', 'Torpe', 'Más Me gusta'],
  'Lubbock': ['Night Raid', 'Teigu', 'Rival', 'Biblioteca', 'Ingenioso'],
  'Chelsea': ['Night Raid', 'Teigu', 'Más Me gusta', 'Nueva', 'Disfraz'],
  'Susanoo': ['Night Raid', 'Teigu', 'Cocina', 'Habilidades domésticas', 'Silencioso'],

  // ── El bando del Imperio ───────────────────────────────
  'General Esdeath': ['Destacados', 'Antagonistas', 'Imperio', 'Jaeger', 'Más Me gusta', 'Teigu'],
  'Prime Minister Honest': ['Destacados', 'Antagonistas', 'Imperio', 'Jefe', 'Manipulador', 'Teigu'],
  'Emperor Makoto': ['Imperio', 'Antagonistas', 'Niño', 'Teigu', 'Inconsciente'],
  'Seryu Ubiquitous': ['Imperio', 'Jaeger', 'Fanatica', 'Policía', 'Teigu', 'Más Me gusta'],
  'Dr. Stylish': ['Antagonistas', 'Imperio', 'Científico', 'Experimentos', 'Teigu', 'Jaeger'],
  'Wave': ['Imperio', 'Jaeger', 'Teigu', 'Cambio de bando', 'Honesto'],
  'Kurome': ['Antagonistas', 'Imperio', 'Jaeger', 'Hermanas', 'Teigu', 'Marionetas'],
  'Run': ['Imperio', 'Jaeger', 'Teigu', 'Caballero', 'Buen hombre'],
  'Bols': ['Imperio', 'Jaeger', 'Teigu', 'Cocina', 'Buen hombre'],
  'Captain Ogre': ['Imperio', 'Antagonistas', 'Policía', 'Muerte pronta'],
  'Zank': ['Antagonistas', 'Imperio', 'Teigu', 'Loco', 'Verdugo'],
  'Daidara': ['Imperio', 'Antagonistas', 'Tres Bestias', 'Teigu', 'Bruto'],
  'Nyau': ['Imperio', 'Antagonistas', 'Tres Bestias', 'Teigu', 'Sádico'],
  'Liver': ['Imperio', 'Antagonistas', 'Tres Bestias', 'Teigu', 'Veterano'],
  'Bolic': ['Antagonistas', 'Imperio', 'Secta', 'Enmascarado', 'Corrupto'],
  'Great General Budo': ['Imperio', 'Antagonistas', 'General', 'Teigu', 'Veterano'],
  'Syura': ['Imperio', 'Antagonistas', 'Teigu', 'Hijo del primer ministro', 'Presumido'],
  'Holimaca': ['Imperio', 'Antagonistas', 'Guardaespaldas', 'Teigu'],
  'Ibara': ['Imperio', 'Antagonistas', 'Rakshasa', 'Fraternidad de los rakshasa'],
  'Sten': ['Imperio', 'Antagonistas', 'Rakshasa', 'Fraternidad de los rakshasa'],
  'Mez': ['Imperio', 'Antagonistas', 'Rakshasa', 'Fraternidad de los rakshasa'],
  'Suzuka': ['Imperio', 'Antagonistas', 'Rakshasa', 'Fraternidad de los rakshasa'],

  // ── Los tres del capitulo uno ──────────────────────────
  'Gozuki': ['Imperio', 'Antagonistas', 'Entrenador de asesinos', 'Secuestra ninos', 'Hermanas'],
  'Aria': ['Antagonistas', 'Imperio', 'Aristocracia', 'Verdugo', 'Capitulo uno'],
  'Sayo': ['Víctima', 'Amigos de la infancia', 'Capitulo uno', 'Muerta'],
  'Ieyasu': ['Amigos de la infancia', 'Víctima', 'Capitulo uno', 'Muerte famosa'],
};