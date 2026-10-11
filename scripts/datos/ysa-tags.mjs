// ETIQUETAS DE LOS PERSONAJES DE YOUR LIE IN APRIL
//
// Van en un fichero aparte, y no dentro de `ysa-personajes.mjs`, por
// dos razones:
//
//   · Las etiquetas son texto libre y cambian mucho mas que el resto
//     de los datos de un personaje. Mezclarlas con el nombre japones
//     o el seiyuu hace que cada retoque de una linea arriesgue el
//     archivo entero.
//
//   · Al separarlas se puede COMPROBAR que no se separan entre si:
//     `comprobar-datos.mjs` avisa si un personaje no tiene ninguna
//     etiqueta o si hay una etiqueta de un personaje que no existe.
//
// ── EL VOCABULARIO ───────────────────────────────────────
//
// Se reutilizan tal cual las etiquetas que ya usan otros animes del
// catalogo, para no inventar casi-duplicados: si el buscador
// encuentra "Maga" y "Mago" por separado, el filtro deja de servir.
// Las que ya existen:
//
//   Destacados, Más Me gusta, Consejo Estudiantil, Maga, Elfa,
//   Hechicero, Gamer, Genio, Tsundere, Trabajador, Meme Queen,
//   Relacionados
//
// El resto agrupa por lo que hace la persona, que es lo que de
// verdad se busca al mirar una ficha ("¿es de los buenos o de los
// otros?", "¿quien es?").
//
// ── POR QUE "PIANISTA" Y "VIOLINISTA" ──────────────────────
// Es un anime de música y casi todos los personajes con nombre tocan
// algo. La etiqueta no distingue entonces entre quien toca bien y
// quien toca de oído, pero sí marca de un vistazo de qué instrumento
// es cada uno, que es la pregunta que uno se hace al ver la foto de
// un personaje y no saber nada más de él.
//
// "Pianista" va tanto en Kōsei como en Hiroko, y no son la misma
// etiqueta: ella es la profesora y él el que todavía no sabe tocar.
//
// ── EL LÍMITE ─────────────────────────────────────────────
//
// 40 caracteres por etiqueta (`MAX_TAG`), y todas estas entran de
// sobra. "Hermano mayor" es la más larga, con 13.

export const TAGS = {
  'Kōsei Arima': ['Destacados', 'Protagonista', 'Pianista', 'Más Me gusta'],
  'Kaori Miyazono': ['Destacados', 'Violinista', 'Enferma', 'Más Me gusta'],
  'Tsubaki Sawabe': ['Destacados', 'Sóftbol', 'Amistad', 'Más Me gusta'],
  'Ryōta Watari': ['Fútbol', 'Amistad', 'Novio'],
  'Takeshi Aiza': ['Pianista', 'Rival', 'Hermano mayor'],
  'Emi Igawa': ['Pianista', 'Rival', 'Más Me gusta'],
  'Nagi Aiza': ['Pianista', 'Hermana menor', 'Consejo Estudiantil'],
  'Saki Arima': ['Madre', 'Muerta', 'Pianista'],
  'Hiroko Seto': ['Pianista', 'Profesora', 'Conocida'],
  'Saitō': ['Sóftbol', 'Novio', 'Ex'],
  'Nao Kashiwagi': ['Amistad', 'Consejo Estudiantil', 'Honesta'],
};
