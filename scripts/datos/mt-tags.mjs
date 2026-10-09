// ETIQUETAS DE LOS PERSONAJES DE MUSHOKU TENSEI
//
// Van en un fichero aparte, y no dentro de `mt-personajes.mjs`, por
// dos razones:
//
//   · Las etiquetas son texto libre y cambian mucho mas que el resto
//     de los datos de un personaje. Mezclarlas con el nombre japones
//     o el seiyuu hace que cada retoque de una linea arriesgue el
//     archivo entero.
//
//   · Al separarlas se puede COMPROBAR que no se separan entre si:
//     `comprobar-datos.mjs` avisa si un personaje no tiene
//     ninguna etiqueta o si hay una etiqueta de un personaje que no
//     existe. Con los datos en el mismo array, un personaje nuevo
//     olvidado aqui no se nota.
//
// ── EL VOCABULARIO ───────────────────────────────────────
//
// Las etiquetas del proyecto ya tienen un tono: no son solo
// descriptivas, hay algunas de broma ("Más Me gusta",
// "Consejo Estudiantil", "Meme Queen"). Un anime como este, que es
// de Aventura y magia, se entiende mejor con las dos cosas:
// etiquetas de quién es ("Maga", "Espadachina", "Familia Greyrat")
// y una o dos de la voz del sitio.
//
// Se reutilizan tal cual las que ya usan otros animes del catálogo
// para no inventar casi-duplicados: si el buscador encuentra
// "Maga" y "Mago" por separado, el filtro deja de servir.
//
//   Maga / Elfa / Genio / Tsundere      ya existen en el catálogo
//   Destacados                          la que filtra la wiki
//   Más Me gusta                        ya existe
//   Consejo Estudiantil                 ya existe
//
// El resto se agrupa en el nombre del grupo al que pertenece la
// persona, que es lo que de verdad se busca al mirar la ficha de un
// personaje ("¿de la familia Greyrat era?", "¿de Ranoa?",
// "¿demoníaca?").
//
// El límite es de 40 caracteres por etiqueta (`MAX_TAG`), y todas
// estas entran de sobra.

/**
 * Etiquetas por personaje.
 *
 * La clave es el nombre EXACTO que aparece en `mt-personajes.mjs`,
 * con mayúsculas y tildes. Si uno de los dos ficheros cambia el
 * nombre, la comprobación de `comprobar-datos.mjs` lo detecta: el
 * personaje se queda sin etiquetas y el mapa tiene una clave que no
 * corresponde a nadie.
 */
export const TAGS = {
  // ── Compartidos ────────────────────────────────────────
  // `Destacados` es la que filtra la wiki: sale en la pestaña de
  // personajes cuando se elige ese filtro.
  'Rudeus Greyrat': ['Destacados', 'Familia Greyrat', 'Protagonista', 'Genio', 'Más Me gusta'],
  'Roxy Migurdia': ['Destacados', 'Tribu Migurd', 'Maga', 'Consejo Estudiantil'],
  Sylphiette: ['Destacados', 'Familia Greyrat', 'Elfa', 'Maga'],
  'Eris Boreas Greyrat': ['Destacados', 'Familia Boreas', 'Espadachina', 'Tsundere', 'Más Me gusta'],
  'Zenith Greyrat': ['Destacados', 'Familia Greyrat', 'Curandera'],
  'Norn Greyrat': ['Familia Greyrat', 'Hermanas'],
  'Aisha Greyrat': ['Familia Greyrat', 'Hermanas', 'Casa'],
  'Ghislaine Dedoldia': ['Tribu Dedoldia', 'Espadachina', 'Raza Bestia', 'Maestro'],
  'Zanoba Shirone': ['Universidad de Ranoa', 'Genio', 'Frikis'],
  Orsted: ['Antagonistas', 'Dios Dragón'],

  // ── Solo la primera ────────────────────────────────────
  'Paul Greyrat': ['Destacados', 'Familia Greyrat', 'Espadachino', 'Aventurero'],
  'Lilia Greyrat': ['Familia Greyrat', 'Criada'],
  'Sauros Boreas Greyrat': ['Familia Boreas', 'Severo'],
  'Hilda Boreas Greyrat': ['Familia Boreas'],
  'Philip Boreas Greyrat': ['Familia Boreas'],
  'Gustav Dedoldia': ['Tribu Dedoldia', 'Raza Bestia', 'Jefe tribal'],
  'Minitona Dedoldia': ['Tribu Dedoldia', 'Raza Bestia'],
  'Rowin Migurdia': ['Tribu Migurd'],
  'Rokari Migurdia': ['Tribu Migurd'],

  // ── Primera y segunda ──────────────────────────────────
  'Elinalise Dragonroad': ['Tribu Migurd', 'Elfa', 'Maga', 'Abuela'],
  'Geese Nukadia': ['Tribu Demoníaca', 'Aventurero'],
  Tallhand: ['Tribu Demoníaca', 'Mago'],
  'Ruijerd Superd': ['Tribu Demoníaca', 'Raza Superd', 'Espadachino'],
  'Gyes Dedoldia': ['Tribu Dedoldia', 'Raza Bestia'],
  'Cliff Grimoire': ['Universidad de Ranoa', 'Nobleza', 'Presumido'],

  // ── Segunda y tercera ──────────────────────────────────
  // Los hijos llevan "Niños" porque es lo que los hace localizables
  // en una ficha donde hay veinte personajes de la misma familia.
  'Kishirika Kishirisu': ['Tribu Demoníaca', 'Emperatriz', 'Maga'],
  'Lucy Greyrat': ['Familia Greyrat', 'Niños'],
  'Lara Greyrat': ['Familia Greyrat', 'Niños'],
  'Ars Greyrat': ['Familia Greyrat', 'Niños', 'Espadachina'],
  'Sieghart Greyrat': ['Familia Greyrat', 'Niños'],
  'Lily Greyrat': ['Familia Greyrat', 'Niños'],
  'Christina Greyrat': ['Familia Greyrat', 'Niños'],

  // ── Solo la segunda ────────────────────────────────────
  Badigadi: ['Tribu Demoníaca', 'Estudiante'],
  'Atoferatofe Rybak': ['Tribu Demoníaca', 'Militar'],
  Moore: ['Tribu Demoníaca', 'Militar'],
  'Linia Dedoldia': ['Tribu Dedoldia', 'Raza Bestia'],
  'Pursena Adoldia': ['Tribu Dedoldia', 'Raza Bestia'],
  'Shizuka Nanahoshi': ['Universidad de Ranoa', 'Genio'],
  'Ariel Anemoi Asura': ['Princesa', 'Reino Asura', 'Maga'],
  'Luke Notos Greyrat': ['Familia Greyrat', 'Caballero', 'Reino Asura'],
  Juliette: ['Universidad de Ranoa', 'Enana'],
  'Jinas Halfas': ['Universidad de Ranoa', 'Docente'],
  Suzanne: ['Aventurero', 'Líder'],
  Sara: ['Aventurero'],
  Timothy: ['Aventurero', 'Mago'],
  Mimir: ['Aventurero', 'Curandero'],
  Patris: ['Aventurero', 'Mago guerrero'],
  'Soldat Heckler': ['Antagonistas', 'Aventurero'],

  // ── Solo la tercera ────────────────────────────────────
  'Gal Farion': ['Templo de la Espada', 'Espada Dios', 'Maestro'],
  'Nina Farion': ['Templo de la Espada', 'Espadachina'],
  'Gino Britz': ['Templo de la Espada', 'Espadachina'],
  'Auber Corvette': ['Templo de la Espada', 'Emperador del Norte', 'Antagonistas'],
  'Reida Lia': ['Agua Dios'],
  'Isolte Cruel': ['Agua Dios', 'Antagonistas'],
  'Perugius Dola': ['Antagonistas', 'Rey Dragón Acorazado', 'Chaos Breaker'],
};