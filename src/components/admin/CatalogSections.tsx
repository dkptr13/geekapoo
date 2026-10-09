import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { Plus, X, Loader2, MessageSquare, Trash2, Heart, AlertCircle, Search, SlidersHorizontal, BarChart3 } from 'lucide-react';

import { createAnime, createTrivia, deleteItem, updateFields } from '../../services/catalogAdmin';
import {
  deletePollEverywhere,
  readPollVotes,
  setPollClosed,
} from '../../services/polls';
import type { UploadProvider } from '../../services/imageUpload';
import { ALL_ANIME_CATEGORIES, normalize } from '../../data/animeCategories';
import { estadoCorto } from '../../utils/seasonData';

import { AnimeEditor, type AnimeDoc, type CharacterDoc, type EpisodeDoc, type SeasonDoc } from './AnimeEditor';
import { ImageUploader } from './ImageUploader';
import { ImagePicker } from './ImagePicker';
import { TextField, TextArea, SelectField, NumberField, MultiSelectField, FocalField } from './fields';

type RawDoc = Record<string, unknown> & { id: string };

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');

// ======================================================
// SECCIÓN DE ANIMES (con los episodios y los personajes dentro)
// ======================================================

/**
 * Las categorías de un anime, todas.
 *
 * ── POR QUÉ HACE FALTA ESTA FUNCIÓN ───────────────────────────
 *
 * Un anime puede tener varias categorías desde que el editor de
 * animes guarda la lista completa en `categories` y deja la primera
 * en `category`. Takopi's Original Sin es el primero del catálogo con
 * dos: Thriller & Misterio y Ciencia Ficción & Cyberpunk.
 *
 * El filtro comparaba solo `category`, así que con dos categorías solo
 * se encontraba por la primera: buscando por "Ciencia Ficción &
 * Cyberpunk" no salía, y con razón, porque es de las dos.
 *
 * ── POR QUÉ CAE AL CAMPO VIEJO ─────────────────────────────────
 *
 * Porque los animes que ya estaban tienen `category` y pueden no
 * tener `categories`. Si solo se leyera la lista, esos se quedarían
 * fuera del filtro sin avisar. Con el || se leen los dos: primero la
 * lista, y si no hay lista, el campo de antes.
 *
 * ── POR QUÉ ACEPTA DOS TIPOS ──────────────────────────────────
 *
 * Porque la idea se usa en dos sitios con datos de dos formas: el
 * catálogo del panel lee los documentos de Firestore en crudo, donde
 * un array viene como `[{ stringValue: 'x' }]`, y la sección de
 * categorías usa el tipo `Anime` del contexto, donde el mismo array ya
 * viene convertido en `string[]`. Las dos formas se leen aqui para
 * que el filtro y el contador no puedan dejar de coincidir.
 */
export const categoriasDe = (a: RawDoc | { category?: unknown; categories?: unknown }): string[] => {
  const crudo = a?.categories;

  const lista = Array.isArray(crudo)
    ? crudo
        .map((c) => {
          if (typeof c === 'string') return c;

          const v = (c as { stringValue?: unknown })?.stringValue;

          return typeof v === 'string' ? v : null;
        })
        .filter((x): x is string => Boolean(x))
    : [];

  const suelta = typeof a?.category === 'string' ? a.category : '';

  return lista.length ? lista : suelta ? [suelta] : [];
};

export const AnimesSection: FC<{
  animes: RawDoc[];
  seasons: RawDoc[];
  episodes: RawDoc[];
  characters: RawDoc[];
  categories: RawDoc[];
  provider: UploadProvider;
}> = ({ animes, seasons, episodes, characters, categories, provider }) => {
  const [showNew, setShowNew] = useState(false);

  // El desplegable del filtro se arma con la lista canónica de
  // código NECESARIAMENTE, no solo con los documentos de Firestore.
  //
  // La colección "categories" se sembró una vez con las primeras
  // cinco y no se ha vuelto a tocar, así que de ahí salen cinco. Las
  // cuatro que se añadieron después (Shojo, Seinen, Josei y Kodomo)
  // viven solo en el código, igual que las ofrece el editor de
  // animes: sin esto se podían asignar a una serie, pero no se
  // podía filtrar por ellas, que es justo lo que hace inútil el
  // filtro para encontrarla.
  //
  // Se comparan normalizadas (sin tildes ni mayúsculas) para que un
  // "Thriller & Misterio" y un " thriller y misterio " accounten
  // como la misma categoría y no salgan duplicados.
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; name: string }[] = [];

    const add = (id: string, name: string) => {
      const key = normalize(name);
      if (!name.trim() || seen.has(key)) return;
      seen.add(key);
      options.push({ id: id || key, name });
    };

    // Primero los de Firestore, que son los que tienen contador real.
    categories.forEach((c) => add(asStr(c.id), asStr(c.name)));

    // Y detrás las de la lista, para tapar los huecos.
    ALL_ANIME_CATEGORIES.forEach((c) => add(c.id, c.name));

    return options;
  }, [categories]);

  // ======================================================
  // BUSCADOR Y FILTROS
  // ======================================================
  // Con unas decenas de animes, desplegarlos todos era scroll
  // infinito. El buscador va sobre el texto que se ve en la ficha
  // (título, japonés, estudio, géneros y categoría), que es por
  // donde se busca de verdad, y no solo por el título.
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [content, setContent] = useState<'all' | 'empty' | 'withEpisodes' | 'multiSeason'>('all');
  const [sort, setSort] = useState<'title' | 'yearDesc' | 'yearAsc' | 'seasons' | 'episodes'>('title');

  // Cuántas temporadas y cuántos episodios tiene cada anime, para
  // filtrar y ordenar sin recalcularlo por cada fila.
  const stats = useMemo(() => {
    const map = new Map<string, { seasons: number; episodes: number; characters: number }>();
    animes.forEach((a) => map.set(a.id, { seasons: 0, episodes: 0, characters: 0 }));
    seasons.forEach((s) => {
      const row = map.get(asStr(s.animeId));
      if (row) row.seasons += 1;
    });
    episodes.forEach((e) => {
      const row = map.get(asStr(e.animeId));
      if (row) row.episodes += 1;
    });
    characters.forEach((c) => {
      const row = map.get(asStr(c.animeId));
      if (row) row.characters += 1;
    });
    return map;
  }, [animes, seasons, episodes, characters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = animes.filter((a) => {
      if (category && !categoriasDe(a).includes(category)) return false;
      // El estado se escribe con dos vocabularios: la serie usa la
      // palabra corta ('emitiendo') y la temporada la larga ('En
      // emisión'), y la copia de la ficha de la T1 traduce de una a
      // otra. Como puede quedar cualquiera de las dos, se comparan
      // contra la forma corta en vez de contra el valor literal: si
      // no, una serie guardada con la palabra larga desaparecería
      // del filtro "Emitiendo" sin avisar.
      if (status && estadoCorto(asStr(a.status)) !== status) return false;

      const st = stats.get(a.id) ?? { seasons: 0, episodes: 0, characters: 0 };
      if (content === 'empty' && (st.episodes > 0 || st.characters > 0)) return false;
      if (content === 'withEpisodes' && st.episodes === 0) return false;
      if (content === 'multiSeason' && st.seasons === 0) return false;

      if (!q) return true;
      const haystack = [
        asStr(a.title),
        asStr(a.japaneseTitle),
        asStr(a.studio),
        asStr(a.category),
        asStr(a.status),
        Array.isArray(a.genres) ? a.genres.join(' ') : '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const episodesOf = (id: string) => stats.get(id)?.episodes ?? 0;
    const seasonsOf = (id: string) => stats.get(id)?.seasons ?? 0;

    return list.sort((a, b) => {
      switch (sort) {
        case 'yearDesc':
          return num(b.year) - num(a.year) || asStr(a.title).localeCompare(asStr(b.title));
        case 'yearAsc':
          return num(a.year) - num(b.year) || asStr(a.title).localeCompare(asStr(b.title));
        case 'seasons':
          return seasonsOf(b.id) - seasonsOf(a.id) || asStr(a.title).localeCompare(asStr(b.title));
        case 'episodes':
          return episodesOf(b.id) - episodesOf(a.id) || asStr(a.title).localeCompare(asStr(b.title));
        default:
          return asStr(a.title).localeCompare(asStr(b.title), 'es');
      }
    });
  }, [animes, query, category, status, content, sort, stats]);

  const filtersOn = Boolean(query.trim() || category || status || content !== 'all');
  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setStatus('');
    setContent('all');
  };

  return (
    <div className="space-y-3">
      {/* ── BUSCADOR Y FILTROS ─────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, estudio, género o categoría..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="emitiendo">Emitiendo</option>
            <option value="finished">Finalizado</option>
            <option value="upcoming">Próximamente</option>
          </select>

          <select
            value={content}
            onChange={(e) => setContent(e.target.value as typeof content)}
            aria-label="Filtrar por contenido"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="all">Con y sin contenido</option>
            <option value="withEpisodes">Con episodios</option>
            <option value="multiSeason">Con temporadas</option>
            <option value="empty">Vacíos</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Ordenar"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="title">Orden: Título (A-Z)</option>
            <option value="yearDesc">Orden: Año (más nuevo)</option>
            <option value="yearAsc">Orden: Año (más antiguo)</option>
            <option value="seasons">Orden: Temporadas</option>
            <option value="episodes">Orden: Episodios</option>
          </select>

          {filtersOn && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-2 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <SlidersHorizontal size={10} />
            {filtered.length === animes.length
              ? `${animes.length} animes`
              : `${filtered.length} de ${animes.length} animes`}
          </span>
          {filtersOn && (
            <span className="text-violet-400">filtro aplicado</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">
          Despliega un anime para editarlo y gestionar sus temporadas, episodios y personajes.
        </p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-violet-500"
        >
          <Plus size={13} />
          Añadir anime
        </button>
      </div>

      {showNew && (
        <NewAnimeForm
          provider={provider}
          onDone={() => setShowNew(false)}
        />
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          {animes.length === 0
            ? 'No hay animes en el catálogo. Usa "Añadir anime" para crear el primero.'
            : 'Ningún anime coincide con la búsqueda o los filtros.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((anime) => {
            const animeSeasons = seasons.filter((s) => asStr(s.animeId) === anime.id);
            return (
              <AnimeEditor
                key={anime.id}
                anime={anime as AnimeDoc}
                seasons={animeSeasons as SeasonDoc[]}
                episodes={
                  episodes.filter(
                    (e) => (e as EpisodeDoc).animeId === anime.id,
                  ) as EpisodeDoc[]
                }
                characters={
                  characters.filter(
                    (c) => (c as CharacterDoc).animeId === anime.id,
                  ) as CharacterDoc[]
                }
                provider={provider}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Formulario de anime nuevo ────────────────────────

const NewAnimeForm: FC<{
  provider: UploadProvider;
  onDone: () => void;
}> = ({ provider, onDone }) => {
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('emitiendo');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [genres, setGenres] = useState('');
  const [studio, setStudio] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  // Encuadres de portada y banner, para poder ajustarlos antes de
  // crear el anime y no tener que editarlo justo despues.
  const [coverFocus, setCoverFocus] = useState({ x: 0.5, y: 0.5 });
  const [bannerFocus, setBannerFocus] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (saving) return;
    setError('');

    if (!title.trim()) {
      setError('El título no puede estar vacío.');
      return;
    }
    if (categoriesList.length === 0) {
      setError('Elige al menos una categoría: el anime quedaría fuera de los filtros de la wiki.');
      return;
    }

    setSaving(true);
    try {
      await createAnime({
        title,
        synopsis,
        year,
        status,
        category: categoriesList[0],
        categories: categoriesList,
        genres,
        studio,
        coverUrl,
        bannerUrl,
        coverFocus,
        bannerFocus,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el anime.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Nuevo anime</h4>
        <button
          type="button"
          onClick={onDone}
          className="text-zinc-500 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      <TextField label="Título" value={title} onChange={setTitle} />
      <TextArea label="Sinopsis" value={synopsis} onChange={setSynopsis} rows={4} />

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Año" value={year} onChange={setYear} />
        <SelectField
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'emitiendo', label: 'Emitiendo' },
            { value: 'finished', label: 'Finalizado' },
            { value: 'upcoming', label: 'Próximamente' },
          ]}
        />
      </div>

      <MultiSelectField
        label="Categorías"
        value={categoriesList}
        onChange={setCategoriesList}
        hint="Puede encajar en varias. La primera es la que sale como principal en la ficha."
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
        placeholder="Romance, Comedia"
      />
      <TextField
        label="Estudio"
        value={studio}
        onChange={setStudio}
        placeholder="Trigger / CD PROJECT RED"
      />
      <ImagePicker
        label="Portada"
        value={coverUrl}
        onChange={setCoverUrl}
        provider={provider}
        collectionName="animes"
        placeholderId="nuevo"
        field="cover"
        hint="Puedes elegirla de tu PC o pegar una URL. Se sube antes de crear el anime."
      />

      <FocalField
        label="Encuadre de la portada"
        src={coverUrl}
        value={coverFocus}
        onChange={setCoverFocus}
        hint="Pulsa o arrastra sobre la foto. Sale centrado si no lo tocas."
        alto="h-40"
      />

      <ImagePicker
        label="Banner"
        value={bannerUrl}
        onChange={setBannerUrl}
        provider={provider}
        collectionName="animes"
        placeholderId="nuevo"
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

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        {saving ? 'Creando...' : 'Crear anime'}
      </button>
    </div>
  );
};

// ======================================================
// SECCIÓN DE CURIOSIDADES
// ======================================================

export const TriviaSection: FC<{
  trivia: RawDoc[];
  provider: UploadProvider;
}> = ({ trivia, provider }) => {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">
          Son los datos que salen en la sección Extras de la web.
        </p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-amber-500"
        >
          <Plus size={13} />
          Añadir curiosidad
        </button>
      </div>

      {showNew && <NewTriviaForm provider={provider} onDone={() => setShowNew(false)} />}

      {trivia.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          No hay curiosidades.
        </p>
      ) : (
        <ul className="space-y-2">
          {trivia.map((t) => (
            <TriviaRow key={t.id} item={t} provider={provider} />
          ))}
        </ul>
      )}
    </div>
  );
};

const TriviaRow: FC<{ item: RawDoc; provider: UploadProvider }> = ({ item, provider }) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(asStr(item.title));
  const [who, setWho] = useState(asStr(item.characterOrAnime));
  const [fact, setFact] = useState(asStr(item.fact));
  const [category, setCategory] = useState(asStr(item.category));

  const handleSave = async () => {
    if (saving) return;
    setError('');
    if (!title.trim() || !fact.trim()) {
      setError('El título y la curiosidad son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      await updateFields('trivia', item.id, {
        title: title.trim(),
        characterOrAnime: who.trim(),
        fact: fact.trim(),
        category,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem('trivia', item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2.5 p-3">
        <div className="h-9 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
          {asStr(item.imageUrl) ? (
            <img src={asStr(item.imageUrl)} alt={title} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-200">{title}</p>
          <p className="truncate text-[10px] text-zinc-500">
            {who} · <Heart size={9} className="inline" />{' '}
            {typeof item.likes === 'number' ? item.likes : 0}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          {open ? 'Cerrar' : 'Editar'}
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
            aria-label="Eliminar curiosidad"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 p-3">
          <TextField label="Título" value={title} onChange={setTitle} />
          <TextField
            label="Personaje o anime"
            value={who}
            onChange={setWho}
          />
          <TextArea label="Curiosidad" value={fact} onChange={setFact} rows={4} />
          <TextField label="Categoría" value={category} onChange={setCategory} />

          <ImageUploader
            label="Imagen"
            currentUrl={asStr(item.imageUrl)}
            section="trivia"
            itemId={item.id}
            field="imageUrl"
            provider={provider}
            onSaved={(url) => updateFields('trivia', item.id, { imageUrl: url })}
          />

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </li>
  );
};

const NewTriviaForm: FC<{ provider: UploadProvider; onDone: () => void }> = ({
  provider,
  onDone,
}) => {
  const [title, setTitle] = useState('');
  const [who, setWho] = useState('');
  const [fact, setFact] = useState('');
  const [category, setCategory] = useState('Curiosidades');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (saving) return;
    setError('');

    if (!title.trim() || !fact.trim()) {
      setError('El título y la curiosidad son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      await createTrivia({ title, characterOrAnime: who, fact, category, imageUrl });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Nueva curiosidad</h4>
        <button type="button" onClick={onDone} aria-label="Cerrar" className="text-zinc-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <TextField label="Título" value={title} onChange={setTitle} />
      <TextField
        label="Personaje o anime"
        value={who}
        onChange={setWho}
      />
      <TextArea label="Curiosidad" value={fact} onChange={setFact} rows={4} />
      <TextField label="Categoría" value={category} onChange={setCategory} />
      <ImagePicker
        label="Imagen"
        value={imageUrl}
        onChange={setImageUrl}
        provider={provider}
        collectionName="trivia_extras"
        placeholderId="nuevo"
        field="image"
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        {saving ? 'Creando...' : 'Crear curiosidad'}
      </button>
    </div>
  );
};

// ======================================================
// SECCIÓN DE HILOS (solo lectura y borrado)
// ======================================================

export const ThreadsSection: FC<{ threads: RawDoc[] }> = ({ threads }) => {
  const [filter, setFilter] = useState('');

  const visible = threads.filter((t) => {
    if (!filter.trim()) return true;
    const q = filter.trim().toLowerCase();
    return (
      asStr(t.title).toLowerCase().includes(q) ||
      asStr(t.authorName).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Buscar por título o autor..."
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
      />

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          No hay hilos que coincidan.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
        </ul>
      )}
    </div>
  );
};

const ThreadRow: FC<{ thread: RawDoc }> = ({ thread }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // ── Encuesta del hilo ────────────────────────────────
  //
  // El equipo puede cerrarla, reabrirla y borrarla. Lo que NO
  // puede es tocar los resultados: los votos son documentos que
  // solo crea quien vota, y las reglas no dejan ni que se
  // cambien ni que se inventen.
  const poll =
    thread.poll && typeof thread.poll === 'object'
      ? (thread.poll as {
          question?: string;
          options?: Record<string, string>;
          isClosed?: boolean;
          allowChangeVote?: boolean;
          expiresAt?: { toMillis?: () => number } | null;
        })
      : null;

  // El cierre y el borrado se guardan aquí en vez de tocar el
  // documento que llega por props (ese objeto es el del estado del
  // catálogo, y mutarlo a mano no repinta nada).
  const [hayPoll, setHayPoll] = useState(Boolean(poll));
  const [cerrada, setCerrada] = useState(Boolean(poll?.isClosed));
  const [stats, setStats] = useState<{ options: Record<string, number>; total: number } | null>(
    null,
  );
  const [cargandoStats, setCargandoStats] = useState(false);
  const [moderando, setModerando] = useState(false);
  const [confirmarBorrarPoll, setConfirmarBorrarPoll] = useState(false);

  const cargarStats = async () => {
    setCargandoStats(true);
    try {
      const votes = await readPollVotes(thread.id);
      const opciones: Record<string, number> = {};
      Object.keys(poll?.options ?? {}).forEach((k) => {
        opciones[k] = 0;
      });
      votes.forEach((v) => {
        if (v.optionId in opciones) opciones[v.optionId] += 1;
      });
      setStats({ options: opciones, total: votes.length });
    } catch {
      setError('No se pudieron leer los votos de la encuesta.');
    } finally {
      setCargandoStats(false);
    }
  };

  const alternarCierre = async () => {
    setModerando(true);
    setError('');
    try {
      await setPollClosed(thread.id, !cerrada);
      setCerrada(!cerrada);
      setStats(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    } finally {
      setModerando(false);
    }
  };

  const borrarEncuesta = async () => {
    setModerando(true);
    setError('');
    try {
      await deletePollEverywhere(thread.id);
      setHayPoll(false);
      setStats(null);
      setConfirmarBorrarPoll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la encuesta.');
    } finally {
      setModerando(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem('threads', thread.id);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
      setDeleting(false);
    }
  };

  if (done) return null;

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-start gap-2.5">
        <MessageSquare size={15} className="mt-0.5 flex-shrink-0 text-zinc-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-zinc-200">
            {asStr(thread.title)}
          </p>
          <p className="truncate text-[10px] text-zinc-500">
            @{asStr(thread.authorName)} · {asStr(thread.categoryName)}
          </p>
        </div>

        {confirming ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              {deleting ? '...' : 'Sí, borrar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md p-1 text-zinc-500 hover:text-red-400"
            aria-label="Eliminar hilo"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* ── Encuesta ─────────────────────────────────────
          Los resultados se leen de los documentos de voto, que
          son la verdad; el resumen que guarda el servidor
          (`pollStats`) solo se usa para informes, y aquí se
          cuentan al vuelo para que estas cifras existan aunque
          las funciones no estén desplegadas. */}
      {hayPoll && poll && (
        <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-950/20 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-violet-200">
              <BarChart3 size={12} className="flex-shrink-0 text-violet-400" />
              <span className="truncate">{asStr(poll.question)}</span>
            </p>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  cerrada
                    ? 'bg-zinc-700/60 text-zinc-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {cerrada ? 'Cerrada' : 'Activa'}
              </span>
              {poll.allowChangeVote && (
                <span className="rounded-full bg-zinc-700/60 px-1.5 py-0.5 text-[9px] text-zinc-400">
                  Cambia voto
                </span>
              )}
            </span>
          </div>

          <p className="mt-1 text-[10px] text-zinc-500">
            {Object.keys(poll.options ?? {}).length} opciones
          </p>

          {stats && (
            <ul className="mt-2 space-y-1">
              {Object.entries(poll.options ?? {}).map(([id, texto]) => {
                const n = stats.options[id] ?? 0;
                const pct = stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;
                return (
                  <li key={id} className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 shrink-0 font-mono text-zinc-500">{id.replace('o', '')}</span>
                    <span className="min-w-0 flex-1 truncate text-zinc-300">{texto}</span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
                      <span
                        className="block h-full rounded-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-zinc-400">
                      {n} · {pct}%
                    </span>
                  </li>
                );
              })}
              <li className="pt-0.5 text-right font-mono text-[10px] text-zinc-500">
                {stats.total} votos en total
              </li>
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={cargarStats}
              disabled={cargandoStats}
              className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {cargandoStats ? 'Contando...' : stats ? 'Actualizar' : 'Ver estadísticas'}
            </button>

            <button
              type="button"
              onClick={alternarCierre}
              disabled={moderando}
              className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
            >
              {moderando ? '...' : cerrada ? 'Reabrir' : 'Cerrar'}
            </button>

            {confirmarBorrarPoll ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={borrarEncuesta}
                  disabled={moderando}
                  className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                >
                  {moderando ? '...' : 'Sí, borrarvotes'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarBorrarPoll(false)}
                  className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarBorrarPoll(true)}
                disabled={moderando}
                className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                Eliminar encuesta
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </li>
  );
};
