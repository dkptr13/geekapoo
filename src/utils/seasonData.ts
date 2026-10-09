import type { Anime, Season } from '../types';

// ======================================================
// LA FICHA QUE SE ESTÁ VIENDO
// ======================================================
// Una temporada tiene su propia ficha: la 2 puede tener otro año,
// otro estudio, otra puntuación, otros capítulos y otras
// imágenes que la 1. Lo único compartido entre temporadas son las
// categorías, los géneros y las plataformas, que son de la serie
// entera.
//
// Aquí se junta lo de la temporada con lo del anime para poder
// pintar una sola cosa: si la temporada no tiene un campo, se
// hereda el del anime. Con `||` a propósito, porque un 0 o una
// cadena vacía en la temporada ("aún no lo he rellenado") tienen
// que caer en el valor del anime y no dejar un hueco en la ficha.
//
// El resultado se usa en la wiki. Las tarjetas del catálogo no
// pasan por aquí: enseñan la serie, no una temporada, y por eso
// leen el anime directamente. Lo que evita que se quede corto es
// que al guardar la temporada 1 su ficha se copia al anime (ver
// `saveSeasonFields`).
// ======================================================

export interface FichaVisible {
  synopsis: string;
  year: number;
  status: string;
  studio: string;
  rating: number;
  episodesCount: number;
  /** Portada vertical. */
  coverUrl: string;
  coverFocus: unknown;
  /** Banner horizontal. */
  bannerUrl: string;
  bannerFocus: unknown;
}

/**
 * Estado tal como se enseña, sea cual sea el documento del que
 * venga.
 *
 * El estado está escrito con dos vocabularios: el anime usa la
 * palabra corta ('emitiendo', 'finished', 'upcoming') porque el
 * filtro del panel compara contra ella, y la temporada la larga
 * ('En emisión', 'Finalizado', 'Próximamente') porque es la que se
 * escribe a mano. Sin traducción, la misma serie se veía como
 * "emitiendo" en la vista general y como "En emisión" al pinchar
 * la T1, y la copia de la ficha al anime era según cuánto
 * hubiera tardado el primero en abrirse.
 *
 * Ambos se aceptan aquí, y también la palabra suelta ("emitiendo")
 * que queda de un campo vacío, para que pinchar cualquier botón
 * de la ficha salga siempre igual.
 */
export function textoEstado(valor: unknown): string {
  const clave = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  switch (clave) {
    case 'emitiendo':
    case 'en emisión':
    case 'en emision':
      return 'En emisión';
    case 'finished':
    case 'finalizado':
      return 'Finalizado';
    case 'upcoming':
    case 'próximamente':
    case 'proximamente':
      return 'Próximamente';
    default:
      return '';
  }
}

/** 'En emisión' → 'emitiendo'. La forma que espera el filtro. */
const ESTADO_CORTO_POR_ESTADO: Record<string, string> = {
  'En emisión': 'emitiendo',
  emitiendo: 'emitiendo',
  Finalizado: 'finished',
  finished: 'finished',
  'Próximamente': 'upcoming',
  upcoming: 'upcoming',
};


// ======================================================
// EL NUMERO DE UN EPISODIO
// ======================================================
//
// Aqui vive la regla de que numeros se pueden guardar, y esta en un
// solo sitio porque el panel y el servicio tienen que ponerse de
// acuerdo: si cada uno compusiera su comprobacion, el panel dejaria
// escribir 15.5 y el servicio lo rechazaria con "debe ser un numero
// entero". Es el mismo problema que `LIMITS` en `catalogAdmin.ts`.
//
// ── POR QUE FRACCIONES ──────────────────────────────────
//
// Porque hay capitulos que no ocupan un numero entero. Los dos casos
// reales que hay en el catalogo:
//
//   · Un extra ENTRE dos capitulos. "Eris la cazadora de goblins", de
//     Mushoku Tensei, ocurre entre el 15 y el 16. Y los tres OAD de
//     Ataca a los Titanes del 104 van entre el 3 y el 4.
//
//   · Un extra ANTES del primero. "No Regrets", de Ataca a los
//     Titanes, son los dos capitulos de Levi en el Subsuelo, muy
//     antes de que el corpus se graduara. La propia Wikipedia los
//     numera como 0.5A y 0.5B.
//
// En ninguno de los dos casos hay un entero que le corresponda, y las
// dos alternativas son peores:
//   · renumerar la temporada, que rompe los enlaces de la wiki y las
//     referencias de otros sitios, o
//   · inventarle un numero entero que no existe.
//
// El orden sale solo porque todo el mundo compara con
// `a.number - b.number`, y con fracciones sigue funcionando igual:
// el 0.5 se queda antes del 1, y el 15.5 entre el 15 y el 16.
//
// ── LOS LIMITES ─────────────────────────────────────────
//
//   · MAYOR que 0, y no 1. Antes esto exigia empezar en 1 y, cuando
//     se escribio, el motivo era que el panel trata "sin temporada"
//     como la AUSENCIA del campo y un 0 guardado se confundia con
//     eso. El 0 sigue sin valer por ese motivo, pero el 0.5 no es
//     un 0: es tan inequivoco como el 15.5, asi que el minimo se
//     bajo cuando aparecio un precuela de verdad que lo necesitaba.
//
//   · Dos decimales como mucho. El 15.5 y el 15.50 se distinguen
//     como dos capitulos distintos, y eso ya es un bug esperando.
//     Con mas, la posicion respecto a sus vecinos deja de
//     distinguirse.
//
//   · Tope en 9999, por el mismo motivo que los anos: evita que un
//     descuido tecleado acabe con un numero absurdo que si se
//     guardaria.

export const MAX_DECIMALES_EPISODIO = 2;
export const MAX_NUMERO_EPISODIO = 9999;

/**
 * Un numero de episodio es valido si es mayor que 0, no pasa de 9999
 * y tiene, como mucho, dos decimales.
 *
 * @returns El numero ya convertido, o `null` si no vale. Devolver
 *          el numero y no un booleano ahorra repetir el `Number()`
 *          en quien llama, que es el error facil: validar una cosa y
 *          guardar la conversion hecha de otra.
 */
export function numeroDeEpisodioValido(valor: unknown): number | null {
  const n = typeof valor === 'number' ? valor : Number(valor);

  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > MAX_NUMERO_EPISODIO) return null;

  // El redondeo a dos decimales tiene que devolver EXACTAMENTE el
  // mismo numero. Si no, es que traia mas decimales de los que se
  // permiten, y aqui es preferible decir que no vale antes que
  // guardarlo cambiado: un 15.499 que se guarda como 15.5 ha
  // cambiado de sitio entre dos capitulos sin avisar.
  const factor = 10 ** MAX_DECIMALES_EPISODIO;
  if (Math.round(n * factor) / factor !== n) return null;

  return n;
}

/** El mismo criterio, en texto, para los mensajes de error del panel. */
export const ERROR_NUMERO_EPISODIO =
  'El numero de episodio tiene que ser mayor que 0 (hasta 9999) y puede llevar ' +
  'decimales: 15.5 para un extra que va entre el 15 y el 16, o 0.5 para uno que va ' +
  'antes del primero.';


// ======================================================
// LAS TEMPORADAS DE UN PERSONAJE
// ======================================================
// Un personaje puede estar en una sola temporada (alguien que
// debuta en la 3) o en varias (Kaguya, que sale en las tres sin
// repetirla). Por eso el campo es un array: con un único
// "seasonId" no había forma de decir "estas dos y solo estas dos"
// sin duplicar el personaje y perder sus "me gusta" y comentarios.
//
// Lista VACÍA = COMPARTIDO, que sale en todas las temporadas. Es
// el valor por defecto y lo que queda al borrar la última.
//
// El "seasonId" a secas es el campo viejo, de cuando solo cabía
// una. Se sigue leyendo para que los personajes que ya había
// sigan enseñándose igual sin tocar un solo documento; al editar
// uno, `setCharacterSeasons` borra el campo antiguo.

/** Los dos campos de temporadas de un personaje, con lo que traigan. */
interface ConTemporadas {
  /** Campo antiguo: una sola temporada, o el id del grupo implícito. */
  seasonId?: unknown;
  /** Campo actual: todas las temporadas en las que sale. */
  seasonIds?: unknown;
}

/**
 * Temporadas de un personaje, sea cual sea el campo del que vengan.
 *
 * Acepta el documento sin forma a propósito: el panel los lee como
 * `Record<string, unknown>` y la wiki como `Character`, y Firestore
 * no garantiza ninguno de los dos tipos. El filtrado de dentro es
 * el que decide.
 *
 * Si el documento tiene "seasonIds", ese manda: es la decisión
 * explícita y puede estar vacía a propósito (compartido). Solo si
 * no existe se recurre al "seasonId" de los documentos antiguos.
 */
export function seasonIdsDe(doc: unknown): string[] {
  if (!doc || typeof doc !== 'object') return [];
  const d = doc as ConTemporadas;

  if (Array.isArray(d.seasonIds)) {
    return Array.from(
      new Set(d.seasonIds.filter((id): id is string => typeof id === 'string' && id !== '')),
    );
  }

  const antiguo = d.seasonId;
  return typeof antiguo === 'string' && antiguo !== '' ? [antiguo] : [];
}

/** Si un personaje sale en esa temporada concreta. Vacía = en todas. */
export function personajeEnTemporada(doc: unknown, seasonId: string): boolean {
  const ids = seasonIdsDe(doc);
  return ids.length === 0 || ids.includes(seasonId);
}

/**
 * Estado al vocabulario del anime, sea cual sea el que venga.
 *
 * Lo usa el filtro del panel y la copia de la ficha de la T1 al
 * anime. Un estado que no está en la tabla se devuelve tal cual:
 * mejor guardar un valor raro que dejar el campo vacío, porque un
 * "" en el estado de la serie la saca de todos los filtros.
 */
export function estadoCorto(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return ESTADO_CORTO_POR_ESTADO[valor.trim()] ?? valor;
}

/**
 * Ficha de la temporada abierta, con lo que le falte tomado del
 * anime. Sin temporada (la vista de "Todas" o un anime sin
 * temporadas) es directamente la del anime.
 */
export function fichaDe(anime: Anime | null | undefined, season?: Season | null): FichaVisible {
  const s = season ?? undefined;

  return {
    synopsis: s?.synopsis || anime?.synopsis || '',
    year: s?.year || anime?.year || 0,
    status: textoEstado(s?.status) || textoEstado(anime?.status),
    studio: s?.studio || anime?.studio || '',
    rating: s?.rating || anime?.rating || 0,
    episodesCount: s?.episodesCount || anime?.episodesCount || 0,
    coverUrl: s?.posterUrl || anime?.coverUrl || '',
    // El encuadre va con la imagen: si la portada sale del anime,
    // su encuadre también, y mezclar los dos colocaría la foto en
    // un punto pensado para otra.
    coverFocus: s?.posterUrl ? s.posterFocus : anime?.coverFocus,
    bannerUrl: s?.bannerUrl || anime?.bannerUrl || '',
    bannerFocus: s?.bannerUrl ? s.bannerFocus : anime?.bannerFocus,
  };
}
