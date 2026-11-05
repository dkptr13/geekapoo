import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  Sparkles,
  Play,
  Star,
  Calendar,
  Shuffle,
  Clapperboard,
  Users,
  MessageSquare,
  SearchX,
  Loader2,
} from 'lucide-react';

import { ALL_ANIME_CATEGORIES, animeCategories, isInCategory, normalize } from '../../data/animeCategories';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { encuadre, toText } from '../../utils/safeData';
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
  pasaPestanaAnime,
  sinDuplicados,
  type FiltrosAvanzados,
  type MainTab,
} from '../../utils/wikiFilter';
import type { Anime, Character, Episode, Thread } from '../../types';
// ======================================================
// VISTA DE CATÁLOGO
// ======================================================
// Es lo que se ve antes de abrir cualquier serie: las categorías
// y las portadas de lo que hay en cada una.
//
// Antes esto era un wiki de una sola serie, y las categorías eran
// una fila de botones pequeños encima. Ahora las categorías son
// las tarjetas grandes de arriba, porque son el sitio por el que
// se entra: ocho bloques que se leen de un vistazo, en vez de
// ocho etiquetas apiñadas.
//
// El filtro por categoría vive en la URL (?wikiCat=), así que la
// vista se puede compartir y sobrevive a un F5.
// ======================================================

interface CatalogBrowserProps {
  animes: Anime[];
  episodes: Record<string, Episode[]>;
  characters: Record<string, Character[]>;
  threads: Thread[];
  selectedCategory: string;
  mainTab: MainTab;
  filtros: FiltrosAvanzados;
  onSelectCategory: (name: string) => void;
  onSelectAnime: (id: string) => void;
  onSelectThread?: (thread: Thread) => void;
  onLimpiarFiltros: () => void;
  hasMoreEpisodes?: boolean;
  loadingMoreEpisodes?: boolean;
  onLoadMoreEpisodes?: () => Promise<void>;
  hasMoreCharacters?: boolean;
  loadingMoreCharacters?: boolean;
  onLoadMoreCharacters?: () => Promise<void>;
}

const CatalogBrowser: FC<CatalogBrowserProps> = ({
  animes,
  episodes,
  characters,
  threads,
  selectedCategory,
  mainTab,
  filtros,
  onSelectCategory,
  onSelectAnime,
  onSelectThread,
  onLimpiarFiltros,
  hasMoreEpisodes = false,
  loadingMoreEpisodes = false,
  onLoadMoreEpisodes,
  hasMoreCharacters = false,
  loadingMoreCharacters = false,
  onLoadMoreCharacters,
}) => {
  // Se agrupa una sola vez y no en cada render de la rejilla: se
  // recorre la lista entera por cada categoría.
  //
  // Una serie puede estar en varias, así que se mete en todas las
  // que le tocan. Con una sola categoría sería un "if" y ya, pero
  // con la lista hay que recorrerla.
  const byCategory = useMemo(() => {
    const map = new Map<string, Anime[]>();
    ALL_ANIME_CATEGORIES.forEach((c) => map.set(normalize(c.name), []));

    animes.forEach((a) => {
      animeCategories(a).forEach((cat) => {
        const key = normalize(cat);
        map.get(key)?.push(a);
      });
    });

    return map;
  }, [animes]);

  const visible = selectedCategory === 'all' ? animes : byCategory.get(normalize(selectedCategory)) ?? [];

  // Animes de la rejilla: categoría temática + pestaña + filtros
  // avanzados, en ese orden. La ordenación cierra la cadena.
  const animesVisibles = useMemo(
    () =>
      ordenarAnimes(
        visible.filter((a) => pasaPestanaAnime(a, mainTab) && pasaFiltrosAnime(a, filtros)),
        filtros.orden,
      ),
    [visible, mainTab, filtros],
  );

  const animePorId = useMemo(() => new Map(animes.map((a) => [a.id, a])), [animes]);

  // Los capítulos y personajes heredan la categoría temática y los
  // filtros del anime padre. Sin ficha del padre no se juzgan.
  // Los hilos son del foro y no cuelgan de ningún anime: solo les
  // aplican su categoría y la ordenación.
  const enCategoriaTematica = (animeId: string) =>
    selectedCategory === 'all' || isInCategory(animePorId.get(animeId), selectedCategory);

  const fSinNota: FiltrosAvanzados = { ...filtros, notaMin: 0 };

  const episodiosVisibles = useMemo(
    () =>
      ordenarEpisodios(
        sinDuplicados(
          Object.values(episodes)
            .flat()
            .filter(
              (ep) =>
                enCategoriaTematica(ep.animeId) &&
                episodioDeAnimeValido(animePorId, ep.animeId, fSinNota) &&
                (filtros.notaMin <= 0 || (ep.rating || 0) >= filtros.notaMin),
            ),
        ),
        filtros.orden,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [episodes, animePorId, selectedCategory, filtros],
  );

  const personajesVisibles = useMemo(
    () =>
      ordenarPersonajes(
        sinDuplicados(
          Object.values(characters)
            .flat()
            .filter(
              (c) =>
                enCategoriaTematica(c.animeId) &&
                episodioDeAnimeValido(animePorId, c.animeId, fSinNota),
            ),
        ),
        filtros.orden,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characters, animePorId, selectedCategory, filtros],
  );

  const hilosVisibles = useMemo(
    () => ordenarHilos(threads.filter((t) => pasaCategoriaHilo(t, filtros)), filtros.orden),
    [threads, filtros],
  );

  const nombreAnime = (animeId: string) => animePorId.get(animeId)?.title ?? '';

  // Como en la búsqueda: se calcula todo pero se pintan 30 con
  // "Ver más". La pestaña de episodios son 2.400 tarjetas.
  const LIMITE_SECCION = 30;
  const [ampliadas, setAmpliadas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setAmpliadas({});
  }, [mainTab, filtros, selectedCategory]);

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

  // Duración de una peli, si su capítulo único la trae. Igual que
  // en la búsqueda: no se inventa.
  const duracionDe = (anime: Anime): string => {
    if (!esPelicula(anime)) return '';
    return toText(episodes[anime.id]?.[0]?.duration).trim();
  };

  const activeCategory = ALL_ANIME_CATEGORIES.find(
    (c) => normalize(c.name) === normalize(selectedCategory),
  );

  // Abre una serie al azar de las que se están viendo.
  //
  // Antes se usaba "visible[visible.length % visible.length]",
  // que es siempre el último elemento de la lista: el botón se
  // llamaba "Sorpréndeme" y siempre salía la misma. Math.random()
  // sí que sortea.
  const pickRandom = () => {
    if (animesVisibles.length === 0) return;
    const pick = animesVisibles[Math.floor(Math.random() * animesVisibles.length)];
    onSelectAnime(pick.id);
  };

  const tituloSeccion =
    mainTab === 'movies'
      ? 'Películas'
      : mainTab === 'episodes'
        ? 'Episodios'
        : mainTab === 'characters'
          ? 'Personajes'
          : mainTab === 'threads'
            ? 'Hilos de la Wiki'
            : (activeCategory ? activeCategory.name : 'Todo el catálogo');

  const cuentaSeccion = (() => {
    const n =
      mainTab === 'episodes'
        ? episodiosVisibles.length
        : mainTab === 'characters'
          ? personajesVisibles.length
          : mainTab === 'threads'
            ? hilosVisibles.length
            : animesVisibles.length;
    const sufijo =
      (mainTab === 'episodes' && hasMoreEpisodes) ||
      (mainTab === 'characters' && hasMoreCharacters)
        ? ' · hay más'
        : '';
    if (mainTab === 'movies') return n === 1 ? '1 película' : `${n} películas`;
    if (mainTab === 'episodes') return `${n === 1 ? '1 episodio' : `${n} episodios`}${sufijo}`;
    if (mainTab === 'characters') return `${n === 1 ? '1 personaje' : `${n} personajes`}${sufijo}`;
    if (mainTab === 'threads') return n === 1 ? '1 hilo' : `${n} hilos`;
    return n === 1 ? '1 serie' : `${n} series`;
  })();

  const hayResultados =
    mainTab === 'episodes'
      ? episodiosVisibles.length > 0
      : mainTab === 'characters'
        ? personajesVisibles.length > 0
        : mainTab === 'threads'
          ? hilosVisibles.length > 0
          : animesVisibles.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ==================================================
          LA CHICA, A LA IZQUIERDA
      ==================================================
          Es lo primero que se ve al entrar en la wiki. Va sin
          tarjeta ni fondo: es una ilustración sobre el fondo de
          la página, no un panel. Con el borde y el degradado
          parecía un recuadro más del panel, y tapaba hueco
          además de Dani. */}
      <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
        <div className="lg:sticky lg:top-20">
          <div className="relative flex justify-center">
            <img
              src="/img/recomendacion.webp"
              alt=""
              aria-hidden="true"
              onError={(e) => {
                // Si el archivo no está, se oculta y se queda solo
                // el texto. Un onError de imagen rota se ve fatal.
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
              className="w-full max-w-sm object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="mt-2 space-y-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
              Sugerencia del día
            </p>

            <h2 className="text-lg font-black leading-tight text-white">
              ¿Amor u odio?
            </h2>

            <p className="text-xs leading-relaxed text-zinc-400">
              Entra a dejar tu nota y tu comentario.
            </p>

            {animesVisibles.length > 0 && (mainTab === 'all' || mainTab === 'series' || mainTab === 'movies') && (
              <button
                onClick={pickRandom}
                className="chat-boton inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all"
              >
                <Shuffle size={13} />
                Sorpréndeme
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ==================================================
          CATEGORÍAS Y SERIES
      ==================================================
          Todo lo demás va a su derecha, porque la ilustración se
          queda a la izquierda occupying su sitio. */}
      <div className="min-w-0 space-y-8 lg:col-span-8 xl:col-span-9">
      {/* ==================================================
          CATEGORÍAS
      ==================================================
          Las ocho en rejilla, cada una con su color. Se cuentan
          las series de cada una, para que se vea de un vistazo
          cuáles están vacías. */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <Sparkles size={13} className="text-violet-400" />
            Explora por categoría
          </h2>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="chat-boton rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
            >
              Ver todo el catálogo
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ALL_ANIME_CATEGORIES.map((cat) => {
            const count = byCategory.get(normalize(cat.name))?.length ?? 0;
            const isActive = normalize(selectedCategory) === normalize(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isActive ? 'all' : cat.name)}
                title={cat.description}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition-all ${
                  cat.color
                } ${
                  isActive
                    ? 'ring-2 ring-violet-400'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-bold leading-tight">{cat.name}</h3>
                    <span className="shrink-0 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px]">
                      {count}
                    </span>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed opacity-70">
                    {cat.description}
                  </p>
                </div>

                {/* Brillo al pasar por encima, para que se note
                    que la tarjeta es pulsable. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          RESULTADOS DE LA PESTAÑA ELEGIDA
      ==================================================
          Series y películas en rejilla de portadas; capítulos,
          personajes e hilos en listas con su imagen y su anime.
          La tarjeta de serie es la de siempre, con la duración
          añadida cuando la peli la trae. */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-white">
            {tituloSeccion}
          </h2>
          <span className="text-[11px] text-zinc-500">
            {cuentaSeccion}
          </span>
        </div>

        {!hayResultados ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
            <SearchX size={24} className="mx-auto text-zinc-700" />
            <p className="mt-3 text-sm text-zinc-500">
              Nada por aquí con estos filtros.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Prueba a quitar algún filtro o a cambiar de pestaña.
            </p>
            {contarFiltrosActivos(filtros) > 0 && (
              <button
                onClick={onLimpiarFiltros}
                className="chat-boton rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (mainTab === 'episodes' || mainTab === 'characters' || mainTab === 'threads') ? (
          <>
          <div className="grid gap-3 sm:grid-cols-2">
            {mainTab === 'episodes' &&
              episodiosVisibles.slice(0, recorte('episodes', episodiosVisibles.length)).map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectAnime(ep.animeId)}
                  className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-colors hover:border-amber-400/40"
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
                      <Clapperboard size={16} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-amber-400">
                      {nombreAnime(ep.animeId)}
                    </span>
                    <h4 className="truncate text-xs font-bold text-zinc-200">
                      {ep.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                      {ep.description}
                    </p>
                  </div>
                </button>
              ))}

            {mainTab === 'characters' &&
              personajesVisibles.slice(0, recorte('characters', personajesVisibles.length)).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectAnime(c.animeId)}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-colors hover:border-pink-400/40"
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
                    <span className="text-[10px] font-bold uppercase text-pink-400">
                      {nombreAnime(c.animeId)}
                    </span>
                    <h4 className="truncate text-xs font-bold text-zinc-200">
                      {c.name}
                    </h4>
                    <p className="line-clamp-1 text-[11px] text-zinc-400">
                      {c.description}
                    </p>
                  </div>
                </button>
              ))}

            {mainTab === 'threads' &&
              hilosVisibles.slice(0, recorte('threads', hilosVisibles.length)).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectThread?.(t)}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-colors hover:border-emerald-400/40"
                >
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    {t.categoryName}
                  </span>
                  <h4 className="truncate text-xs font-bold text-zinc-200">{t.title}</h4>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                    {t.body}
                  </p>
                  <span className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600">
                    <MessageSquare size={10} />
                    {t.commentsCount} · {t.authorName}
                  </span>
                </button>
              ))}
          </div>
          {mainTab === 'episodes' && botonVerMas('episodes', episodiosVisibles.length)}
          {mainTab === 'characters' && botonVerMas('characters', personajesVisibles.length)}
          {mainTab === 'threads' && botonVerMas('threads', hilosVisibles.length)}
          {mainTab === 'episodes' &&
            hasMoreEpisodes &&
            onLoadMoreEpisodes &&
            episodiosVisibles.length <= recorte('episodes', episodiosVisibles.length) && (
            <button
              type="button"
              onClick={() => void onLoadMoreEpisodes()}
              disabled={loadingMoreEpisodes}
              className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-white disabled:opacity-60"
            >
              {loadingMoreEpisodes && <Loader2 size={11} className="animate-spin" />}
              {loadingMoreEpisodes ? 'Cargando...' : 'Cargar más episodios'}
            </button>
          )}
          {mainTab === 'characters' &&
            hasMoreCharacters &&
            onLoadMoreCharacters &&
            personajesVisibles.length <= recorte('characters', personajesVisibles.length) && (
            <button
              type="button"
              onClick={() => void onLoadMoreCharacters()}
              disabled={loadingMoreCharacters}
              className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-pink-400/40 hover:text-white disabled:opacity-60"
            >
              {loadingMoreCharacters && <Loader2 size={11} className="animate-spin" />}
              {loadingMoreCharacters ? 'Cargando...' : 'Cargar más personajes'}
            </button>
          )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {animesVisibles.map((anime) => {
              const peli = esPelicula(anime);
              const duracion = duracionDe(anime);
              return (
              <button
                key={anime.id}
                onClick={() => onSelectAnime(anime.id)}
                className="group text-left"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  <QuickImageEditor
                    section="animes"
                    itemId={anime.id}
                    field="coverUrl"
                    label={`Portada de ${anime.title}`}
                    src={anime.coverUrl}
                    alt={anime.title}
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    imgStyle={encuadre(anime.coverFocus)}
                    badgeClassName="top-1.5 right-1.5"
                  />

                  {/* El velo solo aparece al pasar por encima:
                      la portada se ve limpia en reposo. */}
                  <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex w-full items-center gap-1.5 p-2.5 text-[11px] font-bold text-white">
                      <Play size={12} className="fill-white" />
                      Ver ficha
                    </span>
                  </div>

                  {peli && (
                    <span className="absolute left-1.5 top-1.5 rounded-md border border-white/[0.06] bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                      Película
                    </span>
                  )}
                </div>

                <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-zinc-200 group-hover:text-violet-300">
                  {anime.title}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                  {anime.rating > 0 && (
                    <span className="flex items-center gap-0.5 font-semibold text-amber-400">
                      <Star size={9} className="fill-amber-400" />
                      {anime.rating}
                    </span>
                  )}
                  {anime.year > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Calendar size={9} />
                      {anime.year}
                    </span>
                  )}
                  {!peli && anime.episodesCount > 0 && (
                    <span>{anime.episodesCount} eps</span>
                  )}
                  {peli && duracion && (
                    <span>{duracion}</span>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        )}
      </section>
      </div>
    </div>
  );
};

export default CatalogBrowser;
