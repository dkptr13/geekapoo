import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Loader2,
  Film,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Star,
  Layers,
  ArrowUp,
  ArrowDown,
  FolderTree,
} from 'lucide-react';

import { db } from '../../lib/firebase';
import {
  createCharacter,
  createEpisode,
  createSeason,
  deleteAnimeCascade,
  deleteItem,
  deleteSeasonCascade,
  moveToSeason,
  normalizeRating,
  saveSeasonFields,
  setCharacterSeasons,
  slugify,
  updateFields,
  type CatalogSection,
} from '../../services/catalogAdmin';

import { uploadImage, type UploadProvider } from '../../services/imageUpload';
import { puntoEncuadre } from '../../utils/safeData';
import {
  textoEstado,
  estadoCorto,
  seasonIdsDe,
  numeroDeEpisodioValido,
  ERROR_NUMERO_EPISODIO,
} from '../../utils/seasonData';
import { TAG_DESTACADOS, normalizaTags } from '../../utils/tags';

import { ImageUploader } from './ImageUploader';
import { ImagePicker } from './ImagePicker';
import { CollapsibleSection } from './CollapsibleSection';
import { StreamingAvailabilityEditor } from './StreamingAvailabilityEditor';
import {
  TextField,
  TextArea,
  SelectField,
  NumberField,
  MultiSelectField,
  TagsField,
  FocalField,
} from './fields';
import { ALL_ANIME_CATEGORIES, animeCategories } from '../../data/animeCategories';
import type { StreamingService } from '../../types';

// ======================================================
// EDITOR DE UN ANIME, CON SUS TEMPORADAS DENTRO
// ======================================================
// Los episodios ya no son una pestaña suelta: cuelgan de su
// anime, que es como se ven en la wiki. Editar un episodio
// desde aquí deja claro a qué serie pertenece, cosa que antes
// no se veía en ningún sitio.
//
// Y dentro del anime están las TEMPORADAS. Una serie larga
// ("Kaguya-sama" tiene tres) no cabe en una sola lista plana de
// episodios: el capítulo 45 de la temporada 2 no se puede
// distinguir del 45 de la primera.
//
// El detalle que importa: los episodios y personajes anteriores
// a este cambio NO tienen seasonId. Se agrupan en una
// "Temporada 1" implícita que existe solo en pantalla. Así el
// catálogo existente se ve igual que antes, sin tener que
// migrar un solo documento, y en cuanto se añade una Temporada 2
// ya se pueden ir moviendo a ella uno a uno.
// ======================================================

export type AnimeDoc = Record<string, unknown> & { id: string };
export type SeasonDoc = Record<string, unknown> & { id: string };
export type EpisodeDoc = Record<string, unknown> & { id: string };
export type CharacterDoc = Record<string, unknown> & { id: string };

/** Id reservado para el grupo sin temporada. Nunca se escribe en Firestore. */
const NO_SEASON = '';

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNum = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * Normaliza un seasonId. Los documentos antiguos no tienen el
 * campo, y Firestore tampoco devuelve "" (viene null), así que
 * todo lo que no sea un id real se trata como temporada 1.
 */
const seasonIdOf = (doc: Record<string, unknown>): string => {
  const raw = doc.seasonId;
  return typeof raw === 'string' ? raw : NO_SEASON;
};

/** Normaliza el array de plataformas, ignorando entradas rotas. */
const asStreaming = (v: unknown): StreamingService[] =>
  Array.isArray(v)
    ? v
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          name: asStr(s.name),
          url: asStr(s.url),
          badgeColor: asStr(s.badgeColor) || '#e11d48',
          ...(Array.isArray(s.regions) && s.regions.length > 0
            ? {
                regions: s.regions
                  .filter((r) => typeof r === 'string')
                  .map((r) => (r as string).trim().toUpperCase())
                  .filter((r) => r.length > 0),
              }
            : {}),
        }))
        .filter((s) => s.name !== '' || s.url !== '')
    : [];

/** Colores de la etiqueta de cada plataforma, por nombre. */
const SERVICE_COLORS: { name: string; color: string }[] = [
  { name: 'Netflix', color: '#e11d48' },
  { name: 'Crunchyroll', color: '#f47521' },
  { name: 'Hulu', color: '#1ce783' },
  { name: 'Disney+', color: '#113ccf' },
  { name: 'Amazon Prime', color: '#00a8e1' },
  { name: 'Max', color: '#a020f0' },
  { name: 'AniList', color: '#02a9ff' },
  { name: 'YouTube', color: '#ff0000' },
  { name: 'Otro', color: '#71717a' },
];

const ROLE_OPTIONS = [
  { value: 'main', label: 'Principal' },
  { value: 'supporting', label: 'Secundario' },
  { value: 'antagonist', label: 'Antagonista' },
];

/** Orden en que se listan los personajes: por importancia. */
const ROLE_ORDER: Record<string, number> = {
  main: 0,
  supporting: 1,
  antagonist: 2,
};

const roleLabel = (value: string): string =>
  ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value;

/**
 * Etiquetas que se ofrecen al añadir un personaje: las que ya usan
 * los demás de la serie y la que el filtro "Destacados" de la wiki
 * reconoce. El campo acepta cualquier texto, esto es solo para no
 * tener que escribir de memoria lo que ya está puesto.
 */
function sugerenciasDePersonajes(characters: CharacterDoc[]): string[] {
  const usadas = characters.flatMap((c) => asList(c.tags));
  return Array.from(new Set([TAG_DESTACADOS, ...usadas.map((t) => t.trim())].filter(Boolean)));
}

/** Una nota solo es válida si cabe en el 0-10. Vacío = sin nota. */
function isValidRating(value: string): boolean {
  if (!value.trim()) return true;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && num <= 10;
}

interface FieldErrors {
  title?: string;
  synopsis?: string;
  category?: string;
}

interface AnimeEditorProps {
  anime: AnimeDoc;
  seasons: SeasonDoc[];
  episodes: EpisodeDoc[];
  characters: CharacterDoc[];
  provider: UploadProvider;
}

export const AnimeEditor: FC<AnimeEditorProps> = ({
  anime,
  seasons,
  episodes,
  characters,
  provider,
}) => {
  const [open, setOpen] = useState(false);

  // Lo único del anime que se edita aquí: lo que es de la serie
  // entera. El año, el estado, el estudio, la puntuación, los
  // capítulos emitidos y las imágenes son de cada temporada, y se
  // editan en su bloque (o en la ficha base del grupo implícito
  // mientras no haya ninguna temporada guardada).
  const [title, setTitle] = useState(asStr(anime.title));
  const [synopsis, setSynopsis] = useState(asStr(anime.synopsis));

  // Categorías elegidas. Se parte de la lista nueva si el anime la
  // tiene, y si no de la principal, que es lo que traen las series
  // que ya estaban guardadas.
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const list = animeCategories(anime).filter((c) => c.trim());
    return list.length > 0 ? list : asStr(anime.category) ? [asStr(anime.category)] : [];
  });
  const [genres, setGenres] = useState(asList(anime.genres).join(', '));
  const [streaming, setStreaming] = useState<StreamingService[]>(asStreaming(anime.streaming));

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [streamingError, setStreamingError] = useState('');

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showNewSeason, setShowNewSeason] = useState(false);
  const [showLooseEpisode, setShowLooseEpisode] = useState(false);
  const [showNewCharacter, setShowNewCharacter] = useState(false);

  // Ficha base de la serie (temporada 1 implícita). Solo se abre a
  // mano: el grupo donde vive ya está plegado.
  const [editingBase, setEditingBase] = useState(false);

  // ======================================================
  // ACORDEÓN
  // ======================================================
  // El id de la única fila que puede estar desplegada. No es
  // un "abierto sí/no" por fila porque entonces se quedaban
  // varias a la vez: con veinte episodios de cuarenta campos
  // cada uno, la página se hacía larguísima y había que bajar
  // para volver arriba. Con un solo id, al abrir otra se cierra
  // la anterior sola.
  const [episodioAbierto, setEpisodioAbierto] = useState<string | null>(null);
  const [personajeAbierto, setPersonajeAbierto] = useState<string | null>(null);

  // Episodios y personajes van a cuentas separadas: son listas
  // distintas, y abrir un personaje no tiene por qué cerrar el
  // episodio que estabas viendo.
  const toggleEpisodio = (id: string) =>
    setEpisodioAbierto((actual) => (actual === id ? null : id));

  const togglePersonaje = (id: string) =>
    setPersonajeAbierto((actual) => (actual === id ? null : id));
  // El grupo implícito arranca plegado: si el catálogo entero está
  // sin organizar, son decenas de filas y taparían las
  // temporadas reales, que es lo que hay que revisar primero.
  const [looseOpen, setLooseOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  // ======================================================
  // REPARTO POR TEMPORADA
  // ======================================================
  // Se calcula aquí y no en cada fila, porque cada temporada
  // necesita saber cuáles son sus episodios y sus personajes.

  // Las temporadas reales, ordenadas por número. El número es
  // lo que manda: si alguien guardó la 3 antes que la 2, el
  // orden de los documentos en Firestore no sirve de nada.
  const orderedSeasons = [...seasons].sort((a, b) => asNum(a.number) - asNum(b.number));

  // Episodios sin temporada asignada. Se muestran como
  // "Temporada 1" solo si hay alguno: si el autor ya lo ha ido
  // moviendo todo, el grupo vacío no aparece.
  //
  // Los personajes no se filtran aquí porque ya no viven dentro
  // de las temporadas: tienen su propia sección más abajo (ver
  // `orderedCharacters`). Un personaje sin temporadas marcadas es
  // COMPARTIDO y sale en todas ellas; con una o varias marcadas
  // sale solo en esas, y puede estar en varias a la vez.
  const looseEpisodes = episodes.filter((e) => seasonIdOf(e) === NO_SEASON);

  // Episodio 2 antes que el 10: ordenar por número como texto
  // daría 1, 10, 11, 2.
  const byEpisodeNumber = (a: EpisodeDoc, b: EpisodeDoc) => asNum(a.number) - asNum(b.number);

  // Ordena por importancia y luego por nombre, que es como se
  // leen mejor: primero los principales de la serie.
  const orderedCharacters = [...characters].sort((a, b) => {
    const ra = ROLE_ORDER[asStr(a.role)] ?? 3;
    const rb = ROLE_ORDER[asStr(b.role)] ?? 3;
    if (ra !== rb) return ra - rb;
    return asStr(a.name).localeCompare(asStr(b.name));
  });

  const totalEpisodes = episodes.length;
  const totalCharacters = characters.length;

  // Etiquetas ofrecidas al añadir o editar un personaje: las que
  // ya usan los de esta serie. Se calcula una vez para que todas
  // las filas ofrezcan las mismas y no dependa del orden.
  const tagSuggestions = useMemo(
    () => sugerenciasDePersonajes(characters),
    [characters],
  );

  // La siguiente temporada que se crearía: la más alta que ya
  // hay, más uno. Si el autor borró la 3 y le queda la 1 y la 2,
  // la siguiente vuelve a ser la 3, que es lo que espera.
  const nextSeasonNumber =
    orderedSeasons.length > 0 ? asNum(orderedSeasons[orderedSeasons.length - 1].number) + 1 : 2;

  // ── Guardar el anime ───────────────────────────────
  const handleSave = async () => {
    if (saving) return;

    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = 'El título no puede estar vacío.';
    if (!synopsis.trim()) nextErrors.synopsis = 'La sinopsis no puede estar vacía.';
    if (categoriesList.length === 0) nextErrors.category = 'Elige al menos una categoría.';

    // Una plataforma sin nombre no sirve de nada y en la wiki
    // aparecería una caja en blanco.
    const badService = streaming.find((s) => !s.name.trim());
    if (badService) {
      setStreamingError('Ponle un nombre a cada plataforma, o quita la que esté vacía.');
      setErrors(nextErrors);
      return;
    }
    setStreamingError('');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // El slug identifica el anime en la URL de la wiki. Si
    // cambia el título, se recalcula para que la ficha siga
    // siendo predecible, pero solo si nadie lo ha enlazado.
    const shouldUpdateSlug = asStr(anime.slug) === slugify(asStr(anime.title));

    setSaving(true);
    setFeedback(null);
    try {
      // OJO: aquí NO se guardan el año, el estado, el estudio, la
      // puntuación, los capítulos ni las imágenes. Son de cada
      // temporada y se editan en su bloque, o en la ficha base del
      // grupo implícito mientras el anime no tenga ninguna
      // temporada. No incluirlos aquí es lo que deja esos valores a
      // salvo: si se mandaran vacíos, guardar el título de la
      // serie borraría la ficha entera.
      await updateFields('animes', anime.id, {
        title: title.trim(),
        synopsis: synopsis.trim(),
        // "category" sigue guardándose con la primera elegida: es
        // lo que leen las fichas y lo que usan partes antiguas de
        // la app. La lista completa va en "categories".
        category: categoriesList[0] ?? '',
        categories: categoriesList,
        streaming: streaming
          .map((s) => ({
            ...s,
            name: s.name.trim(),
            url: s.url.trim(),
            ...(Array.isArray(s.regions) && s.regions.length
              ? { regions: s.regions.map((r) => r.trim().toUpperCase()).filter(Boolean) }
              : {}),
          }))
          .filter((s) => s.name),
        genres: genres
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        ...(shouldUpdateSlug ? { slug: slugify(title) } : {}),
      });
      setFeedback({ success: 'Cambios guardados.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback({ error: messageOf(e, 'No se pudo guardar.') });
    } finally {
      setSaving(false);
    }
  };

  // ── Borrar el anime y todo lo suyo ─────────────────
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const removed = await deleteAnimeCascade(anime.id);
      setFeedback({
        success:
          `Anime eliminado, junto con ${removed.seasons} temporada(s), ` +
          `${removed.episodes} episodio(s) y ${removed.characters} personaje(s).`,
      });
    } catch (e) {
      setFeedback({ error: messageOf(e, 'No se pudo eliminar.') });
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // ── Mover una temporada arriba o abajo ──────────────
  // El número es lo único que decide el orden, así que subir
  // una temporada es cambiarle el número y renumerar las
  // demás por encima. Si solo se guardara el nuevo número sin
  // tocar el resto, aparecerían dos "Temporada 2".
  const handleReorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedSeasons.length) return;

    const reordered = [...orderedSeasons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    setReordering(true);
    setFeedback(null);
    try {
      const batch = writeBatch(db);
      reordered.forEach((s, i) => {
        batch.update(doc(db, 'seasons', s.id), { number: i + 1 });
      });
      await batch.commit();
    } catch (e) {
      setFeedback({ error: messageOf(e, 'No se pudo reordenar.') });
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Cabecera */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
          {asStr(anime.coverUrl) ? (
            <img
              src={asStr(anime.coverUrl)}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Film size={16} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white">{title || anime.id}</h3>
          <p className="truncate text-[11px] text-zinc-500">
            {categoriesList[0] || 'Sin categoría'} · {asNum(anime.year) || '—'} ·{' '}
            {/* Con más de una categoría se indica el total, para
                que no parezca que solo tiene una. */}
            {categoriesList.length > 1 ? `${categoriesList.length} categorías · ` : ''}
            {orderedSeasons.length > 0 ? (
              <>
                {orderedSeasons.length}{' '}
                {orderedSeasons.length === 1 ? 'temporada' : 'temporadas'} ·{' '}
              </>
            ) : null}
            {totalEpisodes} {totalEpisodes === 1 ? 'episodio' : 'episodios'} ·{' '}
            {totalCharacters}{' '}
            {totalCharacters === 1 ? 'personaje' : 'personajes'}
          </p>
        </div>

        {open ? (
          <ChevronUp size={17} className="flex-shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown size={17} className="flex-shrink-0 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="space-y-5 border-t border-zinc-800 p-4">
          {/* ==================================================
              DATOS DE LA SERIE
          ==================================================
          Aquí solo lo que es de la serie entera y NO depende de la
          temporada: el título, el resumen general, las categorías,
          los géneros y las plataformas.

          El año, el estado, la ficha técnica y las imágenes son de
          cada temporada, y se editan en su bloque. Mientras el
          anime no tenga ninguna temporada guardada, su ficha se
          edita en el grupo "Temporada 1 (implícita)". */}
          <CollapsibleSection title="Datos de la serie" defaultOpen>
            <TextField
              label="Título"
              value={title}
              onChange={setTitle}
              error={errors.title}
            />

            <TextArea
              label="Sinopsis de la serie"
              value={synopsis}
              onChange={setSynopsis}
              error={errors.synopsis}
              rows={5}
              hint="Es el resumen de la serie entera. Cada temporada puede tener el suyo."
            />

            <MultiSelectField
              label="Categorías"
              value={categoriesList}
              onChange={setCategoriesList}
              error={errors.category}
              hint="Una serie puede encajar en varias. La primera es la que sale como principal en la ficha."
              options={ALL_ANIME_CATEGORIES.map((c) => ({
                value: c.name,
                label: c.name,
                color: c.color,
              }))}
            />

            <TextField
              label="Géneros (separados por comas)"
              value={genres}
              onChange={setGenres}
              placeholder="Romance, Comedia, Drama"
            />
          </CollapsibleSection>

          {/* Plataformas antiguas de la ficha. No se borran: la wiki
              las usa como fallback «Sin verificar» hasta que exista
              una fila regional en el apartado de abajo. */}
          <CollapsibleSection
            title={`Plataformas antiguas / sin región (${streaming.length})`}
            actions={
              <button
                type="button"
                onClick={() =>
                  setStreaming((prev) => [
                    ...prev,
                    { name: '', url: '', badgeColor: '#e11d48' },
                  ])
                }
                className="flex items-center gap-1 rounded-lg bg-violet-600/20 px-2.5 py-1 text-[10px] font-semibold text-violet-300 transition-colors hover:bg-violet-600/30"
              >
                <Plus size={11} />
                Añadir plataforma
              </button>
            }
          >
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[10px] leading-relaxed text-zinc-500">
              Son los datos que ya existían y no tienen país. La lista de regiones es solo una
              pista para organizarlas; no confirma disponibilidad: en la wiki aparecen como
              «Sin verificar» hasta que registres la disponibilidad regional en el apartado
              siguiente.
            </p>

            {streamingError && (
              <p className="text-[11px] text-red-400">{streamingError}</p>
            )}

            {streaming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center text-[11px] text-zinc-500">
                Sin plataformas. En la wiki se mostrará "no disponible por ahora".
              </p>
            ) : (
              <ul className="space-y-2">
                {streaming.map((svc, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5"
                  >
                    <div className="min-w-[120px] flex-1">
                      <TextField
                        label="Plataforma"
                        value={svc.name}
                        onChange={(v) =>
                          setStreaming((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, name: v } : s)),
                          )
                        }
                        placeholder="Netflix"
                      />
                    </div>

                    <div className="min-w-[160px] flex-[2]">
                      <TextField
                        label="Enlace"
                        value={svc.url}
                        onChange={(v) =>
                          setStreaming((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, url: v } : s)),
                          )
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <div className="w-32">
                      <SelectField
                        label="Color"
                        value={svc.badgeColor ?? '#e11d48'}
                        onChange={(v) =>
                          setStreaming((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, badgeColor: v } : s)),
                          )
                        }
                        options={SERVICE_COLORS.map((c) => ({ value: c.color, label: c.name }))}
                      />
                    </div>

                    <div className="min-w-[140px] flex-1">
                      <TextField
                        label="Regiones (separadas por comas)"
                        value={(svc.regions ?? []).join(', ')}
                        onChange={(v) =>
                          setStreaming((prev) =>
                            prev.map((s, j) =>
                              j === i
                                ? {
                                    ...s,
                                    regions:
                                      v
                                        .split(',')
                                        .map((r) => r.trim().toUpperCase())
                                        .filter(Boolean),
                                  }
                                : s,
                            ),
                          )
                        }
                        placeholder="ES, US, JP"
                        hint="Pista informativa: no cambia el estado en la wiki."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStreaming((prev) => prev.filter((_, j) => j !== i))}
                      className="mb-0.5 rounded-md p-1.5 text-zinc-500 transition-colors hover:text-red-400"
                      aria-label="Quitar plataforma"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          {/* Disponibilidad por obra + plataforma + país. */}
          <StreamingAvailabilityEditor animeId={anime.id} />

          {/* ==================================================
              TEMPORADAS
              ==================================================
              Cada temporada lleva dentro sus episodios y sus
              personajes. Encima del todo va el grupo implícito,
              que solo aparece si hay algo sin temporada asignada
              (típicamente, todo lo que ya había). */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                <FolderTree size={12} />
                Temporadas ({orderedSeasons.length || 1})
              </h4>

              <button
                type="button"
                onClick={() => setShowNewSeason((v) => !v)}
                className="flex items-center gap-1 rounded-lg bg-violet-600/20 px-2.5 py-1 text-[11px] font-semibold text-violet-300 transition-colors hover:bg-violet-600/30"
              >
                <Plus size={12} />
                Añadir temporada
              </button>
            </div>

            {showNewSeason && (
              <NewSeasonForm
                animeId={anime.id}
                nextNumber={nextSeasonNumber}
                provider={provider}
                onDone={() => setShowNewSeason(false)}
                onCancel={() => setShowNewSeason(false)}
              />
            )}

            {/* ==================================================
                TEMPORADA 1 IMPLÍCITA
            ==================================================
            Lo que todavía no es una temporada guardada:

              - Los capítulos sin "seasonId". Salen aquí y, si no
                hay ninguna temporada creada, cuentan como la
                primera.
              - La FICHA DE LA SERIE, cuando el anime no tiene
                ninguna temporada guardada. El año, el estado, el
                estudio, la puntuación, los capítulos y las
                imágenes son de cada temporada, pero alguien tiene
                que rellenarlos mientras no haya ninguna, y ese
                alguien es el anime: es la base que heredan todas
                (ver `fichaDe`).

            En cuanto se guarda la primera temporada, la ficha pasa
            a vivir en ella y aquí solo quedan los capítulos sueltos.
            Por eso el editor de la ficha sale únicamente cuando no
            hay temporadas, y es también el motivo por el que este
            grupo aparece con un anime recién creado aunque no tenga
            ni un capítulo. */}
            {(orderedSeasons.length === 0 || looseEpisodes.length > 0 || showLooseEpisode) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5">
                {/* Cabecera: el clic en el título pliega */}
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setLooseOpen((v) => !v)}
                    aria-expanded={looseOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-[11px] font-black text-amber-300">
                      1
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Layers size={12} />
                        Temporada 1 (implícita)
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {orderedSeasons.length === 0
                          ? 'La ficha de la serie y los capítulos sin guardar'
                          : `${looseEpisodes.length} ${
                              looseEpisodes.length === 1 ? 'episodio' : 'episodios'
                            } sin temporada asignada`}
                      </p>
                    </div>
                    {looseOpen ? (
                      <ChevronUp size={15} className="flex-shrink-0 text-zinc-400" />
                    ) : (
                      <ChevronDown size={15} className="flex-shrink-0 text-zinc-400" />
                    )}
                  </button>
                </div>

                {looseOpen && (
                  <div className="space-y-3 border-t border-amber-500/20 p-3">
                    <p className="text-[10px] leading-relaxed text-zinc-500">
                      Esto no es una temporada guardada: es la ficha base de la serie y el grupo
                      de capítulos que aún no tienen temporada asignada. Míralo como la primera,
                      o mueve cada capítulo a una nueva con el desplegable de su fila.
                    </p>

                    {/* La ficha se despliega a petición, no por
                        defecto: si el anime ya está ordenado y solo
                        quedan capítulos sueltos, abrirla sería
                        enseñar un formulario que no toca. */}
                    {orderedSeasons.length === 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setEditingBase((v) => !v)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/30"
                        >
                          {editingBase ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          Ficha de la serie (año, estado, estudio, imágenes)
                        </button>

                        {editingBase && (
                          <div className="mt-2 rounded-xl border border-amber-500/30">
                            <SeasonDataForm
                              doc={anime}
                              animeId={anime.id}
                              seasonId={NO_SEASON}
                              provider={provider}
                              onDone={() => setEditingBase(false)}
                              onCancel={() => setEditingBase(false)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* No hay barra de botones: tanto "añadir
                        episodio" como "añadir personaje" van en la
                        cabecera de su propia lista, que es donde se
                        van a añadir. */}

                    <SeasonItems
                      label={`Episodios (${looseEpisodes.length})`}
                      icon={<Film size={11} />}
                      emptyText="Esta temporada no tiene episodios."
                      actions={
                        <button
                          type="button"
                          onClick={() => setShowLooseEpisode((v) => !v)}
                          className="flex items-center gap-1 rounded-lg bg-cyan-600/20 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-600/30"
                        >
                          <Plus size={12} />
                          Añadir episodio
                        </button>
                      }
                      items={[...looseEpisodes]
                        .sort(byEpisodeNumber)
                        .map((ep) => (
                          <EpisodeRow
                            key={ep.id}
                            episode={ep}
                            seasons={orderedSeasons}
                            provider={provider}
                            open={episodioAbierto === ep.id}
                            onToggle={() => toggleEpisodio(ep.id)}
                          />
                        ))}
                    />

                    {/* El formulario se abre justo debajo de la lista,
                        que es donde está el botón. */}
                    {showLooseEpisode && (
                      <EpisodeForm
                        animeId={anime.id}
                        seasonId={NO_SEASON}
                        nextNumber={looseEpisodes.length + 1}
                        provider={provider}
                        onDone={() => setShowLooseEpisode(false)}
                        onCancel={() => setShowLooseEpisode(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {orderedSeasons.length === 0 && looseEpisodes.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center text-[11px] text-zinc-500">
                Este anime no tiene ni temporadas ni episodios. Añade una temporada para
                empezar a meter capítulos dentro.
              </p>
            )}

            {orderedSeasons.map((season, index) => (
              <SeasonBlock
                key={season.id}
                season={season}
                index={index}
                total={orderedSeasons.length}
                reordering={reordering}
                onMove={(dir) => handleReorder(index, dir)}
                episodes={episodes.filter((e) => seasonIdOf(e) === season.id)}
                characters={characters.filter((c) => seasonIdsDe(c).includes(season.id))}
                allSeasons={orderedSeasons}
                provider={provider}
                episodioAbierto={episodioAbierto}
                onToggleEpisodio={toggleEpisodio}
              />
            ))}

            {/* ==================================================
                PERSONAJES
            ==================================================
            Apartado propio, y no dentro de cada temporada, porque
            los personajes pueden estar en varias: Kaguya sale en
            las tres, y repetirla tres veces en el panel obligaría
            a crear un personaje nuevo por temporada y a que cada
            uno tuviera su propia imagen, sus "me gusta" y sus
            comentarios.

            Por defecto son COMPARTIDOS: sin temporadas marcadas
            salen en todas las temporadas de la wiki. Solo hace
            falta marcarlas cuando el personaje NO está en todas,
            y se pueden marcar varias. */}
            <CollapsibleSection
              title={`Personajes (${orderedCharacters.length})`}
              icon={<Users size={12} />}
              tone="pink"
              defaultOpen
              actions={
                <button
                  type="button"
                  onClick={() => setShowNewCharacter((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-pink-600/20 px-2.5 py-1.5 text-[11px] font-semibold text-pink-300 transition-colors hover:bg-pink-600/30"
                >
                  <Plus size={12} />
                  Añadir personaje
                </button>
              }
            >
              <p className="text-[10px] leading-relaxed text-zinc-500">
                Por defecto son de toda la serie y salen en todas las temporadas. Si uno solo sale
                en algunas, despliega su fila y marca cuáles: las que no marques le quedan fuera.
              </p>

              {showNewCharacter && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
                  <NewCharacterForm
                    animeId={anime.id}
                    seasons={orderedSeasons}
                    tagSuggestions={tagSuggestions}
                    provider={provider}
                    onDone={() => setShowNewCharacter(false)}
                    onCancel={() => setShowNewCharacter(false)}
                  />
                </div>
              )}

              {orderedCharacters.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-center text-[11px] text-zinc-500">
                  Este anime todavía no tiene personajes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {orderedCharacters.map((c) => (
                    <CharacterEditor
                      key={c.id}
                      character={c}
                      seasons={orderedSeasons}
                      tagSuggestions={tagSuggestions}
                      provider={provider}
                      open={personajeAbierto === c.id}
                      onToggle={() => togglePersonaje(c.id)}
                    />
                  ))}
                </ul>
              )}
            </CollapsibleSection>
          </section>

          {/* Guardar / borrar */}
          <section className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 size={14} />
                Eliminar anime
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                <span className="text-[11px] text-red-300">
                  ¿Seguro? Se borrarán {orderedSeasons.length} temporada(s),{' '}
                  {totalEpisodes} episodio(s) y {totalCharacters} personaje(s). No se puede
                  deshacer.
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Borrando...' : 'Sí, borrar todo'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-lg bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
              </div>
            )}

            {feedback?.success && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 size={12} />
                {feedback.success}
              </span>
            )}
            {feedback?.error && (
              <span className="flex items-center gap-1 text-[11px] text-red-400">
                <AlertCircle size={12} />
                {feedback.error}
              </span>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// MOVER ENTRE TEMPORADAS
// ────────────────────────────────────────────────────────

/**
 * Desplegable para pasar un episodio de una temporada a otra.
 *
 * Solo episodes: un episodio es de una sola temporada, así que
 * un id basta. Los personajes pueden estar en varias y usan el
 * selector múltiple (`CharacterSeasonsPicker`).
 *
 * No se pinta si el anime solo tiene una temporada: mover un
 * episodio de la 1 a la 1 no es una acción.
 */
const MoveToSeasonSelect: FC<{
  itemId: string;
  currentSeasonId: string;
  seasons: SeasonDoc[];
  onError: (message: string) => void;
}> = ({ itemId, currentSeasonId, seasons, onError }) => {
  const [busy, setBusy] = useState(false);

  const options = useMemo(
    () =>
      [...seasons]
        .sort((a, b) => asNum(a.number) - asNum(b.number))
        .map((s) => ({
          value: s.id,
          label: `Temporada ${asNum(s.number)}${asStr(s.title) ? ` · ${asStr(s.title)}` : ''}`,
        })),
    [seasons],
  );

  const handleChange = async (next: string) => {
    setBusy(true);
    try {
      // "" es el grupo implícito (temporada 1): moveToSeason lo
      // traduce a borrar el campo, que es lo que espera el
      // filtro de la wiki.
      await moveToSeason(itemId, next || null);
    } catch (e) {
      onError(messageOf(e, 'No se pudo cambiar de temporada.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-zinc-300">
          Temporada
        </span>
        <select
          value={currentSeasonId}
          disabled={busy}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none disabled:opacity-50"
        >
          {/* Sin temporada no es "temporada 1" para un personaje,
              pero para un episodio sí: es la primera implícita. */}
          <option value={NO_SEASON}>Temporada 1 (implícita)</option>
          {options.map((o: { value: string; label: string }) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 text-[10px] text-zinc-600">
        Moverlo no lo borra: el episodio sigue en el anime, solo cambia de temporada.
      </p>
    </div>
  );
};

/**
 * Chapa de la fila de un personaje: en cuántas temporadas sale.
 *
 * Sin marcar ninguna es COMPARTIDO y sale en todas, que es el
 * caso normal. Con los números marcados se ve cuáles, para no
 * tener que desplegar la fila y mirar el selector.
 */
const SeasonBadge: FC<{ ids: string[]; seasons: SeasonDoc[] }> = ({ ids, seasons }) => {
  if (ids.length === 0) {
    return <span className="text-emerald-400/80">compartido</span>;
  }

  const numeros = ids
    .map((id) => seasons.find((s) => s.id === id))
    .sort((a, b) => asNum(a?.number) - asNum(b?.number))
    .map((s) => (s ? asNum(s.number, 0) || '?' : '?'));

  return (
    <span className="text-violet-300/80">
      temporadas {numeros.join(', ')}
    </span>
  );
};

/**
 * Temporadas en las que sale un personaje, varias si hace falta.
 *
 * Es la diferencia con los episodios: Kaguya está en las tres, y
 * con un solo desplegable había que elegir entre "compartido" y
 * "una sola", sin poder decir "estas dos". Con ninguna marcada el
 * personaje es COMPARTIDO y sale en todas.
 *
 * No guarda por su cuenta: escribe en el estado de la fila y va
 * con el mismo "Guardar personaje" que el nombre y la descripción,
 * para que marcar un par de temporadas no se guarde a medias si
 * se cierra la fila sin pulsar nada.
 */
const CharacterSeasonsPicker: FC<{
  /** Temporadas marcadas, ya leídas con `seasonIdsDe`. */
  value: string[];
  seasons: SeasonDoc[];
  onChange: (ids: string[]) => void;
}> = ({ value, seasons, onChange }) => {
  const options = useMemo(
    () =>
      [...seasons]
        .sort((a, b) => asNum(a.number) - asNum(b.number))
        .map((s) => ({
          value: s.id,
          label: `Temporada ${asNum(s.number)}${asStr(s.title) ? ` · ${asStr(s.title)}` : ''}`,
        })),
    [seasons],
  );

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
      <MultiSelectField
        label="Temporadas en las que sale"
        value={value}
        onChange={onChange}
        options={options}
        hint="Sin marcar ninguna sale en todas las temporadas. Con varias marcadas, solo en esas."
      />

      {value.length > 0 && (
        <p className="mt-1 text-[10px] text-zinc-600">
          Deja de salir en la {value.length === 1 ? 'temporada' : 'temporadas'} que no has marcado.
        </p>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// FORMULARIOS DE TEMPORADA
// ────────────────────────────────────────────────────────

const SEASON_STATUS_OPTIONS = [
  { value: 'Próximamente', label: 'Próximamente' },
  { value: 'En emisión', label: 'En emisión' },
  { value: 'Finalizado', label: 'Finalizado' },
];

// Los estados del anime se escriben con palabras cortas porque el
// filtro de estado del panel compara contra ellas. La copia a
// anime.status traduce las de la temporada (ver saveSeasonFields).
const ANIME_STATUS_OPTIONS = [
  { value: 'emitiendo', label: 'Emitiendo' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'upcoming', label: 'Próximamente' },
];

const NewSeasonForm: FC<{
  animeId: string;
  nextNumber: number;
  provider: UploadProvider;
  onDone: () => void;
  onCancel: () => void;
}> = ({ animeId, nextNumber, provider, onDone, onCancel }) => {
  const [number, setNumber] = useState(String(nextNumber));
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('Próximamente');
  const [studio, setStudio] = useState('');
  const [rating, setRating] = useState('');
  const [episodesCount, setEpisodesCount] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [posterFocus, setPosterFocus] = useState({ x: 0.5, y: 0.5 });
  const [bannerFocus, setBannerFocus] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (saving) return;
    setError('');

    const num = Number(number);
    if (!Number.isInteger(num) || num < 1) {
      setError('El número de temporada debe ser 1 o mayor.');
      return;
    }
    const yearNum = Number(year);
    if (year && (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100)) {
      setError('El año debe ser un número entre 1900 y 2100.');
      return;
    }
    if (!isValidRating(rating)) {
      setError('La puntuación debe estar entre 0 y 10.');
      return;
    }
    const episodesNum = Number(episodesCount);
    if (episodesCount && (!Number.isInteger(episodesNum) || episodesNum < 0)) {
      setError('Los capítulos emitidos deben ser un número entero.');
      return;
    }

    setSaving(true);
    try {
      await createSeason({
        animeId,
        number: num,
        title,
        synopsis,
        year: year ? yearNum : 0,
        status,
        studio,
        rating: rating ? Number(rating) : 0,
        episodesCount: episodesCount ? episodesNum : 0,
        posterUrl,
        // Las dos imágenes son opcionales: si no se suben, la
        // temporada se queda sin imágenes propias y la wiki usa
        // las del anime.
        bannerUrl,
        posterFocus,
        bannerFocus,
      });
      onDone();
    } catch (e) {
      setError(messageOf(e, 'No se pudo crear la temporada.'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField label="Número" value={number} onChange={setNumber} />
        <div className="sm:col-span-2">
          <TextField
            label="Nombre (opcional)"
            value={title}
            onChange={setTitle}
            placeholder="Segunda Parte"
          />
        </div>
        <NumberField label="Año" value={year} onChange={setYear} />
      </div>

      <SelectField
        label="Estado"
        value={status}
        onChange={setStatus}
        options={SEASON_STATUS_OPTIONS}
      />

      <TextArea
        label="Sinopsis de la temporada (opcional)"
        value={synopsis}
        onChange={setSynopsis}
        rows={3}
      />

      {/* Ficha técnica de la temporada. Igual que en la edición:
          cada temporada tiene la suya y lo que se deja vacío lo
          hereda la wiki del anime (ver `fichaDe`). */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Estudio"
          value={studio}
          onChange={setStudio}
          placeholder="Trigger / CD PROJECT RED"
        />
        <NumberField
          label="Puntuación (0-10)"
          value={rating}
          onChange={setRating}
          hint="La que se ve en la ficha"
        />
        <NumberField
          label="Capítulos emitidos"
          value={episodesCount}
          onChange={setEpisodesCount}
          hint="Opcional. Se puede sincronizar con los episodios guardados."
        />
      </div>

      {/* Imágenes PROPIAS de la temporada. La portada es el
          póster vertical y el banner el horizontal de la wiki. Si
          se dejan vacías, la wiki usa las del anime, así que una
          segunda temporada no está obligada a tener imagen
          distinta. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <ImagePicker
            label="Póster de la temporada"
            value={posterUrl}
            onChange={setPosterUrl}
            provider={provider}
            collectionName="seasons"
            placeholderId={animeId}
            field="poster"
          />
          <FocalField
            label="Encuadre del póster"
            src={posterUrl}
            value={posterFocus}
            onChange={setPosterFocus}
            hint="Qué parte del póster se ve en la wiki. Se recorta en vertical pequeño."
            alto="h-40"
          />
        </div>

        <div className="space-y-2">
          <ImagePicker
            label="Banner de la temporada"
            value={bannerUrl}
            onChange={setBannerUrl}
            provider={provider}
            collectionName="seasons"
            placeholderId={animeId}
            field="banner"
          />
          <FocalField
            label="Encuadre del banner"
            src={bannerUrl}
            value={bannerFocus}
            onChange={setBannerFocus}
            hint="El banner es muy horizontal: casi siempre querrás arriba o al centro."
            alto="h-40"
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {saving ? 'Creando...' : 'Crear temporada'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700"
        >
          <X size={12} />
          Cancelar
        </button>
      </div>
    </div>
  );
};

/**
 * Ficha de una temporada: nombre, año, estado, sinopsis, ficha
 * técnica e imágenes.
 *
 * Cada temporada tiene la suya. La 2 puede tener otro estudio, otro
 * año y otra portada que la 1, y eso es lo que sale en la wiki al
 * pinchar esa temporada. Lo único que no cambia entre temporadas
 * son las categorías, los géneros y las plataformas, que son de la
 * serie entera y se editan en el bloque del anime.
 *
 * `seasonId` vacío = TEMPORADA 1 IMPLÍCITA: la ficha se guarda en el
 * documento del anime, que es la base que heredan todas las
 * temporadas. Es lo que se usa cuando el anime todavía no tiene
 * ninguna temporada guardada; en cuanto se crea la primera, la
 * ficha pasa a vivir en su documento y el anime queda con los
 * valores por defecto.
 */
const SeasonDataForm: FC<{
  /** Documento del que se leen los valores actuales. */
  doc: Record<string, unknown>;
  animeId: string;
  /** Vacío = temporada 1 implícita (los datos van al anime). */
  seasonId: string;
  /**
   * Si es la primera temporada, la ficha se copia también al anime
   * (ver `saveSeasonFields`). Solo tiene sentido con temporada.
   */
  esLaPrimera?: boolean;
  provider: UploadProvider;
  onDone: () => void;
  onCancel: () => void;
}> = ({ doc, animeId, seasonId, esLaPrimera = false, provider, onDone, onCancel }) => {
  const esTemporada = Boolean(seasonId);

  // Cada sitio llama a su portada como quiere: el anime la tiene en
  // "coverUrl" y la temporada en "posterUrl". Con un solo nombre
  // habría que renombrar una de las dos, y renombrar la del anime
  // dejaría sin portada a todo el catálogo antiguo.
  const campoPortada = esTemporada ? 'posterUrl' : 'coverUrl';
  const campoEncuadrePortada = esTemporada ? 'posterFocus' : 'coverFocus';

  const [number, setNumber] = useState(String(asNum(doc.number, 1)));
  const [title, setTitle] = useState(asStr(doc.title));
  const [synopsis, setSynopsis] = useState(asStr(doc.synopsis));
  const [year, setYear] = useState(String(asNum(doc.year) || ''));
  // El estado se normaliza al vocabulario de cada formulario: el
  // de la temporada es la palabra larga y el de la ficha base la
  // corta. Sin esto, una serie antigua guardada con "En emisión"
  // abriría el desplegable sin ninguna opción marcada, porque su
  // valor no está en la lista.
  const [status, setStatus] = useState(
    esTemporada
      ? textoEstado(doc.status) || 'Próximamente'
      : estadoCorto(asStr(doc.status)) || 'emitiendo',
  );
  const [studio, setStudio] = useState(asStr(doc.studio));
  const [rating, setRating] = useState(String(asNum(doc.rating) || ''));
  const [episodesCount, setEpisodesCount] = useState(String(asNum(doc.episodesCount) || ''));
  const [posterFocus, setPosterFocus] = useState(puntoEncuadre(doc[campoEncuadrePortada]));
  const [bannerFocus, setBannerFocus] = useState(puntoEncuadre(doc.bannerFocus));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /** Guarda en la temporada y, si es la primera, también en el anime. */
  const guardar = async (fields: Record<string, unknown>) => {
    if (esTemporada) {
      await saveSeasonFields(seasonId, animeId, esLaPrimera, fields);
    } else {
      await updateFields('animes', animeId, fields);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setError('');

    const num = Number(number);
    if (esTemporada && (!Number.isInteger(num) || num < 1)) {
      setError('El número de temporada debe ser 1 o mayor.');
      return;
    }
    const yearNum = Number(year);
    if (year && (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100)) {
      setError('El año debe ser un número entre 1900 y 2100.');
      return;
    }
    const ratingNum = Number(rating);
    if (rating && (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 10)) {
      setError('La puntuación debe estar entre 0 y 10.');
      return;
    }
    const episodesNum = Number(episodesCount);
    if (episodesCount && (!Number.isInteger(episodesNum) || episodesNum < 0)) {
      setError('Los capítulos emitidos deben ser un número entero.');
      return;
    }

    setSaving(true);
    try {
      await guardar({
        ...(esTemporada ? { number: num } : {}),
        title: title.trim(),
        synopsis: synopsis.trim(),
        year: year ? yearNum : 0,
        status,
        studio: studio.trim(),
        rating: rating ? ratingNum : 0,
        episodesCount: episodesCount ? episodesNum : 0,
        // Los encuadres van con "Guardar". Las imágenes NO: las
        // sube el ImageUploader en cuanto se sube, para no
        // perderlas si se cierra sin guardar.
        [campoEncuadrePortada]: posterFocus,
        bannerFocus,
      });
      onDone();
    } catch (e) {
      setError(
        messageOf(e, esTemporada ? 'No se pudo guardar la temporada.' : 'No se pudo guardar la ficha.'),
      );
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/60 p-3">
      <div className={`grid gap-3 ${esTemporada ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {esTemporada && <NumberField label="Número" value={number} onChange={setNumber} />}
        <div className={esTemporada ? 'sm:col-span-2' : 'sm:col-span-2'}>
          <TextField
            label="Nombre"
            value={title}
            onChange={setTitle}
            placeholder="Segunda Parte"
          />
        </div>
        <NumberField label="Año" value={year} onChange={setYear} />
      </div>

      <SelectField
        label="Estado"
        value={status}
        onChange={setStatus}
        options={esTemporada ? SEASON_STATUS_OPTIONS : ANIME_STATUS_OPTIONS}
      />

      <TextArea label="Sinopsis" value={synopsis} onChange={setSynopsis} rows={3} />

      {/* Ficha técnica */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Estudio"
          value={studio}
          onChange={setStudio}
          placeholder="Trigger / CD PROJECT RED"
        />
        <NumberField
          label="Puntuación (0-10)"
          value={rating}
          onChange={setRating}
          hint="La que se ve en la ficha"
        />
        <NumberField
          label="Capítulos emitidos"
          value={episodesCount}
          onChange={setEpisodesCount}
        />
      </div>

      {/* Imágenes de la temporada. El póster y el banner se suben
          por separado y cada uno guarda su encuadre: son recortes
          distintos, como los del anime. Si no hay banner propio, la
          wiki sigue enseñando el de la serie. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
<ImageUploader
            label="Portada de la temporada"
            currentUrl={asStr(doc[campoPortada])}
            section={esTemporada ? 'seasons' : 'animes'}
            itemId={seasonId || animeId}
            field={campoPortada}
            provider={provider}
            // 3:4, que es la proporción de la tarjeta del catálogo y
            // del póster de la wiki. Es la que hay que recortar: si se
            // subiera sin recortar, cada uno de esos sitios decidiría
            // por su cuenta qué parte se ve.
            aspectRatio={3 / 4}
            maximo={900}
            onSaved={(url) => guardar({ [campoPortada]: url })}
          />
          <FocalField
            label="Encuadre de la portada"
            src={asStr(doc[campoPortada])}
            value={posterFocus}
            onChange={setPosterFocus}
            hint="Qué parte se ve en la tarjeta y en la wiki."
            alto="h-40"
          />
        </div>

        <div className="space-y-2">
<ImageUploader
            label="Banner de la temporada"
            currentUrl={asStr(doc.bannerUrl)}
            section={esTemporada ? 'seasons' : 'animes'}
            itemId={seasonId || animeId}
            field="bannerUrl"
            provider={provider}
            // 16:9, que es la proporción del banner del detalle. Es
            // el caso donde más se nota: una imagen vertical aquí
            // perdía más de la mitad, y siempre por el centro.
            aspectRatio={16 / 9}
            maximo={1600}
            onSaved={(url) => guardar({ bannerUrl: url })}
          />
          <FocalField
            label="Encuadre del banner"
            src={asStr(doc.bannerUrl)}
            value={bannerFocus}
            onChange={setBannerFocus}
            hint="El banner es muy horizontal: casi siempre querrás arriba o al centro."
            alto="h-40"
          />
        </div>
      </div>

      {!esTemporada && (
        <p className="text-[11px] text-zinc-500">
          Esta es la ficha base de la serie: la heredan las temporadas que no tengan la suya. En
          cuanto guardes la primera temporada, lo que rellenes aquí pasará a vivir en su ficha y
          estos campos quedarán como valores por defecto.
        </p>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Guardando...' : esTemporada ? 'Guardar temporada' : 'Guardar ficha'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700"
        >
          <X size={12} />
          Cerrar
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────
// AÑADIR DENTRO DE UNA TEMPORADA
// ────────────────────────────────────────────────────────

/**
 * Botón que despliega el formulario de episodio dentro del
 * bloque de la temporada. Cada temporada tiene el suyo, así que
 * un episodio nace ya dentro de ella y no hay que acordarse de
 * moverlo después.
 */
const SeasonAddForm: FC<{
  season: SeasonDoc;
  nextNumber: number;
  provider: UploadProvider;
}> = ({ season, nextNumber, provider }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg bg-cyan-600/20 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-600/30"
      >
        <Plus size={12} />
        Añadir episodio
      </button>

      {open && (
        <div className="w-full">
          <EpisodeForm
            animeId={asStr(season.animeId)}
            seasonId={season.id}
            nextNumber={nextNumber}
            provider={provider}
            onDone={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
};

// ────────────────────────────────────────────────────────
// BLOQUES DE TEMPORADA
// ────────────────────────────────────────────────────────

/**
 * Lista con su etiqueta, plegable. Se usa igual para los episodios
 * y para los personajes de una temporada, para no repetir el mismo
 * "título + lista" cinco veces.
 *
 * Arranca DESPLEGADA, al revés que el resto del panel. Para verla
 * hay que haber desplegado antes la temporada o el grupo sin
 * asignar, así que a esas alturas ya se ha pedido ver su contenido;
 * meter un paso más solo para ver una lista de diez capítulos
 * cansaría. Si se quisiera al revés, es cambiar el false por true.
 */
const SeasonItems: FC<{
  label: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  emptyText?: string;
  tone?: 'cyan' | 'pink';
  actions?: React.ReactNode;
}> = ({ label, icon, items, emptyText, tone = 'cyan', actions }) => {
  // true = desplegada. Para cambiarlo al revés, false aquí.
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-2">
      {/* "flex-wrap" para que el formulario que se abre junto al
          botón baje a su propia línea en vez de estrujarse al lado
          de la etiqueta. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* La etiqueta es un botón, pero suelta: anidarla dentro
            del <button> de "actions" no valdría, porque un botón
            dentro de otro botón es HTML inválido y el de "añadir"
            dejaría de pulsarse al abrir la lista. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-widest transition-colors hover:brightness-125 ${
            tone === 'pink' ? 'text-pink-300' : 'text-cyan-300'
          }`}
        >
          {icon}
          {label}
          {open ? (
            <ChevronUp size={12} className="flex-shrink-0 opacity-60" />
          ) : (
            <ChevronDown size={12} className="flex-shrink-0 opacity-60" />
          )}
        </button>

        {actions}
      </div>

      {open && (
        <>
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-center text-[11px] text-zinc-500">
              {emptyText ?? 'Nada aquí todavía.'}
            </p>
          ) : (
            <ul className="space-y-2">{items}</ul>
          )}
        </>
      )}
    </div>
  );
};

interface SeasonBlockProps {
  season: SeasonDoc;
  index: number;
  total: number;
  reordering: boolean;
  onMove: (direction: -1 | 1) => void;
  episodes: EpisodeDoc[];
  characters: CharacterDoc[];
  allSeasons: SeasonDoc[];
  provider: UploadProvider;
  /**
   * El acordeón vive en AnimeEditor, no aquí dentro.
   *
   * Si el estado de "qué fila está desplegada" fuera de cada
   * SeasonBlock, cada bloque tendría el suyo y se podrían abrir
   * varias filas a la vez al cambiar de bloque. Pasándolo como
   * props, el acordeón es de todo el anime.
   */
  episodioAbierto: string | null;
  onToggleEpisodio: (id: string) => void;
}

const SeasonBlock: FC<SeasonBlockProps> = ({
  season,
  index,
  total,
  reordering,
  onMove,
  episodes,
  characters,
  allSeasons,
  provider,
  episodioAbierto,
  onToggleEpisodio,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const number = asNum(season.number, index + 1);
  const name = asStr(season.title);

  const orderedEps = [...episodes].sort((a, b) => asNum(a.number) - asNum(b.number));

  // Los personajes de la temporada solo se cuentan aquí, para la
  // cabecera. Su lista está en la sección de personajes de abajo:
  // son compartidos y no se editan dentro de la temporada. Un
  // personaje que sale en varias cuenta en cada una de ellas.
  const charCount = characters.length;

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const moved = await deleteSeasonCascade(season.id);
      setConfirmingDelete(false);
      setError(
        `Temporada ${number} eliminada. ${moved.episodes} episodio(s) han vuelto a la ` +
          `temporada 1 y ${moved.characters} personaje(s) han dejado de salir en ella.`,
      );
    } catch (e) {
      setError(messageOf(e, 'No se pudo eliminar la temporada.'));
    } finally {
      setDeleting(false);
    }
  };

  const syncEpisodeCount = async () => {
    try {
      await updateFields('seasons', season.id, { episodesCount: orderedEps.length });
      setError('');
    } catch (e) {
      setError(messageOf(e, 'No se pudo actualizar el contador.'));
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40">
      {/* Cabecera */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-[11px] font-black text-violet-300">
            {number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">
              Temporada {number}
              {name ? `: ${name}` : ''}
            </p>
            <p className="truncate text-[10px] text-zinc-500">
              {orderedEps.length} {orderedEps.length === 1 ? 'episodio' : 'episodios'} ·{' '}
              {charCount} personaje{charCount === 1 ? '' : 's'} en ella
              {asNum(season.year) ? ` · ${asNum(season.year)}` : ''}
              {textoEstado(season.status) ? ` · ${textoEstado(season.status)}` : ''}
            </p>
          </div>
          {open ? (
            <ChevronUp size={15} className="flex-shrink-0 text-zinc-400" />
          ) : (
            <ChevronDown size={15} className="flex-shrink-0 text-zinc-400" />
          )}
        </button>

        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={reordering || index === 0}
            title="Subir"
            aria-label="Subir temporada"
            className="rounded-md p-1 text-zinc-500 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={reordering || index === total - 1}
            title="Bajar"
            aria-label="Bajar temporada"
            className="rounded-md p-1 text-zinc-500 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-500"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Editar datos de la temporada"
            aria-label="Editar temporada"
            className="rounded-md p-1 text-zinc-500 hover:text-violet-400"
          >
            <Save size={13} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            title="Eliminar temporada"
            aria-label="Eliminar temporada"
            className="rounded-md p-1 text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {error && (
        <p className="border-t border-zinc-800 px-3 py-2 text-[11px] text-amber-400">{error}</p>
      )}

      {confirmingDelete && (
        <div className="flex flex-wrap items-center gap-2 border-t border-red-500/30 bg-red-500/10 px-3 py-2">
          <span className="text-[11px] text-red-300">
            ¿Eliminar la temporada {number}? Sus {orderedEps.length} episodio(s) y{' '}
            {charCount} personaje(s) no se borran: los episodios vuelven a la temporada 1 y
            los personajes dejan de salir en esta, manteniendo las demás temporadas en las que
            estaban.
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? 'Borrando...' : 'Sí, eliminar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
          >
            Cancelar
          </button>
        </div>
      )}

      {editing && (
        <SeasonDataForm
          doc={season}
          animeId={asStr(season.animeId)}
          seasonId={asStr(season.id)}
          esLaPrimera={index === 0}
          provider={provider}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      )}

      {open && (
        <div className="space-y-4 border-t border-zinc-800 p-3">
          {asStr(season.synopsis) && (
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400">
              {asStr(season.synopsis)}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {orderedEps.length > 0 && (
              <button
                type="button"
                onClick={syncEpisodeCount}
                className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
              >
                Sincronizar contador ({orderedEps.length})
              </button>
            )}
          </div>

          {/* "Añadir episodio" va en la cabecera de su lista, que es
              donde se van a añadir. Si se deja en la barra de arriba
              queda separado de la lista a la que pertenece.

              Aquí NO hay lista de personajes: viven en su propia
              sección, más abajo. Un personaje puede estar en
              varias temporadas, así que ponerlo dentro de una
              sola daría la impresión de que es suyo cuando en
              la wiki se verá en todas las que tenga marcadas. */}
          <SeasonItems
            label={`Episodios (${orderedEps.length})`}
            icon={<Film size={11} />}
            tone="cyan"
            emptyText="Esta temporada todavía no tiene episodios."
            actions={
              <SeasonAddForm
                season={season}
                nextNumber={orderedEps.length + 1}
                provider={provider}
              />
            }
            items={orderedEps.map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                seasons={allSeasons}
                provider={provider}
                open={episodioAbierto === ep.id}
                onToggle={() => onToggleEpisodio(ep.id)}
              />
            ))}
          />
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// FILA DE EPISODIO
// ────────────────────────────────────────────────────────

const EpisodeRow: FC<{
  episode: EpisodeDoc;
  /** Temporadas del anime, para poder mover el episodio. */
  seasons: SeasonDoc[];
  provider: UploadProvider;
  /** Si esta fila es la única desplegada. Lo decide el padre. */
  open: boolean;
  onToggle: () => void;
}> = ({ episode, seasons, provider, open, onToggle }) => {
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [number, setNumber] = useState(String(asNum(episode.number, 1)));
  const [title, setTitle] = useState(asStr(episode.title));
  const [description, setDescription] = useState(asStr(episode.description));
  const [airDate, setAirDate] = useState(asStr(episode.airDate));
  const [rating, setRating] = useState(asNum(episode.rating) ? String(asNum(episode.rating)) : '');
  const [ratingError, setRatingError] = useState('');
  const [thumbnailFocus, setThumbnailFocus] = useState(puntoEncuadre(episode.thumbnailFocus));

  const handleSave = async () => {
    if (saving) return;
    setError('');


    // Un episodio puede llevar decimales: las OVAs van entre dos capitulos
    // sin renumerar la temporada. Ver `numeroDeEpisodioValido`.
    const num = numeroDeEpisodioValido(number);
    if (num === null) {
      setError(ERROR_NUMERO_EPISODIO);
      return;
    }
    setRatingError('');

    setSaving(true);
    try {
    await updateFields('episodes', episode.id, {
      number: num,
      title: title.trim(),
      description: description.trim(),
      airDate,
      rating: normalizeRating(rating),
      thumbnailFocus,
    });
      setError('');
    } catch (e) {
      setError(messageOf(e, 'No se pudo guardar.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem('episodes', episode.id);
    } catch (e) {
      setError(messageOf(e, 'No se pudo eliminar.'));
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center gap-2.5 p-2.5">
        <div className="h-9 w-16 flex-shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
          {asStr(episode.thumbnailUrl) ? (
            <img
              src={asStr(episode.thumbnailUrl)}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Film size={13} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-200">
            Ep.{asNum(episode.number)} · {title}
          </p>
          <p className="truncate text-[10px] text-zinc-500">
            {asStr(episode.airDate) || 'Sin fecha'}
            {asNum(episode.rating) > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-amber-400">
                <Star size={9} className="fill-amber-400" />
                {asNum(episode.rating)}
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1 text-zinc-500 hover:text-white"
          aria-label={open ? 'Cerrar' : 'Editar'}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {confirming ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              {deleting ? '...' : 'Sí'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md p-1 text-zinc-500 hover:text-red-400"
            aria-label="Eliminar episodio"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
              {/* Episodios con decimales: una OVA que va entre el 15 y el 16
                  se guarda como 15.5, que es lo unico que cabe sin renumerar
                  la temporada. El `step` deja escribirlo; sin el, el navegador
                  lo marca como invalido. Ver `numeroDeEpisodioValido`. */}
              <NumberField
                label="Número"
                value={number}
                onChange={setNumber}
                step={0.1}
                hint="Admite decimales: 15.5 para un extra entre el 15 y el 16, 0.5 para uno antes del primero."
              />
            <div className="sm:col-span-2">
              <TextField label="Título" value={title} onChange={setTitle} />
            </div>
          </div>

          <TextArea
            label="Descripción"
            value={description}
            onChange={setDescription}
            rows={3}
          />

          <TextField
            label="Fecha de emisión"
            value={airDate}
            onChange={setAirDate}
            placeholder="2019-01-12"
          />

          <NumberField
            label="Puntuación (0-10)"
            value={rating}
            onChange={(v) => {
              setRating(v);
              if (ratingError) setRatingError('');
            }}
            error={ratingError}
            hint="La que se ve en la wiki. Déjalo vacío si aún no tiene nota."
          />

          <ImageUploader
            label="Miniatura"
            currentUrl={asStr(episode.thumbnailUrl)}
            section={'episodes' as CatalogSection}
            itemId={episode.id}
            field="thumbnailUrl"
            provider={provider}
            // 16:9, que es como se ven las miniaturas en la lista de
            // capítulos. Recortadas aquí, no se pierde el centro de la
            // imagen al pintar cada fila.
            aspectRatio={16 / 9}
            maximo={800}
            onSaved={(url) => updateFields('episodes', episode.id, { thumbnailUrl: url })}
          />

          <FocalField
            label="Encuadre de la miniatura"
            src={asStr(episode.thumbnailUrl)}
            value={thumbnailFocus}
            onChange={setThumbnailFocus}
            hint="Pulsa o arrastra para decidir qué parte se ve en la lista de episodios."
            alto="h-40"
          />

          {seasons.length > 0 && (
            <MoveToSeasonSelect
              itemId={episode.id}
              currentSeasonId={seasonIdOf(episode)}
              seasons={seasons}
              onError={setError}
            />
          )}

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Guardando...' : 'Guardar episodio'}
          </button>
        </div>
      )}
    </li>
  );
};

// ────────────────────────────────────────────────────────
// FORMULARIO DE NUEVO EPISODIO
// ────────────────────────────────────────────────────────

const EpisodeForm: FC<{
  animeId: string;
  /** Vacío = temporada 1 implícita del anime. */
  seasonId: string;
  nextNumber: number;
  provider: UploadProvider;
  onDone: () => void;
  onCancel: () => void;
}> = ({ animeId, seasonId, nextNumber, provider, onDone, onCancel }) => {
  const [number, setNumber] = useState(String(nextNumber));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [airDate, setAirDate] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFocus, setThumbnailFocus] = useState({ x: 0.5, y: 0.5 });
  const [rating, setRating] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (saving) return;
    setError('');


    // Un episodio puede llevar decimales: las OVAs van entre dos capitulos
    // sin renumerar la temporada. Ver `numeroDeEpisodioValido`.
    const num = numeroDeEpisodioValido(number);
    if (num === null) {
      setError(ERROR_NUMERO_EPISODIO);
      return;
    }
    setRatingError('');

    setSaving(true);
    try {
      await createEpisode({
        animeId,
        seasonId,
        number: num,
        title,
        description,
        airDate,
        thumbnailUrl,
        thumbnailFocus,
        rating: normalizeRating(rating),
      });
      onDone();
    } catch (e) {
      setError(messageOf(e, 'No se pudo crear el episodio.'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
      <div className="grid gap-3 sm:grid-cols-3">
              {/* Episodios con decimales: una OVA que va entre el 15 y el 16
                  se guarda como 15.5, que es lo unico que cabe sin renumerar
                  la temporada. El `step` deja escribirlo; sin el, el navegador
                  lo marca como invalido. Ver `numeroDeEpisodioValido`. */}
              <NumberField
                label="Número"
                value={number}
                onChange={setNumber}
                step={0.1}
                hint="Admite decimales: 15.5 para un extra entre el 15 y el 16, 0.5 para uno antes del primero."
              />
        <div className="sm:col-span-2">
          <TextField label="Título" value={title} onChange={setTitle} />
        </div>
      </div>

      <TextArea
        label="Descripción"
        value={description}
        onChange={setDescription}
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Fecha de emisión"
          value={airDate}
          onChange={setAirDate}
          placeholder="2019-01-12"
        />

        <NumberField
          label="Puntuación (0-10)"
          value={rating}
          onChange={(v) => {
            setRating(v);
            if (ratingError) setRatingError('');
          }}
          error={ratingError}
          hint="Opcional: la que se verá en la wiki."
        />
      </div>

      <ImagePicker
        label="Miniatura"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
        provider={provider}
        collectionName="episodes"
        placeholderId={animeId}
        field="thumbnail"
      />

      <FocalField
        label="Encuadre de la miniatura"
        src={thumbnailUrl}
        value={thumbnailFocus}
        onChange={setThumbnailFocus}
        hint="Pulsa o arrastra para decidir qué parte se ve en la lista de episodios."
        alto="h-40"
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {saving ? 'Creando...' : 'Crear episodio'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700"
        >
          <X size={12} />
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────
// FILA DE PERSONAJE
// ────────────────────────────────────────────────────────

const CharacterEditor: FC<{
  character: CharacterDoc;
  /** Temporadas del anime, para poder mover el personaje. */
  seasons: SeasonDoc[];
  /** Etiquetas ya usadas por los personajes de la serie. */
  tagSuggestions: string[];
  provider: UploadProvider;
  /** Si esta fila es la única desplegada. Lo decide el padre. */
  open: boolean;
  onToggle: () => void;
}> = ({ character, seasons, tagSuggestions, provider, open, onToggle }) => {
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(asStr(character.name));
  const [description, setDescription] = useState(asStr(character.description));
  const [role, setRole] = useState(asStr(character.role) || 'main');
  const [imageFocus, setImageFocus] = useState(puntoEncuadre(character.imageFocus));
  const [japaneseName, setJapaneseName] = useState(asStr(character.japaneseName));
  const [voiceActor, setVoiceActor] = useState(asStr(character.voiceActor));
  // Temporadas marcadas en el selector. Se leen con seasonIdsDe,
  // que también entiende el "seasonId" antiguo de los personajes
  // que ya había.
  const [seasonIds, setSeasonIds] = useState<string[]>(() => seasonIdsDe(character));
  const [tags, setTags] = useState<string[]>(() => asList(character.tags));

  const handleSave = async () => {
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      // Las temporadas van aparte (ver `setCharacterSeasons`):
      // tienen su propio botón, y escribirlas aquí borraría lo
      // que se hubiera marcado sin llegar a pulsarlo.
      await Promise.all([
        updateFields('characters', character.id, {
          name: name.trim(),
          description,
          role,
          imageFocus,
          // Se guardan vacíos si se vacían: es la forma de quitar
          // un nombre japonés o un seiyuu que se puso por error,
          // sin tener que borrarlo y volver a escribirlo.
          japaneseName: japaneseName.trim(),
          voiceActor: voiceActor.trim(),
          // Las etiquetas también: quitarlas todas tiene que
          // deixar el array vacío, no quitar el campo.
          tags: normalizaTags(tags),
        }),
        setCharacterSeasons(character.id, seasonIds),
      ]);
    } catch (e) {
      setError(messageOf(e, 'No se pudo guardar.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem('characters', character.id);
    } catch (e) {
      setError(messageOf(e, 'No se pudo eliminar.'));
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center gap-2.5 p-2.5">
        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
          {asStr(character.imageUrl) ? (
            <img
              src={asStr(character.imageUrl)}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Users size={13} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-200">{name}</p>
          <p className="truncate text-[10px] text-zinc-500">
            {roleLabel(role)} ·{' '}
            {/* Chapa para no tener que desplegar la fila para
                saber en cuántas temporadas sale el personaje. */}
            <SeasonBadge ids={seasonIdsDe(character)} seasons={seasons} />
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1 text-zinc-500 hover:text-white"
          aria-label={open ? 'Cerrar' : 'Editar'}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {confirming ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              {deleting ? '...' : 'Sí'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md p-1 text-zinc-500 hover:text-red-400"
            aria-label="Eliminar personaje"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nombre" value={name} onChange={setName} />
            <SelectField
              label="Importancia"
              value={role}
              onChange={setRole}
              options={ROLE_OPTIONS}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nombre japonés"
              value={japaneseName}
              onChange={setJapaneseName}
              placeholder="白銀 御行"
              hint="Opcional. Sale en violeta bajo el nombre."
            />
            <TextField
              label="Seiyuu (Voz)"
              value={voiceActor}
              onChange={setVoiceActor}
              placeholder="Makoto Furukawa"
              hint="Opcional. Sale junto al nombre japonés."
            />
          </div>

          <TextArea
            label="Descripción"
            value={description}
            onChange={setDescription}
            rows={3}
          />

          <TagsField
            label="Etiquetas"
            value={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            hint="Salen bajo el nombre en la wiki y el buscador las encuentra. Con 'Destacados' el personaje sale en el filtro de destacados."
          />

          <ImageUploader
            label="Imagen"
            currentUrl={asStr(character.imageUrl)}
            section={'characters' as CatalogSection}
            itemId={character.id}
            field="imageUrl"
            provider={provider}
            // 2:3, que es la proporción de la tarjeta de personaje de
            // la wiki. Es la que más sufria: una ficha de personaje
            // es casi siempre vertical y la tarjeta la recortaba por
            // el centro, que es justo donde no está la cara.
            aspectRatio={2 / 3}
            maximo={900}
            onSaved={(url) => updateFields('characters', character.id, { imageUrl: url })}
          />

          <FocalField
            label="Encuadre de la imagen"
            src={asStr(character.imageUrl)}
            value={imageFocus}
            onChange={setImageFocus}
            hint="Pulsa o arrastra sobre la foto para decidir qué parte se ve en la tarjeta de la wiki."
          />

          {seasons.length > 0 && (
            <CharacterSeasonsPicker
              value={seasonIds}
              seasons={seasons}
              onChange={setSeasonIds}
            />
          )}

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Guardando...' : 'Guardar personaje'}
          </button>
        </div>
      )}
    </li>
  );
};

// ────────────────────────────────────────────────────────
// FORMULARIO DE NUEVO PERSONAJE
// ────────────────────────────────────────────────────────

const NewCharacterForm: FC<{
  animeId: string;
  /**
   * Temporadas del anime, para elegir en cuáles nace. Sin ellas
   * (dentro de una temporada) el personaje nace compartido y se
   * reasigna desde su fila.
   */
  seasons?: SeasonDoc[];
  /** Etiquetas ya usadas por los personajes de la serie. */
  tagSuggestions?: string[];
  provider: UploadProvider;
  onDone: () => void;
  onCancel: () => void;
}> = ({ animeId, seasons, tagSuggestions = [], provider, onDone, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('main');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFocus, setImageFocus] = useState({ x: 0.5, y: 0.5 });
  const [japaneseName, setJapaneseName] = useState('');
  const [voiceActor, setVoiceActor] = useState('');
  // Vacío = compartido, que es lo normal. Se puede marcar más de
  // una: hay quien sale en la 1 y en la 3 pero no en la 2.
  const [seasonIds, setSeasonIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      await createCharacter({
        animeId,
        seasonIds,
        name,
        description,
        role,
        imageUrl,
        imageFocus,
        japaneseName: japaneseName.trim(),
        voiceActor: voiceActor.trim(),
        tags,
      });
      onDone();
    } catch (e) {
      setError(messageOf(e, 'No se pudo crear el personaje.'));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-pink-500/30 bg-pink-500/5 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Nombre" value={name} onChange={setName} />
        <SelectField
          label="Importancia"
          value={role}
          onChange={setRole}
          options={ROLE_OPTIONS}
        />
      </div>

      <TextArea
        label="Descripción"
        value={description}
        onChange={setDescription}
        rows={3}
      />

      <TagsField
        label="Etiquetas"
        value={tags}
        onChange={setTags}
        suggestions={tagSuggestions}
        hint="Opcionales. Salen bajo el nombre en la wiki y el buscador las encuentra."
      />

      {/* En qué temporadas sale. Aparece solo cuando el formulario
          recibe la lista de temporadas (la sección de personajes).
          Sin marcar ninguna es COMPARTIDO, que es lo normal: sale
          en todas y no hay que tocarlo. */}
      {seasons && seasons.length > 0 && (
        <MultiSelectField
          label="Temporadas en las que sale"
          value={seasonIds}
          onChange={setSeasonIds}
          options={[...seasons]
            .sort((a, b) => asNum(a.number) - asNum(b.number))
            .map((s) => ({
              value: asStr(s.id),
              label: `Temporada ${asNum(s.number)}${asStr(s.title) ? ` · ${asStr(s.title)}` : ''}`,
            }))}
          hint="Sin marcar ninguna sale en todas. Marca solo las que quieras quitarle."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nombre japonés"
          value={japaneseName}
          onChange={setJapaneseName}
          placeholder="白銀 御行"
        />
        <TextField
          label="Seiyuu (Voz)"
          value={voiceActor}
          onChange={setVoiceActor}
          placeholder="Makoto Furukawa"
        />
      </div>

      <ImagePicker
        label="Imagen del personaje"
        value={imageUrl}
        onChange={setImageUrl}
        provider={provider}
        collectionName="characters"
        placeholderId={animeId}
        field="image"
      />

      <FocalField
        label="Encuadre de la imagen"
        src={imageUrl}
        value={imageFocus}
        onChange={setImageFocus}
        hint="El recuadro es el mismo alto que la tarjeta de la wiki, así que lo que ves aquí es lo que se verá allí."
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {saving ? 'Creando...' : 'Crear personaje'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700"
        >
          <X size={12} />
          Cancelar
        </button>
      </div>
    </div>
  );
};

function messageOf(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    if (e.message.includes('permission-denied')) {
      return 'No tienes permiso. Comprueba que las reglas de seguridad están desplegadas.';
    }
    return e.message;
  }
  return fallback;
}
