import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Star,
  Tag,
  Tv,
  Calendar,
  Layers,
  Heart,
  MessageCircle,
  ExternalLink,
  Users,
  Film,
  Sparkles,
  Send,
  CornerDownRight,
  Filter,
  ArrowLeft,
  Search,
  X,
  Trash2,
  Flag,
  Loader2,
  Info,
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { AuthorBadge } from '../gamification/AuthorBadge';
import { ReportDialog } from '../community/ReportDialog';
import { useQueryState, useQueryStateBatch } from '../../hooks/useQueryState';
import { useCommentsForTarget } from '../../hooks/useCommentsForTarget';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { animeCategories } from '../../data/animeCategories';
import CatalogBrowser from './CatalogBrowser';
import CatalogSearch from './CatalogSearch';
import MainTabs from './MainTabs';
import { AdvancedFilters, ChipsFiltros } from './AdvancedFilters';
import { WhereToWatch } from './WhereToWatch';
import {
  FILTROS_VACIOS,
  esPelicula,
  generosDisponibles,
  rangoAnios,
  sanearFiltros,
  type FiltrosAvanzados,
  type MainTab,
} from '../../utils/wikiFilter';
import { encuadre, listHas, toTextList } from '../../utils/safeData';
import { fichaDe, personajeEnTemporada } from '../../utils/seasonData';
import { TAG_DESTACADOS } from '../../utils/tags';
import { ALTURA_CARD_PERSONAJE } from '../../utils/layout';

import { Anime, Character, Comment, Episode, Season, Thread } from '../../types';

interface AnimeWikiProps {
  /** Anime con el que se abre la wiki. Es opcional: si no llega,
   *  se usa el de la URL o el primero del catálogo. */
  initialAnimeSlug?: string | null;
  /** Ir a un hilo del foro desde los resultados de búsqueda. */
  onSelectThread?: (thread: Thread) => void;
  /**
   * Cada vez que este número cambia, se enfoca el buscador. Lo
   * incrementa App.tsx cuando se pulsa "Buscar" en la barra, para
   * que no haya que llegar a la wiki y luego pinchar en la barra.
   */
  searchFocusToken?: number;
}

export const AnimeWiki: React.FC<AnimeWikiProps> = ({
  initialAnimeSlug,
  onSelectThread,
  searchFocusToken = 0,
}) => {
  const {
    animes,
    seasons,
    episodes,
    characters,
    threads,
    ensureCatalogData,
    ensureAnimeData,
    catalogComplete,
    toggleAnimeLike,
    toggleEpisodeLike,
    toggleCharacterLike,
    addComment,
    toggleCommentLike,
    deleteComment,
  } = useCommunity();

  const { currentUser, requireAuth, isModerator, isAdmin } = useAuth();
  const puedeModerar = isModerator || isAdmin;

  // Moderación de comentarios de la wiki. Mismo par de estados que
  // en HomeFeed, y por el mismo motivo: uno para el comentario que
  // espera "sí o no" y otro para el que se está borrando de verdad.
  // Con un solo estado, el botón se ponía en "¿Seguro?" con un
  // spinner permanente y no había manera de confirmar ni de
  // echarse atrás.
  const [confirmandoBorrar, setConfirmandoBorrar] = useState<string | null>(null);
  const [borrandoAhora, setBorrandoAhora] = useState<string | null>(null);
  const [reporteando, setReporteando] = useState<{
    tipo: 'thread' | 'comment';
    id: string;
  } | null>(null);
  const [aviso, setAviso] = useState('');
  const avisoTimer = useRef<number | null>(null);

  const avisar = useCallback((texto: string) => {
    if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    setAviso(texto);
    avisoTimer.current = window.setTimeout(() => {
      avisoTimer.current = null;
      setAviso('');
    }, 3500);
  }, []);

  useEffect(
    () => () => {
      if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    },
    [],
  );

  const handleBorrarComment = async (commentId: string) => {
    if (borrandoAhora === commentId) return;

    setBorrandoAhora(commentId);
    const ok = await deleteComment(commentId);
    setBorrandoAhora(null);

    if (ok) setConfirmandoBorrar(null);
    avisar(ok ? 'Comentario borrado.' : 'No se pudo borrar el comentario.');
  };

  const alternarLikeEpisodio = (comment: Comment) => {
    if (!currentUser) {
      void toggleCommentLike(comment.id);
      return;
    }

    const uid = currentUser.uid;
    const estaba = comment.likedBy?.includes(uid) ?? false;
    marcarLikeEpisodioLocal(comment.id, uid, !estaba);

    void toggleCommentLike(comment.id).then((ok) => {
      if (!ok) marcarLikeEpisodioLocal(comment.id, uid, estaba);
    });
  };

  // ====================================================
  // ESTADO EN LA URL
  // ====================================================
  // La categoría, el anime abierto y la pestaña de la ficha van
  // en la barra de direcciones. Antes eran useState sueltos, así
  // que al recargar se perdía la ficha que se estaba leyendo, que
  // es justo lo que se hace cuando se viene de un hilo con un
  // enlace a la wiki: pulsar F5 y encontrarse en la portada.
  //
  // Se comparte el mismo parámetro "?anime=" con App.tsx, para que
  // llegar desde el buscador o desde el feed y recargar después
  // landing en la misma serie.

  // Categoría elegida en la wiki. Se guarda el NOMBRE y no el id
  // porque Anime.category guarda el nombre, que es como se
  // relacionan animes y categorías.
  const [selectedCategory] = useQueryState('wikiCat', 'all');

  // Anime abierto. Se DERIVA de la URL en cada render, sin useState.
  //
  // Con un useState(), el valor solo se lee al montar el
  // componente. Eso rompía un caso real: si ya estás dentro de la
  // wiki y pulsas un anime en la barra lateral, App.tsx cambia
  // "?anime=" pero el componente sigue montado y con el estado
  // viejo, así que no se move nada. Al derivarlo, cambiar la URL
  // ya cambia la ficha.
  const [urlAnime] = useQueryState('anime', '');

  // Escritura conjunta de los parámetros de la wiki. Ver
  // useQueryStateBatch para por qué hace falta.
  const setWikiUrl = useQueryStateBatch();

  // ====================================================
  // NAVEGAR O VER UNA FICHA
  // ====================================================
  // Hay dos modos y se distinguen por si "?anime=" apunta a algo.
  //
  //   - Sin anime en la URL: se ve el catálogo (las ocho
  //     categorías y sus portadas).
  //   - Con anime en la URL: se ve su ficha, como antes.
  //
  // Antes, sin anime en la URL se abría directamente el primero del
  // catálogo. Eso obligaba a pasar siempre por una ficha ajena para
  // llegar al listado, que es justo lo que se quería evitar al
  // redistribuir la página.
  //
  // Pisar la categoría o escribir en el buscador devuelve el
  // catálogo: si estás en una ficha y quieres otra cosa, no
  // necesitas un botón "atrás" para no seguir dentro.
  const currentAnime = animes.find(
    (a) => a.id === urlAnime || a.slug === urlAnime,
  );

  const isBrowsing = !currentAnime;

  // La ficha carga solo su serie. El catálogo completo (miles de
  // episodios y personajes) se reserva para el buscador global.
  useEffect(() => {
    if (currentAnime?.id) ensureAnimeData(currentAnime.id);
  }, [currentAnime?.id, ensureAnimeData]);

  // Todas las salidas al catálogo se hacen con UNA escritura.
  //
  // Antes cada una llamaba a su propio setUrlAnime y setSearchQuery
  // por separado, y como el navegador no aplica nada hasta que
  // acaba el clic, la segunda escritura partía de los parámetros
  // anteriores y resucitaba "?anime=". Por eso el botón de volver
  // no hacía nada.
  const leaveDetail = () => setWikiUrl({ anime: null, q: null });

  /** Vuelve al catálogo y limpia la búsqueda. */
  const backToCatalog = () => leaveDetail();

  const selectCategory = (name: string) => {
    // Cambiar de categoría siempre lleva al catálogo: si se
    // estaba viendo una ficha, se cierra. La categoría se cambia
    // en la misma escritura para no pelearse con las otras dos.
    setWikiUrl({ wikiCat: name === 'all' ? null : name, anime: null, q: null });
  };

  const openAnime = (id: string) => {
    // Abrir una serie limpia la búsqueda: si no, la ficha no se
    // vería, porque los resultados tienen prioridad sobre ella.
    setWikiUrl({ anime: id, q: null });
  };

  // Tabs inside selected anime: "info" | "episodes" | "characters"
  const [activeTabRaw, setActiveTabRaw] = useQueryState('wikiTab', 'info');
  const activeTab = (['info', 'episodes', 'characters'] as const).includes(
    activeTabRaw as 'info',
  )
    ? (activeTabRaw as 'info' | 'episodes' | 'characters')
    : 'info';
  const setActiveTab = (tab: 'info' | 'episodes' | 'characters') => setActiveTabRaw(tab);

  // Temporada elegida. Sin valor por defecto en la URL: la que
  // abra la ficha es la primera, y el botón "Todas" ya no está (ver
  // `seasonOfView`), así que siempre hay una.
  const [seasonFilter, setSeasonFilter] = useQueryState('temporada', '');

  // ====================================================
  // BUSCADOR
  // ====================================================
  // Va en la franja de arriba de la wiki, no en una pantalla
  // aparte: antes el buscador global era otra pestaña y había que
  // saltar fuera de la wiki para buscar.
  //
  // El texto va en la URL (?q=) como el resto del estado, así que
  // una búsqueda se puede compartir y recargar no la borra.
  const [searchQuery, setSearchQuery] = useQueryState('q', '');
  // Pestaña principal: qué tipo de contenido se consulta. En
  // búsqueda filtra las secciones de resultados; en catálogo,
  // cambia la vista (rejilla de animes o listas).
  const [searchFilter, setSearchFilter] = useState<MainTab>('all');

  // El buscador y las pestañas globales de episodios/personajes
  // abarcan todas las series. Solo entonces se piden completos.
  useEffect(() => {
    const necesitaCatalogoCompleto =
      Boolean(searchQuery.trim()) ||
      (isBrowsing && (searchFilter === 'episodes' || searchFilter === 'characters'));
    if (necesitaCatalogoCompleto) ensureCatalogData();
  }, [searchQuery, searchFilter, isBrowsing, ensureCatalogData]);

  // Filtros avanzados: refinan la pestaña activa y se combinan
  // con el buscador. No van a la URL para no ensuciarla.
  const [filtros, setFiltros] = useState<FiltrosAvanzados>(FILTROS_VACIOS);

  // Cambiar de pestaña conserva solo los filtros compatibles
  // (p. ej. 'En emisión' no viaja a Películas). Ver
  // `sanearFiltros` para el reparto exacto.
  const cambiarPestana = useCallback((tab: MainTab) => {
    setSearchFilter(tab);
    setFiltros((f) => sanearFiltros(f, tab));
  }, []);

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_VACIOS), []);

  // Opciones del panel, sacadas de los datos reales: si mañana
  // entra un género nuevo, sale solo en el filtro.
  const generosWiki = useMemo(() => generosDisponibles(animes), [animes]);
  const rangoWiki = useMemo(() => rangoAnios(animes), [animes]);

  // Contadores de las pestañas en modo catálogo: totales reales
  // por tipo. En búsqueda los pone cada sección de resultados.
  const conteosPestanas = useMemo(() => {
    const pelis = animes.filter(esPelicula).length;
    return {
      all: animes.length,
      series: animes.length - pelis,
      movies: pelis,
      episodes: catalogComplete ? Object.values(episodes).flat().length : undefined,
      characters: catalogComplete ? Object.values(characters).flat().length : undefined,
      threads: threads.length,
    };
  }, [animes, episodes, characters, threads, catalogComplete]);

  // Ref al input, para poder ponerle el cursor encima desde fuera.
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cada vez que App incrementa este número, se enfoca el input.
  //
  // Es un contador y no un booleano a propósito: si se pulsara dos
  // veces seguidas, un booleano puesto a true ya no cambiaría y la
  // segunda pulsación no haría nada. Con un número, cada pulsación
  // es un cambio distinto y el efecto salta siempre.
  useEffect(() => {
    if (searchFocusToken > 0) searchInputRef.current?.focus();
  }, [searchFocusToken]);

  // Episode comments expansion
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(null);
  const [episodeCommentText, setEpisodeCommentText] = useState('');

  // Character filter: "all" | "destacados" | "likes" | "related"
  const [characterFilter, setCharacterFilter] = useState<'all' | 'destacados' | 'likes' | 'related'>('all');
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);
  const {
    comments: comentariosEpisodio,
    marcarLikeLocal: marcarLikeEpisodioLocal,
  } = useCommentsForTarget(
    expandedEpisodeId ? 'episode' : null,
    expandedEpisodeId,
  );
  const { comments: comentariosPersonaje } = useCommentsForTarget(
    expandedCharacterId ? 'character' : null,
    expandedCharacterId,
  );
  const [characterCommentText, setCharacterCommentText] = useState('');
  // Respuesta a una opinión de personaje: a qué comentario y con qué texto.
  const [replyingToCharId, setReplyingToCharId] = useState<string | null>(null);
  const [charReplyText, setCharReplyText] = useState('');

  // Todo lo que sigue usa "currentAnime", que puede no existir
  // mientras se está en el catálogo. Se protege aquí para que el
  // resto del archivo no tenga que comprobarlo en cada sitio.
  const allEpisodes: Episode[] = currentAnime ? episodes[currentAnime.id] || [] : [];
  const allCharacters: Character[] = currentAnime ? characters[currentAnime.id] || [] : [];

  // ====================================================
  // TEMPORADAS
  // ====================================================
  // Solo hay temporadas si alguien las ha creado en el panel.
  // Un anime sin ellas se comporta exactamente igual que antes:
  // sus capítulos y personajes son los que ya había.
  const animeSeasons: Season[] = currentAnime
    ? seasons.filter((s) => s.animeId === currentAnime.id).sort((a, b) => a.number - b.number)
    : [];

// Todo lo que no tiene seasonId es la temporada 1 implícita. Por
  // eso una temporada concreta y "sin filtro" no siempre muestran
  // lo mismo cuando ya hay temporadas guardadas.
  const inSeason = (item: { seasonId?: string }, seasonId: string) =>
    seasonId === 'all' || (item.seasonId ?? null) === seasonId;

  // Los personajes son distintos a propósito: Kaguya está en las
  // tres temporadas y repetirla tres veces obligaría a crear un
  // personaje nuevo por temporada, cada uno con su propia foto, sus
  // "me gusta" y sus comentarios. Así que un personaje SIN
  // temporadas es COMPARTIDO y sale en todas ellas, y solo se
  // filtra cuando tiene temporadas elegidas (un debut en la 3, o
  // alguien que sale en la 1 y en la 3 pero no en la 2). Para los
  // capítulos sigue mandando inSeason: un capítulo sin temporada
  // sigue siendo el de la primera.
  const inCharacterSeason = (c: Character, seasonId: string) =>
    seasonId === 'all' || personajeEnTemporada(c, seasonId);

  // ====================================================
  // FICHA DE LA TEMPORADA QUE SE ESTÁ VIENDO
  // ====================================================
  // Cada temporada tiene su ficha: la 2 puede tener otro año,
  // estudio, puntuación, capítulos, portada y banner que la 1. Lo
  // único que se comparte entre temporadas son las categorías, los
  // géneros y las plataformas, que son de la serie entera.
  //
  // `fichaDe` junta lo de la temporada con lo del anime: si la
  // temporada no tiene un campo, se hereda el del anime. Por eso
  // un catálogo antiguo, con todo en el anime y sin temporadas, se
  // ve exactamente igual.
  //
  // No hay opción "Todas", así que siempre hay una temporada
  // abierta: la que diga la URL y, si no dice ninguna, la primera.
  // También cae en la primera cuando la URL apunta a una temporada
  // de OTRO anime, que es lo que pasa al abrir una serie distinta
  // sin limpiar "?temporada=".
  //
  // Si el anime no tiene temporadas guardadas no hay ninguna
  // abierta y se ve la ficha de la serie entera, como siempre.
  const seasonOfView: Season | undefined =
    animeSeasons.find((s) => s.id === seasonFilter) ?? animeSeasons[0];

  // Con qué se filtran los capítulos y los personajes. 'all' solo
  // cuando el anime no tiene temporadas, que es el caso en el que
  // sus capítulos son los que ya había, sin temporada asignada.
  const seasonActiva = seasonOfView?.id ?? 'all';

  const animeEpisodes: Episode[] = allEpisodes.filter((e) => inSeason(e, seasonActiva));
  const animeCharacters: Character[] = allCharacters.filter((c) =>
    inCharacterSeason(c, seasonActiva),
  );

  const ficha = fichaDe(currentAnime, seasonOfView);

  // Si la imagen que se ve es la de la temporada, el editor rápido
  // tiene que escribir en su documento, y no en el del anime. Se
  // decide por separado para la portada y el banner: puede haber
  // temporada con portada nueva y sin banner, o al revés.
  const bannerIsSeason = Boolean(seasonOfView?.bannerUrl);
  const coverIsSeason = Boolean(seasonOfView?.posterUrl);

  // Categorías de la serie abierta, todas las que tenga. La lista
  // nueva si existe, y la principal si no, para que las series
  // antiguas muestren su categoría como siempre.
  const currentAnimeCategories = currentAnime ? animeCategories(currentAnime) : [];

  const handleEpisodeComment = async (episodeId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeCommentText.trim()) return;
    const ok = await addComment('episode', episodeId, episodeCommentText);
    if (ok) setEpisodeCommentText('');
  };

  const handleCharacterComment = async (characterId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!characterCommentText.trim()) return;
    const ok = await addComment('character', characterId, characterCommentText);
    if (ok) setCharacterCommentText('');
  };

  const handleCharacterReply = async (
    characterId: string,
    parentId: string,
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    if (!charReplyText.trim()) return;
    const ok = await addComment('character', characterId, charReplyText, parentId);
    if (ok) {
      setCharReplyText('');
      setReplyingToCharId(null);
    }
  };

  // Filtered characters
  let filteredCharacters = [...animeCharacters];
  if (characterFilter === 'destacados') {
    filteredCharacters = filteredCharacters.filter(
      (c) => listHas(c.tags, TAG_DESTACADOS) || c.role === 'main',
    );
  } else if (characterFilter === 'likes') {
    filteredCharacters.sort((a, b) => b.likesCount - a.likesCount);
  } else if (characterFilter === 'related') {
    filteredCharacters = filteredCharacters.filter((c) => c.role !== 'main');
  }

  return (
    <div className="space-y-6">
      {/* ====================================================
          CABECERA CON BUSCADOR
      ====================================================
      El buscador global era antes otra pestaña del Navbar, así que
      para buscar había que salir de la wiki. Ahora está aquí
      arriba, en la misma franja que el título, y la búsqueda
      convive con el catálogo: se escribe y salen los resultados
      justo debajo, sin cambiar de sección.

      La migaja solo aparece en la ficha: en el catálogo no hay
      ninguna serie abierta y ponerla sería mentir. */}
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
        {/* Fila de cabecera: título → botón de filtros → buscador.
            En móvil el título va arriba y filtros + buscador debajo,
            para que nada se solape. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {currentAnime ? (
              <>
                <button
                  onClick={backToCatalog}
                  className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                  title="Volver al catálogo"
                >
                  <ArrowLeft size={12} />
                  Catálogo
                </button>
                <Tv size={18} className="flex-shrink-0 text-violet-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Wiki
                </span>
                <span className="text-zinc-700">/</span>
                <span className="truncate text-sm font-semibold text-violet-300">
                  {currentAnime.title}
                </span>
              </>
            ) : (
              <>
                <Tv size={18} className="flex-shrink-0 text-violet-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Wiki de Anime &amp; Series
                </h2>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Solo en catálogo: en la ficha no hay nada que filtrar. */}
            {isBrowsing && (
              <AdvancedFilters
                tab={searchFilter}
                filtros={filtros}
                onChange={setFiltros}
                onClear={limpiarFiltros}
                generos={generosWiki}
                rangoAnios={rangoWiki}
              />
            )}

            {/* El buscador */}
            <div className="relative flex-1 sm:w-80 sm:flex-none">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  // Una sola escritura para el texto y para cerrar la
                  // ficha. Con dos llamadas seguidas, la segunda
                  // borraba lo que la primera acababa de escribir y el
                  // buscador se quedaba vacío.
                  setWikiUrl({ q: value || null, anime: value ? null : undefined });
                }}
                placeholder="Buscar series, capítulos, personajes..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-9 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas principales + filtros activos. Solo en catálogo:
            en la ficha se vería ruido encima de la serie abierta. */}
        {isBrowsing && (
          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <MainTabs active={searchFilter} counts={conteosPestanas} onChange={cambiarPestana} />
            <ChipsFiltros filtros={filtros} onChange={setFiltros} />
          </div>
        )}
      </div>

      {/* ====================================================
          RESULTADOS DE BÚSQUEDA
      ==================================================== */}
      {searchQuery.trim() ? (
        <CatalogSearch
          query={searchQuery}
          filter={searchFilter}
          onFilterChange={cambiarPestana}
          filtros={filtros}
          onLimpiarFiltros={limpiarFiltros}
          animes={animes}
          episodes={episodes}
          characters={characters}
          threads={threads}
          onSelectAnime={openAnime}
          onSelectThread={onSelectThread}
        />
      ) : null}

      {/* ====================================================
          CATÁLOGO
      ====================================================
      Las ocho categorías con sus portadas. Solo se ve si no hay
      ninguna serie abierta en la URL. */}
      {!searchQuery.trim() && isBrowsing && (
        <CatalogBrowser
          animes={animes}
          episodes={episodes}
          characters={characters}
          threads={threads}
          selectedCategory={selectedCategory}
          mainTab={searchFilter}
          filtros={filtros}
          onSelectCategory={selectCategory}
          onSelectAnime={openAnime}
          onSelectThread={onSelectThread}
          onLimpiarFiltros={limpiarFiltros}
        />
      )}

      {/* ====================================================
          FICHA DE LA SERIE
      ====================================================
      A partir de aquí empieza la interfaz de siempre: banner,
      pestañas, capítulos, personajes y comentarios. */}
      {!searchQuery.trim() && currentAnime && (
        <>
      {/* ====================================================
          SELECTOR DE TEMPORADA
      ====================================================
      Solo aparece si hay algo que elegir, o sea dos o más
      temporadas registradas en el panel. Con una sola no hay
      decisión que tomar, y el nombre de esa temporada ya sale en
      la etiqueta del hero. */}
      {animeSeasons.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <Layers size={14} className="flex-shrink-0 text-violet-400" />
          <span className="flex-shrink-0 text-xs font-semibold text-zinc-400">
            Temporada:
          </span>

          {animeSeasons.map((s) => {
            // Miniatura de la imagen propia de la temporada, para
            // que se vea de un vistazo cuáles la tienen y cuáles
            // salen con las del anime. Se prioriza el póster, que
            // es el que se ve en la ficha.
            const propia = s.posterUrl || s.bannerUrl;

            return (
              <button
                key={s.id}
                onClick={() => setSeasonFilter(s.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  seasonOfView?.id === s.id
                    ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                {propia && (
                  <img
                    src={propia}
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-4 flex-shrink-0 rounded object-cover"
                    style={encuadre(s.posterUrl ? s.posterFocus : s.bannerFocus)}
                  />
                )}
                Temporada {s.number}
              </button>
            );
          })}

        </div>
      )}

      {/* SERIES HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        {/* La altura del banner. Pasó de "h-64 sm:h-80" (256px en móvil y
            320px en escritorio) a esto, que son 384px y 544px.

            Se puede subir sin más porque todo lo que va encima esta
            anclado con "absolute": las etiquetas arriba a la izquierda,
            el boton de "Me gusta" arriba a la derecha y el bloque del
            titulo con "bottom-6". Al estar anclado a los bordes, un
            banner mas alto no empuja nada, solo deja ver mas imagen.

            Los dos valores arbitrarios van entre corchetes porque no son
            de serie: 96 es el mayor salto de la escala de Tailwind y se
            queda corto en pantallas anchas, y 34rem es lo que se le
            añade para llegar a un alto que no parezca una franja. */}
        <div className="relative h-96 sm:h-[34rem] w-full overflow-hidden bg-zinc-800">
          {/* Si el anime no tiene banner, se pinta el degradado en
              lugar de un <img> con src vacío, que es lo que
              justamente se veía roto en la wiki.

              El editor rápido apunta a la temporada cuando el
              banner que se ve es el suyo, y al anime cuando se está
              viendo el del anime. */}
          <QuickImageEditor
            section={bannerIsSeason ? 'seasons' : 'animes'}
            itemId={bannerIsSeason ? seasonOfView!.id : currentAnime.id}
            field="bannerUrl"
            label={
              bannerIsSeason
                ? `Banner de la temporada ${seasonOfView!.number} de ${currentAnime.title}`
                : `Banner de ${currentAnime.title}`
            }
            src={ficha.bannerUrl}
            alt={currentAnime.title}
            containerClassName="h-full w-full"
            className="h-full w-full object-cover"
            /* ── EL ENCUADRE POR DEFECTO DEL BANNER ────────────────
               Esta caja es MUCHO más alta que ancha (544 px contra el
               ancho de la pantalla), y el banner es panorámico. A esa
               diferencia le sale un recorte de cerca del 78% de la
               altura, y sin decir nada cae SIEMPRE en el centro
               vertical, que es donde no están ni la cara ni el
               logotipo de la serie.

               `encuadre()` devuelve `50% 50%` cuando no hay nada
               guardado, así que aquí se sustituye por `50% 30%`: sale
               más cielo y título, que es lo que se quiere ver en un
               banner.

               Es un parche para lo que YA está subido sin recortar.
               Lo definitivo es que el banner se guarde ya en esta
               proporción, y desde que el editor del panel recorta a
               16:9, las imágenes nuevas ya no necesitan nada de esto:
               al estar en la proporción correcta, `object-position` no
               tiene margen sobre el que actuar. */
            imgStyle={ficha.bannerFocus ? encuadre(ficha.bannerFocus) : { objectPosition: '50% 30%' }}
            badgeClassName="top-1/2 right-3 -translate-y-1/2"
            empty={
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-900">
                <span className="text-sm font-semibold text-zinc-600">
                  Sin imagen de portada
                </span>
              </div>
            }
          />

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

{/* Status & Studio badges

              Las etiquetas y el botón de "Me gusta" van en la MISMA
              fila, no sueltos cada uno con su "absolute".

              Antes cada uno se colocaba por su cuenta: las etiquetas
              en "left-4 top-4" y el corazón en "top-4 right-4". Las
              etiquetas no tenían ningún tope a la derecha, así que
              en un móvil la fila crecía y el corazón se pintaba
              encima de "Finalizado" (el corazón va después en el
              DOM, y lo que va después tapa lo de antes).

              Con la fila flex, el corazón es "shrink-0" y las
              etiquetas se reparten el hueco que sobra. Da igual
              cuántas haya: si no caben, bajan de línea. */}
          <div className="absolute left-4 right-4 top-4 flex items-start gap-2">
            {/* Todas las categorías de la serie, no solo la
                principal: si encaja en tres, se ven las tres. */}
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {currentAnimeCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-1 text-xs font-bold text-violet-300 backdrop-blur-md"
                >
                  {cat}
                </span>
              ))}
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md">
                {ficha.status}
              </span>

              {/* Qué temporada se está viendo. Solo el nombre: si
                  tiene ficha propia o hereda la de la serie ya se ve
                  en los datos de abajo, y decirlo aquí era repetirlo
                  en una línea más. */}
              {seasonOfView && (
                <span className="rounded-lg border border-violet-500/30 bg-zinc-900/90 px-2.5 py-1 text-xs font-bold text-violet-200 backdrop-blur-md">
                  Temporada {seasonOfView.number}
                  {seasonOfView.title ? `: ${seasonOfView.title}` : ''}
                </span>
              )}
            </div>

            <button
              onClick={() => toggleAnimeLike(currentAnime.id)}
              aria-label={`Dar Me gusta a ${currentAnime.title}`}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-pink-500/30 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-bold text-pink-300 backdrop-blur-md hover:bg-pink-500/20 transition-all"
            >
              <Heart
                size={14}
                className={
                  currentUser && currentAnime.likedBy?.includes(currentUser.uid)
                    ? 'fill-pink-500 text-pink-500'
                    : ''
                }
              />
<span className="font-mono">{currentAnime.likesCount}</span>
            </button>
          </div>

          {/* Bottom Title overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <QuickImageEditor
                section={coverIsSeason ? 'seasons' : 'animes'}
                itemId={coverIsSeason ? seasonOfView!.id : currentAnime.id}
                field="coverUrl"
                label={
                  coverIsSeason
                    ? `Portada de la temporada ${seasonOfView!.number} de ${currentAnime.title}`
                    : `Portada de ${currentAnime.title}`
                }
                src={ficha.coverUrl}
                alt={currentAnime.title}
                containerClassName="hidden sm:block shrink-0"
                className="w-24 h-32 rounded-2xl object-cover ring-4 ring-zinc-900 shadow-2xl"
                imgStyle={encuadre(ficha.coverFocus)}

                badgeClassName="-top-2 -right-2"
                empty={
                  <div className="flex h-32 w-24 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-800 text-[10px] text-zinc-600 ring-4 ring-zinc-900">
                    Sin portada
                  </div>
                }
              />
              <div>
                {currentAnime.japaneseTitle && (
                  <span className="text-xs font-medium text-violet-400">
                    {currentAnime.japaneseTitle}
                  </span>
                )}
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {currentAnime.title}
                  {/* El nombre de la temporada va debajo del de la
                      serie, no delante: el título de la serie es el
                      que la identifica, y "Segunda Parte" es el
                      subtítulo de esa. */}
                  {seasonOfView?.title && (
                    <span className="ml-2 text-lg font-bold text-violet-300 sm:text-2xl">
                      · {seasonOfView.title}
                    </span>
                  )}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Star size={14} className="fill-amber-400" />
                    {ficha.rating}/10
                  </span>
                  <span>•</span>
                  <span>{ficha.year}</span>
                  <span>•</span>
                  <span>{ficha.studio}</span>
                  <span>•</span>
                  <span>{ficha.episodesCount} Episodios</span>
                </div>

              </div>
            </div>
          </div>
        </div>

{/* TABS NAVIGATION (Información, Episodios, Personajes)

           Se desliza en horizontal en vez de repartirse.

           Antes los tres botones iban en un "flex" normal, así que a
           390px el ancho se repartía a partes iguales y "Información
           de la serie" se partía en dos líneas ("Información" / "de
           la serie"), con la pestaña más alta que las demás y el
           texto del título cortado al no caber.

           Con "overflow-x-auto" y "shrink-0" los botones conservan su
           tamaño, no caben los tres, y se desliza. El nombre se lee
           entero, que es lo que se pidió. El "snap" hace que al
           deslizar se paren en cada pestaña en lugar de dejarlas a
           medias. */}
        <div className="flex snap-x snap-mandatory overflow-x-auto border-t border-zinc-800 bg-zinc-950/60 px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap border-b-2 py-4 px-4 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'info'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers size={16} />
            <span>Información de la serie</span>
          </button>

          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap border-b-2 py-4 px-4 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'episodes'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film size={16} />
            <span>Episodios ({animeEpisodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap border-b-2 py-4 px-4 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'characters'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users size={16} />
            <span>Personajes ({animeCharacters.length})</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA A: INFORMACIÓN DE LA SERIE */}
      {activeTab === 'info' && (
        // En pantallas anchas la ficha técnica pasa a 1/4 y el
        // contenido a 3/4. Con 1/3 la columna de datos quedaba
        // desproporcionada al ensanchar el contenedor.
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-200 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8 2xl:col-span-9 space-y-6">
            {/* Sinopsis */}
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" />
                <span>{seasonOfView ? 'Sinopsis de la temporada' : 'Sinopsis Oficial'}</span>
              </h2>
              {/* Sin `max-w-prose`: la caja de esta sección es de 8 columnas y el
                  texto se quedaba en unos 65 caracteres, dejando media
                  tarjeta vacía a la derecha. Los géneros de abajo sí
                  ocupan todo el ancho, así que además la sinopsis
                  quedaba más corta que lo que hay debajo, y la
                  sección parecía cortada.

                  A favor de `max-w-prose` estaba que una línea de mil
                  doscientos píxeles es incómoda de leer. En contra, que
                  en pantalla ancha se perdía casi la mitad del texto y
                  la página parecía rota. Ahora la línea crece con la
                  caja.

                  Si algún día molesta en pantallas enormes, la vuelta
                  es un `max-w-[80ch]` solo a partir de `2xl`, y no en
                  todas. */}
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
                {ficha.synopsis}
              </p>


              {/* Géneros */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Géneros & Temáticas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentAnime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-lg bg-violet-600/15 border border-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Dónde verla / Streaming oficial */}
            <WhereToWatch anime={currentAnime} />
          </div>

          {/* Ficha técnica lateral. Con la rejilla de 12
              columnas queda en 1/4 en pantallas anchas. */}
          <div className="min-w-0 lg:col-span-4 2xl:col-span-3 space-y-6">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Ficha Técnica
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Estudio:</span>
                  <span className="font-semibold text-white">{ficha.studio || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Año de estreno:</span>
                  <span className="font-semibold text-white">{ficha.year || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Puntuación de la comunidad:</span>
                  <span className="font-semibold text-amber-400">{ficha.rating} / 10</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Capítulos emitidos:</span>
                  <span className="font-semibold text-white">{ficha.episodesCount} eps</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-400">Estado:</span>
                  <span className="font-semibold text-emerald-400">{ficha.status || '—'}</span>
                </div>
              </div>

            </section>
          </div>
        </div>
      )}

      {/* PESTAÑA B: EPISODIOS */}
      {activeTab === 'episodes' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Lista de Capítulos ({animeEpisodes.length})
            </h3>
            <span className="text-xs text-zinc-400">Comentarios individuales por capítulo</span>
          </div>

          {animeEpisodes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center">
              <Film size={22} className="mx-auto text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">
                {allEpisodes.length === 0
                  ? 'Esta serie todavía no tiene capítulos publicados.'
                  : 'No hay capítulos en la temporada elegida.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {animeEpisodes.map((ep) => {
            const isExpanded = expandedEpisodeId === ep.id;
            const epComments = isExpanded ? comentariosEpisodio : [];
            const isLiked = currentUser ? ep.likedBy?.includes(currentUser.uid) : false;
            const epRating = typeof ep.rating === 'number' ? ep.rating : 0;

            return (
              <article
                key={ep.id}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 transition-all hover:border-zinc-700"
              >
                <div className="flex flex-col sm:flex-row gap-5 p-5">
                  <div className="relative h-40 sm:h-32 sm:w-56 shrink-0 overflow-hidden rounded-2xl">
                    {ep.thumbnailUrl ? (
                      <img
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        className="h-full w-full object-cover"
                        style={encuadre(ep.thumbnailFocus)}
                      />
                    ) : (
                      // Sin miniatura: la imagen por capitulo no tiene
                      // fuente publica (AniList y MyAnimeList no guardan
                      // una), asi que muchos quedan vacios. Sin esta
                      // alternativa salia el icono de imagen rota.
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800/60">
                        <Film size={24} className="text-zinc-600" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                      {ep.duration}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                        Episodio {ep.number}
                      </span>

                      <span className="flex items-center gap-3">
                        {epRating > 0 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                            <Star size={12} className="fill-amber-400" />
                            {epRating}
                            <span className="font-normal text-zinc-600">/10</span>
                          </span>
                        )}
                        <span className="text-xs text-zinc-500">{ep.airDate}</span>
                      </span>
                    </div>

                    <h4 className="mt-1 text-base font-bold text-white">{ep.title}</h4>
                    {ep.romajiTitle && (
                      <span className="text-[11px] text-zinc-500 italic block">
                        {ep.romajiTitle}
                      </span>
                    )}

                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                      {ep.description}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => toggleEpisodeLike(ep.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          isLiked
                            ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Heart size={13} className={isLiked ? 'fill-pink-500' : ''} />
                        <span className="font-mono">{ep.likesCount}</span>
                      </button>

                      <button
                        onClick={() => setExpandedEpisodeId(isExpanded ? null : ep.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          isExpanded
                            ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <MessageCircle size={13} />
                        <span>Ver comentarios{isExpanded ? ` (${epComments.length})` : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comentarios del episodio */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/60 p-5 space-y-4 animate-in fade-in duration-150">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Debate sobre el Episodio {ep.number}
                    </h5>

                    {/* Input */}
                    <form
                      onSubmit={(e) => handleEpisodeComment(ep.id, e)}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={episodeCommentText}
                        onChange={(e) => setEpisodeCommentText(e.target.value)}
                        placeholder={
                          currentUser
                            ? '¿Qué te pareció este capítulo? (Evita spoilers sin avisar)'
                            : 'Inicia sesión para debatir sobre el capítulo...'
                        }
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
                      >
                        <Send size={12} />
                        <span>Comentar</span>
                      </button>
                    </form>

                    {/* List */}
                    <div className="space-y-2 pt-1">
                      {epComments.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-2">
                          Sé el primero en comentar este episodio.
                        </p>
                      ) : (
                        epComments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-zinc-850 bg-zinc-900/80 p-3"
                          >
<div className="flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0 flex-1">
                                <AuthorBadge
                                  authorId={c.authorId}
                                  nombre={`@${c.authorName}`}
                                />
                              </div>
                              <span className="flex-shrink-0 text-[10px] text-zinc-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-300">{c.body}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => alternarLikeEpisodio(c)}
                                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-pink-400"
                              >
                                <Heart size={11} />
                                <span>{c.likesCount}</span>
                              </button>

                              {/* Moderación y denuncia, igual que en
                                  los comentarios de los hilos: aquí
                                  también se moderan, y es donde más
                                  comentarios hay. La confirmación
                                  tiene botones propios, para poder
                                  decir que no. */}
                              {(puedeModerar || c.authorId === currentUser?.uid) &&
                                (confirmandoBorrar === c.id ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-zinc-300">
                                      ¿Seguro?
                                    </span>
                                    <button
                                      onClick={() => handleBorrarComment(c.id)}
                                      disabled={borrandoAhora === c.id}
                                      className="flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                                    >
                                      {borrandoAhora === c.id ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        'Sí, borrar'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setConfirmandoBorrar(null)}
                                      disabled={borrandoAhora === c.id}
                                      className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-60"
                                    >
                                      Cancelar
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setConfirmandoBorrar(c.id)}
                                    title="Borrar comentario"
                                    aria-label="Borrar comentario"
                                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                ))}

                              <button
                                onClick={() => setReporteando({ tipo: 'comment', id: c.id })}
                                title="Reportar comentario"
                                aria-label="Reportar comentario"
                                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-amber-400"
                              >
                                <Flag size={11} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA C: PERSONAJES */}
      {activeTab === 'characters' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Character Filters: "Destacados", "Más Me gusta", "Relacionados" */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Filtrar personajes:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCharacterFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  characterFilter === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setCharacterFilter('destacados')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  characterFilter === 'destacados'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                Destacados
              </button>
              <button
                onClick={() => setCharacterFilter('likes')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  characterFilter === 'likes'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                Más "Me gusta"
              </button>
              <button
                onClick={() => setCharacterFilter('related')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  characterFilter === 'related'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                Relacionados
              </button>
            </div>
          </div>

          {/* Characters Grid */}
          {filteredCharacters.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center col-span-full">
              <Users size={22} className="mx-auto text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">
                {allCharacters.length === 0
                  ? 'Esta serie todavía no tiene personajes publicados.'
                  : 'No hay personajes en la temporada elegida.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 min-[480px]:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((char) => {
              const isLiked = currentUser ? char.likedBy?.includes(currentUser.uid) : false;
              const isExpanded = expandedCharacterId === char.id;
              const charComments = isExpanded ? comentariosPersonaje : [];

              return (
                <div
                  key={char.id}
                  className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 flex flex-col justify-between"
                >
                  <div>
                    <div className={`relative ${ALTURA_CARD_PERSONAJE} w-full overflow-hidden bg-zinc-950`}>
                      {/* `object-contain` y no `object-cover`: la foto se ve
                          entera (retrato o cuerpo completo) dentro del mismo
                          recuadro para todas las tarjetas. El fondo oscuro
                          rellena lo que sobra segun la proporcion. */}
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="h-full w-full object-contain"
                        style={encuadre(char.imageFocus)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleCharacterLike(char.id)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all ${
                            isLiked
                              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                              : 'bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                        >
                          <Heart size={14} className={isLiked ? 'fill-white' : ''} />
                          <span className="font-mono">{char.likesCount}</span>
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-md bg-violet-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          {char.role === 'main'
                            ? 'Personaje Principal'
                            : char.role === 'antagonist'
                              ? 'Antagonista'
                              : 'Secundario'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="text-lg font-bold text-white">{char.name}</h4>
                      {char.japaneseName && (
                        <span className="text-xs text-violet-400 font-mono block">
                          {char.japaneseName}
                        </span>
                      )}

                      {char.voiceActor && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Seiyuu (Voz): <strong className="text-zinc-200">{char.voiceActor}</strong>
                        </p>
                      )}

                      <p className="mt-3 text-xs leading-relaxed text-zinc-300">
                        {char.description}
                      </p>

                      {/* Character Tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {toTextList(char.tags).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Character Comments Trigger */}
                  <div className="border-t border-zinc-800 bg-zinc-950/60 p-4">
                    <button
                      onClick={() => setExpandedCharacterId(isExpanded ? null : char.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-violet-300 hover:text-violet-200 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        Opiniones y Críticas
                        {isExpanded ? ` (${charComments.filter((c) => !c.parentId).length})` : ''}
                      </span>
                      <span>{isExpanded ? 'Ocultar' : 'Ver y comentar'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-150">
                        <form
                          onSubmit={(e) => handleCharacterComment(char.id, e)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={characterCommentText}
                            onChange={(e) => setCharacterCommentText(e.target.value)}
                            placeholder={
                              currentUser
                                ? `¿Qué opinas de ${char.name.split(' ')[0]}?`
                                : 'Inicia sesión para comentar...'
                            }
                            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                          >
                            Enviar
                          </button>
                        </form>

                        <div className="space-y-2">
                          {charComments.length === 0 ? (
                            <p className="text-[11px] text-zinc-500">
                              Sé el primero en dejar una opinión sobre este personaje.
                            </p>
                          ) : (
                            charComments
                              .filter((c) => !c.parentId)
                              .map((c) => {
                                const respuestas = charComments.filter((r) => r.parentId === c.id);
                                return (
                                  <div
                                    key={c.id}
                                    className="rounded-xl bg-zinc-900 p-2.5 text-xs border border-zinc-800"
                                  >
                                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                                      <div className="min-w-0 flex-1">
                                        <AuthorBadge
                                          authorId={c.authorId}
                                          nombre={`@${c.authorName}`}
                                          tamano="sm"
                                        />
                                      </div>
                                      <span className="flex-shrink-0">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-zinc-300 text-xs">{c.body}</p>

                                    {/* Responder y borrar, como en el
                                        resto de comentarios de la web:
                                        borrar lo ve quien escribió o
                                        el equipo, con confirmación. */}
                                    <div className="mt-1.5 flex items-center gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (replyingToCharId === c.id) {
                                            setReplyingToCharId(null);
                                          } else if (requireAuth('responder a esta opinión')) {
                                            setReplyingToCharId(c.id);
                                          }
                                        }}
                                        className="text-[11px] font-semibold text-zinc-400 transition-colors hover:text-violet-300"
                                      >
                                        Responder
                                      </button>

                                      {(puedeModerar || c.authorId === currentUser?.uid) &&
                                        (confirmandoBorrar === c.id ? (
                                          <span className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-semibold text-zinc-300">
                                              ¿Seguro?
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleBorrarComment(c.id)}
                                              disabled={borrandoAhora === c.id}
                                              className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                                            >
                                              {borrandoAhora === c.id ? (
                                                <Loader2 size={10} className="animate-spin" />
                                              ) : (
                                                'Sí, borrar'
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setConfirmandoBorrar(null)}
                                              disabled={borrandoAhora === c.id}
                                              className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-60"
                                            >
                                              Cancelar
                                            </button>
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setConfirmandoBorrar(c.id)}
                                            title="Borrar opinión"
                                            aria-label="Borrar opinión"
                                            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        ))}
                                    </div>

                                    {/* Responder a esta opinión */}
                                    {replyingToCharId === c.id && (
                                      <form
                                        onSubmit={(e) => handleCharacterReply(char.id, c.id, e)}
                                        className="mt-2 flex gap-2"
                                      >
                                        <input
                                          type="text"
                                          value={charReplyText}
                                          onChange={(e) => setCharReplyText(e.target.value)}
                                          placeholder={`Respondiendo a @${c.authorName}...`}
                                          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                                        />
                                        <button
                                          type="submit"
                                          className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                                        >
                                          Enviar
                                        </button>
                                      </form>
                                    )}

                                    {/* Respuestas anidadas */}
                                    {respuestas.length > 0 && (
                                      <div className="ml-3 mt-2 space-y-1.5 border-l-2 border-zinc-800 pl-2.5">
                                        {respuestas.map((r) => (
                                          <div key={r.id} className="text-xs">
                                            <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                                <CornerDownRight
                                                  size={11}
                                                  className="flex-shrink-0 text-violet-400"
                                                />
                                                <div className="min-w-0 flex-1">
                                                  <AuthorBadge
                                                    authorId={r.authorId}
                                                    nombre={`@${r.authorName}`}
                                                    tamano="sm"
                                                  />
                                                </div>
                                              </div>
                                              <span className="flex-shrink-0">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="pl-5 text-zinc-300">{r.body}</p>
                                            {(puedeModerar || r.authorId === currentUser?.uid) &&
                                              (confirmandoBorrar === r.id ? (
                                                <span className="mt-1 flex items-center gap-1.5 pl-5">
                                                  <span className="text-[11px] font-semibold text-zinc-300">
                                                    ¿Seguro?
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleBorrarComment(r.id)}
                                                    disabled={borrandoAhora === r.id}
                                                    className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                                                  >
                                                    {borrandoAhora === r.id ? (
                                                      <Loader2 size={10} className="animate-spin" />
                                                    ) : (
                                                      'Sí, borrar'
                                                    )}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setConfirmandoBorrar(null)}
                                                    disabled={borrandoAhora === r.id}
                                                    className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-60"
                                                  >
                                                    Cancelar
                                                  </button>
                                                </span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => setConfirmandoBorrar(r.id)}
                                                  title="Borrar respuesta"
                                                  aria-label="Borrar respuesta"
                                                  className="ml-5 mt-1 flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-red-400"
                                                >
                                                  <Trash2 size={11} />
                                                </button>
                                              ))}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Créditos y atribución legal (TheTVDB, AniList e IMDb).
          Va al final del contenido, fuera de las fichas: es de la
          sección entera, no de un anime. Las sinopsis en español
          son redacción propia del catálogo; los datos de
          episodios, las miniaturas, las imágenes y las notas
          vienen de las APIs indicadas. */}
      <section
        aria-label="Créditos de los datos del catálogo"
        className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center sm:flex-row sm:p-5 sm:text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-600/10 text-violet-400">
            <Info size={18} />
          </div>
          <div className="space-y-0.5 text-xs leading-relaxed text-zinc-400">
            <p>
              Los datos de episodios y temporadas, las miniaturas, las imágenes y las
              notas del catálogo son proporcionados por{' '}
              <a
                href="https://thetvdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet-400 underline transition-colors hover:text-violet-300"
              >
                TheTVDB
              </a>
              {', AniList e IMDb.'}
            </p>
            <p className="text-[11px] text-zinc-500">
              Este producto utiliza su API pero no está avalado ni certificado por TheTVDB.
            </p>
          </div>
        </div>
        <ExternalLink size={14} className="hidden shrink-0 text-zinc-600 sm:block" />
      </section>

      {/* Aviso y denuncia. Fuera de las listas de comentarios a
          propósito: dentro de un listado largo no se sabría a
          cuál se refiere. */}
      {aviso && (
        <p className="geo-aparece fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-xl border border-violet-500/30 bg-zinc-900/95 px-4 py-2.5 text-xs font-semibold text-violet-200 shadow-2xl backdrop-blur">
          {aviso}
        </p>
      )}

      {reporteando && (
        <ReportDialog
          targetType={reporteando.tipo}
          targetId={reporteando.id}
          que="este comentario"
          onCerrar={() => setReporteando(null)}
          onReportado={(estado) =>
            avisar(
              estado === 'ya-reportado'
                ? 'Ya lo habías reportado. Gracias.'
                : 'Reporte enviado. Gracias por avisar.',
            )
          }
        />
      )}
    </div>
  );
};
