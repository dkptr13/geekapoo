import React from 'react';
import { Users, Star, LayoutGrid, Quote, Calendar, Heart } from 'lucide-react';

import type { Anime, User } from '../../types';

// ======================================================
// VITRINAS NUEVAS (las fijas ya existían)
// ======================================================
//
// Cada vitrina es un bloque independiente que el dueño añade,
// ordena y quita desde el editor. Si no hay datos (sin
// personajes, sin colección...), no se pinta nada: una vitrina
// vacía es ruido.
//
// Las de logros y destacadas ya existían (`ProfileMedals` y
// `ProfileFeatured`) y se reutilizan tal cual. Las de nivel,
// estadísticas, actividad y contenido son fijas y no son
// vitrinas: son la identidad del perfil, como la cabecera fija
// de Steam.

/** Personajes favoritos: rejilla con imagen, nombre y serie. */
export const VitrinaPersonajes: React.FC<{ perfil: User }> = ({ perfil }) => {
  const lista = (perfil.favoriteCharacters ?? []).filter((p) => p?.name?.trim());
  if (lista.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Users size={16} className="text-violet-300" />
        Personajes favoritos
        <span className="font-mono text-xs font-normal text-zinc-500">{lista.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {lista.map((p, i) => (
          <div key={`${p.name}-${i}`} className="min-w-0 text-center">
            <div className="aspect-square overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl text-zinc-600">
                  ?
                </span>
              )}
            </div>
            <p className="mt-1.5 truncate text-[11px] font-bold text-zinc-200">{p.name}</p>
            {p.serie?.trim() && (
              <p className="truncate text-[10px] text-zinc-500">{p.serie}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

/** Personaje principal: tarjeta grande con descripción. */
export const VitrinaPrincipal: React.FC<{ perfil: User }> = ({ perfil }) => {
  const pj = perfil.favoriteCharacter?.name?.trim() ? perfil.favoriteCharacter : null;
  if (!pj) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Star size={16} className="text-amber-300" />
        Personaje principal
      </h2>
      <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 sm:flex-row">
        {pj.imageUrl ? (
          <img
            src={pj.imageUrl}
            alt={pj.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="h-36 w-36 flex-shrink-0 self-center rounded-2xl object-cover ring-2 ring-white/10 sm:self-start"
          />
        ) : (
          <span className="flex h-36 w-36 flex-shrink-0 items-center justify-center self-center rounded-2xl border border-dashed border-white/[0.06] text-3xl text-zinc-600 sm:self-start">
            ?
          </span>
        )}
        <div className="min-w-0 text-center sm:text-left">
          <h3 className="text-lg font-black text-white">{pj.name}</h3>
          {pj.desc?.trim() ? (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{pj.desc}</p>
          ) : (
            <p className="mt-1.5 text-xs italic text-zinc-600">
              El personaje favorito de{' '}
              {perfil.displayName || perfil.username || 'Usuario'}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

/** Colección: series a las que dio Me gusta (opt-in al poner la vitrina). */
export const VitrinaColeccion: React.FC<{
  perfil: User;
  animes: Anime[];
  onGoToAnime?: (slug: string) => void;
}> = ({ perfil, animes, onGoToAnime }) => {
  const suyos = animes
    .filter((a) => a.likedBy?.includes(perfil.uid))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));
  if (suyos.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <LayoutGrid size={16} className="text-violet-300" />
        Colección
        <span className="font-mono text-xs font-normal text-zinc-500">{suyos.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {suyos.slice(0, 12).map((anime) => (
          <button
            key={anime.id}
            type="button"
            onClick={() => onGoToAnime?.(anime.slug || anime.id)}
            disabled={!onGoToAnime}
            title={anime.title}
            className="group min-w-0 text-left disabled:cursor-default"
          >
            <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
              {anime.coverUrl ? (
                <img
                  src={anime.coverUrl}
                  alt={anime.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl text-zinc-600">
                  ?
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-tight text-zinc-200 group-hover:text-violet-300">
              {anime.title}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
              {anime.rating > 0 && (
                <span className="flex items-center gap-0.5 font-semibold text-amber-300">
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
              <span className="ml-auto flex items-center gap-0.5 font-semibold text-pink-300">
                <Heart size={9} className="fill-pink-500 text-pink-500" />
                {anime.likesCount}
              </span>
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

/** Texto personal: la bio como tarjeta propia. */
export const VitrinaTexto: React.FC<{ perfil: User }> = ({ perfil }) => {
  const bio = (perfil.bio ?? '').trim();
  const anime = (perfil.favoriteAnime ?? '').trim();
  if (!bio && !anime) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <Quote size={16} className="text-violet-300" />
        Sobre mí
      </h2>
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5">
        {bio && <p className="text-sm leading-relaxed text-zinc-200">{bio}</p>}
        {anime && (
          <p className="mt-2 text-xs text-zinc-500">
            Serie favorita: <span className="font-semibold text-zinc-300">{anime}</span>
          </p>
        )}
      </div>
    </section>
  );
};
