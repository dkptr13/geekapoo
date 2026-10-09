import React, { useState } from 'react';
import { Gift, Heart, Sparkles, Film, Music, Mic, BookOpen, Share2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { TriviaExtra } from '../../types';

export const ExtrasView: React.FC = () => {
  const { currentUser } = useAuth();
  const { triviaExtras, toggleTriviaLike } = useCommunity();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (trivia: TriviaExtra) => {
    navigator.clipboard.writeText(`Curiosidad geekapoo: ${trivia.title} - ${trivia.fact}`);
    setCopiedId(trivia.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-violet-950/40 p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
          <Sparkles size={13} />
          <span>Contenido Especial de la Comunidad</span>
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
          Extras, Curiosidades & Galería
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
          Secretos de producción, curiosidades de doblaje, récords históricos y anécdotas fascinantes de tus series y personajes favoritos seleccionados por el equipo de geekapoo.
        </p>
      </div>

      {/* Grid of Trivia cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        {triviaExtras.map((item) => {
          const isLiked = currentUser ? item.likedBy?.includes(currentUser.uid) : false;
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 flex flex-col justify-between hover:border-violet-500/40 transition-all shadow-lg"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                  <span className="absolute top-3 left-3 rounded-lg bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1 text-[11px] font-bold text-violet-300 backdrop-blur-md">
                    {item.category}
                  </span>
                  <span className="absolute bottom-3 left-3 text-xs font-semibold text-zinc-300">
                    {item.characterOrAnime}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                    {item.fact}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/50 p-4">
                <button
                  onClick={() => toggleTriviaLike(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isLiked
                      ? 'border-pink-500/40 bg-pink-500/10 text-pink-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart size={14} className={isLiked ? 'fill-pink-500 text-pink-500' : ''} />
                  <span>{isLiked ? '¡Me encanta!' : 'Curioso'}</span>
                  <span className="font-mono text-zinc-500 ml-1">({item.likes})</span>
                </button>

                <button
                  onClick={() => handleShare(item)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Compartir dato</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
