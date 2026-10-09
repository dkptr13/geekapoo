import type { FC } from 'react';
import { Star } from 'lucide-react';

// ======================================================
// LA ESTRELLA DE FAVORITO
// ======================================================
//
// El mismo botón en la cuadrícula de emojis y en la de GIFs, para
// que marcar un favorito sea el mismo gesto en los dos sitios.
//
// Va como HERMANO del elemento, no dentro: dos botones anidados
// son HTML inválido y, además, en el navegador el clic del
// interior no llega al de fuera. Por eso el padre es un `div`
// con posición y los dos van encima.
//
// Aparece un poco apagada y se enciende del todo cuando está
// marcada. En puntero fino se ve siempre (un poco más clara) y
// en táctil solo cuando ya está guardada: un botón del tamaño de
// una estrella sobre cada emoji sería un mapa de minas en el
// móvil.

interface FavoriteStarProps {
  /** `true` si ya está en favoritos. */
  marcado: boolean;
  /** Lo que explica el botón: "Guardar el emoji X" / "Quitar X de favoritos". */
  que: string;
  onClick: () => void;
  /** Tamaño del icono en píxeles. */
  size?: number;
}

export const FavoriteStar: FC<FavoriteStarProps> = ({
  marcado,
  que,
  onClick,
  size = 13,
}) => (
  <button
    type="button"
    onClick={(e) => {
      // Sin esto, marcar un favorito en la cuadrícula de emojis
      // insertaría además el emoji en el mensaje: el `onClick`
      // del padre se dispara al propagarse el evento.
      e.stopPropagation();
      onClick();
    }}
    title={que}
    aria-label={que}
    aria-pressed={marcado}
    className={`absolute right-0.5 top-0.5 z-10 flex items-center justify-center rounded-full p-0.5 transition-all duration-150 active:scale-90 ${
      marcado
        ? 'bg-amber-400/25 text-amber-300'
        : 'bg-black/50 text-amber-200/0 hover:bg-black/70 hover:text-amber-200/80'
    }`}
  >
    <Star size={size} className={marcado ? 'fill-amber-300' : ''} />
  </button>
);
