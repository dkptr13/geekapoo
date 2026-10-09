import React, { useState } from 'react';
import {
  Search,
  Tv,
  Film,
  Users,
  MessageSquare,
  Tag,
  ArrowRight,
  Frown,
  Sparkles,
  X,
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { anyMatches, matchesText as matches, toText } from '../../utils/safeData';
import { Anime, Character, Episode, Thread } from '../../types';

interface GlobalSearchProps {
  onSelectAnime?: (slug: string) => void;
  onSelectThread?: (thread: Thread) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSelectAnime,
  onSelectThread,
}) => {
  const { animes, episodes, characters, threads } = useCommunity();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'anime' | 'episodes' | 'characters' | 'threads' | 'tags'
  >('all');

  const cleanQuery = query.trim().toLowerCase();

  // Search in Animes
  const matchedAnimes = cleanQuery
    ? animes.filter(
        (a) =>
          matches(a.title, cleanQuery) ||
          matches(a.synopsis, cleanQuery) ||
          anyMatches(a.genres, cleanQuery) ||
          matches(a.category, cleanQuery)
      )
    : [];

  // Search in Episodes
  const allEpisodes: Episode[] = Object.values(episodes).flat();
  const matchedEpisodes = cleanQuery
    ? allEpisodes.filter(
        (ep) =>
          matches(ep.title, cleanQuery) || matches(ep.description, cleanQuery)
      )
    : [];

  // Search in Characters
  const allCharacters: Character[] = Object.values(characters).flat();
  const matchedCharacters = cleanQuery
    ? allCharacters.filter(
        (c) =>
          matches(c.name, cleanQuery) ||
          matches(c.description, cleanQuery) ||
          anyMatches(c.tags, cleanQuery)
      )
    : [];

  // Search in Threads
  const matchedThreads = cleanQuery
    ? threads.filter(
        (t) =>
          matches(t.title, cleanQuery) ||
          matches(t.body, cleanQuery) ||
          anyMatches(t.tags, cleanQuery)
      )
    : [];

  const totalResults =
    matchedAnimes.length +
    matchedEpisodes.length +
    matchedCharacters.length +
    matchedThreads.length;

  return (
    <div className="space-y-6">
      {/* Search Header and Input */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl mx-auto 2xl:max-w-5xl space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Search size={24} />
          </div>

          <h2 className="text-2xl font-black text-white">
            Buscador Global Geekapoo
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Encuentra animes, episodios individuales, personajes destacados, hilos de debate o etiquetas de la comunidad.
          </p>

          <div className="relative mt-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe por ejemplo: Kaguya, Frieren, Chika, Edgerunners, Seiyuu..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 py-3.5 pl-11 pr-11 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none shadow-inner"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Todos los resultados
            </button>
            <button
              onClick={() => setFilterType('anime')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === 'anime'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Animes ({matchedAnimes.length})
            </button>
            <button
              onClick={() => setFilterType('episodes')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === 'episodes'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Episodios ({matchedEpisodes.length})
            </button>
            <button
              onClick={() => setFilterType('characters')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === 'characters'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Personajes ({matchedCharacters.length})
            </button>
            <button
              onClick={() => setFilterType('threads')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === 'threads'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Hilos del foro ({matchedThreads.length})
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {cleanQuery && totalResults > 0 ? (
        <div className="space-y-6">
          {/* Animes Section */}
          {(filterType === 'all' || filterType === 'anime') && matchedAnimes.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Tv size={14} />
                <span>Animes Encontrados ({matchedAnimes.length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {matchedAnimes.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onSelectAnime && onSelectAnime(a.slug)}
                    className="group flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 hover:border-violet-500/50 hover:bg-zinc-850 cursor-pointer transition-all"
                  >
                    <QuickImageEditor
                      section="animes"
                      itemId={a.id}
                      field="coverUrl"
                      label={`Portada de ${a.title}`}
                      src={a.coverUrl}
                      alt={a.title}
                      containerClassName="shrink-0"
                      className="h-20 w-16 rounded-xl object-cover"
                      badgeClassName="-top-1 -right-1"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-violet-400 uppercase">
                        {a.category}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                        {a.title}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                        {a.synopsis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Characters Section */}
          {(filterType === 'all' || filterType === 'characters') && matchedCharacters.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Users size={14} />
                <span>Personajes ({matchedCharacters.length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedCharacters.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectAnime && onSelectAnime(c.animeId)}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 hover:border-pink-500/50 cursor-pointer transition-all"
                  >
                    {toText(c.imageUrl) ? (
                      <img
                        src={toText(c.imageUrl)}
                        alt={c.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800">
                        <Users size={18} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{c.description}</p>
                      <span className="text-[10px] text-zinc-500">♥ {c.likesCount} votos</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Episodes Section */}
          {(filterType === 'all' || filterType === 'episodes') && matchedEpisodes.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Film size={14} />
                <span>Episodios ({matchedEpisodes.length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {matchedEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => onSelectAnime && onSelectAnime(ep.animeId)}
                    className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 hover:border-amber-500/50 cursor-pointer transition-all"
                  >
                    {toText(ep.thumbnailUrl) ? (
                      <img
                        src={toText(ep.thumbnailUrl)}
                        alt={ep.title}
                        className="h-14 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800">
                        <Film size={18} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-400">
                        Episodio {ep.number}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{ep.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{ep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Threads Section */}
          {(filterType === 'all' || filterType === 'threads') && matchedThreads.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <MessageSquare size={14} />
                <span>Hilos de Discusión ({matchedThreads.length})</span>
              </h3>
              <div className="space-y-2">
                {matchedThreads.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectThread && onSelectThread(t)}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 hover:border-cyan-500/50 cursor-pointer transition-all"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white hover:text-cyan-300">
                        {t.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>@{t.authorName}</span>
                        <span>•</span>
                        <span>{t.categoryName}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-pink-400">♥ {t.likesCount}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : cleanQuery && totalResults === 0 ? (
        /* ESTADO VACÍO INFORMATIVO */
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-12 text-center space-y-4 animate-in fade-in duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400">
            <Frown size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              No hemos encontrado resultados para "{query}"
            </h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Prueba a escribir términos más generales, nombres de personajes (ej: Kaguya, Lucy, Gojo) o explora nuestras categorías populares.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {['Kaguya', 'Frieren', 'Cyberpunk', 'Chika', 'Debate', 'MAPPA'].map((sug) => (
              <button
                key={sug}
                onClick={() => setQuery(sug)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-violet-300 hover:border-violet-500 hover:text-white transition-all"
              >
                Buscar "{sug}"
              </button>
            ))}
          </div>

          <div>
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      ) : (
        /* Default suggestions when no query typed */
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <span>Búsquedas Populares Esta Semana</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Kaguya-sama: Love is War',
                'Frieren',
                'Cyberpunk: Edgerunners',
                'Jujutsu Kaisen',
                'Chika Fujiwara',
                'Crunchyroll',
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500 hover:text-white transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag size={16} className="text-pink-400" />
              <span>Etiquetas Activas en el Foro</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                '#Debate2026',
                '#MangaTheory',
                '#Spoilers',
                '#StudioTrigger',
                '#Animación',
                '#Seiyuu',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag.replace('#', ''))}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:border-pink-500 hover:text-pink-300 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
