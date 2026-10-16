import { useDeferredValue, useMemo } from 'react';
import type { FC } from 'react';
import { Tv, Users, Film, MessageSquare, SearchX, Clapperboard, Calendar, Star } from 'lucide-react';

import { QuickImageEditor } from '../admin/QuickImageEditor';
import { animeCategories } from '../../data/animeCategories';
import { encuadre, toText, toTextList } from '../../utils/safeData';
import { buscarConRelevancia } from '../../utils/busqueda';
import {
  episodioDeAnimeValido,
  esPelicula,
  contarFiltrosActivos,
  ordenarAnimes,
  ordenarEpisodios,
  ordenarHilos,
  ordenarPersonajes,
  pasaCategoriaHilo,
  pasaFiltrosAnime,
  sinDuplicados,
  type FiltrosAvanzados,
  type MainTab,
  type SearchFilter,
} from '../../utils/wikiFilter';
import MainTabs from './MainTabs';
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

export type { SearchFilter } from '../../utils/wikiFilter';

interface CatalogSearchProps {
  query: string;
  filter: MainTab;
  onFilterChange: (filter: MainTab) => void;
  filtros: FiltrosAvanzados;
  onLimpiarFiltros: () => void;
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
  filtros,
  onLimpiarFiltros,
  animes,
  episodes,
  characters,
  threads,
  onSelectAnime,
  onSelectThread,
}) => {
  // La consulta difiere un render: mientras se escribe, la
  // lista filtra con el texto anterior en vez de recalcular con
  // cada tecla. Los datos ya están en memoria, así que no hay
  // peticiones que espaciar; esto solo mantiene el input fluido.
  const q = query.trim().toLowerCase();
  const qDiferida = useDeferredValue(q);

  // Todo el filtrado junto, para que la cuenta de resultados y las
  // listas que se pintan no puedan contradecirse.
  //
  // Orden: coincidencia inteligente primero, filtros avanzados
  // después. Los capítulos y personajes heredan género, año y
  // estado del anime padre; la nota mínima va sobre su propia
  // nota (capítulos) o no aplica (personajes, sin nota). Los
  // hilos entienden texto y categoría del foro.
  //
  // Con ordenación explícita manda ella (y a igual criterio, la
  // relevancia que ya trae la lista); por defecto, relevancia.
  const results = useMemo(() => {
    if (!qDiferida) {
      return { series: [], movies: [], episodes: [], characters: [], threads: [] };
    }

    const animePorId = new Map(animes.map((a) => [a.id, a]));
    const fSinNota: FiltrosAvanzados = { ...filtros, notaMin: 0 };

    const animesRank = buscarConRelevancia(animes, qDiferida, (a) => ({
      principal: a.title,
      originales: [a.japaneseTitle ?? ''],
      alias: a.alternativeTitles,
      claves: [a.synopsis, ...toTextList(a.genres), a.studio, ...animeCategories(a)],
    }))
      .map((r) => r.ficha)
      .filter((a) => pasaFiltrosAnime(a, filtros));
    const series =
      filtros.orden === 'defecto'
        ? animesRank.filter((a) => !esPelicula(a))
        : ordenarAnimes(
            animesRank.filter((a) => !esPelicula(a)),
            filtros.orden,
          );
    const movies =
      filtros.orden === 'defecto'
        ? animesRank.filter((a) => esPelicula(a))
        : ordenarAnimes(
            animesRank.filter((a) => esPelicula(a)),
            filtros.orden,
          );

    const rankEpisodios = buscarConRelevancia(
      sinDuplicados(Object.values(episodes).flat()),
      qDiferida,
      (ep) => ({
        principal: ep.title,
        originales: [ep.romajiTitle ?? ''],
        claves: [ep.description],
      }),
    )
      .map((r) => r.ficha)
      .filter(
        (ep) =>
          episodioDeAnimeValido(animePorId, ep.animeId, fSinNota) &&
          (filtros.notaMin <= 0 || (ep.rating || 0) >= filtros.notaMin),
      );
    const episodesLista =
      filtros.orden === 'defecto' ? rankEpisodios : ordenarEpisodios(rankEpisodios, filtros.orden);

    const rankPersonajes = buscarConRelevancia(
      sinDuplicados(Object.values(characters).flat()),
      qDiferida,
      (c) => ({
        principal: c.name,
        originales: [c.japaneseName ?? ''],
        alias: c.aliases,
        claves: [c.description],
      }),
    )
      .map((r) => r.ficha)
      .filter((c) => episodioDeAnimeValido(animePorId, c.animeId, fSinNota));
    const charactersLista =
      filtros.orden === 'defecto'
        ? rankPersonajes
        : ordenarPersonajes(rankPersonajes, filtros.orden);

    const rankHilos = buscarConRelevancia(threads, qDiferida, (t) => ({
      principal: t.title,
      claves: [t.body, ...(t.tags ?? []), t.categoryName],
    })).map((r) => r.ficha);
    const threadsLista = rankHilos.filter((t) => pasaCategoriaHilo(t, filtros));
    const threadsOrdenados =
      filtros.orden === 'defecto' ? threadsLista : ordenarHilos(threadsLista, filtros.orden);

    return {
      series,
      movies,
      episodes: episodesLista,
      characters: charactersLista,
      threads: threadsOrdenados,
    };
  }, [qDiferida, animes, episodes, characters, threads, filtros]);

  const total =
    results.series.length +
    results.movies.length +
    results.episodes.length +
    results.characters.length +
    results.threads.length;

  if (!q) return null;

  const show = (section: MainTab) => filter === 'all' || filter === section;

  // Duración de una peli, si su capítulo único la trae. Los
  // capítulos cargados por script no tienen duración, así que la
  // mayoría no enseñará nada: no se inventa.
  const duracionDe = (anime: Anime): string => {
    if (!esPelicula(anime)) return '';
    const unico = episodes[anime.id]?.[0];
    return toText(unico?.duration).trim();
  };

  return (
    <div className="space-y-6">
      {/* Pestañas principales, con el recuento de esta búsqueda */}
      <MainTabs
        active={filter}
        counts={{
          all: total,
          series: results.series.length,
          movies: results.movies.length,
          episodes: results.episodes.length,
          characters: results.characters.length,
          threads: results.threads.length,
        }}
        onChange={onFilterChange}
      />

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
          <SearchX size={26} className="mx-auto text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-400">
            Nada que coincida con «{query.trim()}»
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Prueba con el nombre de una serie, un personaje o un hilo del foro.
          </p>
          {contarFiltrosActivos(filtros) > 0 && (
            <button
              onClick={onLimpiarFiltros}
              className="mx-auto mt-4 block rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* SERIES */}
          {show('series') && results.series.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
                <Tv size={14} />
                Series ({results.series.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.series.map((a) => (
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
                      className="w-14 h-20 rounded-lg object-cover"
                    imgStyle={encuadre(a.coverFocus)}
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

          {/* PELÍCULAS */}
          {show('movies') && results.movies.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Clapperboard size={14} />
                Películas ({results.movies.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {results.movies.map((a) => {
                  const duracion = duracionDe(a);
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelectAnime(a.id)}
                      className="group flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-rose-500/50 hover:bg-zinc-900"
                    >
                      <QuickImageEditor
                        section="animes"
                        itemId={a.id}
                        field="coverUrl"
                        label={`Portada de ${a.title}`}
                        src={a.coverUrl}
                        alt={a.title}
                        containerClassName="shrink-0"
                        className="w-14 h-20 rounded-lg object-cover"
                        imgStyle={encuadre(a.coverFocus)}
                        badgeClassName="-top-1 -right-1"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase text-rose-400">
                          Película
                        </span>
                        <h4 className="truncate text-xs font-bold text-white group-hover:text-rose-300">
                          {a.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                          {a.synopsis}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                          {a.year > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Calendar size={9} />
                              {a.year}
                            </span>
                          )}
                          {a.rating > 0 && (
                            <span className="flex items-center gap-0.5 font-semibold text-amber-400">
                              <Star size={9} className="fill-amber-400" />
                              {a.rating}
                            </span>
                          )}
                          {duracion && <span>{duracion}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
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
