import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

import type { FanartImage } from '../../types';

// ======================================================
// GALERÍA DE UN FANART
// ======================================================
//
// La imagen principal se pinta ENTERA y con su proporción
// (`object-contain`, sin alto fijo en la propia imagen). No se
// recorta ni se deforma: una vertical y una panorámica se ven como
// son.
//
// Con varias imágenes se puede pasar con las flechas o las
// miniaturas, y al pulsar se abre un visor a pantalla completa
// montado en `document.body` para que ninguna tarjeta lo recorte.

interface FanartGalleryProps {
  images: FanartImage[];
  alt: string;
  eager?: boolean;
}

export const FanartGallery: FC<FanartGalleryProps> = ({
  images,
  alt,
  eager = false,
}) => {
  const validas = useMemo(
    () => images.filter((imagen) => Boolean(imagen?.url)),
    [images],
  );
  const [indice, setIndice] = useState(0);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (indice >= validas.length) setIndice(0);
  }, [indice, validas.length]);

  useEffect(() => {
    if (!abierta) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPulsar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierta(false);
      if (validas.length === 0) return;
      if (event.key === 'ArrowLeft') {
        setIndice((i) => (i - 1 + validas.length) % validas.length);
      }
      if (event.key === 'ArrowRight') {
        setIndice((i) => (i + 1) % validas.length);
      }
    };

    window.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierta, validas.length]);

  if (validas.length === 0) return null;

  const actual = validas[indice] ?? validas[0];
  const varias = validas.length > 1;
  const ir = (delta: number) => {
    setIndice((i) => (i + delta + validas.length) % validas.length);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/35 p-1.5">
        <button
          type="button"
          onClick={() => setAbierta(true)}
          className="group relative flex w-full justify-center focus-visible:outline-2 focus-visible:outline-violet-400"
          aria-label="Ampliar imagen del fanart"
          title="Ampliar"
        >
          <img
            src={actual.url}
            alt={alt}
            {...(actual.width && actual.height
              ? { width: actual.width, height: actual.height }
              : {})}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
            className="mx-auto block h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
          />
          <span className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <Maximize2 size={14} />
          </span>
        </button>

        {varias && (
          <>
            <button
              type="button"
              onClick={() => ir(-1)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-colors hover:bg-violet-600/80"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => ir(1)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-colors hover:bg-violet-600/80"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={18} />
            </button>
            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              {indice + 1} / {validas.length}
            </span>
          </>
        )}
      </div>

      {varias && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validas.map((imagen, i) => (
            <button
              key={`${imagen.url}-${i}`}
              type="button"
              onClick={() => setIndice(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                i === indice
                  ? 'border-violet-400 ring-2 ring-violet-500/30'
                  : 'border-white/[0.08] opacity-70 hover:opacity-100'
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img
                src={imagen.url}
                alt={`${alt} — imagen ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {abierta &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-black/95 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Imagen ampliada del fanart"
          >
            <div className="flex items-center justify-between text-white">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold">
                {indice + 1} / {validas.length}
              </span>
              <button
                type="button"
                onClick={() => setAbierta(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-red-500/80"
                aria-label="Cerrar imagen ampliada"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center py-3">
              <img
                src={actual.url}
                alt={alt}
                loading="eager"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
              {varias && (
                <>
                  <button
                    type="button"
                    onClick={() => ir(-1)}
                    className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-colors hover:bg-violet-600/80 sm:left-4"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => ir(1)}
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition-colors hover:bg-violet-600/80 sm:right-4"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {varias && (
              <div className="mx-auto flex max-w-full gap-2 overflow-x-auto pb-1">
                {validas.map((imagen, i) => (
                  <button
                    key={`${imagen.url}-${i}`}
                    type="button"
                    onClick={() => setIndice(i)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      i === indice
                        ? 'border-violet-400 opacity-100'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img
                      src={imagen.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
