import React, { startTransition, useEffect, useRef, useState } from 'react';
import { pageview } from '@vercel/analytics';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { RegionPreferenceProvider } from './context/RegionPreferenceContext';
import { StreamingCatalogProvider } from './context/StreamingCatalogContext';

import {
  CommunityProvider,
} from './context/CommunityContext';

import {
  ChatProvider,
} from './context/ChatContext';

import {
  ClubsProvider,
} from './context/ClubsContext';

import { SiteContentProvider } from './context/SiteContentContext';
import { ProgressionProvider } from './context/ProgressionContext';
import { KapoProvider } from './context/KapoContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { FollowsProvider } from './context/FollowsContext';
import { AchievementsView } from './components/gamification/AchievementsView';
import { ProgressionToasts } from './components/gamification/ProgressionToasts';

import Navbar from './components/layout/Navbar';

import { Sidebar } from './components/layout/Sidebar';
import { HomeFeed } from './components/home/HomeFeed';
import { AnimeWiki } from './components/wiki/AnimeWiki';
import { ChatView } from './components/chat/ChatView';
import { SupportView } from './components/support/SupportView';
import { ExtrasView } from './components/extras/ExtrasView';
import { ProfileView } from './components/profile/ProfileView';
import { AccountSettings } from './components/profile/AccountSettings';
import { OtakuMascot } from './components/mascot/OtakuMascot';
import { DailyTriviaView } from './components/trivia/DailyTriviaView';
import { AuthModal } from './components/auth/AuthModal';
import { ArchitectureModal } from './components/docs/ArchitectureModal';

import { AdminPanel } from './components/admin/AdminPanel';

import { slugDeRuta, useQueryState, useQueryStateBatch } from './hooks/useQueryState';

import { Thread } from './types';

import { Code2 } from 'lucide-react';


// ======================================================
// CONTENIDO PRINCIPAL
// ======================================================

const MainAppContent: React.FC = () => {

const {
  currentUser,
  loading,
  canManage,
} = useAuth();

  // Ruta actual. Es lo que distingue una ficha de anime
  // ("/anime/xxx") del resto de secciones ("/?tab=xxx").
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const enFichaAnime = slugDeRuta(pathname) !== null;

  // Compatibilidad con enlaces antiguos. Notificaciones, reportes y
  // marcadores guardados siguen usando "?tab=wiki&anime=<id>": se
  // reescriben a la ruta nueva en cuanto se abren, sin recargar y
  // sin perder el anime que se estaba mirando.
  useEffect(() => {
    if (pathname !== '/') return;

    const slug = new URLSearchParams(search).get('anime');
    if (!slug) return;

    navigate(`/anime/${encodeURIComponent(slug)}`, { replace: true });
  }, [pathname, search, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  const [
    currentTabParam,
    setTabParam,
  ] = useQueryState('tab', 'inicio');

  /**
   * Cambia de pestaña y limpia lo que colgaba de la anterior.
   *
   * Lo de `usuario` importa: si estabas viendo el perfil de otra
   * persona y luego entras en "Chats" y vuelves a "Mi perfil", el
   * enlace de la cabecera pone la pestaña pero no toca el usuario,
   * y te pondría en el perfil de aquella otra persona sin previo
   * aviso. Por eso todo cambio de pestaña borra el usuario.
   *
   * Va en transición para que el botón responda al instante: montar
   * la pestaña nueva (feed, wiki, chat) es un render pesado y sin
   * esto el clic se queda "pegado" hasta que termina, que en móvil
   * se siente como botones con delay. Con la transición, el menú
   * cierra y la pestaña vieja sigue viva hasta que la nueva está
   * lista.
   */
  const setCurrentTab = (tab: string) => {
    startTransition(() => {
      setUrl({ tab, usuario: null });
    });
  };

  // "?tab=buscar" ya no existe: el buscador se fusionó dentro de la
  // wiki. Los enlaces guardados de antes (marcadores, enlaces
  // compartidos) se redirigen allí en vez de mostrar una página en
  // blanco, porque no hay ninguna sección que case con ese nombre.
  //
  // Una ficha de anime no lleva "tab": la ruta "/anime/<slug>" ya
  // dice que es la wiki. Sin esto, la barra de navegación marcaría
  // "Inicio" mientras se está viendo un anime.
  const currentTab = enFichaAnime
    ? 'wiki'
    : currentTabParam === 'buscar'
      ? 'wiki'
      : currentTabParam;

  // Analítica: cada cambio de sección cuenta como una página vista,
  // para saber qué partes se usan de verdad. El pageview inicial ya
  // lo manda `inject()` desde main.tsx, así que el primer render se
  // salta para no contarlo dos veces.
  const tabAnterior = useRef<string | null>(null);
  useEffect(() => {
    if (tabAnterior.current === null) {
      tabAnterior.current = currentTab;
      return;
    }
    if (tabAnterior.current === currentTab) return;
    tabAnterior.current = currentTab;
    pageview({ path: `/?tab=${currentTab}` });
  }, [currentTab]);

  // Estos dos también se guardan. Sin esto, recargar cuando se
  // estaba viendo un anime concreto de la wiki, o filtrando el
  // feed por una categoría, devuelve a la portada: se pierde
  // justo la razón por la que se había ido a ese sitio.
  //
  // Solo se leen aquí. Para cambiarlos está setUrl, más abajo, que
  // escribe varias claves de golpe; con un setter suelto, escribir
  // "tab" y "anime" a la vez no funciona.
  const [selectedCategoryFilter] = useQueryState('categoria', '');
  const [selectedAnimeSlug] = useQueryState('anime', '');

  /**
   * Escribe varios parámetros de la URL de una vez.
   *
   * Todos los "ir a..." hacen falta para moverse a otra sección Y
   * para decir a qué, y eso son dos claves. Con dos llamadas
   * seguidas a useQueryState la segunda se come la primera: al
   * pulsar un anime se escribía "tab=wiki" pero se perdía
   * "anime=...", y en vez de abrirse la ficha se abría el
   * catálogo. Ver useQueryStateBatch.
   */
  const setUrl = useQueryStateBatch();

  // El modal de arquitectura también se recuerda abierto. Es un
  // detalle pequeño, pero es de los que más gente usa: se abre
  // para copiar un dato y recargar sin querer.
  const [archParam, setArchParam] = useQueryState('arquitectura', '0');
  const architectureOpen = archParam === '1';
  const setArchitectureOpen = (open: boolean) => setArchParam(open ? '1' : '0');

  // A quién se está mirando en el perfil.
  //
  // Vacío significa "el tuyo"; cualquier otro uid es el de otra
  // persona, y `ProfileView` enseña solo su parte pública.
  //
  // No hace falta un setter aquí: quien pone el valor es
  // `useGoToProfile`, que escribe la URL entera desde el hook. Este
  // solo lee. Y quien lo borra es `setCurrentTab`, de más abajo.
  const [usuarioParam] = useQueryState('usuario', '');

  // Qué tiene que hacer el perfil al montarse: abrir el editor
  // ('editar') o bajar a los ajustes ('ajustes'). Lo escribe el
  // menú de cuenta de la barra, en la misma operación que pone
  // `tab=perfil`, y lo consume `ProfileView` una sola vez (luego
  // lo borra de la URL para no reabrirlo al volver).
  const [accionParam] = useQueryState('accion', '');

  // Hilo y comentario a los que hay que saltar, si vienen en la URL.
  //
  // Es lo que usan los avisos de la campana y el "ver en su sitio"
  // del panel de reportes. Antes `?hilo=` no lo leía nadie: se
  // escribía en la barra de direcciones y no pasaba nada, que es
  // el mismo bug que el `CustomEvent` que la campana disparaba al
  // vacío.
  const [hiloParam] = useQueryState('hilo', '');
  const [comentarioParam] = useQueryState('comentario', '');

  // Cada pulsación de "Buscar" incrementa este contador, y la wiki
  // lo usa para ponerse el cursor en el buscador. Es un contador y
  // no un booleano porque así dos pulsaciones seguidas funcionan
  // las dos.
  const [searchFocusToken, setSearchFocusToken] = useState(0);


  // ====================================================
  // SELECCIONAR CATEGORÍA
  // ====================================================

  const handleSelectCategory = (
    catId: string
  ) => {
    setUrl({ tab: 'inicio', categoria: catId || null });
  };


  // ====================================================
  // IR A ANIME
  // ====================================================

  const handleGoToAnime = (
    slug: string
  ) => {
    // Se cierra la búsqueda: si se viene de un resultado y se abre
    // una serie, la ficha tiene que verse, no los resultados.
    setUrl({ tab: 'wiki', anime: slug, q: null });
  };


  // ====================================================
  // IR A HILO / COMENTARIO
  // ====================================================
  //
  // HomeFeed es quien sabe abrir un hilo y desplazar hasta un
  // comentario, así que quien navega (el buscador, el perfil, la
  // campana de notificaciones) solo tiene que dejarle dicho a dónde
  // ir.
  //
  // El destino sale de la URL (`?hilo=...&comentario=...`) y no de
  // un useState, por dos razones:
  //
  //   · Los avisos de la campana se abren escribiendo la URL desde
  //     `useGoToNotification`, así que recargar un aviso deja el
  //     hilo abierto en vez de devolverte al feed.
  //   · El panel de reportes ya escribía `?hilo=` a mano y no lo
  //     leía nadie: el enlace no llevaba a ninguna parte.
  //
  // El contador "nonce" está para que pulsar dos veces sobre el MISMO
  // hilo vuelva a disparar el efecto. Sin él, la segunda vez la URL
  // no cambiaría, ninguna dependencia se movería, y el hilo ni se
  // abriría ni se desplazaría.
  const [focusNonce, setFocusNonce] = useState(0);

  useEffect(() => {
    if (!hiloParam) return;
    setFocusNonce((n) => n + 1);
  }, [hiloParam, comentarioParam]);

  const focusTarget = hiloParam
    ? {
        threadId: hiloParam,
        commentId: comentarioParam || undefined,
        nonce: focusNonce,
      }
    : null;

  /**
   * Consume el destino una vez llegado: borra `hilo` y
   * `comentario` de la URL para que volver a inicio (o
   * remontar el feed) no repita el salto. Igual que el
   * `accion` del perfil: de un solo uso.
   *
   * Recargar ANTES de llegar conserva el destino (los
   * parámetros siguen ahí hasta que el salto se completa), y
   * pulsar el mismo aviso otra vez lo repone y vuelve a
   * funcionar por el `nonce`.
   */
  const limpiarFoco = () => {
    setUrl({ hilo: null, comentario: null });
  };

  const goToThread = (
    threadId: string,
    commentId?: string,
  ) => {
    // Al saltar a un hilo concreto, cualquier filtro de
    // categoría previo podría ocultarlo.
    setUrl({
      tab: 'inicio',
      categoria: null,
      hilo: threadId,
      comentario: commentId ?? null,
    });
  };

  const handleSelectThread = (
    thread: Thread,
  ) => {
    goToThread(thread.id);
  };


  return (
    <div className="min-h-screen bg-[#080810] text-zinc-100 flex flex-col">

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => {
          // Siempre a la wiki, y con el buscador vacío y el cursor
          // dentro: entrar a la wiki escribiendo es de lo que se
          // trata, no entrar y tener que pinchar en la barra.
          setUrl({ tab: 'wiki', q: null });
          setSearchFocusToken((n) => n + 1);
        }}
        onOpenArchitecture={() =>
          setArchitectureOpen(true)
        }
      />


      {/* ==================================================
          CONTENIDO PRINCIPAL
      ================================================== */}

      {/* ====================================================
          CONTENEDOR PRINCIPAL
      ====================================================
      Antes estaba fijo en max-w-7xl (1280px), así que en un
      monitor grande sobraban cientos de píxeles a los lados
      sin aprovecharlos. Ahora crece con la ventana hasta
      1900px y a partir de ahí se centra, que es lo que se
      espera en pantallas panorámicas.

      El Navbar usa exactamente el mismo ancho: si no, el logo
      y el contenido quedarían desalineados.
      ==================================================== */}
      <main className="flex-1 mx-auto w-full max-w-[1900px] px-4 py-6 sm:px-6">

        {/* ================================================
            INICIO
        ==================================================
        Hay DOS zonas con scroll propio, y solo dos:

          1. La página entera (hilos, footer, cabecera): se
             comporta como una web normal.
          2. La parte de abajo de la barra lateral
             (Categorías, Hilos del Día, Obras...).

        Lo único que no se mueve nunca es el aviso de
        "Comunidad Geekapoo", que va con position: sticky dentro
        de la columna: se queda clavado arriba mientras se
        desplaza el resto de la barra lateral.
        ================================================== */}

        {currentTab === 'inicio' && (
          /* `grid-cols-1` no es decorativo: sin una plantilla explícita,
             en móvil la columna implícita se dimensiona con el
             min-content de su contenido. Una encuesta con una opción
             larga (el texto va con `truncate`) pedía 508px y arrastraba
             toda la página a scroll horizontal: las tarjetas se cortaban
             por la derecha y la cabecera dejaba de cubrir el ancho.
             `grid-cols-1` usa minmax(0, 1fr), así que la columna mide
             el ancho disponible y el texto largo se recorta dentro de
             su tarjeta, no de la página. */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">

            {/* FEED CENTRAL.
                En pantallas muy anchas pasa a 9/12 para que el
                feed aproveche más y la barra lateral siga
                pareciéndose a una barra lateral, no a una
                columna gigante.

                Sin scroll propio: forma parte de la página, así
                que se desplaza con ella. */}
            <div className="min-w-0 lg:col-span-8 2xl:col-span-9">

              <HomeFeed
                selectedCategoryFilter={
                  selectedCategoryFilter
                }

                focusTarget={focusTarget}

                onLimpiarFoco={limpiarFoco}

                onClearCategoryFilter={() =>
                  setUrl({ categoria: null })
                }

                onGoToAnime={
                  handleGoToAnime
                }
              />

            </div>


            {/* SIDEBAR
                Es la segunda zona con scroll propio.

                La altura va AQUÍ, en la celda de la rejilla, y no
                en el <aside>: tiene que ser una altura
                DEFINITIVA (h-) para que el "h-full" de dentro
                pueda resolverse. Con solo un "max-h-" en el
                padre, el porcentaje del hijo resuelve a auto,
                el <aside> crecía sin tope y las tarjetas se
                salían del contenedor.

                Los 6rem son la altura del Navbar más 1rem de
                aire. "dvh" y no "vh" porque en móvil la barra de
                direcciones encoge y crece al hacer scroll, y vh
                mide mal entonces.

                El "sticky" va en la celda y no en el <aside>
                porque sticky se limita a la altura de su
                contenedor: pegado al <aside>, que es justo lo
                que hay que mover, no tenía recorrido. */}
            <div className="min-w-0 lg:sticky lg:top-20 lg:col-span-4 lg:h-[calc(100dvh-6rem)] 2xl:col-span-3">

              <Sidebar
                onSelectCategory={
                  handleSelectCategory
                }

                onSelectThread={
                  handleSelectThread
                }

                onGoToExtras={() =>
                  setCurrentTab('extras')
                }

                onGoToAnime={
                  handleGoToAnime
                }
              />

            </div>

          </div>
        )}


        {/* ================================================
            WIKI + BUSCADOR
        ==================================================
        El buscador global se fusionó aquí dentro: ya no hay una
        pestaña "Buscar" aparte, la búsqueda va en la franja
        superior de la wiki y los resultados salen en el mismo
        sitio que el catálogo. */}

        {currentTab === 'wiki' && (
          <AnimeWiki
            initialAnimeSlug={
              selectedAnimeSlug
            }

            onSelectThread={
              handleSelectThread
            }

            searchFocusToken={
              searchFocusToken
            }
          />
        )}




        {/* ================================================
            SOPORTE
        ================================================= */}

        {currentTab === 'soporte' && (
          <SupportView />
        )}


        {/* ================================================
            EXTRAS
        ================================================= */}

        {currentTab === 'extras' && (
          <ExtrasView />
        )}


        {/* ================================================
            CHATS
        ================================================= */}

        {currentTab === 'chats' && (
          currentUser ? (
            <ChatView />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">

                <h2 className="text-xl font-bold text-white">
                  Acceso restringido
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Debes iniciar sesión para acceder a los chats.
                </p>

              </div>
            </div>
          )
        )}


        {/* ================================================
            PERFIL
        ================================================= */}

        {currentTab === 'perfil' && (
          currentUser ? (
            <ProfileView
              onGoToThread={goToThread}
              onGoToAnime={handleGoToAnime}
              userId={usuarioParam || undefined}
              accionInicial={accionParam || undefined}
              onAccionConsumida={() => setUrl({ accion: null })}
            />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">

                <h2 className="text-xl font-bold text-white">
                  Inicia sesión
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Debes iniciar sesión para ver tu perfil.
                </p>

              </div>
            </div>
          )
        )}


        {/* ================================================
            CONFIGURACIÓN DE LA CUENTA
        =================================================
        Apartado propio (ya no vive al final del perfil): solo
        con sesión, como el perfil. Cada usuario solo ve la
        suya, porque `AccountSettings` lee de `currentUser`. */}

        {currentTab === 'ajustes' && (
          currentUser ? (
            <div className="mx-auto max-w-3xl 2xl:max-w-4xl">
              <AccountSettings />
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">

                <h2 className="text-xl font-bold text-white">
                  Inicia sesión
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Debes iniciar sesión para ver tu configuración.
                </p>

              </div>
            </div>
          )
        )}


        {/* ================================================
            LOGROS
        =================================================
            El catálogo de medallas. Lleva su propio
            ProgressionProvider porque el de la app sigue al
            usuario de la sesión y esta vista se monta
            independiente (así el mismo componente sirve para
            enseñarle los logros a otro usuario). */}

        {currentTab === 'logros' && <AchievementsView />}

        {/* ================================================
            TRIVIA DIARIA
        ================================================= */}
        {/* Va con su propio ProgressionProvider porque esta
            página necesita el progreso del usuario para enseñar
            el XP ganado y la racha, igual que la de logros. */}

        {currentTab === 'trivia' && <DailyTriviaView />}


        {/* ================================================
            PANEL DE ADMINISTRACIÓN
        ================================================= */}

        {currentTab === 'admin' && (
          canManage ? (
            <AdminPanel />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">

                <h2 className="text-xl font-bold text-red-300">
                  Acceso denegado
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  No tienes permisos para acceder al panel de administración.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentTab('inicio')
                  }
                  className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  Volver al inicio
                </button>

              </div>

            </div>
          )
        )}

      </main>


      {/* ==================================================
          MASCOTA
      =================================================== */}
      {/* Va dentro de `KapoProvider` para que el texto y el
          humor los decida el contexto (qué sección es, si
          subió de nivel, si hay trivia nueva) en vez de este
          archivo. El provider va aquí y no arriba porque
          necesita ir dentro del `BrowserRouter`: usa
          `useNavigate` para los botones de acceso rápido. */}

      <KapoProvider currentSection={currentTab}>
        <OtakuMascot currentSection={currentTab} />
      </KapoProvider>


      {/* ==================================================
          AVISOS DE PROGRESIÓN
      ==================================================
          Montados aquí, y no dentro de cada vista, para que
          salgan estén donde estén: subir de nivel no depende
          de estar mirando el perfil. */}
      <ProgressionToasts />


      {/* ==================================================
          MODAL AUTENTICACIÓN
      ================================================== */}

      <AuthModal />


      {/* ==================================================
          MODAL ARQUITECTURA
      ================================================== */}

      <ArchitectureModal
        isOpen={architectureOpen}
        onClose={() =>
          setArchitectureOpen(false)
        }
      />


      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="border-t border-white/[0.06] bg-[#07070d] py-8 text-xs text-zinc-500">

        <div className="mx-auto max-w-[1900px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <span className="font-black text-white text-sm">
              geekapoo.es
            </span>

            <span>—</span>

            <span>
              Espacio libre y respetuoso para la comunidad otaku y geek.
            </span>

          </div>


          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                setArchitectureOpen(true)
              }
              className="flex items-center gap-1.5 text-violet-300 hover:text-violet-200 font-semibold transition-colors"
            >
              <Code2 size={13} />

              <span>
                Ver Especificación Técnica & DB
              </span>
            </button>


            <span>•</span>


            <button
              type="button"
              onClick={() =>
                setCurrentTab('soporte')
              }
              className="hover:text-zinc-300 transition-colors"
            >
              Soporte
            </button>


            <span>•</span>


            <button
              type="button"
              onClick={() =>
                setCurrentTab('wiki')
              }
              className="hover:text-zinc-300 transition-colors"
            >
              Wiki
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
};


// ======================================================
// APP
// ======================================================

 // ✅ ASÍ DEBE QUEDAR — todo dentro de BrowserRouter
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';

// `FollowingUidProvider` es un `FollowsProvider` con el uid del
// usuario que se está mirando en la URL.
//
// Va AQUÍ y no dentro de `MainAppContent` por una razón concreta:
// el provider necesita el uid, y ese uid lo lee `MainAppContent`
// de la URL. Si el provider estuviera dentro, tendría que ir
// dentro de `MainAppContent`, y entonces quedaría debajo de
// `ProfileView`, que es quien lo usa: el contexto no existaría
// cuando el perfil se monta.
//
// La separación es la misma que ya usa el proyecto con
// `ProgressionProvider` (que va arriba) y `ProfileView` (que lo
// consume): el contexto se declara arriba y recibe el uid
// por propiedad desde donde se sabe.
//
// `null` cuando no se está mirando a nadie (está en la portada),
// y entonces no se escucha nada: cero suscripciones.
//
// Ojo al orden de los providers: `FollowsProvider` necesita
// `currentUser` de `AuthProvider`, así que tiene que ir debajo. Y
// `MainAppContent` lo consume, así que tiene que ir encima.
function FollowingUidProvider({ children }: { children: React.ReactNode }) {
  const [usuarioParam] = useQueryState('usuario', '');
  const { currentUser } = useAuth();

  // Sin `usuario` en la URL se está mirando el perfil PROPIO, y
  // entonces lo que hay que escuchar es el documento de uno mismo.
  //
  // Antes se pasaba `null` y el perfil enseñaba "—" en los dos
  // contadores con siempre: el que mira su propio perfil es el
  // primero que quiere ver cuántos seguidores tiene, y es
  // justo el caso que no funcionaba.
  const uid = usuarioParam || currentUser?.uid || null;

  return <FollowsProvider uid={uid}>{children}</FollowsProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RegionPreferenceProvider>
          <StreamingCatalogProvider>
            <CommunityProvider>
              <ChatProvider>
                <ClubsProvider>
                  <ProgressionProvider>
                    <NotificationsProvider>
                      <SiteContentProvider>
                        <FollowingUidProvider>
                          <MainAppContent />
                        </FollowingUidProvider>
                      </SiteContentProvider>
                    </NotificationsProvider>
                  </ProgressionProvider>
                </ClubsProvider>
              </ChatProvider>
            </CommunityProvider>
          </StreamingCatalogProvider>
        </RegionPreferenceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
