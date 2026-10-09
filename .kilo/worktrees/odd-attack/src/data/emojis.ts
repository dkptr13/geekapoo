// ======================================================
// CATÁLOGO DE EMOJIS
// ======================================================
//
// Vive en el CÓDIGO y no en Firestore, y a propósito:
//
//   - Un emoji no es un dato que cambie ni que se administre:
//     son un montón de entradas fijas. Meterlas en la base de
//     datos obligaría a leerlas antes de pintar cualquier botón,
//     y además no se podrían empaquetar en el bundle.
//
//   - La clave (`key`) es lo que se guarda en Firestore, nunca
//     el emoji en sí. Con texto plano, "🔥" son cuatro bytes que
//     además dependen de la fuente de cada sistema; con una
//     clave, los datos de losReaction se pueden leer, comparar
//     y contar en cualquier idioma.
//
//     La clave es lo que validan las reglas de seguridad
//     (`matches('^[a-z0-9_]{1,24}$')`), porque una lista de 200
//     literales en un `in [...]` sería ilegible.
//
// Las cinco primeras son las que ya estaban antes
// (fire/shocked/laugh/cry/trophy). Sus claves no se tocan
// porque hay reacciones guardadas en Firestore con esos nombres.
//
// Añadir un emoji nuevo es añadir una línea a `EMOJIS`. Si se
// cambia o se borra una clave vieja, las reacciones que la
// usaban dejan de pintarse (el contador sigue contando), así
// que mejor añadir que renombrar.

export type CategoriaEmoji =
  | 'destacados'
  | 'caras'
  | 'gestos'
  | 'personas'
  | 'corazones'
  | 'animales'
  | 'comida'
  | 'actividades'
  | 'objetos'
  | 'simbolos';

export interface EmojiInfo {
  /** Clave estable. Es lo que se guarda en Firestore. */
  key: string;
  /** El emoji en sí, que se pinta. */
  emoji: string;
  /** Texto para buscar y para el tooltip. */
  label: string;
  categoria: CategoriaEmoji;
}

/** Las pestañas del selector, en el orden en que se enseñan. */
export const CATEGORIAS: { id: CategoriaEmoji; label: string; icono: string }[] = [
  { id: 'destacados', label: 'Destacados', icono: '⭐' },
  { id: 'caras', label: 'Caras', icono: '😀' },
  { id: 'gestos', label: 'Gestos', icono: '👋' },
  { id: 'personas', label: 'Personas', icono: '🧑' },
  { id: 'corazones', label: 'Corazones', icono: '❤️' },
  { id: 'animales', label: 'Animales', icono: '🐱' },
  { id: 'comida', label: 'Comida', icono: '🍜' },
  { id: 'actividades', label: 'Actividades', icono: '⚔️' },
  { id: 'objetos', label: 'Objetos', icono: '💡' },
  { id: 'simbolos', label: 'Símbolos', icono: '✅' },
];

/**
 * El catálogo entero.
 *
 * Los emojis NO se repiten: cada carácter Unicode aparece una
 * sola vez, para que el buscador no ofrezca dos veces lo mismo
 * con dos nombres.
 */
export const EMOJIS: EmojiInfo[] = [
  // ── Destacados (los cinco de siempre) ───────────────────
  { key: 'fire', emoji: '🔥', label: 'Me encanta', categoria: 'destacados' },
  { key: 'shocked', emoji: '😱', label: 'Sorprendente', categoria: 'destacados' },
  { key: 'laugh', emoji: '😂', label: 'Me hizo reír', categoria: 'destacados' },
  { key: 'cry', emoji: '😭', label: 'Me emocionó', categoria: 'destacados' },
  { key: 'trophy', emoji: '🏆', label: 'Épico', categoria: 'destacados' },

  // ── Caras ──────────────────────────────────────────────
  { key: 'grin', emoji: '😀', label: 'Sonrisa', categoria: 'caras' },
  { key: 'smile', emoji: '😄', label: 'Sonrisa abierta', categoria: 'caras' },
  { key: 'joy', emoji: '😃', label: 'Alegría', categoria: 'caras' },
  { key: 'rofl', emoji: '🤣', label: 'Carcajada', categoria: 'caras' },
  { key: 'sweat_smile', emoji: '😅', label: 'Nervioso', categoria: 'caras' },
  { key: 'wink', emoji: '😉', label: 'Guiño', categoria: 'caras' },
  { key: 'blush', emoji: '😊', label: 'Sonrojo', categoria: 'caras' },
  { key: 'innocent', emoji: '😇', label: 'Inocente', categoria: 'caras' },
  { key: 'heart_eyes', emoji: '😍', label: 'Enamorada', categoria: 'caras' },
  { key: 'kissing_heart', emoji: '😘', label: 'Beso', categoria: 'caras' },
  { key: 'yum', emoji: '😋', label: 'Sabroso', categoria: 'caras' },
  { key: 'tongue_out', emoji: '😛', label: 'Lengua fuera', categoria: 'caras' },
  { key: 'sunglasses', emoji: '😎', label: 'Con gafas', categoria: 'caras' },
  { key: 'smirk', emoji: '😏', label: 'Sonrisa loba', categoria: 'caras' },
  { key: 'unamused', emoji: '😒', label: 'Sin ganas', categoria: 'caras' },
  { key: 'rolling_eyes', emoji: '🙄', label: 'Ojos arriba', categoria: 'caras' },
  { key: 'grimace', emoji: '😬', label: 'Mueca', categoria: 'caras' },
  { key: 'relieved', emoji: '😌', label: 'Aliviado', categoria: 'caras' },
  { key: 'pensive', emoji: '😔', label: 'Pensativo', categoria: 'caras' },
  { key: 'sleepy', emoji: '😪', label: 'Somnoliento', categoria: 'caras' },
  { key: 'sleeping', emoji: '😴', label: 'Durmiendo', categoria: 'caras' },
  { key: 'mask', emoji: '😷', label: 'Con máscara', categoria: 'caras' },
  { key: 'nerd', emoji: '🤓', label: 'Nerd', categoria: 'caras' },
  { key: 'confused', emoji: '😕', label: 'Confundido', categoria: 'caras' },
  { key: 'worried', emoji: '😟', label: 'Preocupado', categoria: 'caras' },
  { key: 'frowning', emoji: '🙁', label: 'Fruncido', categoria: 'caras' },
  { key: 'hushed', emoji: '😯', label: 'Sin aliento', categoria: 'caras' },
  { key: 'astonished', emoji: '😲', label: 'Asombrado', categoria: 'caras' },
  { key: 'flushed', emoji: '😳', label: 'Sonrojado', categoria: 'caras' },
  { key: 'exploding_head', emoji: '🤯', label: 'Mente explotada', categoria: 'caras' },
  { key: 'confounded', emoji: '😖', label: 'Confundido', categoria: 'caras' },
  { key: 'persevere', emoji: '😣', label: 'Con esfuerzo', categoria: 'caras' },
  { key: 'disappointed', emoji: '😞', label: 'Decepcionado', categoria: 'caras' },
  { key: 'disappointed_relieved', emoji: '😥', label: 'Aliviado cansado', categoria: 'caras' },
  { key: 'sweat', emoji: '😓', label: 'Sudor', categoria: 'caras' },
  { key: 'weary', emoji: '😩', label: 'Agotado', categoria: 'caras' },
  { key: 'tired_face', emoji: '😫', label: 'Cansado', categoria: 'caras' },
  { key: 'triumph', emoji: '😤', label: 'Orgullo', categoria: 'caras' },
  { key: 'rage', emoji: '😡', label: 'Furia', categoria: 'caras' },
  { key: 'angry', emoji: '😠', label: 'Enfadado', categoria: 'caras' },
  { key: 'fearful', emoji: '😨', label: 'Miedo', categoria: 'caras' },
  { key: 'cold_sweat', emoji: '😰', label: 'Angustia', categoria: 'caras' },
  // OJO con la clave: "cry" YA la usa el emoji destacado (😭,
  // "Me emocionó"), y hay reacciones guardadas en Firestore con
  // esa clave. Este es el de la lágrima, así que se llama
  // "tears": si dos entradas comparten clave, el índice
  // `EMOJI_POR_CLAVE` se queda con la última y el 😭 de las
  // reacciones se pinta como 😢.
  { key: 'tears', emoji: '😢', label: 'Lágrima', categoria: 'caras' },
  { key: 'confused_face', emoji: '😵', label: 'Aturdido', categoria: 'caras' },
  { key: 'zipper_face', emoji: '🤐', label: 'Boca cerrada', categoria: 'caras' },
  { key: 'money_face', emoji: '🤑', label: 'Dinero', categoria: 'caras' },
  { key: 'hugs', emoji: '🤗', label: 'Abrazo', categoria: 'caras' },
  { key: 'shushing', emoji: '🤫', label: 'Shhh', categoria: 'caras' },
  { key: 'thinking', emoji: '🤔', label: 'Pensando', categoria: 'caras' },
  { key: 'clown', emoji: '🤡', label: 'Payaso', categoria: 'caras' },
  { key: 'ghost', emoji: '👻', label: 'Fantasma', categoria: 'caras' },
  { key: 'alien', emoji: '👽', label: 'Alien', categoria: 'caras' },
  { key: 'robot', emoji: '🤖', label: 'Robot', categoria: 'caras' },
  { key: 'poop', emoji: '💩', label: 'Caca', categoria: 'caras' },
  { key: 'skull', emoji: '💀', label: 'Calavera', categoria: 'caras' },
  { key: 'party', emoji: '🥳', label: 'Fiesta', categoria: 'caras' },
  { key: 'disguised', emoji: '🥸', label: 'Disfraz', categoria: 'caras' },
  { key: 'melting', emoji: '🫠', label: 'Derritiéndose', categoria: 'caras' },
  { key: 'saluting', emoji: '🫡', label: 'Saludo', categoria: 'caras' },
  { key: 'yawning', emoji: '🥱', label: 'Bostezo', categoria: 'caras' },
  { key: 'face_with_monocle', emoji: '🧐', label: 'Monocle', categoria: 'caras' },
  { key: 'smiling_imp', emoji: '😈', label: 'Diablillo', categoria: 'caras' },

  // ── Gestos ─────────────────────────────────────────────
  { key: 'thumbs_up', emoji: '👍', label: 'Me gusta', categoria: 'gestos' },
  { key: 'thumbs_down', emoji: '👎', label: 'No me gusta', categoria: 'gestos' },
  { key: 'clap', emoji: '👏', label: 'Aplauso', categoria: 'gestos' },
  { key: 'raised_hands', emoji: '🙌', label: 'Manos arriba', categoria: 'gestos' },
  { key: 'pray', emoji: '🙏', label: 'Gracias', categoria: 'gestos' },
  { key: 'muscle', emoji: '💪', label: 'Músculo', categoria: 'gestos' },
  { key: 'wave', emoji: '👋', label: 'Hola', categoria: 'gestos' },
  { key: 'ok_hand', emoji: '👌', label: 'Perfecto', categoria: 'gestos' },
  { key: 'pinching', emoji: '🤌', label: ' pinched', categoria: 'gestos' },
  { key: 'v', emoji: '✌️', label: 'Victoria', categoria: 'gestos' },
  { key: 'crossed_fingers', emoji: '🤞', label: 'Suerte', categoria: 'gestos' },
  { key: 'love_you', emoji: '🤟', label: 'Te quiero', categoria: 'gestos' },
  { key: 'call_me', emoji: '🤙', label: 'Llámame', categoria: 'gestos' },
  { key: 'point_up', emoji: '☝️', label: 'Arriba', categoria: 'gestos' },
  { key: 'point_down', emoji: '👇', label: 'Abajo', categoria: 'gestos' },
  { key: 'point_left', emoji: '👈', label: 'Izquierda', categoria: 'gestos' },
  { key: 'point_right', emoji: '👉', label: 'Derecha', categoria: 'gestos' },
  { key: 'eyes', emoji: '👀', label: 'Mirando', categoria: 'gestos' },
  { key: 'ear', emoji: '👂', label: 'Escuchando', categoria: 'gestos' },
  { key: 'brain', emoji: '🧠', label: 'Cerebro', categoria: 'gestos' },
  { key: 'handshake', emoji: '🤝', label: 'Apretón de manos', categoria: 'gestos' },
  { key: 'writing', emoji: '✍️', label: 'Escribiendo', categoria: 'gestos' },
  { key: 'selfie', emoji: '🤳', label: 'Selfie', categoria: 'gestos' },

  // ── Personas ───────────────────────────────────────────
  { key: 'man', emoji: '👨', label: 'Hombre', categoria: 'personas' },
  { key: 'woman', emoji: '👩', label: 'Mujer', categoria: 'personas' },
  { key: 'person', emoji: '🧑', label: 'Persona', categoria: 'personas' },
  { key: 'girl', emoji: '👧', label: 'Chica', categoria: 'personas' },
  { key: 'boy', emoji: '👦', label: 'Chico', categoria: 'personas' },
  { key: 'older_woman', emoji: '👵', label: 'Abuela', categoria: 'personas' },
  { key: 'older_man', emoji: '👴', label: 'Abuelo', categoria: 'personas' },
  { key: 'baby', emoji: '👶', label: 'Bebé', categoria: 'personas' },
  { key: 'cop', emoji: '👮', label: 'Policía', categoria: 'personas' },
  { key: 'detective', emoji: '🕵️', label: 'Detective', categoria: 'personas' },
  { key: 'teacher', emoji: '👩‍🏫', label: 'Profesora', categoria: 'personas' },
  { key: 'student', emoji: '👩‍🎓', label: 'Estudiante', categoria: 'personas' },
  { key: 'ninja', emoji: '🥷', label: 'Ninja', categoria: 'personas' },
  { key: 'mage', emoji: '🧙', label: 'Mago', categoria: 'personas' },
  { key: 'vampire', emoji: '🧛', label: 'Vampiro', categoria: 'personas' },
  { key: 'merperson', emoji: '🧜', label: 'Sirena', categoria: 'personas' },
  { key: 'fairy', emoji: '🧚', label: 'Hada', categoria: 'personas' },
  { key: 'superhero', emoji: '🦸', label: 'Héroe', categoria: 'personas' },
  { key: 'shrug', emoji: '🤷', label: 'Ni idea', categoria: 'personas' },
  { key: 'bow', emoji: '🙇', label: 'Reverencia', categoria: 'personas' },
  { key: 'facepalm', emoji: '🤦', label: 'Palmada en la cara', categoria: 'personas' },
  { key: 'dancer', emoji: '💃', label: 'Baile', categoria: 'personas' },
  { key: 'walking', emoji: '🚶', label: 'Caminando', categoria: 'personas' },
  { key: 'runner', emoji: '🏃', label: 'Corriendo', categoria: 'personas' },

  // ── Corazones ──────────────────────────────────────────
  { key: 'heart', emoji: '❤️', label: 'Corazón', categoria: 'corazones' },
  { key: 'orange_heart', emoji: '🧡', label: 'Corazón naranja', categoria: 'corazones' },
  { key: 'yellow_heart', emoji: '💛', label: 'Corazón amarillo', categoria: 'corazones' },
  { key: 'green_heart', emoji: '💚', label: 'Corazón verde', categoria: 'corazones' },
  { key: 'blue_heart', emoji: '💙', label: 'Corazón azul', categoria: 'corazones' },
  { key: 'purple_heart', emoji: '💜', label: 'Corazón morado', categoria: 'corazones' },
  { key: 'black_heart', emoji: '🖤', label: 'Corazón negro', categoria: 'corazones' },
  { key: 'white_heart', emoji: '🤍', label: 'Corazón blanco', categoria: 'corazones' },
  { key: 'broken_heart', emoji: '💔', label: 'Corazón roto', categoria: 'corazones' },
  { key: 'two_hearts', emoji: '💕', label: 'Dos corazones', categoria: 'corazones' },
  { key: 'sparkling_heart', emoji: '💖', label: 'Corazón brillante', categoria: 'corazones' },
  { key: 'fire_heart', emoji: '❤️‍🔥', label: 'Corazón en llamas', categoria: 'corazones' },
  { key: 'heart_arrow', emoji: '💘', label: 'Corazón con flecha', categoria: 'corazones' },

  // ── Animales ───────────────────────────────────────────
  { key: 'cat', emoji: '🐱', label: 'Gato', categoria: 'animales' },
  { key: 'dog', emoji: '🐶', label: 'Perro', categoria: 'animales' },
  { key: 'fox', emoji: '🦊', label: 'Zorro', categoria: 'animales' },
  { key: 'bear', emoji: '🐻', label: 'Oso', categoria: 'animales' },
  { key: 'panda', emoji: '🐼', label: 'Panda', categoria: 'animales' },
  { key: 'koala', emoji: '🐨', label: 'Koala', categoria: 'animales' },
  { key: 'tiger', emoji: '🐯', label: 'Tigre', categoria: 'animales' },
  { key: 'lion', emoji: '🦁', label: 'León', categoria: 'animales' },
  { key: 'cow', emoji: '🐮', label: 'Vaca', categoria: 'animales' },
  { key: 'pig', emoji: '🐷', label: 'Cerdo', categoria: 'animales' },
  { key: 'frog', emoji: '🐸', label: 'Rana', categoria: 'animales' },
  { key: 'monkey', emoji: '🐵', label: 'Mono', categoria: 'animales' },
  { key: 'penguin', emoji: '🐧', label: 'Pingüino', categoria: 'animales' },
  { key: 'bird', emoji: '🐦', label: 'Pájaro', categoria: 'animales' },
  { key: 'owl', emoji: '🦉', label: 'Búho', categoria: 'animales' },
  { key: 'bat', emoji: '🦇', label: 'Murciélago', categoria: 'animales' },
  { key: 'dragon', emoji: '🐉', label: 'Dragón', categoria: 'animales' },
  { key: 'dinosaur', emoji: '🦕', label: 'Dinosaurio', categoria: 'animales' },
  { key: 'unicorn', emoji: '🦄', label: 'Unicornio', categoria: 'animales' },
  { key: 'whale', emoji: '🐳', label: 'Ballena', categoria: 'animales' },
  { key: 'dolphin', emoji: '🐬', label: 'Delfín', categoria: 'animales' },
  { key: 'octopus', emoji: '🐙', label: 'Pulpo', categoria: 'animales' },
  { key: 'crab', emoji: '🦀', label: 'Cangrejo', categoria: 'animales' },
  { key: 'butterfly', emoji: '🦋', label: 'Mariposa', categoria: 'animales' },
  { key: 'bee', emoji: '🐝', label: 'Abeja', categoria: 'animales' },
  { key: 'snake', emoji: '🐍', label: 'Serpiente', categoria: 'animales' },
  { key: 'fish', emoji: '🐟', label: 'Pez', categoria: 'animales' },
  { key: 'bird_hawk', emoji: '🦅', label: 'Águila', categoria: 'animales' },

  // ── Comida ────────────────────────────────────────────
  { key: 'ramen', emoji: '🍜', label: 'Ramen', categoria: 'comida' },
  { key: 'sushi', emoji: '🍣', label: 'Sushi', categoria: 'comida' },
  { key: 'rice', emoji: '🍚', label: 'Arroz', categoria: 'comida' },
  { key: 'pizza', emoji: '🍕', label: 'Pizza', categoria: 'comida' },
  { key: 'burger', emoji: '🍔', label: 'Hamburguesa', categoria: 'comida' },
  { key: 'taco', emoji: '🌮', label: 'Taco', categoria: 'comida' },
  { key: 'ramen_bowl', emoji: '🍲', label: 'Potaje', categoria: 'comida' },
  { key: 'curry', emoji: '🍛', label: 'Curry', categoria: 'comida' },
  { key: 'bread', emoji: '🍞', label: 'Pan', categoria: 'comida' },
  { key: 'cheese', emoji: '🧀', label: 'Queso', categoria: 'comida' },
  { key: 'meat', emoji: '🍖', label: 'Carne', categoria: 'comida' },
  { key: 'chicken', emoji: '🍗', label: 'Pollo', categoria: 'comida' },
  { key: 'cookie', emoji: '🍪', label: 'Galleta', categoria: 'comida' },
  { key: 'cake', emoji: '🍰', label: 'Pastel', categoria: 'comida' },
  { key: 'chocolate', emoji: '🍫', label: 'Chocolate', categoria: 'comida' },
  { key: 'candy', emoji: '🍬', label: 'Caramelo', categoria: 'comida' },
  { key: 'coffee', emoji: '☕', label: 'Café', categoria: 'comida' },
  { key: 'tea', emoji: '🍵', label: 'Té', categoria: 'comida' },
  { key: 'beer', emoji: '🍺', label: 'Cerveza', categoria: 'comida' },
  { key: 'cocktail', emoji: '🍹', label: 'Cóctel', categoria: 'comida' },
  { key: 'popcorn', emoji: '🍿', label: 'Palomitas', categoria: 'comida' },
  { key: 'apple', emoji: '🍎', label: 'Manzana', categoria: 'comida' },
  { key: 'banana', emoji: '🍌', label: 'Plátano', categoria: 'comida' },
  { key: 'strawberry', emoji: '🍓', label: 'Fresa', categoria: 'comida' },
  { key: 'watermelon', emoji: '🍉', label: 'Sandía', categoria: 'comida' },
  { key: 'avocado', emoji: '🥑', label: 'Aguacate', categoria: 'comida' },

  // ── Actividades ────────────────────────────────────────
  { key: 'swords', emoji: '⚔️', label: 'Combate', categoria: 'actividades' },
  { key: 'shield', emoji: '🛡️', label: 'Escudo', categoria: 'actividades' },
  { key: 'bow_arrow', emoji: '🏹', label: 'Arco', categoria: 'actividades' },
  { key: 'bomb', emoji: '💣', label: 'Bomba', categoria: 'actividades' },
  { key: 'fire_extinguisher', emoji: '🧨', label: 'Petardo', categoria: 'actividades' },
  { key: 'game_die', emoji: '🎲', label: 'Dado', categoria: 'actividades' },
  { key: 'dart', emoji: '🎯', label: 'Diana', categoria: 'actividades' },
  { key: 'trophy_ball', emoji: '🏅', label: 'Medalla', categoria: 'actividades' },
  { key: 'medal', emoji: '🎖️', label: 'Condecoración', categoria: 'actividades' },
  { key: 'guitar', emoji: '🎸', label: 'Guitarra', categoria: 'actividades' },
  { key: 'mic', emoji: '🎤', label: 'Micro', categoria: 'actividades' },
  { key: 'headphones', emoji: '🎧', label: 'Auriculares', categoria: 'actividades' },
  { key: 'movie', emoji: '🎬', label: 'Película', categoria: 'actividades' },
  { key: 'tv', emoji: '📺', label: 'Televisión', categoria: 'actividades' },
  { key: 'art', emoji: '🎨', label: 'Pintura', categoria: 'actividades' },
  { key: 'camera', emoji: '📷', label: 'Cámara', categoria: 'actividades' },
  { key: 'rocket', emoji: '🚀', label: 'Cohete', categoria: 'actividades' },
  { key: 'sparkles', emoji: '✨', label: 'Magia', categoria: 'actividades' },
  { key: 'crystal_ball', emoji: '🔮', label: 'Bola de cristal', categoria: 'actividades' },
  { key: 'crown', emoji: '👑', label: 'Corona', categoria: 'actividades' },
  { key: 'chess', emoji: '♟️', label: 'Ajedrez', categoria: 'actividades' },
  { key: 'cards', emoji: '🃏', label: 'Cartas', categoria: 'actividades' },
  { key: 'puzzle', emoji: '🧩', label: 'Puzle', categoria: 'actividades' },
  { key: 'lightbulb', emoji: '💡', label: 'Idea', categoria: 'actividades' },

  // ── Objetos ───────────────────────────────────────────
  { key: 'laptop', emoji: '💻', label: 'Ordenador', categoria: 'objetos' },
  { key: 'keyboard', emoji: '⌨️', label: 'Teclado', categoria: 'objetos' },
  { key: 'phone', emoji: '📱', label: 'Móvil', categoria: 'objetos' },
  { key: 'battery', emoji: '🔋', label: 'Batería', categoria: 'objetos' },
  { key: 'plug', emoji: '🔌', label: 'Enchufe', categoria: 'objetos' },
  { key: 'floppy', emoji: '💾', label: 'Guardar', categoria: 'objetos' },
  { key: 'cd', emoji: '💿', label: 'Disco', categoria: 'objetos' },
  { key: 'dvd', emoji: '📀', label: 'DVD', categoria: 'objetos' },
  { key: 'camera_flash', emoji: '📸', label: 'Foto', categoria: 'objetos' },
  { key: 'gift', emoji: '🎁', label: 'Regalo', categoria: 'objetos' },
  { key: 'balloon', emoji: '🎈', label: 'Globo', categoria: 'objetos' },
  { key: 'money_bag', emoji: '💰', label: 'Dinero', categoria: 'objetos' },
  { key: 'gem', emoji: '💎', label: 'Diamante', categoria: 'objetos' },
  { key: 'key', emoji: '🔑', label: 'Llave', categoria: 'objetos' },
  { key: 'lock', emoji: '🔒', label: 'Candado', categoria: 'objetos' },
  { key: 'hammer', emoji: '🔨', label: 'Martillo', categoria: 'objetos' },
  { key: 'wrench', emoji: '🔧', label: 'Herramienta', categoria: 'objetos' },
  { key: 'gear', emoji: '⚙️', label: 'Engranaje', categoria: 'objetos' },
  { key: 'pill', emoji: '💊', label: 'Pastilla', categoria: 'objetos' },
  { key: 'syringe', emoji: '💉', label: 'Jeringuilla', categoria: 'objetos' },
  { key: 'chair', emoji: '🪑', label: 'Silla', categoria: 'objetos' },
  { key: 'door', emoji: '🚪', label: 'Puerta', categoria: 'objetos' },
  { key: 'book', emoji: '📖', label: 'Libro', categoria: 'objetos' },
  { key: 'newspaper', emoji: '📰', label: 'Periódico', categoria: 'objetos' },
  { key: 'memo', emoji: '📝', label: 'Nota', categoria: 'objetos' },
  { key: 'clipboard', emoji: '📋', label: 'Lista', categoria: 'objetos' },
  { key: 'package', emoji: '📦', label: 'Paquete', categoria: 'objetos' },
  { key: 'envelope', emoji: '✉️', label: 'Mensaje', categoria: 'objetos' },
  { key: 'bell', emoji: '🔔', label: 'Aviso', categoria: 'objetos' },
  { key: 'hourglass', emoji: '⏳', label: 'Espera', categoria: 'objetos' },
  { key: 'alarm', emoji: '⏰', label: 'Alarma', categoria: 'objetos' },
  { key: 'calendar', emoji: '📅', label: 'Calendario', categoria: 'objetos' },

  // ── Símbolos ───────────────────────────────────────────
  { key: 'check', emoji: '✅', label: 'Hecho', categoria: 'simbolos' },
  { key: 'cross', emoji: '❌', label: 'No', categoria: 'simbolos' },
  { key: 'question', emoji: '❓', label: 'Duda', categoria: 'simbolos' },
  { key: 'exclamation', emoji: '❗', label: 'Alerta', categoria: 'simbolos' },
  { key: 'warning', emoji: '⚠️', label: 'Cuidado', categoria: 'simbolos' },
  { key: 'no_entry', emoji: '🚫', label: 'Prohibido', categoria: 'simbolos' },
  { key: 'recycle', emoji: '♻️', label: 'Reciclar', categoria: 'simbolos' },
  { key: 'infinity', emoji: '♾️', label: 'Infinito', categoria: 'simbolos' },
  { key: 'arrow_right', emoji: '➡️', label: 'Derecha', categoria: 'simbolos' },
  { key: 'arrow_left', emoji: '⬅️', label: 'Izquierda', categoria: 'simbolos' },
  { key: 'arrow_up', emoji: '⬆️', label: 'Arriba', categoria: 'simbolos' },
  { key: 'arrow_down', emoji: '⬇️', label: 'Abajo', categoria: 'simbolos' },
  { key: 'top', emoji: '🔝', label: 'Top', categoria: 'simbolos' },
  { key: 'ok', emoji: '🆗', label: 'OK', categoria: 'simbolos' },
  { key: 'new', emoji: '🆕', label: 'Nuevo', categoria: 'simbolos' },
  { key: 'free', emoji: '🆓', label: 'Gratis', categoria: 'simbolos' },
  { key: 'cool', emoji: '🆒', label: 'Genial', categoria: 'simbolos' },
  { key: 'hundred', emoji: '💯', label: 'Perfecto', categoria: 'simbolos' },
  { key: 'anger', emoji: '💢', label: 'Cólera', categoria: 'simbolos' },
  { key: 'zzz', emoji: '💤', label: 'Dormido', categoria: 'simbolos' },
  { key: 'dizzy', emoji: '💫', label: 'Aturdido', categoria: 'simbolos' },
  { key: 'boom', emoji: '💥', label: 'Explosión', categoria: 'simbolos' },
  { key: 'sweat_drops', emoji: '💦', label: 'Sudor', categoria: 'simbolos' },
  { key: 'dash', emoji: '💨', label: 'Rápido', categoria: 'simbolos' },
  { key: 'speech', emoji: '💬', label: 'Bocadillo', categoria: 'simbolos' },
  { key: 'thought', emoji: '💭', label: 'Pensamiento', categoria: 'simbolos' },
  { key: 'hourglass_done', emoji: '⌛', label: 'Tiempo', categoria: 'simbolos' },
  { key: 'link', emoji: '🔗', label: 'Enlace', categoria: 'simbolos' },
  { key: 'mute', emoji: '🔇', label: 'Silencio', categoria: 'simbolos' },
  { key: 'sound', emoji: '🔊', label: 'Sonido', categoria: 'simbolos' },
];

/** Índice por clave, para pintar sin buscar en la lista. */
export const EMOJI_POR_CLAVE: Record<string, EmojiInfo> = EMOJIS.reduce(
  (acc, e) => {
    acc[e.key] = e;
    return acc;
  },
  {} as Record<string, EmojiInfo>,
);

/**
 * Los cinco que salen primero en el selector de reacciones.
 *
 * Son los de siempre (los que ya había antes de que existiera el
 * catálogo) y están aquí porque son los que se usan el 90% de las
 * veces: llegar a 🔥 debe costar un clic, no tres scrolls.
 */
export const DESTACADOS: EmojiInfo[] = EMOJIS.filter((e) => e.categoria === 'destacados');

/** Emoji de una clave, o `undefined` si la clave no está en el catálogo. */
export function emojiDe(clave: string | undefined | null): EmojiInfo | undefined {
  return clave ? EMOJI_POR_CLAVE[clave] : undefined;
}

/** Emoji de una clave, o un punto si la clave es desconocida. */
export function emojiDeClave(clave: string | undefined | null): string {
  return emojiDe(clave)?.emoji ?? '•';
}

/**
 * ¿Es una clave de reacción válida?
 *
 * Dos comprobaciones: el FORMATO (que es el que validan las
 * reglas de Firestore, porque ellas no pueden saber qué emojis
 * hay en este catálogo) y que la clave exista de verdad, que es
 * lo que impide pintar un documento con una clave inventada.
 */
export function esClaveDeReaccion(clave: unknown): clave is string {
  return typeof clave === 'string' && /^[a-z0-9_]{1,24}$/.test(clave) && clave in EMOJI_POR_CLAVE;
}

/**
 * Busca emojis por nombre o por palabra.
 *
 * Con la lista entera: recorrer unos 250 elementos en cada
 * pulsación es instantáneo, así que no hace falta ni índice ni
 * espera.
 */
export function buscarEmojis(texto: string, limite = 60): EmojiInfo[] {
  const q = texto.trim().toLowerCase();

  if (!q) return [];

  const encontrados = EMOJIS.filter(
    (e) => e.label.toLowerCase().includes(q) || e.key.includes(q),
  );

  return encontrados.slice(0, limite);
}
