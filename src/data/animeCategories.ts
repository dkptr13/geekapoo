// ======================================================
// CATEGORÍAS DEL CATÁLOGO DE ANIME
// ======================================================
// Esta lista es la fuente de verdad de las categorías, y no la
// colección de Firestore.
//
// El motivo: Firestore tiene las cuatro primeras, de cuando se
// sembró el catálogo, y añadir las cuatro nuevas a una colección ya
// existente exigiría una migración. Como Anime guarda su categoría
// por NOMBRE (no por id), el catálogo se puede definir entero aquí
// y las series que ya había siguen encajando sin tocar nada.
//
// Si algún día se quiseran guardar en Firestore, esta lista es el
// mismo formato que consume la migración del panel de admin.

export interface AnimeCategory {
  id: string;
  name: string;
  description: string;
  /** Clases de Tailwind para el chip: fondo degradado, texto y borde. */
  color: string;
}

export const ANIME_CATEGORIES: AnimeCategory[] = [
  {
    id: 'fantasia-aventura',
    name: 'Fantasía & Aventura',
    description: 'Elfos, magia ancestral, viajes conmovedores y mundos mágicos.',    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'romance',
    name: 'Romance & Comedia',
    description: 'Enredos amorosos, situaciones cómicas y risas aseguradas.',
    color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
  },
  {
    id: 'sci-fi-cyberpunk',
    name: 'Ciencia Ficción & Cyberpunk',
    description: 'Futuros distópicos, tecnología avanzada y realidades virtuales.',
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'shonen-accion',
    name: 'Shonen & Acción',
    description: 'Poderes sobrenaturales, combate y superación sin límites.',
    color: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
  },
  {
    id: 'shojo-escolar',
    name: 'Shojo & Escolar',
    description: 'Amor adolescente, academias, triángulos amorosos y amistad.',
    color: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
  },
  {
    id: 'seinen-psicologico',
    name: 'Seinen & Psicológico',
    description: 'Intenso y reflexivo: dilemas morales, salud mental y suspense.',
    color: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/30',
  },
  {
    id: 'josei-drama',
    name: 'Josei & Drama',
    description: 'Drama adulto: trabajo, familia y relaciones complejas.',
    color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    id: 'kodomo-familiar',
    name: 'Kodomo & Familiar',
    description: 'Para toda la familia: aventuras ligeras, amistad y humor.',
    color: 'from-lime-500/20 to-emerald-500/20 text-lime-300 border-lime-500/30',
  },
];

/** Categorías que están en Firestore pero no en esta lista. */
export const EXTRA_CATEGORIES = [
  {
    id: 'thriller-misterio',
    name: 'Thriller & Misterio',
    description: 'Giro de trama constante, investigaciones oscuras y dilemas morales.',
    color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
  },
];

/** Todas las categorías, canónicas primero y las extras detrás. */
export const ALL_ANIME_CATEGORIES: AnimeCategory[] = [
  ...ANIME_CATEGORIES,
  ...EXTRA_CATEGORIES,
];

/**
 * Categorías que solo existen en el foro.
 *
 * No van en `ALL_ANIME_CATEGORIES` a propósito: no son géneros de
 * anime y no deben aparecer en los filtros del catálogo.
 * `mergeCategories` las añade solo a la lista de categorías de hilos.
 */
export const FORUM_CATEGORIES: AnimeCategory[] = [
  {
    id: 'debates',
    name: 'Debates',
    description: 'Opiniones enfrentadas, teorías y temas de actualidad.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'encuestas',
    name: 'Encuestas',
    description: 'Votaciones de la comunidad: elige una opción y descubre qué opina la gente.',
    color: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'recomendaciones',
    name: 'Recomendaciones',
    description: 'Animes, mangas y joyitas que merecen la pena; pide y comparte recomendaciones.',
    color: 'from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30',
  },
];

/**
 * Quita tildes, mayúsculas y símbolos de un texto para poder
 * compararlo con otro sin que un detalle tipográfico los separe.
 *
 * "Shojo & Escolar" -> "shojoescolar"
 * "Shonen & Acción"  -> "shonenaccion"
 */
export const normalize = (value: string | undefined | null): string =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    // Separa la "ó" en "o" + tilde, y aquí se tira la tilde.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

/**
 * Nombres antiguos que significan lo mismo que una categoría
 * canónica.
 *
 * El catálogo se sembró con categorías escritas a mano y algunas
 * nunca estuvieron en `ALL_ANIME_CATEGORIES`. Como las tarjetas de
 * "Explora por categoría" solo pintan las canónicas, un anime que
 * solo tuviera "Fantasía & Magia" desaparecía de todas las
 * secciones: no era un fallo del filtro, sino de la comparación.
 *
 * Aquí se normalizan esos nombres al leerlos. No hace falta migrar
 * Firestore: los documentos viejos siguen valiendo y la web los
 * coloca en la categoría que les corresponde. Las claves van
 * normalizadas, como en `animeGenres`.
 */
const ALIAS_CATEGORIA: Record<string, string> = {
  accion: 'Shonen & Acción',
  accionaventura: 'Shonen & Acción',
  shonenaccion: 'Shonen & Acción',
  comedia: 'Romance & Comedia',
  romance: 'Romance & Comedia',
  comediasliceoflife: 'Romance & Comedia',
  drama: 'Josei & Drama',
  dramarecuerdos: 'Josei & Drama',
  fantasiamagia: 'Fantasía & Aventura',
  cienciaficcion: 'Ciencia Ficción & Cyberpunk',
  cienciaficcionfuturo: 'Ciencia Ficción & Cyberpunk',
  shojoromance: 'Shojo & Escolar',
  misteriomisterio: 'Thriller & Misterio',
};

const CANONICA_POR_CLAVE = new Map(
  ALL_ANIME_CATEGORIES.map((categoria) => [normalize(categoria.name), categoria.name] as const),
);

/**
 * Convierte una categoría guardada en su nombre canónico.
 *
 * Devuelve `null` si no es un texto válido. Si el nombre no es un
 * alias conocido se conserva tal cual: una categoría nueva no debe
 * desaparecer solo porque no esté en la lista.
 */
export const normalizarCategoria = (valor: unknown): string | null => {
  if (typeof valor !== 'string') return null;

  const nombre = valor.trim().replace(/\s+/g, ' ');
  if (!nombre) return null;

  const clave = normalize(nombre);
  if (!clave || clave === 'null' || clave === 'undefined' || clave === 'objectobject') {
    return null;
  }

  return ALIAS_CATEGORIA[clave] ?? CANONICA_POR_CLAVE.get(clave) ?? nombre;
};

/**
 * Busca una categoría por nombre, sin distinguir mayúsculas ni
 * acentos.
 *
 * Se usa al filtrar: Anime.category viene escrito como lo escribió
 * el autor en el panel, y no siempre coincide al milímetro con la
 * lista de arriba (por ejemplo, "Seinen & Psicológico" puede
 * aparecer escrito sin acento). Comparar normalizado evita que un
 * anime desaparezca de su categoría por un detalle tipográfico.
 *
 * También acepta los nombres antiguos: `findCategory('Fantasía &
 * Magia')` devuelve la ficha de "Fantasía & Aventura".
 */
export const findCategory = (name: string | undefined | null) => {
  const target = normalize(normalizarCategoria(name) ?? '');
  if (!target) return undefined;
  return ALL_ANIME_CATEGORIES.find((c) => normalize(c.name) === target);
};

/** Campos mínimos de una categoría del foro, tal como llega de Firestore. */
export interface StoredCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  animeCount?: number;
  threadsCount?: number;
  color?: string;
  /**
   * La categoría está definida en código y no en Firestore. No se
   * puede borrar desde el panel: volvería a aparecer al recargar.
   */
  fixed?: boolean;
}

/**
 * Une las categorías de Firestore con la lista canónica de código.
 *
 * Firestore tiene las primeras, de cuando se sembró el catálogo. Las
 * cuatro nuevas no están ahí, y el foro (el desplegable al publicar
 * un hilo y los botones de la barra lateral) leía solo de Firestore,
 * así que no aparecían por ninguna parte.
 *
 * En vez de sembrar las que faltan, se añaden aquí al construir la
 * lista. Gana una fuente menos que mantener y no hace falta migrar
 * nada.
 *
 * Cuando coinciden, manda el documento de Firestore: es el que lleva
 * el contador real de hilos, que el código no puede saber. La lista
 * solo aporta las que faltan, con cero hilos.
 */
export const mergeCategories = <T extends StoredCategory>(stored: T[]): T[] => {
  const known = new Set(stored.map((c) => normalize(c.name)));
  // También se comprueba el id: si alguien renombró una categoría
  // en Firestore conservando el id, no debe aparecer dos veces la
  // misma clave en el desplegable.
  const knownIds = new Set(stored.map((c) => c.id));

  const missing = [...ALL_ANIME_CATEGORIES, ...FORUM_CATEGORIES]
    .filter((c) => !known.has(normalize(c.name)) && !knownIds.has(c.id))
    .map(
      (c) =>
        ({
          id: c.id,
          name: c.name,
          slug: c.id,
          description: c.description,
          animeCount: 0,
          threadsCount: 0,
          color: c.color,
          // Las que no están en Firestore no se pueden borrar: el
          // panel las oculta del borrado y las vuelve a añadir al
          // recargar.
          fixed: true,
        }) as unknown as T,
    );

  return [...stored, ...missing];
};

/** Forma mínima que se lee de un anime, sin validar. */
type MaybeCategorized = { category?: unknown; categories?: unknown };

/**
 * Todas las categorías de una serie, de la forma que tenga.
 *
 * Una serie nueva puede estar en varias, y entonces trae "categories"
 * (array). Las que ya estaban en Firestore solo traen "category"
 * (string). Aquí se unifican: se usa la lista cuando existe y se cae
 * a la principal cuando no, para que las series viejas sigan
 * saliendo en su categoría sin migrar nada.
 *
 * Los nombres se devuelven ya normalizados a la lista canónica y sin
 * repetir: un anime con "Romance", "Comedia" y "Romance & Comedia"
 * solo tiene una categoría, no tres. Así las tarjetas y las fichas
 * hablan siempre del mismo vocabulario.
 *
 * El parámetro es "unknown" a propósito: los documentos llegan de
 * Firestore sin validar, y desde el panel llegan como
 * "Record<string, unknown>". Tiparlo bien aquí obligaría a castear
 * en cada llamada sin ganar nada, porque igual hay que comprobar
 * los tipos dentro.
 */
export const animeCategories = (anime: unknown): string[] => {
  const a = (anime ?? {}) as MaybeCategorized;

  // Se filtra por tipo porque "categories" puede no ser un array, o
  // traer cosas que no son cadenas si alguien lo escribió a mano.
  const raw = Array.isArray(a.categories) ? a.categories : [];
  const list = raw.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);

  const candidatas =
    list.length > 0
      ? list
      : typeof a.category === 'string' && a.category.trim()
        ? [a.category]
        : [];

  const salida: string[] = [];
  const vistas = new Set<string>();

  for (const candidata of candidatas) {
    const nombre = normalizarCategoria(candidata);
    if (!nombre) continue;

    const clave = normalize(nombre);
    if (vistas.has(clave)) continue;

    vistas.add(clave);
    salida.push(nombre);
  }

  return salida;
};

/** ¿Esta serie está en esa categoría? Sin distinguir tildes. */
export const isInCategory = (anime: unknown, categoryName: string): boolean => {
  const target = normalize(normalizarCategoria(categoryName) ?? '');
  if (!target) return false;
  return animeCategories(anime).some((c) => normalize(c) === target);
};
