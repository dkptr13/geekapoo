import { useState } from 'react';
import type { FC } from 'react';
import { ExternalLink } from 'lucide-react';

import { ATRIBUCION, ORIGEN } from '../../services/gifs';
import { dimsValidas } from '../../utils/imagenes';
import type { GifAttachment } from '../../types';

// ======================================================
// EL GIF DE UN COMENTARIO
// ======================================================
//
// Se pinta debajo del texto, igual que una foto adjunta. El
// comentario sigue siendo texto plano: el GIF es un dato
// aparte, y por eso se puede quitar o moderar sin reescribir lo
// que alguien escribió.
//
// El `src` normal es la versión grande (la que se guarda en
// `gif.url`), y si esa URL falla se cae a la pequeña
// (`previewUrl`): con una sola pasada, porque si fallan las dos
// ya no hay nada que reintentar y se enseña el aviso.

interface CommentGifProps {
  gif: GifAttachment;
  /** Sangría para igualar la del texto del comentario. */
  className?: string;
  /** `true` para lo que tiene que verse ya (destino de un aviso). */
  eager?: boolean;
}

export const CommentGif: FC<CommentGifProps> = ({ gif, className = '', eager = false }) => {
  const [fallback, setFallback] = useState(false);
  const [roto, setRoto] = useState(false);

  const src = fallback ? gif.previewUrl : gif.url;
  const reservado = dimsValidas(gif.width, gif.height);

  return (
    <figure className={`mt-1 ${className}`}>
      {roto ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] text-zinc-500">
          Este GIF ya no está disponible en {ATRIBUCION[gif.provider]}.
        </div>
      ) : (
        <a
          href={gif.url}
          target="_blank"
          rel="noreferrer noopener"
          title={`Abrir el GIF en ${ORIGEN[gif.provider]}`}
          className="group relative inline-block"
        >
          <img
            src={src}
            alt={gif.title ?? 'GIF del comentario'}
            {...(reservado ? { width: gif.width, height: gif.height } : {})}
            loading={eager ? 'eager' : 'lazy'}
            onError={() => {
              if (!fallback && gif.previewUrl && gif.previewUrl !== gif.url) {
                setFallback(true);
              } else {
                setRoto(true);
              }
            }}
            className="max-h-72 max-w-full rounded-xl border border-zinc-800 bg-zinc-950 object-cover transition-opacity group-hover:opacity-90"
          />
          <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-lg bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
            GIF
            <ExternalLink size={8} />
          </span>
        </a>
      )}

      {/* Crédito: lo exigen los acuerdos de GIPHY y Tenor para
          usar su CDN, así que se enseña siempre, no solo al
          pasar el ratón. */}
      <figcaption className="mt-1 text-[9px] text-zinc-600">
        {ATRIBUCION[gif.provider]}
      </figcaption>
    </figure>
  );
};
