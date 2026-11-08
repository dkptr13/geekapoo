import React from 'react';
import type { CSSProperties, FC } from 'react';

import { MARCOS_AVATAR } from '../../data/profileCustomization';

interface AvatarUsuarioProps {
  src?: string | null;
  alt: string;
  frame?: string | null;
  /** Nivel del perfil; si se pasa, un marco bloqueado no se pinta. */
  level?: number;
  /** Tamaño del avatar, por ejemplo `h-10 w-10`. */
  sizeClass?: string;
  /** Forma: `rounded-full`, `rounded-xl`, `rounded-2xl`... */
  shapeClass?: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  /** Color de perfil para el halo del contenedor. */
  color?: string;
  onClick?: () => void;
}

/**
 * Avatar con el marco coleccionable del perfil.
 *
 * Los marcos son CSS puro (ver `.avatar-marco` en index.css). El
 * componente no pide nada a Firestore: recibe el avatar y el marco
 * que ya vienen en el usuario o en la lista de usuarios cargada.
 */
export const AvatarUsuario: FC<AvatarUsuarioProps> = ({
  src,
  alt,
  frame,
  level,
  sizeClass = 'h-10 w-10',
  shapeClass = 'rounded-xl',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  fallbackSrc,
  color = '#8b5cf6',
  onClick,
}) => {
  const marco = frame ? MARCOS_AVATAR.find((m) => m.id === frame) : null;
  const visible =
    marco && marco.id !== 'ninguno' && (level === undefined || level >= marco.nivelMinimo);
  const frameId = visible ? marco!.id : 'ninguno';
  const srcFinal = src || fallbackSrc || '/img/avatar-comunidad.webp';

  return (
    <span
      className={`avatar-marco shrink-0 ${sizeClass} ${shapeClass} ${className}`}
      data-marco={frameId}
      style={{ '--avatar-accent': color } as CSSProperties}
      onClick={onClick}
    >
      <span className="avatar-deco avatar-deco-1" aria-hidden="true" />
      <span className="avatar-deco avatar-deco-2" aria-hidden="true" />
      <span className="avatar-deco avatar-deco-3" aria-hidden="true" />
      <img
        src={srcFinal}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`h-full w-full object-cover ${shapeClass} ${imgClassName}`}
        onError={(e) => {
          if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
          }
        }}
      />
    </span>
  );
};
