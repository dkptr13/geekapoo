import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Heart, Shield, ArrowRight, Tag, Star, Flame } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { NewsWidget } from '../home/NewsWidget';
import { encuadre } from '../../utils/safeData';
import { Thread } from '../../types';
interface SidebarProps {
  /** Categoría que está filtrando el feed, si hay alguna. */
  activeCategoryId?: string | null;
  onSelectCategory?: (catId: string) => void;
  onSelectThread?: (thread: Thread) => void;
  onGoToExtras?: () => void;
  onGoToAnime?: (slug: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategoryId,
  onSelectCategory,
  onSelectThread,
  onGoToExtras,
  onGoToAnime,
}) => {
  const { threads, allThreads, animes, categories } = useCommunity();
  const { usersList } = useAuth();
  const { weeklyWorks } = useSiteContent();

  // Para las categorías de código no hay contador del servidor. Se
  // unen el histórico y la página reciente (el reciente pisa al
  // histórico) para que un hilo recién creado cuente aunque
  // `allThreads` todavía esté cacheado.
  const hilosParaConteo = useMemo(() => {
    if (allThreads.length === 0) return threads;
    const porId = new Map<string, Thread>();
    allThreads.forEach((thread) => porId.set(thread.id, thread));
    threads.forEach((thread) => porId.set(thread.id, thread));
    return [...porId.values()];
  }, [allThreads, threads]);

  /**
   * Los 3 hilos destacados del DÍA: entre los publicados hoy,
   * ordenados por "me gusta" de más a menos.
   *
   * Antes esta sección sacaba los más vistos de toda la
   * historia, sin mirar fechas, y un hilo antiguo con muchos
   * likes se quedaba ahí para siempre. Al filtrar por el día,
   * el contenido se renueva solo.
   *
   * Se calcula con useMemo sobre la lista de hilos, que es
   * pequeña y ya viene del listener de Firestore: no hace
   * falta ningún temporizador ni guardar esto en el servidor.
   */
  const threadsOfTheDay = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const from = startOfToday.getTime();

    return threads
      .filter((t) => {
        const at = Date.parse(t.createdAt);
        return !Number.isNaN(at) && at >= from;
      })
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 3);
  }, [threads]);

  const featuredAnime = animes[0]; // Kaguya-sama

  // ======================================================
  // ESTRUCTURA DE LA BARRA LATERAL
  // ======================================================
  // Dos partes muy distintas a propósito:
  //
  // - El aviso de Comunidad va FUERA de la zona scrolleable.
  //   Es lo único de la barra que debe estar siempre a la
  //   vista, para recordar las normas del sitio mientras se
  //   navega por el resto.
  //
  // - Todo lo demás (Categorías, Hilos del Día, Noticias, Obras,
  //   Extras) entra en un contenedor con su propio scroll. Con
  //   el ratón sobre esa zona solo se mueve ella, no el feed.
  //
  // El <aside> es flex para poder darle "flex-1" a la zona
  // scrolleable: así hereda la altura máxima que fija
  // App.tsx en la columna menos el alto del aviso, que siempre
  // se pinta entero.
  // ======================================================

  // El <aside> ocupa toda la celda (h-full) para que la zona
  // scrolleable de dentro pueda repartir el alto que sobra con
  // flex-1. App.tsx pone esa altura como definitiva; aquí solo
  // se copia.
  return (
    <aside className="flex h-full flex-col gap-6">

      {/* Community Manifest / Respeto Mutuo. Fijo, sin scroll. */}
      <section className="relative shrink-0 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-[#0e0e17] to-[#0c0c14] p-5 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.8)]">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <Shield size={15} />
          <span>Comunidad Geekapoo</span>
        </div>
        <h3 className="text-base font-black text-white">Espacio Seguro &amp; Libre</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300">
          Un rincón sin censura para el debate honesto sobre anime, videojuegos y cultura
          geek. La única condición: el <strong>respeto mutuo</strong> entre usuarios.
        </p>
      </section>

      {/* ====================================================
          AVISO DE LA MASCOTA
      ====================================================
          Va fuera de la zona scrolleable, igual que el aviso de
          arriba, para que siga a la vista mientras se recorre el
          resto de la barra lateral.

          La imagen es un adorno: si el archivo no está, el onError
          la oculta y se queda solo el texto, sin hueco raro ni
          icono de imagen rota. */}
      <section className="shrink-0">
        <div className="flex justify-center">
          <img
            src="/img/avatar-comunidad.webp"
            alt=""
            aria-hidden="true"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            className="max-h-56 w-auto object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.55)]"
          />
        </div>

        <p className="mt-1 text-center text-xs leading-relaxed text-zinc-300">
          <strong className="text-white">¡Cuidadito con ponerse feos, eh!</strong>{' '}
          En Geekapoo todos nos tratamos con cariño. ¡Si te portas mal te hago pucheros!
        </p>
      </section>

      {/* Todo lo demás: segunda zona con scroll propio.

          "-mr-2 pr-2" deja el hueco justo para la barra de
          scroll, para que no separe las tarjetas del borde de
          la columna. */}
      <div className="panel-scroll -mr-2 min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-2">

        {/* Categorías más populares */}
        <section className="geo-panel rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-violet-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Categorías
              </h2>
            </div>
            <span className="text-[10px] text-zinc-600">hilos</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              // Las categorías fijas no tienen documento en
              // Firestore, así que no llevan contador del servidor.
              // Se cuenta sobre el histórico si ya está cargado y,
              // mientras tanto, sobre la página reciente.
              const total = cat.fixed
                ? hilosParaConteo.filter(
                    (thread) => thread.categoryId === cat.id,
                  ).length
                : cat.threadsCount ?? 0;

              const activa = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                  aria-pressed={activa}
                  title={
                    activa
                      ? `Quitar el filtro de ${cat.name}`
                      : `Filtrar los hilos por ${cat.name}`
                  }
                  className={`chat-boton group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                    activa
                      ? 'border-violet-400/50 bg-violet-500/15 text-violet-100'
                      : 'border-white/[0.06] bg-white/[0.03] text-zinc-300 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.2 font-mono text-[10px] ${
                      activa
                        ? 'bg-violet-500/25 text-violet-100'
                        : 'bg-white/[0.06] text-violet-300 group-hover:bg-violet-500/20'
                    }`}
                  >
                    {total}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Hilos destacados del día */}
        <section className="geo-panel rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-pink-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Hilos del Día
            </h2>
          </div>

          {threadsOfTheDay.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-3 py-5 text-center text-[11px] leading-relaxed text-zinc-500">
              Todavía no se ha publicado ningún hilo hoy.
              <span className="mt-1 block text-zinc-600">
                Aquí aparecerán los más gustados de cada jornada.
              </span>
            </p>
          ) : (
            <div className="space-y-3">
              {threadsOfTheDay.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread && onSelectThread(thread)}
                  className="chat-boton group w-full cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:border-violet-400/40 hover:bg-white/[0.05]"
                >
                  <h4 className="line-clamp-3 text-xs font-bold text-zinc-200 transition-colors group-hover:text-violet-300">
                    {thread.title}
                  </h4>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="max-w-[120px] truncate">
                      {usersList.find((u) => u.uid === thread.authorId)?.displayName ||
                        thread.authorName}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-semibold text-pink-400">
                      <Heart size={11} className="fill-pink-500 text-pink-500" />
                      {thread.likesCount}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Ver hilo completo</span>
                    <ArrowRight size={11} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Últimas noticias de anime. Va aquí, entre los hilos y la
            obra de la semana, y no en el feed: son datos de fuera que
            envejecen solos, no contenido que crea la comunidad. */}
        <NewsWidget />

        {/* Extras / Personaje de la semana */}
        {featuredAnime && (
        <section className="geo-panel overflow-hidden rounded-2xl border shadow-[0_16px_48px_-20px_rgba(0,0,0,0.8)]">
          <div className="relative h-28 w-full">
            <QuickImageEditor
              section="animes"
              itemId={featuredAnime.id}
              field="coverUrl"
              label={`Portada de ${featuredAnime.title}`}
              src={featuredAnime.coverUrl}
              alt={`Portada de ${featuredAnime.title}`}
              containerClassName="h-full w-full"
              className="h-full w-full object-cover"
              imgStyle={encuadre(featuredAnime.coverFocus)}
              badgeClassName="top-2 right-2"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-[#0c0c14]/40 to-transparent" />
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-950/40">
              <Star size={11} className="fill-white" />
              Obra de la Semana
            </span>
          </div>

            <div className="p-4">
              <h4 className="text-sm font-bold text-white">{featuredAnime.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                {featuredAnime.synopsis}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onGoToAnime && onGoToAnime(featuredAnime.slug)}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-400 transition-colors hover:text-violet-300"
                >
                  <span>Ver ficha y capítulos</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Obras de la semana */}
        {weeklyWorks.length > 0 && (
        <section className="geo-panel rounded-2xl border p-5">
          <div className="mb-4 flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Obras de la Semana
            </h2>
          </div>

          <ul className="space-y-3">
            {weeklyWorks.map((work) => (
              <li key={work.id}>
                {work.imageUrl ? (
                  <div className="mb-2 aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <img
                      src={work.imageUrl}
                      alt={work.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-bold text-zinc-200">
                        {work.title}
                      </h4>
                      {work.author && (
                        <p className="truncate text-[10px] text-zinc-500">{work.author}</p>
                      )}
                    </div>

                    {work.score > 0 && (
                      <span className="flex-shrink-0 rounded-md bg-orange-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">
                        {work.score}
                      </span>
                    )}
                  </div>

                  {work.badge && (
                    <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">
                      {work.badge}
                    </span>
                  )}

                  {work.synopsis && (
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-zinc-400">
                      {work.synopsis}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-dashed border-violet-400/25 bg-violet-500/5 p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Sparkles size={16} />
          </div>
          <h4 className="text-xs font-bold text-violet-200">Curiosidades &amp; Extras</h4>
          <p className="mt-1 text-[11px] text-zinc-400">
            Descubre trivias, datos de seiyuus y curiosidades de producción anime.
          </p>
          <button
            onClick={onGoToExtras}
            className="chat-boton mt-3 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110"
          >
            <span>Explorar Extras</span>
            <ArrowRight size={12} />
          </button>
        </section>

      </div>
    </aside>
  );
};
