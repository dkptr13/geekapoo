import { CategoryItem, TriviaExtra } from '../types';

// ======================================================
// CATÁLOGO DE SEMILLA
// Datos que antes vivían en `mockData.ts` y que deben
// pasar a Firestore. Solo se usan durante la migración:
// el botón "Migrar datos" del panel de admin los escribe
// una vez y a partir de ahí la app lee de Firestore.
// ======================================================

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'romance',
    name: 'Romance & Comedia',
    slug: 'romance',
    description: 'Enredos amorosos, batallas psicológicas de amor y risas aseguradas.',
    animeCount: 14,
    color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
  },
  {
    id: 'shonen-accion',
    name: 'Shonen & Acción',
    slug: 'shonen-accion',
    description: 'Poderes sobrenaturales, coreografías de combate y superación sin límites.',
    animeCount: 28,
    color: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
  },
  {
    id: 'sci-fi-cyberpunk',
    name: 'Ciencia Ficción & Cyberpunk',
    slug: 'sci-fi-cyberpunk',
    description: 'Futuros distópicos, tecnología avanzada, IA y realidades virtuales.',
    animeCount: 19,
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'fantasia-aventura',
    name: 'Fantasía & Aventura',
    slug: 'fantasia-aventura',
    description: 'Elfos, magia ancestral, viajes conmovedores y mundos mágicos.',
    animeCount: 22,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'thriller-misterio',
    name: 'Thriller & Misterio',
    slug: 'thriller-misterio',
    description: 'Giro de trama constante, investigaciones oscuras y dilemas morales.',
    animeCount: 11,
    color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
  },
  // ======================================================
  // CATEGORÍAS AÑADIDAS DESPUÉS DE LA SEMILLA INICIAL
  // ======================================================
  // La semilla original solo cubría cuatro transferable (+ thriller).
  // Estas cuatro completan lo que faltaba: lo romántico-escolar, lo
  // adulto y psicológico, el drama y el familiar.
  {
    id: 'shojo-escolar',
    name: 'Shojo & Escolar',
    slug: 'shojo-escolar',
    description: 'Amor adolescente, academias, triángulos amorosos y amistad.',
    animeCount: 9,
    color: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
  },
  {
    id: 'seinen-psicologico',
    name: 'Seinen & Psicológico',
    slug: 'seinen-psicologico',
    description: 'Intenso y reflexivo: dilemas morales, salud mental y suspense psicológico.',
    animeCount: 8,
    color: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/30',
  },
  {
    id: 'josei-drama',
    name: 'Josei & Drama',
    slug: 'josei-drama',
    description: 'Drama adulto: trabajo, familia y relaciones complejas.',
    animeCount: 7,
    color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    id: 'kodomo-familiar',
    name: 'Kodomo & Familiar',
    slug: 'kodomo-familiar',
    description: 'Para toda la familia: aventuras ligeras, amistad y humor.',
    animeCount: 6,
    color: 'from-lime-500/20 to-emerald-500/20 text-lime-300 border-lime-500/30',
  },
];

export const TRIVIA_EXTRAS: TriviaExtra[] = [
  {
    id: 'trivia-1',
    title: 'El baile rotoscópico de Chika Fujiwara',
    characterOrAnime: 'Kaguya-sama: Love is War',
    fact: 'El icónico ending "Chikatto Chika Chika" fue animado individualmente por Naoya Nakayama dibujando más de 1.100 fotogramas a mano basándose en la coreografía de la bailarina Furitsukekagyo.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    category: 'Animación',
    likes: 189,
    likedBy: [],
  },
  {
    id: 'trivia-2',
    title: 'El significado de los nombres en Frieren',
    characterOrAnime: "Frieren: Beyond Journey's End",
    fact: 'Todos los nombres de los personajes son palabras en alemán relacionadas con su personalidad: Frieren significa "congelar", Himmel "cielo/paraíso", Heiter "alegre/despreocupado", Eisen "hierro" y Fern "lejano".',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    category: 'Curiosidades lingüísticas',
    likes: 245,
    likedBy: [],
  },
  {
    id: 'trivia-3',
    title: 'Lucy y la música de Cyberpunk: Edgerunners',
    characterOrAnime: 'Cyberpunk: Edgerunners',
    fact: 'La canción "I Really Want to Stay at Your House" de Rosa Walton multiplicó sus reproducciones en Spotify más de un 1,400% tras el lanzamiento del anime.',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
    category: 'Música & OST',
    likes: 312,
    likedBy: [],
  },
  {
    id: 'trivia-4',
    title: 'La voz de Kaguya y su récord',
    characterOrAnime: 'Kaguya-sama: Love is War',
    fact: 'Aoi Koga (seiyuu de Kaguya) ganó el premio a la Mejor Actriz Principal en los Seiyu Awards por su habilidad para alternar entre el tono gélido Shinomiya, el cómico chibi y el tímido.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    category: 'Seiyuu & Doblaje',
    likes: 178,
    likedBy: [],
  },
];

export const MASCOT_DIALOGUES: { id: string; text: string }[] = [
  {
    id: 'mascot-1',
    text: '¡Bienvenido a geekapoo! ¿Viste el último episodio de tu anime favorito?',
  },
  {
    id: 'mascot-2',
    text: '¡O-kawaii koto! Recuerda que aquí el respeto mutuo es nuestra única regla inquebrantable.',
  },
  {
    id: 'mascot-3',
    text: '¿Buscando serie nueva? Pásate por la sección de Navegar para ver sinopsis y streaming oficial.',
  },
  {
    id: 'mascot-4',
    text: '¡Psst! Si buscas con quién hablar, añade amigos con su ID en la sección de Chats privados.',
  },
  {
    id: 'mascot-5',
    text: '¿Manga o anime? ¡El debate eterno está abierto en los hilos del foro!',
  },
  {
    id: 'mascot-6',
    text: '¡Kapo-chan a tu servicio! Haz clic sobre mí si necesitas compañía otaku.',
  },
];
