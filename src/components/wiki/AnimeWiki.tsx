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
import { MentionText } from '../community/MentionText';
import { EmojiPickerButton } from '../community/EmojiPickerButton';
import { CommunityRatingCard } from './CommunityRatingCard';
import { AutoGrowTextarea } from '../common/AutoGrowTextarea';
import { insertarTextoEnCursor } from '../../utils/textarea';
import { useQueryState, useQueryStateBatch } from '../../hooks/useQueryState';
import { useCommentsForTarget } from '../../hooks/useCommentsForTarget';
import { useCatalogPage, useCollectionCount } from '../../hooks/useCatalogPage';
import { useAnimeCatalogData } from '../../hooks/useAnimeCatalogData';
import {
  useAnimeCollectionCount,
  useAnimeCollectionPage,
} from '../../hooks/useAnimeCollectionPage';
import { useAnimeDoc } from '../../hooks/useAnimeDoc';
import { invalidateCache, PUBLIC_CACHE } from '../../lib/firestoreCache';
import { SITE_URL, useSeo } from '../../lib/seo';
import {
  cargarIndiceBusqueda,
  cargarTemporadasIndice,
  type IndiceBusqueda,
  type TemporadasPorAnime,
} from '../../services/searchIndex';
import { registrarVisitaAnime } from '../../services/animeStats';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { animeCategories, isInCategory } from '../../data/animeCategories';
import CatalogBrowser from './CatalogBrowser';
import CatalogSearch from './CatalogSearch';
import MainTabs from './MainTabs';
import { AdvancedFilters, ChipsFiltros } from './AdvancedFilters';
import { WhereToWatch } from './WhereToWatch';
import {
  FILTROS_VACIOS,
  contarFiltrosActivos,
  esPelicula,
  generosDisponibles,
  pasaFiltrosAnime,
  rangoAnios,
  sanearFiltros,
  type FiltrosAvanzados,
  type MainTab,
} from '../../utils/wikiFilter';
import { encuadre, listHas, toTextList } from '../../utils/safeData';
import { fichaDe } from '../../utils/seasonData';
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
    allThreads,
    ensureCatalogData,
    ensureAnimeList,
    ensureAllThreads,
    ensureAnimeData,
    catalogComplete,
    toggleAnimeLike,
    toggleEpisodeLike,
    toggleCharacterLike,
    addComment,
    toggleCommentLike,
    deleteComment,
  } = useCommunity();

  const { currentUser, usersList, requireAuth, isModerator, isAdmin } =
    useAuth();

  /** Nombre visible actual, con el guardado como respaldo. */
  const nombreDe = (uid: string, respaldo: string): string => {
    const vivo = usersList.find((u) => u.uid === uid);
    return vivo?.displayName || vivo?.username || respaldo;
  };
  const puedeModerar = isModerator || isAdmin;

  // La Wiki sí necesita todas las series para el catálogo.
  useEffect(() => {
    ensureAnimeList();
  }, [ensureAnimeList]);

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
  // La lista de animes ya no viene de Firestore: se pinta desde
  // `animes.json`. Para la ficha se lee solo el documento de la serie
  // abierta y se prefiere su copia completa a la ligera.
  const staticAnime = animes.find(
    (a) => a.id === urlAnime || a.slug === urlAnime,
  );
  const animeDoc = useAnimeDoc(
    (staticAnime?.id ?? urlAnime) || null,
    Boolean(urlAnime) && animes.length > 0,
  );
  const currentAnime = animeDoc ?? staticAnime;

  // Visitas reales a la ficha. Se llama al abrir una serie, no en
  // cada render. La sesión local evita repetir la llamada; la Cloud
  // Function vuelve a deduplicar en servidor (UID o huella anónima
  // durante 24 h).
  const visitasPedidas = useRef<Set<string>>(new Set());
  useEffect(() => {
    const animeId = currentAnime?.id;
    if (!urlAnime || !animeId) return;

    const clave = `geekapoo:visita:${animeId}`;
    try {
      const ultima = Number(sessionStorage.getItem(clave) ?? 0);
      if (Number.isFinite(ultima) && Date.now() - ultima < 86_400_000) return;
    } catch {
      // Sin sessionStorage se sigue: el servidor deduplica.
    }

    if (visitasPedidas.current.has(animeId)) return;
    visitasPedidas.current.add(animeId);

    void registrarVisitaAnime(animeId).then((resultado) => {
      if (!resultado.contado) return;
      try {
        sessionStorage.setItem(clave, String(Date.now()));
      } catch {
        // La visita ya está contada en servidor.
      }
    });
  }, [urlAnime, currentAnime?.id]);

  // SEO de la ficha. Las páginas de anime ya salen prerenderizadas
  // con estos mismos datos; esto mantiene el <head> correcto al
  // navegar dentro de la SPA y al abrir una ficha desde el catálogo.
  useSeo(
    currentAnime
      ? (() => {
          const pelicula = esPelicula(currentAnime);
          const slug = currentAnime.slug || currentAnime.id;
          const url = `${SITE_URL}/anime/${encodeURIComponent(slug)}`;
          const imagen =
            currentAnime.bannerUrl ||
            currentAnime.coverUrl ||
            `${SITE_URL}/img/og-geekapoo.png`;
          const titulo = pelicula
            ? `${currentAnime.title} – Película, personajes y dónde verla | Geekapoo`
            : `${currentAnime.title} – Wiki, personajes y episodios | Geekapoo`;
          const descripcion = currentAnime.synopsis?.trim()
            ? `${currentAnime.title}: ${currentAnime.synopsis}`
            : `Descubre la información de ${currentAnime.title}, sus temporadas, episodios, personajes y disponibilidad en plataformas de streaming.`;

          const ficha: Record<string, unknown> = {
            '@context': 'https://schema.org',
            '@type': pelicula ? 'Movie' : 'TVSeries',
            '@id': `${url}#main`,
            name: currentAnime.title,
            description: currentAnime.synopsis,
            url,
            image: [currentAnime.coverUrl, currentAnime.bannerUrl].filter(Boolean),
            inLanguage: 'ja',
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            ...(currentAnime.japaneseTitle
              ? { alternateName: currentAnime.japaneseTitle }
              : {}),
            ...(currentAnime.year
              ? { datePublished: currentAnime.year }
              : {}),
            ...(currentAnime.genres?.length
              ? { genre: currentAnime.genres }
              : {}),
            ...(!pelicula && currentAnime.episodesCount
              ? { numberOfEpisodes: currentAnime.episodesCount }
              : {}),
            ...(currentAnime.studio
              ? {
                  productionCompany: {
                    '@type': 'Organization',
                    name: currentAnime.studio,
                  },
                }
              : {}),
          };

          const migas = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: `${SITE_URL}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Wiki de anime',
                item: `${SITE_URL}/?tab=wiki`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: currentAnime.title,
                item: url,
              },
            ],
          };

          return {
            title: titulo,
            description: descripcion,
            canonical: url,
            image: imagen,
            imageAlt: `Portada de ${currentAnime.title}`,
            type: pelicula ? ('video.movie' as const) : ('video.tv_show' as const),
            jsonLd: [ficha, migas],
          };
        })()
      : null,
  );

  // Temporadas de la ficha. Vienen de `temporadas.json`; si el
  // archivo no está o no conoce esta serie, se piden a Firestore.
  const [temporadasIndice, setTemporadasIndice] =
    useState<TemporadasPorAnime | null>(null);

  // La ficha completa se lee aparte, así que el corazón del anime se
  // actualiza en local y se invalida la copia de ese documento.
  const [animeLikeLocal, setAnimeLikeLocal] = useState<{
    id: string;
    liked: boolean;
    count: number;
  } | null>(null);

  useEffect(() => {
    setAnimeLikeLocal(null);
  }, [currentAnime?.id]);

  const animeLikeOverride =
    animeLikeLocal && animeLikeLocal.id === currentAnime?.id
      ? animeLikeLocal
      : null;

  const animeLikeLiked = currentUser
    ? animeLikeOverride
      ? animeLikeOverride.liked
      : (currentAnime?.likedBy?.includes(currentUser.uid) ?? false)
    : false;
  const animeLikeCount = animeLikeOverride
    ? animeLikeOverride.count
    : (currentAnime?.likesCount ?? 0);

  const alternarLikeAnime = async () => {
    if (!currentAnime) return;

    const uid = currentUser?.uid;
    if (!uid) {
      void toggleAnimeLike(currentAnime.id);
      return;
    }

    const antesLiked = currentAnime.likedBy?.includes(uid) ?? false;
    const antesCount = currentAnime.likesCount ?? 0;
    setAnimeLikeLocal({
      id: currentAnime.id,
      liked: !antesLiked,
      count: Math.max(0, antesCount + (antesLiked ? -1 : 1)),
    });

    const ok = await toggleAnimeLike(currentAnime.id, antesLiked);
    if (!ok) {
      setAnimeLikeLocal({
        id: currentAnime.id,
        liked: antesLiked,
        count: antesCount,
      });
      return;
    }

    invalidateCache(`anime-doc:${currentAnime.id}`, PUBLIC_CACHE);
  };

  const isBrowsing = !currentAnime;

  // Enlaces antiguos y avisos que traen el id del documento en vez
  // del slug: en cuanto el catálogo sabe el slug real, la barra de
  // direcciones se reescribe. Así una misma serie no vive en dos
  // URLs distintas, que es justo lo que Google penaliza como
  // contenido duplicado.
  useEffect(() => {
    if (!currentAnime?.slug) return;
    if (urlAnime === currentAnime.slug) return;
    setWikiUrl({ anime: currentAnime.slug });
    // setWikiUrl cambia en cada navegación; con el slug y la URL
    // actual como dependencias basta para no repetir la escritura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnime?.slug, urlAnime]);

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
    //
    // La URL usa el slug y no el id del documento: "/anime/jujutsu-kaisen"
    // se lee, se comparte y posiciona; "/anime/A1b2C3d4" no. Si la
    // serie aún no tiene slug se cae al id, que sigue funcionando.
    const anime = animes.find((a) => a.id === id);
    setWikiUrl({ anime: anime?.slug || id, q: null });
  };

  // Tabs inside selected anime: "info" | "episodes" | "characters"
  const [activeTabRaw, setActiveTabRaw] = useQueryState('wikiTab', 'info');
  const activeTab = (['info', 'episodes', 'characters'] as const).includes(
    activeTabRaw as 'info',
  )
    ? (activeTabRaw as 'info' | 'episodes' | 'characters')
    : 'info';
  const setActiveTab = (tab: 'info' | 'episodes' | 'characters') => setActiveTabRaw(tab);

  // La ficha pide las temporadas al abrirse porque el selector está
  // en la cabecera. Primero intenta el archivo estático; Firestore
  // queda como respaldo si el archivo falta o no conoce esta serie
  // (por ejemplo, un anime creado después del último refresco).
  useEffect(() => {
    if (!currentAnime?.id) return;

    let activo = true;
    void cargarTemporadasIndice().then((mapa) => {
      if (!activo) return;
      if (mapa) {
        setTemporadasIndice(mapa);
        return;
      }
      ensureAnimeData(currentAnime.id, ['seasons']);
    });

    return () => {
      activo = false;
    };
  }, [currentAnime?.id, ensureAnimeData]);

  useEffect(() => {
    if (!currentAnime?.id || !temporadasIndice) return;

    const lista = temporadasIndice[currentAnime.id];
    if (!Array.isArray(lista)) {
      ensureAnimeData(currentAnime.id, ['seasons']);
      return;
    }

    // El contador desnormalizado del anime detecta una lista
    // estática antigua: si se creó o borró una temporada después
    // del último refresco, se pide la lista real.
    const esperadas = currentAnime.seasonsCount;
    if (typeof esperadas === 'number' && esperadas !== lista.length) {
      ensureAnimeData(currentAnime.id, ['seasons']);
    }
  }, [
    currentAnime?.id,
    currentAnime?.seasonsCount,
    temporadasIndice,
    ensureAnimeData,
  ]);

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

  // Navegación normal: páginas de 60. Los filtros que cambian QUÉ
  // se enseña (género, año, nota...) piden las filas de las series
  // que pasan el filtro. Cambiar solo el ORDEN no: eso se aplica
  // sobre la página que ya está en memoria y no justifica leer
  // miles de episodios.
  const filtrosSinOrden = { ...filtros, orden: 'defecto' as const };
  const sinFiltrosCatalogo =
    selectedCategory === 'all' &&
    !searchQuery.trim() &&
    contarFiltrosActivos(filtrosSinOrden) === 0;
  const paginaEpisodiosActiva =
    isBrowsing && searchFilter === 'episodes' && sinFiltrosCatalogo && !catalogComplete;
  const paginaPersonajesActiva =
    isBrowsing && searchFilter === 'characters' && sinFiltrosCatalogo && !catalogComplete;

  const paginaEpisodios = useCatalogPage<Episode>('episodes', paginaEpisodiosActiva);
  const paginaPersonajes = useCatalogPage<Character>(
    'characters',
    paginaPersonajesActiva,
    'name',
  );
  const totalEpisodios = useCollectionCount('episodes', isBrowsing);
  const totalPersonajes = useCollectionCount('characters', isBrowsing);

  // Los filtros de episodios/personajes son, salvo la nota del
  // episodio, filtros del anime padre. Se calculan sus ids una vez y
  // solo se piden las filas de esas series.
  const animesElegibles = useMemo(() => {
    if (!isBrowsing || catalogComplete || searchQuery.trim()) return [];
    if (searchFilter !== 'episodes' && searchFilter !== 'characters') return [];
    const filtrosSinNota: FiltrosAvanzados = { ...filtros, notaMin: 0 };
    return animes
      .filter(
        (anime) =>
          (selectedCategory === 'all' || isInCategory(anime, selectedCategory)) &&
          pasaFiltrosAnime(anime, filtrosSinNota),
      )
      .map((anime) => anime.id);
  }, [
    animes,
    selectedCategory,
    filtros,
    isBrowsing,
    searchFilter,
    searchQuery,
    catalogComplete,
  ]);

  const usarFiltradosEpisodios =
    isBrowsing &&
    !catalogComplete &&
    !searchQuery.trim() &&
    searchFilter === 'episodes' &&
    !paginaEpisodiosActiva;
  const usarFiltradosPersonajes =
    isBrowsing &&
    !catalogComplete &&
    !searchQuery.trim() &&
    searchFilter === 'characters' &&
    !paginaPersonajesActiva;

  const filtradosEpisodios = useAnimeCatalogData<Episode>(
    'episodes',
    animesElegibles,
    usarFiltradosEpisodios,
  );
  const filtradosPersonajes = useAnimeCatalogData<Character>(
    'characters',
    animesElegibles,
    usarFiltradosPersonajes,
  );

  // ── ÍNDICE LIGERO DE BÚSQUEDA ─────────────────────────────
  //
  // Firestore no sabe buscar subcadenas. Antes, la primera
  // búsqueda descargaba TODOS los episodios, personajes y
  // temporadas (miles de documentos) para filtrar en memoria.
  //
  // Ahora se usa el índice que genera `prebuild` y se sirve como
  // un archivo estático: cero lecturas de Firestore para buscar,
  // con los mismos títulos, alias, nombres japoneses y romaji.
  // Si el archivo no está (desarrollo sin prebuild, despliegue
  // antiguo o fallo de red), se conserva el camino anterior como
  // red de seguridad.
  const [indiceBusqueda, setIndiceBusqueda] = useState<IndiceBusqueda | null>(null);
  const [cargandoIndice, setCargandoIndice] = useState(false);
  const indicePedidoRef = useRef(false);

  useEffect(() => {
    const buscando = Boolean(searchQuery.trim());

    if (buscando && !indicePedidoRef.current) {
      indicePedidoRef.current = true;
      setCargandoIndice(true);
      void cargarIndiceBusqueda()
        .then((indice) => {
          if (indice) setIndiceBusqueda(indice);
          else ensureCatalogData();
        })
        .finally(() => setCargandoIndice(false));
    }

    if (buscando || searchFilter === 'threads') ensureAllThreads();
  }, [searchQuery, searchFilter, ensureCatalogData, ensureAllThreads]);

  // Los resultados se pintan igual que antes, pero las filas de
  // episodios y personajes vienen del índice estático. Así el
  // buscador conserva la búsqueda por sinopsis, géneros, alias y
  // descripciones sin descargar las colecciones.
  const episodiosBusqueda = useMemo(() => {
    if (!indiceBusqueda) return episodes;
    const grouped: Record<string, Episode[]> = {};
    indiceBusqueda.episodes.forEach((ep) => {
      if (!grouped[ep.animeId]) grouped[ep.animeId] = [];
      grouped[ep.animeId].push(ep);
    });
    return grouped;
  }, [indiceBusqueda, episodes]);

  const personajesBusqueda = useMemo(() => {
    if (!indiceBusqueda) return characters;
    const grouped: Record<string, Character[]> = {};
    indiceBusqueda.characters.forEach((personaje) => {
      if (!grouped[personaje.animeId]) grouped[personaje.animeId] = [];
      grouped[personaje.animeId].push(personaje);
    });
    return grouped;
  }, [indiceBusqueda, characters]);

  const episodiosParaCatalogo = useMemo(() => {
    if (catalogComplete || searchQuery.trim()) return episodes;
    const fuente = paginaEpisodiosActiva
      ? paginaEpisodios.items
      : usarFiltradosEpisodios
        ? filtradosEpisodios.items
        : null;
    if (!fuente) return episodes;
    const grouped: Record<string, Episode[]> = {};
    fuente.forEach((ep) => {
      if (!grouped[ep.animeId]) grouped[ep.animeId] = [];
      grouped[ep.animeId].push(ep);
    });
    return grouped;
  }, [
    catalogComplete,
    searchQuery,
    paginaEpisodiosActiva,
    paginaEpisodios.items,
    usarFiltradosEpisodios,
    filtradosEpisodios.items,
    episodes,
  ]);

  const personajesParaCatalogo = useMemo(() => {
    if (catalogComplete || searchQuery.trim()) return characters;
    const fuente = paginaPersonajesActiva
      ? paginaPersonajes.items
      : usarFiltradosPersonajes
        ? filtradosPersonajes.items
        : null;
    if (!fuente) return characters;
    const grouped: Record<string, Character[]> = {};
    fuente.forEach((personaje) => {
      if (!grouped[personaje.animeId]) grouped[personaje.animeId] = [];
      grouped[personaje.animeId].push(personaje);
    });
    return grouped;
  }, [
    catalogComplete,
    searchQuery,
    paginaPersonajesActiva,
    paginaPersonajes.items,
    usarFiltradosPersonajes,
    filtradosPersonajes.items,
    characters,
  ]);

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
      episodes: catalogComplete
        ? Object.values(episodes).flat().length
        : (totalEpisodios ?? undefined),
      characters: catalogComplete
        ? Object.values(characters).flat().length
        : (totalPersonajes ?? undefined),
      threads: allThreads.length > 0 ? allThreads.length : threads.length,
    };
  }, [
    animes,
    episodes,
    characters,
    allThreads,
    threads,
    catalogComplete,
    totalEpisodios,
    totalPersonajes,
  ]);

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
  const episodeCommentRef = useRef<HTMLTextAreaElement>(null);

  // Character filter: "all" | "destacados" | "likes" | "related"
  const [characterFilter, setCharacterFilter] = useState<'all' | 'destacados' | 'likes' | 'related'>('all');
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);
  const {
    comments: comentariosEpisodio,
    loadingMore: cargandoEpisodioAnteriores,
    hasMore: hayEpisodioAnteriores,
    loadMore: cargarEpisodioAnteriores,
    marcarLikeLocal: marcarLikeEpisodioLocal,
  } = useCommentsForTarget(
    expandedEpisodeId ? 'episode' : null,
    expandedEpisodeId,
  );
  const {
    comments: comentariosPersonaje,
    loadingMore: cargandoPersonajeAnteriores,
    hasMore: hayPersonajeAnteriores,
    loadMore: cargarPersonajeAnteriores,
  } = useCommentsForTarget(
    expandedCharacterId ? 'character' : null,
    expandedCharacterId,
  );
  const [characterCommentText, setCharacterCommentText] = useState('');
  const characterCommentRef = useRef<HTMLTextAreaElement>(null);
  // Respuesta a una opinión de personaje: a qué comentario y con qué texto.
  const [replyingToCharId, setReplyingToCharId] = useState<string | null>(null);
  const [charReplyText, setCharReplyText] = useState('');
  const charReplyRef = useRef<HTMLTextAreaElement>(null);

  // ====================================================
  // TEMPORADAS
  // ====================================================
  // Solo hay temporadas si alguien las ha creado en el panel.
  // Un anime sin ellas se comporta exactamente igual que antes:
  // sus capítulos y personajes son los que ya había.
  const temporadasDeEsteAnime = currentAnime
    ? temporadasIndice?.[currentAnime.id]
    : undefined;
  const fuenteTemporadas: Season[] =
    temporadasDeEsteAnime &&
    (typeof currentAnime?.seasonsCount !== 'number' ||
      currentAnime.seasonsCount === temporadasDeEsteAnime.length)
      ? temporadasDeEsteAnime
      : currentAnime
        ? seasons.filter((s) => s.animeId === currentAnime.id)
        : [];
  const animeSeasons: Season[] = fuenteTemporadas
    .slice()
    .sort((a, b) => a.number - b.number);

  // Los personajes son distintos a propósito: Kaguya está en las
  // tres temporadas y repetirla tres veces obligaría a crear un
  // personaje nuevo por temporada, cada uno con su propia foto, sus
  // "me gusta" y sus comentarios. Así que un personaje SIN
  // temporadas es COMPARTIDO y sale en todas ellas, y solo se
  // filtra cuando tiene temporadas elegidas (un debut en la 3, o
  // alguien que sale en la 1 y en la 3 pero no en la 2). Para los
  // capítulos sigue mandando inSeason: un capítulo sin temporada
  // sigue siendo el de la primera.
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

  // Cada pestaña tiene su propia página. Los episodios se filtran por
  // la temporada abierta en Firestore y se ordenan por número; los
  // personajes se paginan por anime y se filtran por temporada en
  // local (un personaje puede ser compartido o estar en varias).
  const episodiosPagina = useAnimeCollectionPage<Episode>(
    'episodes',
    currentAnime?.id ?? null,
    activeTab === 'episodes',
    {
      seasonId: seasonActiva === 'all' ? null : seasonActiva,
      orderByNumber: true,
    },
  );
  const personajesPagina = useAnimeCollectionPage<Character>(
    'characters',
    currentAnime?.id ?? null,
    activeTab === 'characters',
    { characterSeasonId: seasonActiva === 'all' ? null : seasonActiva },
  );
  const totalEpisodiosTemporada = useAnimeCollectionCount(
    'episodes',
    currentAnime?.id ?? null,
    seasonActiva,
    Boolean(currentAnime),
  );
  const totalPersonajesTemporada = useAnimeCollectionCount(
    'characters',
    currentAnime?.id ?? null,
    null,
    Boolean(currentAnime),
    seasonActiva,
  );

  const animeEpisodes: Episode[] = episodiosPagina.items;
  const animeCharacters: Character[] = personajesPagina.items;
  const cargandoEpisodios = episodiosPagina.loading;
  const cargandoPersonajes = personajesPagina.loading;

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

  const insertarEmojiEpisodio = (emoji: string) => {
    insertarTextoEnCursor(
      episodeCommentRef,
      episodeCommentText,
      emoji,
      setEpisodeCommentText,
    );
  };

  const insertarEmojiPersonaje = (emoji: string) => {
    insertarTextoEnCursor(
      characterCommentRef,
      characterCommentText,
      emoji,
      setCharacterCommentText,
    );
  };

  const insertarEmojiRespuestaPersonaje = (emoji: string) => {
    insertarTextoEnCursor(charReplyRef, charReplyText, emoji, setCharReplyText);
  };

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
      <div className="geo-panel space-y-3 rounded-2xl border border-zinc-800 p-4">
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
          episodes={episodiosBusqueda}
          characters={personajesBusqueda}
          threads={allThreads}
          cargando={
            cargandoIndice ||
            (Boolean(searchQuery.trim()) && !indiceBusqueda && !catalogComplete)
          }
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
          episodes={episodiosParaCatalogo}
          characters={personajesParaCatalogo}
          threads={allThreads.length > 0 ? allThreads : threads}
          selectedCategory={selectedCategory}
          mainTab={searchFilter}
          filtros={filtros}
          onSelectCategory={selectCategory}
          onSelectAnime={openAnime}
          onSelectThread={onSelectThread}
          onLimpiarFiltros={limpiarFiltros}
          hasMoreEpisodes={
            (paginaEpisodiosActiva && paginaEpisodios.hasMore) ||
            (usarFiltradosEpisodios && filtradosEpisodios.hasMore)
          }
          loadingMoreEpisodes={
            (paginaEpisodiosActiva && paginaEpisodios.loadingMore) ||
            (usarFiltradosEpisodios && filtradosEpisodios.loadingMore)
          }
          onLoadMoreEpisodes={
            paginaEpisodiosActiva
              ? paginaEpisodios.loadMore
              : usarFiltradosEpisodios
                ? filtradosEpisodios.loadMore
                : undefined
          }
          hasMoreCharacters={
            (paginaPersonajesActiva && paginaPersonajes.hasMore) ||
            (usarFiltradosPersonajes && filtradosPersonajes.hasMore)
          }
          loadingMoreCharacters={
            (paginaPersonajesActiva && paginaPersonajes.loadingMore) ||
            (usarFiltradosPersonajes && filtradosPersonajes.loadingMore)
          }
          onLoadMoreCharacters={
            paginaPersonajesActiva
              ? paginaPersonajes.loadMore
              : usarFiltradosPersonajes
                ? filtradosPersonajes.loadMore
                : undefined
          }
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

      {/* SERIES HERO: portada completa en móvil y banner en escritorio */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        {/* Este wrapper contiene la imagen y el título. En escritorio el
            título se posiciona contra él (no contra las pestañas), así
            que sigue pegado al borde inferior del banner. */}
        <div className="relative">
        {/* En móvil la caja es 2:3 para que quepa la portada entera.
            Desde sm recupera la altura del banner panorámico. */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800 sm:aspect-auto sm:h-[34rem]">
          {/* MÓVIL: portada completa. El fondo desenfocado rellena
              las franjas si la portada no es exactamente 2:3. */}
          <div className="absolute inset-0 sm:hidden">
            {ficha.coverUrl && (
              <img
                src={ficha.coverUrl}
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                style={encuadre(ficha.coverFocus)}
              />
            )}
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
              alt={
                coverIsSeason
                  ? `Portada de la temporada ${seasonOfView!.number} de ${currentAnime.title}`
                  : `Portada de ${currentAnime.title}`
              }
              loading="eager"
              fetchPriority="high"
              containerClassName="relative h-full w-full"
              className="h-full w-full object-contain"
              imgStyle={encuadre(ficha.coverFocus)}
              badgeClassName="top-2 right-2"
              empty={
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-900">
                  <span className="text-sm font-semibold text-zinc-600">
                    Sin portada
                  </span>
                </div>
              }
            />
          </div>

          {/* ESCRITORIO: el banner de siempre. */}
          <div className="absolute inset-0 hidden sm:block">
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
            alt={
              bannerIsSeason
                ? `Banner de la temporada ${seasonOfView!.number} de ${currentAnime.title}`
                : `Banner de ${currentAnime.title}`
            }
            loading="eager"
            fetchPriority="high"
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
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent sm:via-zinc-950/60" />

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
              onClick={() => void alternarLikeAnime()}
              aria-label={`Dar Me gusta a ${currentAnime.title}`}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-pink-500/30 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-bold text-pink-300 backdrop-blur-md hover:bg-pink-500/20 transition-all"
            >
              <Heart
                size={14}
                className={animeLikeLiked ? 'fill-pink-500 text-pink-500' : ''}
              />
              <span className="font-mono">{animeLikeCount}</span>
            </button>
          </div>

        </div>

        {/* Bloque del título. En móvil va debajo de la portada para no
            tapar el póster; desde sm vuelve a flotar sobre el banner. */}
        <div className="relative z-10 flex flex-col gap-4 border-t border-white/[0.06] bg-zinc-950/90 px-4 pb-5 pt-4 sm:absolute sm:bottom-6 sm:left-6 sm:right-6 sm:flex-row sm:items-end sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
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
              alt={
                coverIsSeason
                  ? `Portada de la temporada ${seasonOfView!.number} de ${currentAnime.title}`
                  : `Portada de ${currentAnime.title}`
              }
              loading="eager"
              containerClassName="hidden sm:block shrink-0"
              className="hidden h-32 w-24 rounded-2xl object-cover ring-4 ring-zinc-900 shadow-2xl sm:block"
              imgStyle={encuadre(ficha.coverFocus)}

              badgeClassName="-top-2 -right-2"
              empty={
                <div className="hidden h-32 w-24 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-800 text-[10px] text-zinc-600 ring-4 ring-zinc-900 sm:flex">
                  Sin portada
                </div>
              }
            />
            <div className="min-w-0">
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
                <span
                  className="flex items-center gap-1 font-bold text-amber-400"
                  title="Puntuación de IMDb"
                >
                  <Star size={14} className="fill-amber-400" />
                  {ficha.rating > 0 ? `${ficha.rating}/10` : 'No disponible'}
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
            <span>
              Episodios (
              {totalEpisodiosTemporada ??
                (episodiosPagina.loaded
                  ? `${animeEpisodes.length}${episodiosPagina.hasMore ? '+' : ''}`
                  : '…')}
              )
            </span>
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
            <span>
              Personajes (
              {totalPersonajesTemporada ??
                (personajesPagina.loaded
                  ? `${animeCharacters.length}${personajesPagina.hasMore ? '+' : ''}`
                  : '…')}
              )
            </span>
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
                  <span className="text-zinc-400">Puntuación de IMDb:</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Star size={11} className="fill-amber-400" />
                    {ficha.rating > 0 ? `${ficha.rating} / 10` : 'No disponible'}
                  </span>
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

            <CommunityRatingCard
              animeId={currentAnime.id}
              animeTitle={currentAnime.title}
              sum={currentAnime.communityRatingSum}
              count={currentAnime.communityRatingCount}
              avg={currentAnime.communityRatingAvg}
            />
          </div>
        </div>
      )}

      {/* PESTAÑA B: EPISODIOS */}
      {activeTab === 'episodes' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Lista de Capítulos ({totalEpisodiosTemporada ?? animeEpisodes.length})
            </h3>
            <span className="text-xs text-zinc-400">Comentarios individuales por capítulo</span>
          </div>

          {episodiosPagina.error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-300">
              {episodiosPagina.error}
            </div>
          ) : animeEpisodes.length === 0 ? (
            cargandoEpisodios || !episodiosPagina.loaded ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
                <Loader2 size={20} className="mx-auto animate-spin text-violet-400" />
                <p className="mt-3 text-sm text-zinc-500">Cargando episodios…</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center">
                <Film size={22} className="mx-auto text-zinc-700" />
                <p className="mt-3 text-sm text-zinc-500">
                  {totalEpisodiosTemporada === 0 && (currentAnime?.episodesCount ?? 0) > 0
                    ? 'No hay capítulos en la temporada elegida.'
                    : 'Esta serie todavía no tiene capítulos publicados.'}
                </p>
              </div>
            )
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
                        <span>
                          Ver comentarios
                          {isExpanded
                            ? ` (${epComments.length}${hayEpisodioAnteriores ? '+' : ''})`
                            : ''}
                        </span>
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
                      className="space-y-2"
                    >
                      <div className="flex items-end gap-2">
                        <AutoGrowTextarea
                          inputRef={episodeCommentRef}
                          rows={1}
                          maxHeight={160}
                          value={episodeCommentText}
                          onChange={(e) => setEpisodeCommentText(e.target.value)}
                          placeholder={
                            currentUser
                              ? '¿Qué te pareció este capítulo? (Evita spoilers sin avisar)'
                              : 'Inicia sesión para debatir sobre el capítulo...'
                          }
                          className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-base text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none sm:text-xs"
                        />
                        <button
                          type="submit"
                          className="flex shrink-0 items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
                        >
                          <Send size={12} />
                          <span>Comentar</span>
                        </button>
                      </div>
                      <EmojiPickerButton onElegir={insertarEmojiEpisodio} />
                    </form>

                    {hayEpisodioAnteriores && (
                      <button
                        type="button"
                        onClick={() => void cargarEpisodioAnteriores()}
                        disabled={cargandoEpisodioAnteriores}
                        className="mx-auto flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-200 disabled:opacity-60"
                      >
                        {cargandoEpisodioAnteriores && (
                          <Loader2 size={11} className="animate-spin" />
                        )}
                        {cargandoEpisodioAnteriores
                          ? 'Cargando...'
                          : 'Cargar comentarios anteriores'}
                      </button>
                    )}

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
                                  nombre={c.authorName}
                                />
                              </div>
                              <span className="flex-shrink-0 text-[10px] text-zinc-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-line break-words text-xs text-zinc-300">
                          <MentionText text={c.body} />
                        </p>
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

          {episodiosPagina.hasMore && (
            <button
              type="button"
              onClick={() => void episodiosPagina.loadMore()}
              disabled={episodiosPagina.loadingMore}
              className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-violet-400/40 hover:text-white disabled:opacity-60"
            >
              {episodiosPagina.loadingMore && (
                <Loader2 size={11} className="animate-spin" />
              )}
              {episodiosPagina.loadingMore ? 'Cargando...' : 'Cargar más episodios'}
            </button>
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
          {personajesPagina.error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-sm text-red-300 col-span-full">
              {personajesPagina.error}
            </div>
          ) : filteredCharacters.length === 0 ? (
            cargandoPersonajes || !personajesPagina.loaded ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center col-span-full">
                <Loader2 size={20} className="mx-auto animate-spin text-violet-400" />
                <p className="mt-3 text-sm text-zinc-500">Cargando personajes…</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center col-span-full">
                <Users size={22} className="mx-auto text-zinc-700" />
                <p className="mt-3 text-sm text-zinc-500">
                  {seasonActiva === 'all'
                    ? 'Esta serie todavía no tiene personajes publicados.'
                    : 'No hay personajes en la temporada elegida.'}
                </p>
              </div>
            )
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
                        {isExpanded
                          ? ` (${charComments.filter((c) => !c.parentId).length}${
                              hayPersonajeAnteriores ? '+' : ''
                            })`
                          : ''}
                      </span>
                      <span>{isExpanded ? 'Ocultar' : 'Ver y comentar'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-150">
                        <form
                          onSubmit={(e) => handleCharacterComment(char.id, e)}
                          className="space-y-2"
                        >
                          <div className="flex items-end gap-2">
                            <AutoGrowTextarea
                              inputRef={characterCommentRef}
                              rows={1}
                              maxHeight={160}
                              value={characterCommentText}
                              onChange={(e) => setCharacterCommentText(e.target.value)}
                              placeholder={
                                currentUser
                                  ? `¿Qué opinas de ${char.name.split(' ')[0]}?`
                                  : 'Inicia sesión para comentar...'
                              }
                              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-base text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none sm:text-xs"
                            />
                            <button
                              type="submit"
                              className="shrink-0 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                            >
                              Enviar
                            </button>
                          </div>
                          <EmojiPickerButton onElegir={insertarEmojiPersonaje} />
                        </form>

                        {hayPersonajeAnteriores && (
                          <button
                            type="button"
                            onClick={() => void cargarPersonajeAnteriores()}
                            disabled={cargandoPersonajeAnteriores}
                            className="mx-auto flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-200 disabled:opacity-60"
                          >
                            {cargandoPersonajeAnteriores && (
                              <Loader2 size={11} className="animate-spin" />
                            )}
                            {cargandoPersonajeAnteriores
                              ? 'Cargando...'
                              : 'Cargar comentarios anteriores'}
                          </button>
                        )}

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
                                          nombre={c.authorName}
                                          tamano="sm"
                                        />
                                      </div>
                                      <span className="flex-shrink-0">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-line break-words text-xs text-zinc-300">
                          <MentionText text={c.body} />
                        </p>

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
                                        className="mt-2 space-y-2"
                                      >
                                        <div className="flex items-end gap-2">
                                          <AutoGrowTextarea
                                            inputRef={charReplyRef}
                                            rows={1}
                                            maxHeight={160}
                                            value={charReplyText}
                                            onChange={(e) => setCharReplyText(e.target.value)}
                                            placeholder={`Respondiendo a ${nombreDe(
                                              c.authorId,
                                              c.authorName,
                                            )}...`}
                                            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-base text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none sm:text-xs"
                                          />
                                          <button
                                            type="submit"
                                            className="shrink-0 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
                                          >
                                            Enviar
                                          </button>
                                        </div>
                                        <EmojiPickerButton onElegir={insertarEmojiRespuestaPersonaje} />
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
                                                    nombre={r.authorName}
                                                    tamano="sm"
                                                  />
                                                </div>
                                              </div>
                                              <span className="flex-shrink-0">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="whitespace-pre-line break-words pl-5 text-zinc-300">
                          <MentionText text={r.body} />
                        </p>
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

          {personajesPagina.hasMore && (
            <button
              type="button"
              onClick={() => void personajesPagina.loadMore()}
              disabled={personajesPagina.loadingMore}
              className="chat-boton flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] py-2 text-[11px] font-bold text-zinc-400 transition-colors hover:border-pink-400/40 hover:text-white disabled:opacity-60"
            >
              {personajesPagina.loadingMore && (
                <Loader2 size={11} className="animate-spin" />
              )}
              {personajesPagina.loadingMore ? 'Cargando...' : 'Cargar más personajes'}
            </button>
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
