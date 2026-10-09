// ETIQUETAS DE LOS PERSONAJES DE ATAQUE A LOS TITANES
//
// Van en un fichero aparte, y no dentro de `aot-personajes.mjs`, por
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
// El resto agrupa por quien pertenece la persona, que es lo que de
// verdad se busca al mirar una ficha ("¿de la familia Reiss era?",
// "¿era de Marley?", "¿guerrero o soldado de la isla?").
//
// ── POR QUÉ "GUERREROS DE MARLEY" Y NO "MARLEY" ───────────
//
// Un personaje no es "de Marley" sin más: es un eldiano que sirve a
// Marley. La diferencia es el tema entero de la serie, y una etiqueta
// que no la distinguiera no serviría para nada.
//
// ── EL LÍMITE ─────────────────────────────────────────────
//
// 40 caracteres por etiqueta (`MAX_TAG`), y todas estas entran de
// sobra. "Cuerpo de Exploración" es la más larga con 21.

export const TAGS = {
  // ── Compartidos: salen en las siete temporadas ──────────
  'Eren Yeager': ['Destacados', 'Familia Yeager', 'Protagonista', 'Titán de Ataque', 'Más Me gusta'],
  'Mikasa Ackerman': ['Destacados', 'Familia Yeager', 'Ackerman', 'Soldado', 'Más Me gusta'],
  'Armin Arlert': ['Destacados', 'Familia Yeager', 'Genio', 'Cerebro del grupo'],
  'Levi Ackerman': ['Destacados', 'Ackerman', 'Soldado', 'Antagonistas'],
  'Reiner Braun': ['Destacados', 'Guerreros de Marley', 'Titán Acorazado', 'Doble vida'],
  'Jean Kirstein': ['Destacados', 'Cuerpo de Exploración', 'Cuerpo 104', 'Responsable'],
  'Connie Springer': ['Cuerpo de Exploración', 'Cuerpo 104', 'Locuaz'],
  'Sasha Blouse': ['Destacados', 'Cuerpo 104', 'Tiradora', 'Comida'],
  'Annie Leonhart': ['Guerreros de Marley', 'Titán Hembra', 'Cuerpo 104', 'Fría'],
  'Historia Reiss': ['Destacados', 'Familia Reiss', 'Cuerpo 104', 'Reina'],
  Ymir: ['Cuerpo 104', 'Ymir Fritz', 'Guardiana'],
  'Bertholdt Hoover': ['Guerreros de Marley', 'Titán Colosal', 'Cuerpo 104', 'Silencioso'],
  'Pieck Finger': ['Destacados', 'Guerreros de Marley', 'Titán Carro', 'Pragmática'],
  'Zeke Yeager': ['Destacados', 'Familia Yeager', 'Titán Bestia', 'Hermanos', 'Antagonistas'],
  'Floch Forster': ['Cuerpo 104', 'Guarnición', 'Yageristas', 'Antagonistas'],
  'Hange Zoë': ['Destacados', 'Cuerpo de Exploración', 'Científico', 'Maestro'],
  'Keith Shadis': ['Cuerpo 104', 'Maestros', 'Instructor'],
  'Erwin Smith': ['Destacados', 'Cuerpo de Exploración', 'Comandante', 'Estratega'],

  // ── Solo la segunda ────────────────────────────────────
  'Rod Reiss': ['Antagonistas', 'Familia Reiss', 'Rey verdadero'],
  'Darius Zackly': ['Guarnición', 'Comandante', 'Golpe de estado'],
  'Kenny Ackerman': ['Ackerman', 'Antagonistas', 'Policía Interior', 'Maestro'],
  'Traute Carven': ['Policía Interior', 'Kenny Ackerman'],
  'Nile Dok': ['Policía Militar', 'Comandante'],
  'Marlowe Freudenberg': ['Policía Militar', 'Cuerpo de Exploración'],
  'Hitch Dreyse': ['Policía Militar', 'Annie Leonhart'],
  'Boris Feulner': ['Policía Militar', 'Cuerpo 104'],
  'Minister Nick': ['Sacerdote', 'Sabotaje'],
  'Marco Bott': ['Cuerpo 104', 'Muerte famosa'],
  'Petra Ral': ['Cuerpo de Exploración', 'Escuadra de Levi', 'Muerte famosa'],
  'Eld Jinn': ['Cuerpo de Exploración', 'Escuadra de Levi', 'Muerte famosa'],
  'Oluo Bozado': ['Cuerpo de Exploración', 'Escuadra de Levi', 'Presumido'],
  'Günther Schultz': ['Cuerpo de Exploración', 'Escuadra de Levi', 'Muerte famosa'],
  'Rico Brzenska': ['Guarnición', 'Trost', 'Superviviente'],
  'Ilse Langnar': ['Cuerpo de Exploración', 'Solo en el OAD', 'Pista clave'],
  Hannes: ['Guarnición', 'Shiganshina', 'Sargento'],
  'Dot Pixis': ['Guarnición', 'Golpe de estado', 'Raro'],
  'Mike Zacharias': ['Cuerpo de Exploración', 'Señuelo'],
  'Moblit Berner': ['Cuerpo de Exploración', 'Hange Zoë', 'Asistente'],
  Nanaba: ['Cuerpo de Exploración', '57.ª expedición'],
  'Carla Yeager': ['Familia Yeager', 'Shiganshina'],
  Louise: ['Trost', 'Policía Militar', 'Mikasa Ackerman'],

  // ── Cuarta a sexta ─────────────────────────────────────
  'Grisha Yeager': ['Familia Yeager', 'Antagonistas', 'Padre', 'Doctor'],
  'Eren Kruger': ['Familia Yeager', 'Titán de Ataque', 'Espía', 'Antes de la serie'],
  'Dina Yeager': ['Familia Yeager', 'Titán puro', 'Shiganshina'],
  'Marcel Galliard': ['Guerreros de Marley', 'Titán Mandíbula', 'Antes de la serie'],
  'Frieda Reiss': ['Familia Reiss', 'Coordenada', 'Antepasados'],
  'Ymir Fritz': ['Familia Reiss', 'Coordenada', 'Origen de todo'],

  // ── Quinta a séptima ──────────────────────────────────
  'Theo Magath': ['Marley', 'Paz', 'Cambio de bando'],
  Yelena: ['Voluntarios', 'Zeke Yeager', 'Fanática', 'Marley'],
  'Gabi Braun': ['Guerreros de Marley', 'Familia Braun', 'Reunión', 'Marley'],
  'Falco Grice': ['Guerreros de Marley', 'Familia Grice', 'Titán Mandíbula', 'Marley'],
  Onyankopon: ['Voluntarios', 'Tecnología', 'Barcos', 'Marley'],
  'Porco Galliard': ['Guerreros de Marley', 'Titán Mandíbula', 'Familia Galliard'],
  'Colt Grice': ['Guerreros de Marley', 'Familia Grice', 'Marley'],
  'Willy Tybur': ['Familia Tybur', 'Marley', 'Guerra'],
  'Lara Tybur': ['Familia Tybur', 'Titán Martillo de Guerra', 'Marley'],
  Calvi: ['Marley', 'Mariscal', 'Muerte temprana'],
  'Kiyomi Azumabito': ['Familia Azumabito', 'Hizuru', 'Mikasa Ackerman'],
  Nicolo: ['Marley', 'Cocina', 'Sasha Blouse'],
  'Tom Ksaver': ['Marley', 'Investigador', 'Zeke Yeager'],
  Kaya: ['Sasha Blouse', 'Huérfana', 'Liberio'],
};
