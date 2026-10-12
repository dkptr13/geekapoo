import React from 'react';

import {
  PEGATINAS,
  TAMANOS_DECORACION,
  fondoDePerfil,
  sujetarDecoracion,
  type Decoracion,
} from '../../data/profileCustomization';
import { CATALOGO_MEDALLAS } from '../../utils/progression';
import type { User } from '../../types';

// ======================================================
// FONDO Y DECORACIONES DEL PERFIL
// ======================================================
//
// Dos capas tontas: no saben de niveles ni de desbloqueos, solo
// pintan lo que el documento dice (ya filtrado al guardar). Si
// una imagen falla, se esconde en silencio: un archivo borrado
// de Storage no puede romper el perfil de nadie.

/** El fondo de la PÁGINA del perfil (toda la ventana, detrás de todo).
 *
 * Va en `fixed` y no dentro de la columna: lo que se decora es el
 * alrededor (los laterales en escritorio), no la tarjeta. Se monta
 * solo con el perfil y se desmonta al salir de la pestaña, así que
 * no mancha el resto de la web. La barra (opaca, z-50) y los
 * modales quedan por encima.
 *
 * En móvil la columna ocupa casi todo el ancho y apenas se ven
 * los bordes: el `object-cover` evita deformar la imagen. */
export const PerfilFondo: React.FC<{ perfil: User; level: number }> = ({ perfil, level }) => {
  const fondo = fondoDePerfil(perfil.profileBackground, level);
  if (fondo.tipo === 'ninguno') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {fondo.tipo === 'preset' ? (
        <div className="absolute inset-0" style={{ background: fondo.css }} />
      ) : (
        <img
          src={fondo.url}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{ objectPosition: `center ${fondo.position}` }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Oscurecido para que el fondo no deslumbre. Las tarjetas
          del perfil son opacas, así que el texto no se ve afectado. */}
      {fondo.tipo === 'url' && (
        <div className="absolute inset-0 bg-black" style={{ opacity: fondo.dim / 100 }} />
      )}
    </div>
  );
};

/** Lo que pinta cada decoración guardada, o null si ya no vale. */
function contenidoDe(d: Decoracion, perfil: User): React.ReactNode {
  if (d.kind === 'sticker') {
    return PEGATINAS.find((p) => p.id === d.ref)?.emoji ?? null;
  }
  if (d.kind === 'image') {
    if (!/^https:\/\//.test(d.ref)) return null;
    return (
      <img
        src={d.ref}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className="h-full w-full rounded-xl object-cover"
      />
    );
  }
  // Medalla: solo si sigue desbloqueada y en el catálogo. Si se
  // quitó del catálogo o se perdió (cuenta vieja), no se pinta
  // nada en lugar de un icono inventado.
  if (d.kind === 'medal') {
    if (!perfil.medals?.[d.ref]) return null;
    return CATALOGO_MEDALLAS.find((m) => m.id === d.ref)?.icono ?? null;
  }
  return null;
}

/**
 * Capa de decoraciones sobre la cabecera.
 *
 * Coordenadas en % sobre la cabecera (que es `relative`), así el
 * sitio es el mismo en el móvil, en otro navegador y para los
 * visitantes. `pointer-events-none`: es decoración, no tapa
 * botones.
 */
export const CapaDecoraciones: React.FC<{ perfil: User }> = ({ perfil }) => {
  const lista = (perfil.decorations ?? []).map(sujetarDecoracion);
  if (lista.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {lista.map((d) => {
        const contenido = contenidoDe(d, perfil);
        if (!contenido) return null;
        const px = TAMANOS_DECORACION[d.size];
        return (
          <span
            key={d.id}
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: px,
              height: px,
              transform: 'translate(-50%,-50%)',
            }}
            className="absolute flex items-center justify-center text-3xl drop-shadow-lg"
          >
            {contenido}
          </span>
        );
      })}
    </div>
  );
};
