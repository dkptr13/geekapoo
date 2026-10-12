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
//     que le toca antes de descargar un solo byte. La imagen
//     se presenta igual que antes (ancho disponible, alto
//     automático, sin deformar) y el archivo es el original
//     con toda su calidad.
//   - Detrás hay un fondo neutro hasta que carga, y la foto
//     aparece con un fundido en vez de un parpadeo. Al cargar,
//     el fondo se quita para no dejar franjas donde la imagen
//     no llena la caja (fotos estrechas, tope de altura).
//   - Sin dimensiones (publicaciones antiguas), se comporta
//     como el <img> de antes con fundido: no se puede reservar
//     lo que no se sabe, y un hueco inventado sería peor que
//     el salto (un vacío grande y erróneo).
//
// No se recorta, no se comprime y no se pide otra versión:
// `src` sigue siendo el archivo original.
//
// Uso:
//   <StableImage src alt width height className="..." eager />
// ======================================================

interface StableImageProps {
  src: string;
  alt: string;
  /** Anchura original en píxeles, si se guardó al subir. */
  width?: number;
  /** Altura original en píxeles, si se guardó al subir. */
  height?: number;
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
  maxHeight,
  className = '',
  wrapperClassName = '',
  eager = false,
}) => {
  const [cargada, setCargada] = useState(false);
  const [rota, setRota] = useState(false);

  const reservada = dimsValidas(width, height);

  // Si la imagen falla, no se deja un hueco con fondo: mejor
  // no pintar nada que un rectángulo vacío.
  if (rota) return null;

  // Sin capar el ancho al original, una foto pequeña
  // reservaría la caja a ancho completo y encogería al
  // cargar: el salto al revés.
  const estilo: CSSProperties | undefined = reservada
    ? {
        aspectRatio: aspectoDe(width as number, height as number),
        maxWidth: `${width}px`,
        ...(maxHeight != null ? { maxHeight: `${maxHeight}px` } : {}),
      }
    : undefined;

  return (
    <span
      className={`block max-w-full ${!cargada && reservada ? 'bg-zinc-900/60' : ''} ${wrapperClassName}`}
      style={estilo}
    >
      <img
        src={src}
        alt={alt}
        // Los atributos intrínsecos son la otra mitad de la
        // reserva: con ellos el navegador calcula la proporción
        // aunque el CSS falle o llegue tarde.
        {...(reservada ? { width, height } : {})}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setCargada(true)}
        onError={() => setRota(true)}
        className={`${className} ${
          cargada ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      />
    </span>
  );
};
