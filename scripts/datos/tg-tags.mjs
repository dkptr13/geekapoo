// ETIQUETAS DE LOS PERSONAJES DE TOKYO GHOUL
//
// Van en un fichero aparte, y no dentro de `tg-personajes.mjs`, por
// las dos razones que se explican en `ysa-tags.mjs`: las etiquetas son
// texto libre y cambian mucho mas que el resto, y separadas se pueden
// COMPROBAR que no se separan entre si (`comprobar-datos.mjs` avisa si
// un personaje se queda sin ninguna).
//
// ── EL VOCABULARIO ───────────────────────────────────────
//
// Se reutilizan tal cual las etiquetas que ya usan otros animes del
// catalogo, para que el buscador no trate "Fría" y "Fria" como dos
// cosas. Las de aqui que ya existian:
//
//   Destacados, Más Me gusta, Antagonistas, Protagonista, Amistad,
//   Genio, Estudiante, Consejo Estudiantil, Hermano mayor,
//   Hermana menor, Hermanos, Madre, Padre, Doctor, Fría, Raro,
//   Severo, Silencioso, Trabajador, Líder, Investigador, Doble vida,
//   Antes de la serie
//
// ── LOS TRES EJES DE ESTA SERIE ───────────────────────────
//
// Una etiqueta util dice a que bando pertenece la persona, porque es la
// pregunta que uno se hace al ver la foto. Por eso hay tres familias:
// la Comision, los gouls (con el grupo o la familia) y los que estan
// en medio.
//
// El bando de los gouls no se resume en "goul": medio serie son del
// cafe Anteiku y la otra media son de la organizacion que secuestra a
// los ninos. Esa distincion ES la trama, asi que hay etiqueta para las
// dos.
//
// ── "ESPRADAÑA" Y "GOURMET" ──────────────────────────────
//
// Son los dos apodos que se han ganado por la fama: uno por se pasar
// de cazar, el otro por llegar tarde a casa. Arima es de la Comision y
// Tsukiyama es del bando contrario, y es justo por eso los dos se
// cuentan con la misma etiqueta: el justo lo que se busca.
//
// ── EL LÍMITE ─────────────────────────────────────────────
//
// 40 caracteres por etiqueta (`MAX_TAG`), y todas estas entran de
// sobra. "Escuadra de Kaneki" es la mas larga, con 18.

export const TAGS = {
  // ── Los cuatro que salen en las cuatro temporadas ───────
  'Ken Kaneki': ['Destacados', 'Protagonista', 'Más Me gusta', 'Medio goul', 'Renacido'],
  'Touka Kirishima': ['Destacados', 'Familia Kirishima', 'Más Me gusta', 'Goul', 'Café Anteiku'],
  'Shu Tsukiyama': ['Destacados', 'Familia Tsukiyama', 'Gourmet', 'Caballero Negro'],
  'Kishō Arima': ['Destacados', 'Antagonistas', 'Comisión', 'Guadaña', 'Familia Washū'],

  // ── Salen en las tres temporadas de television ──────────
  'Hideyoshi Nagachika': ['Amistad', 'Humano', 'Más Me gusta', 'Consejo Estudiantil'],
  'Rize Kamishiro': ['Destacados', 'Goul', 'Familia Washū', 'Antes de la serie', 'Experimentos de Kanō'],
  'Eto Yoshimura': ['Destacados', 'Antagonistas', 'Aogiri', 'Familia Yoshimura', 'Autora', 'Más Me gusta'],
  'Yoshimura': ['Café Anteiku', 'Goul', 'Padre', 'Generoso'],
  'Hinami Fueguchi': ['Destacados', 'Aogiri', 'Más Me gusta', 'Pequeña', 'Secuestro'],
  'Ayato Kirishima': ['Familia Kirishima', 'Aogiri', 'Hermano menor', 'Rebelde'],
  'Nishiki Nishio': ['Goul', 'Estudiante', 'Consejo Estudiantil', 'Caballero Negro', 'Más Me gusta'],
  'Kōtarō Amon': ['Destacados', 'Comisión', 'Justiciero', 'Más Me gusta', 'Semi-humano'],
  'Akira Mado': ['Comisión', 'Jefa', 'Responsable', 'Caballero Negro'],
  'Akihiro Kanō': ['Antagonistas', 'Humano', 'Experimentos de Kanō', 'Doctor'],
  'Renji Yomo': ['Café Anteiku', 'Goul', 'Familia Kirishima', 'Tío', 'Más Me gusta'],
  'Enji Koma': ['Café Anteiku', 'Goul', 'Trabajador', 'Humor'],
  'Uta': ['Payasos', 'Artesano', 'Goul', 'Tranquilo'],

  // ── Solo las dos primeras temporadas ─────────────────────
  'Kureo Mado': ['Comisión', 'Padre', 'Veterano', 'Justiciero'],
  'Yamori': ['Antagonistas', 'Aogiri', 'Torturador', 'Kakugan', 'Canibalismo'],
  'Kaya Irimi': ['Café Anteiku', 'Goul', 'Jefa de banda', 'Agudeza'],
  'Itori': ['Payasos', 'Goul', 'Dueña de bar', 'Informante'],

  // ── Solo la tercera: el bando de la Comision ────────────
  'Kuki Urie': ['Comisión', 'Escuadra de Kaneki', 'Ambicioso', 'Familia Kuroiwa', 'Más Me gusta'],
  'Ginshi Shirazu': ['Comisión', 'Escuadra de Kaneki', 'Leal', 'Hermanos', 'Más Me gusta'],
  'Tōru Mutsuki': ['Comisión', 'Escuadra de Kaneki', 'G-humanos', 'Más Me gusta', 'Gripe'],
  'Saiko Yonebayashi': ['Comisión', 'Escuadra de Kaneki', 'Gamer', 'Pereza'],
  'Shinsanpei Aura': ['Comisión', 'Escuadra de Kaneki', 'G-humanos', 'Novato', 'Sobrino'],
  'Kiyoko Aura': ['Antagonistas', 'Comisión', 'Familia Aura', 'Veterana'],
  'Itsuki Marude': ['Comisión', 'Jefe', 'Descubridor', 'Franco'],
  'Take Hirako': ['Comisión', 'Veterano', 'Leal', 'Protector'],
  'Kuramoto Itō': ['Comisión', 'Supervisor', 'Simpático', 'Responsable'],
  'Ayumu Hogi': ['Comisión', 'Novata', 'Veterana', 'Curiosa'],
  'Hairu Ihei': ['Comisión', 'Escuadra Zero', 'Semi-humana', 'Más Me gusta'],
  'Takeomi Kuroiwa': ['Comisión', 'Familia Kuroiwa', 'Genio', 'Novio'],
  'Shiki Kijima': ['Antagonistas', 'Comisión', 'Torturador', 'Interrogador'],
  'Jūzō Suzuya': ['Comisión', 'Genio', 'Más Me gusta', 'Niño', 'Superviviente'],
  'Matsuri Washū': ['Antagonistas', 'Familia Washū', 'Comisión', 'Severo'],
  'Naoto Hayashimura': ['Antagonistas', 'Familia Tsukiyama', 'Comisión', 'Hermano mayor'],
  'Nimura Furuta': ['Antagonistas', 'Familia Washū', 'Comisión', 'Agente doble', 'Más Me gusta'],
  'Big Madam': ['Antagonistas', 'Subastas', 'Fría', 'Gorda', 'Sexista'],

  // ── Solo la tercera: el bando de los gouls ──────────────
  'Taishi Fura': ['Comisión', 'Amistad', 'Humano', 'Normal'],
  'Chie Hori': ['Humana', 'Fotógrafa', 'Caballero Negro', 'Más Me gusta'],
  'Donato Porpora': ['Antagonistas', 'Payasos', 'Sacerdote', 'Canibalismo'],
  'Kanae von Rosewald': ['Antagonistas', 'Familia Tsukiyama', 'Obsesivo', 'Servidor'],
  'Tatara': ['Antagonistas', 'Aogiri', 'Fuego', 'Frío'],
  'Naki': ['Aogiri', 'Goul', 'Leal', 'Niño', 'Caballero Negro'],
  'Kazuichi Banjō': ['Goul', 'Caballero Negro', 'Pacífico', 'Distrito once'],
  'Kurona Yasuhisa': ['Antagonistas', 'Medio goul', 'Hermanas', 'Venganza', 'Más Me gusta'],
  'Yoriko Kosaka': ['Humana', 'Caballero Negro', 'Amistad', 'Novia'],
  'Romi': ['Antagonistas', 'Payasos', 'Café Anteiku', 'Más Me gusta'],
  'Noro': ['Antagonistas', 'Aogiri', 'Canibalismo', 'Silencioso'],
  'Nico': ['Payasos', 'Goul', 'Cambio de bando', 'Extravagante'],
  'Seidō Takizawa': ['Antagonistas', 'Comisión', 'Aogiri', 'Medio goul', 'Kakuja', 'Caballero Negro'],
};