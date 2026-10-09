import { useMemo } from 'react';
import type { FC } from 'react';
import { Sparkles, Play, Star, Calendar, Shuffle, Layers } from 'lucide-react';

import { ALL_ANIME_CATEGORIES, animeCategories, normalize } from '../../data/animeCategories';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { encuadre } from '../../utils/safeData';
import type { Anime } from '../../types';
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
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
  onSelectAnime: (id: string) => void;
}

const CatalogBrowser: FC<CatalogBrowserProps> = ({
  animes,
  selectedCategory,
  onSelectCategory,
  onSelectAnime,
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
    if (visible.length === 0) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    onSelectAnime(pick.id);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ==================================================
          LA CHICA, A LA IZQUIERDA
      ==================================================
          Es lo primero que se ve al entrar en la wiki. Va sin
          tarjeta ni fondo: es una ilustración sobre el fondo de
          la página, no un panel. Con el borde y el degradado
          parecía un recuadro más del panel, y tapaba hueco
          además de Dani. */}
      <aside className="lg:col-span-4 xl:col-span-3">
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

            {visible.length > 0 && (
              <button
                onClick={pickRandom}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500"
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
      <div className="space-y-8 lg:col-span-8 xl:col-span-9">
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
              className="rounded-lg bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
          SERIES DE LA CATEGORÍA ELEGIDA
      ================================================== */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-white">
            {activeCategory ? activeCategory.name : 'Todo el catálogo'}
          </h2>
          <span className="text-[11px] text-zinc-500">
            {visible.length === 1 ? '1 serie' : `${visible.length} series`}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
            <Layers size={24} className="mx-auto text-zinc-700" />
            <p className="mt-3 text-sm text-zinc-500">
              Todavía no hay ninguna serie en esta categoría.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Se añaden desde el panel de administración.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((anime) => (
              <button
                key={anime.id}
                onClick={() => onSelectAnime(anime.id)}
                className="group text-left"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
                  {anime.episodesCount > 0 && (
                    <span>{anime.episodesCount} eps</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
};

export default CatalogBrowser;
