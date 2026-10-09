import { useMemo } from 'react';
import type { FC } from 'react';
import { Tv, Users, Film, MessageSquare, SearchX } from 'lucide-react';

import { QuickImageEditor } from '../admin/QuickImageEditor';
import { animeCategories } from '../../data/animeCategories';
import { anyMatches, matchesText as matches, toText } from '../../utils/safeData';
import type { Anime, Character, Episode, Thread } from '../../types';

// ======================================================
// RESULTADOS DE BÚSQUEDA DENTRO DE LA WIKI
// ======================================================
// Antes esto era una pantalla aparte (la pestaña "Buscar"), con su
// propia cabecera gigante. Ahora vive dentro de la wiki, en la
// franja de arriba, y la navegación no se va de la sección.
//
// Busca en las cuatro cosas que se pueden buscar: series,
// capítulos, personajes y hilos del foro. Cuando el filtro es
// "todo", los resultados vienen agrupados por tipo y no en una
// lista mezclada, que es mucho más legible.
// ======================================================

export type SearchFilter = 'all' | 'anime' | 'episodes' | 'characters' | 'threads';

interface CatalogSearchProps {
  query: string;
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
  animes: Anime[];
  episodes: Record<string, Episode[]>;
  characters: Record<string, Character[]>;
  threads: Thread[];
  onSelectAnime: (id: string) => void;
  onSelectThread?: (thread: Thread) => void;
}

const CatalogSearch: FC<CatalogSearchProps> = ({
  query,
  filter,
  onFilterChange,
  animes,
  episodes,
  characters,
  threads,
  onSelectAnime,
  onSelectThread,
}) => {
  const q = query.trim().toLowerCase();

  // Todo el filtrado junto, para que la cuenta de resultados y las
  // listas que se pintan no puedan contradecirse.
  const results = useMemo(() => {
    if (!q) {
      return { animes: [], episodes: [], characters: [], threads: [] };
    }

    return {
      animes: animes.filter(
        (a) =>
          matches(a.title, q) ||
          matches(a.synopsis, q) ||
          anyMatches(a.genres, q) ||
          // Se mira la lista de categorías completa, no solo la
          // principal: si se busca "Seinen" tiene que salir una
          // serie que lo tenga como segunda categoría.
          animeCategories(a).some((c) => matches(c, q)) ||
          matches(a.studio, q),
      ),
      episodes: Object.values(episodes)
        .flat()
        .filter((ep) => matches(ep.title, q) || matches(ep.description, q)),
      characters: Object.values(characters)
        .flat()
        .filter((c) => matches(c.name, q) || matches(c.description, q)),
      threads: threads.filter(
        (t) => matches(t.title, q) || matches(t.body, q) || anyMatches(t.tags, q),
      ),
    };
  }, [q, animes, episodes, characters, threads]);

  const total =
    results.animes.length +
    results.episodes.length +
    results.characters.length +
    results.threads.length;

  if (!q) return null;

  const show = (section: SearchFilter) => filter === 'all' || filter === section;

  const FILTERS: { id: SearchFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todo', count: total },
    { id: 'anime', label: 'Series', count: results.animes.length },
    { id: 'episodes', label: 'Episodios', count: results.episodes.length },
    { id: 'characters', label: 'Personajes', count: results.characters.length },
    { id: 'threads', label: 'Hilos', count: results.threads.length },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{f.count}</span>
            </button>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
          <SearchX size={26} className="mx-auto text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-400">
            Nada que coincida con «{query.trim()}»
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Prueba con el nombre de una serie, un personaje o un hilo del foro.
          </p>
        </div>
      ) : (
        <>
          {/* SERIES */}
          {show('anime') && results.animes.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
                <Tv size={14} />
                Series ({results.animes.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.animes.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectAnime(a.id)}
                    className="group flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-violet-500/50 hover:bg-zinc-900"
                  >
                    <QuickImageEditor
                      section="animes"
                      itemId={a.id}
                      field="coverUrl"
                      label={`Portada de ${a.title}`}
                      src={a.coverUrl}
                      alt={a.title}
                      containerClassName="shrink-0"
                      className="h-20 w-14 rounded-lg object-cover"
                      badgeClassName="-top-1 -right-1"
                    />

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-violet-400">
                        {a.category}
                      </span>
                      <h4 className="truncate text-xs font-bold text-white group-hover:text-violet-300">
                        {a.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                        {a.synopsis}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* EPISODIOS */}
          {show('episodes') && results.episodes.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Film size={14} />
                Episodios ({results.episodes.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {results.episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onSelectAnime(ep.animeId)}
                    className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-amber-500/50"
                  >
                    {toText(ep.thumbnailUrl) ? (
                      <img
                        src={toText(ep.thumbnailUrl)}
                        alt={ep.title}
                        loading="lazy"
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800">
                        <Film size={16} className="text-zinc-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-zinc-200">
                        {ep.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                        {ep.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* PERSONAJES */}
          {show('characters') && results.characters.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-400">
                <Users size={14} />
                Personajes ({results.characters.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectAnime(c.animeId)}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-pink-500/50"
                  >
                    {toText(c.imageUrl) ? (
                      <img
                        src={toText(c.imageUrl)}
                        alt={c.name}
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800">
                        <Users size={16} className="text-zinc-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-zinc-200">
                        {c.name}
                      </h4>
                      <p className="line-clamp-1 text-[11px] text-zinc-400">
                        {c.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* HILOS */}
          {show('threads') && results.threads.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <MessageSquare size={14} />
                Hilos del foro ({results.threads.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {results.threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectThread?.(t)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-emerald-500/50"
                  >
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      {t.categoryName}
                    </span>
                    <h4 className="truncate text-xs font-bold text-zinc-200">{t.title}</h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                      {t.body}
                    </p>
                    <span className="mt-1.5 block text-[10px] text-zinc-600">
                      @{t.authorName}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default CatalogSearch;
