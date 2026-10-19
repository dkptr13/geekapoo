import React from 'react';

import { RANGO_META, rangoEnClub } from '../../data/clubModeracion';
import type { Club } from '../../types';

// ======================================================
// DISTINTIVO DE CARGO EN EL CLUB
// ======================================================
// 👑 Propietario · 🛡️ Admin · 🔨 Moderador
//
// El cargo sale SIEMPRE de `ownerId`, `adminIds` y
// `moderatorIds` del club (ver `rangoEnClub`): son los mismos
// campos que comprueban las reglas, así que lo que se ve y lo
// que tiene autoridad no pueden separarse. Nunca de
// `members[uid].role`, que el cliente puede escribir.
//
// Como el distintivo se calcula en cada render a partir del
// objeto del club, cuando el propietario nombra a alguien o lo
// degrada el cambio se ve en el acto: el club llega por
// `onSnapshot`, no por una copia congelada.
//
// Un miembro normal no muestra nada: se devuelve `null` en vez
// de un distintivo vacío, para no dejar un hueco en la línea.
export const ClubRoleBadge: React.FC<{
  club: Club | null;
  uid: string;
  /** `sm` para la cabecera del chat, `xs` para listas apretadas. */
  size?: 'xs' | 'sm';
  /** Añade `title` con el nombre completo del cargo. */
  conTitle?: boolean;
}> = ({ club, uid, size = 'sm', conTitle = true }) => {
  const rango = rangoEnClub(club, uid);
  if (!rango || rango === 'member') return null;

  const meta = RANGO_META[rango];
  if (!meta.etiqueta) return null;

  // `whitespace-nowrap` es importante: sin él, en una columna
  // estrecha el texto se parte y descuadra la línea del mensaje.
  const tam =
    size === 'xs'
      ? 'gap-0.5 border px-1 py-px text-[9px] leading-tight'
      : 'gap-1 border px-1.5 py-0.5 text-[10px] leading-tight';

  return (
    <span
      title={conTitle ? `Cargo en este club: ${meta.etiqueta}` : undefined}
      className={`inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md border font-bold ${tam} ${meta.clase}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.etiqueta}
    </span>
  );
};

export default ClubRoleBadge;