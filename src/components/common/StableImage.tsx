import { useState } from 'react';
import type { CSSProperties, FC } from 'react';

import { aspectoDe, dimsValidas } from '../../utils/imagenes';

// ======================================================
// IMAGEN CON SITIO RESERVADO
// ======================================================
//
// El mismo <img> de siempre, pero sin mover la pantalla:
//
//   - Con dimensiones conocidas (las que se guardaron al
//     subir), la caja se reserva con su proporción exacta
//     desde el primer renderizado: el navegador sabe el alto
//     que le toca antes de descargar un solo byte.
//   - Sin dimensiones (publicaciones antiguas), se reserva una
//     caja estable con una proporción de seguridad y
//     `object-contain`. La foto se ve entera dentro de esa caja;
//     puede sobrar algo de fondo, pero el contenido de alrededor
//     no se mueve cuando termina de cargar.
//   - Detrás hay un fondo neutro hasta que carga, y la foto
//     aparece con un fundido en vez de un parpadeo. Al cargar,
//     el fondo se quita para no dejar franjas donde la imagen
//     no llena la caja.
//
// No se recorta, no se comprime y no se pide otra versión:
// `src` sigue siendo el archivo original.
//
// Uso:
//   <StableImage src alt width height className="..." eager />
//   <StableImage src alt unknownRatio="16 / 9" ... />
// ======================================================

interface StableImageProps {
  src: string;
  alt: string;
  /** Anchura original en píxeles, si se guardó al subir. */
  width?: number;
  /** Altura original en píxeles, si se guardó al subir. */
  height?: number;
  /**
   * Proporción de reserva para imágenes antiguas sin medidas.
   * Sin esto, una imagen sin `width`/`height` no puede reservar
   * nada y empuja el contenido al cargar.
   */
  unknownRatio?: string;
  /**
   * Tope de altura en píxeles, si la imagen lo tiene (p. ej.
   * 288 para el `max-h-72` de los comentarios). Debe coincidir
   * con el `max-h` de `className` para reservar lo mismo que
   * se va a pintar.
   */
  maxHeight?: number;
  /** Clases de la <img> (las que ya tenía: bordes, máximos...). */
  className?: string;
  /** Clases extra de la caja (márgenes como `ml-8`). */
  wrapperClassName?: string;
  /** `true` para lo que tiene que verse ya (destino de un aviso). */
  eager?: boolean;
}

export const StableImage: FC<StableImageProps> = ({
  src,
  alt,
  width,
  height,
  unknownRatio,
  maxHeight,
  className = '',
  wrapperClassName = '',
  eager = false,
}) => {
  const [cargada, setCargada] = useState(false);
  const [rota, setRota] = useState(false);

  const reservada = dimsValidas(width, height);
  const proporcion = reservada
    ? aspectoDe(width as number, height as number)
    : unknownRatio;
  const estable = Boolean(proporcion);

  // Si la imagen falla y no hay hueco reservado, no se deja un
  // rectángulo vacío. Si el hueco ya está reservado, se mantiene:
  // quitarlo movería todo lo que hay debajo.
  if (rota && !estable) return null;

  const estilo: CSSProperties | undefined = estable
    ? {
        aspectRatio: proporcion,
        ...(reservada ? { maxWidth: `${width}px` } : { width: '100%' }),
        ...(maxHeight != null ? { maxHeight: `${maxHeight}px` } : {}),
      }
    : undefined;

  const estiloImagen: CSSProperties | undefined =
    !reservada && unknownRatio
      ? { width: '100%', height: '100%', objectFit: 'contain' }
      : undefined;

  return (
    <span
      className={`block max-w-full ${!cargada && estable ? 'bg-zinc-900/60' : ''} ${wrapperClassName}`}
      style={estilo}
    >
      {rota ? (
        <span className="flex h-full w-full items-center justify-center p-3 text-center text-[11px] text-zinc-500">
          Imagen no disponible
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          // Los atributos intrínsecos son la otra mitad de la
          // reserva: con ellos el navegador calcula la proporción
          // aunque el CSS falle o llegue tarde.
          {...(reservada ? { width, height } : {})}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          style={estiloImagen}
          onLoad={(e) => {
            const img = e.currentTarget;
            const mostrar = () => setCargada(true);
            // Se espera a que esté DECODIFICADA para que no haya
            // un frame con la caja vacía ni un salto al pintar.
            if (typeof img.decode === 'function') {
              img.decode().then(mostrar, mostrar);
            } else {
              mostrar();
            }
          }}
          onError={() => setRota(true)}
          className={`${className} ${
            cargada ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
        />
      )}
    </span>
  );
};
