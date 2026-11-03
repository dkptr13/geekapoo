import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Tv, Users, Film, MessageSquare, SearchX, Clapperboard, Calendar, Star, Loader2 } from 'lucide-react';

import { QuickImageEditor } from '../admin/QuickImageEditor';
import { animeCategories } from '../../data/animeCategories';
import { avisarKapo } from '../../utils/kapoEvents';
import { encuadre, toText, toTextList } from '../../utils/safeData';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  buscarPreparadas,
  normalizarBusqueda,
  prepararFicha,
  type FichaLista,
} from '../../utils/busqueda';
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
  /** `true` mientras llega el índice de búsqueda o el catálogo de respaldo. */
  cargando?: boolean;
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
  cargando = false,
  onSelectAnime,
  onSelectThread,
}) => {
  // La consulta difiere un render y además espera 300 ms
  // quieta antes de filtrar: mientras se escribe, el input va
  // fluido y la lista filtra con el texto anterior. Los datos
  // ya están en memoria, así que no hay peticiones que espaciar;
  // esto solo evita recalcular y repintar con cada tecla.
  const q = query.trim().toLowerCase();
  const qDiferida = useDeferredValue(q);
  const qProcesada = useDebouncedValue(qDiferida, 300);
  const buscando = q !== '' && qProcesada !== q;

  // ── ÍNDICE: títulos y alias normalizados UNA vez ──────────
  // Antes cada pulsación renormalizaba miles de textos (títulos,
  // sinopsis, alias) y medía distancias de edición contra todos.
  // Ahora se prepara al cargar o cambiar los datos, y por tecla
  // solo se normaliza la consulta y se puntúa.
  const indice = useMemo(() => {
    const fichaAnime = (a: Anime): FichaLista =>
      prepararFicha({
        principal: a.title,
        originales: [a.japaneseTitle ?? ''],
        alias: a.alternativeTitles,
        claves: [a.synopsis, ...toTextList(a.genres), a.studio, ...animeCategories(a)],
      });
    const fichaEpisodio = (ep: Episode): FichaLista =>
      prepararFicha({
        principal: ep.title,
        originales: [ep.romajiTitle ?? ''],
        claves: [ep.description],
      });
    const fichaPersonaje = (c: Character): FichaLista =>
      prepararFicha({
        principal: c.name,
        originales: [c.japaneseName ?? ''],
        alias: c.aliases,
        claves: [c.description],
      });
    const fichaHilo = (t: Thread): FichaLista =>
      prepararFicha({
        principal: t.title,
        claves: [t.body, ...(t.tags ?? []), t.categoryName],
      });
    return {
      animes: animes.map((ficha) => ({ ficha, lista: fichaAnime(ficha) })),
      episodes: sinDuplicados(Object.values(episodes).flat()).map((ficha) => ({
        ficha,
        lista: fichaEpisodio(ficha),
      })),
      characters: sinDuplicados(Object.values(characters).flat()).map((ficha) => ({
        ficha,
        lista: fichaPersonaje(ficha),
      })),
      threads: threads.map((ficha) => ({ ficha, lista: fichaHilo(ficha) })),
    };
  }, [animes, episodes, characters, threads]);

  // ── Límite de tarjetas por sección ────────────────────────
  // Se calcula TODO (la relevancia manda sobre el total) pero
  // se pintan 30 por sección con "Ver más". Sin esto, una letra
  // como "a" renderizaba miles de tarjetas con sus imágenes.
  const LIMITE_SECCION = 30;
  const [ampliadas, setAmpliadas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setAmpliadas({});
  }, [qProcesada, filtros, filter]);

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
    const qn = normalizarBusqueda(qProcesada);
    if (!qn) {
      return { series: [], movies: [], episodes: [], characters: [], threads: [] };
    }

    const animePorId = new Map(animes.map((a) => [a.id, a]));
    const fSinNota: FiltrosAvanzados = { ...filtros, notaMin: 0 };

    const animesRank = buscarPreparadas(indice.animes, qn)
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

    const rankEpisodios = buscarPreparadas(indice.episodes, qn)
      .map((r) => r.ficha)
      .filter(
        (ep) =>
          episodioDeAnimeValido(animePorId, ep.animeId, fSinNota) &&
          (filtros.notaMin <= 0 || (ep.rating || 0) >= filtros.notaMin),
      );
    const episodesLista =
      filtros.orden === 'defecto' ? rankEpisodios : ordenarEpisodios(rankEpisodios, filtros.orden);

    const rankPersonajes = buscarPreparadas(indice.characters, qn)
      .map((r) => r.ficha)
      .filter((c) => episodioDeAnimeValido(animePorId, c.animeId, fSinNota));
    const charactersLista =
      filtros.orden === 'defecto'
        ? rankPersonajes
        : ordenarPersonajes(rankPersonajes, filtros.orden);

    const rankHilos = buscarPreparadas(indice.threads, qn).map((r) => r.ficha);
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
  }, [indice, qProcesada, animes, filtros]);

  const total =
    results.series.length +
    results.movies.length +
    results.episodes.length +
    results.characters.length +
    results.threads.length;

  // Aviso local para Kapo-chan: si la búsqueda se queda vacía
  // después de una pausa, la mascota puede dar una pista. Se espera
  // un poco para no disparar mientras la persona aún escribe y no
  // se hace ninguna lectura nueva: los datos ya están en memoria.
  useEffect(() => {
    if (!q.trim() || buscando || total > 0) return;
    const t = window.setTimeout(() => {
      avisarKapo('search_empty', { query: query.trim() });
    }, 1600);
    return () => window.clearTimeout(t);
  }, [q, query, buscando, total]);

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

  // Tarjetas visibles por sección: el cálculo va sobre todo el
  // catálogo (la relevancia manda), pero se pintan 30 con "Ver
  // más". Sin esto, una letra común renderizaba miles de
  // tarjetas con sus imágenes y la página se arrastraba.
  const recorte = (seccion: string, total: number) =>
    ampliadas[seccion] ? total : Math.min(total, LIMITE_SECCION);

  const botonVerMas = (seccion: string, total: number) =>
    !ampliadas[seccion] && total > LIMITE_SECCION ? (
      <button
        onClick={() => setAmpliadas((v) => ({ ...v, [seccion]: true }))}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white"
      >
        Ver más ({total - LIMITE_SECCION} restantes)
      </button>
    ) : null;

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
      {buscando && (
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-500" aria-live="polite">
          <Loader2 size={12} className="animate-spin" />
          Buscando…
        </p>
      )}

      {total === 0 ? (
        cargando ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-sm text-zinc-400">
            <Loader2 size={16} className="animate-spin text-violet-400" />
            Cargando el índice de búsqueda…
          </div>
        ) : (
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
        )
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
                {results.series.slice(0, recorte('series', results.series.length)).map((a) => (
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
              {botonVerMas('series', results.series.length)}
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
                {results.movies.slice(0, recorte('movies', results.movies.length)).map((a) => {
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
              {botonVerMas('movies', results.movies.length)}
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
                {results.episodes.slice(0, recorte('episodes', results.episodes.length)).map((ep) => (
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
              {botonVerMas('episodes', results.episodes.length)}
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
                {results.characters.slice(0, recorte('characters', results.characters.length)).map((c) => (
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
              {botonVerMas('characters', results.characters.length)}
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
                {results.threads.slice(0, recorte('threads', results.threads.length)).map((t) => (
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
              {botonVerMas('threads', results.threads.length)}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default CatalogSearch;
