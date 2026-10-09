import React from 'react';
import { Lock, Calendar, Trophy } from 'lucide-react';

import type { Medal, MedalRarity, MedalStatus } from '../../types/gamification';

// ======================================================
// PIEZAS DE LA GAMIFICACION
// ======================================================
//
// La tarjeta de medalla y la barra de nivel se usan tanto en el
// perfil como en la pagina de logros, asi que viven aqui y no
// duplicadas en los dos sitios.

// ======================================================
// RAREZA
// ======================================================
//
// Los estilos van escritos a mano y no construidos con
// `bg-${rareza}-500`, porque Tailwind solo ve las clases que
// estan escritas en el codigo: una que se arma en tiempo de
// ejecucion no existe para el y desaparece al compilar.
export const ESTILO_RAREZA: Record<
  MedalRarity,
  {
    etiqueta: string;
    chip: string;
    borde: string;
    fondo: string;
    glow: string;
  }
> = {
  comun: {
    etiqueta: 'Comun',
    chip: 'border-zinc-700 bg-zinc-800/80 text-zinc-300',
    borde: 'border-zinc-700/60',
    fondo: 'bg-zinc-800/40',
    glow: '',
  },
  rara: {
    etiqueta: 'Rara',
    chip: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    borde: 'border-sky-500/40',
    fondo: 'bg-sky-500/5',
    glow: 'shadow-sky-500/10',
  },
  epica: {
    etiqueta: 'Epica',
    chip: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
    borde: 'border-violet-500/40',
    fondo: 'bg-violet-500/5',
    glow: 'shadow-violet-500/20',
  },
  legendaria: {
    etiqueta: 'Legendaria',
    chip: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    borde: 'border-amber-500/40',
    fondo: 'bg-amber-500/5',
    glow: 'shadow-amber-500/20',
  },
};

// ======================================================
// TARJETA DE MEDALLA
// ======================================================
//
// Las bloqueadas se muestran atenuadas y con el icono en gris,
// pero NO se ocultan: ver lo que hay que conseguir es justo lo
// que hace que alguien se anime a hacerlo, y el requisito esta a
// la vista.
export const MedalCard: React.FC<{
  estado: MedalStatus;
  /** Si esta es la medalla del titulo que lleva puesto. */
  equipping?: boolean;
  onEquipar?: (medalId: string | null) => void;
  /** Sin descripcion, para las listas de "proximos logros". */
  compacto?: boolean;
}> = ({ estado, equipping = false, onEquipar, compacto = false }) => {
  const { medal, desbloqueada, fecha, progreso, falta } = estado;
  const estilo = ESTILO_RAREZA[medal.rareza];

  // Solo se puede equipar el titulo de una medalla que lo tenga y
  // que este ya desbloqueada.
  const equipable = desbloqueada && Boolean(medal.titulo) && Boolean(onEquipar);

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl border p-4 transition-all ${
        desbloqueada
          ? `${estilo.borde} ${estilo.fondo} ${estilo.glow}`
          : 'border-zinc-800/80 bg-zinc-900/50 opacity-70'
      }`}
      title={medal.descripcion}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-2xl ${
            desbloqueada
              ? `${estilo.borde} ${estilo.fondo}`
              : 'grayscale border-zinc-800 bg-zinc-950/60'
          }`}
        >
          {desbloqueada ? (
            medal.icono
          ) : (
            <Lock size={16} className="text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-bold ${
              desbloqueada ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {medal.nombre}
          </p>

          <span
            className={`mt-1 inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${estilo.chip}`}
          >
            {estilo.etiqueta}
          </span>
        </div>
      </div>

      {!compacto && (
        <p className="text-[11px] leading-relaxed text-zinc-400">{medal.descripcion}</p>
      )}

      {desbloqueada ? (
        fecha && (
          <p className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Calendar size={10} />
            Obtenida el{' '}
            {new Date(fecha).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )
      ) : (
        <div className="space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-[width] duration-500"
              style={{ width: `${Math.round(progreso * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500">{falta}</p>
        </div>
      )}

      {equipable && equipping && (
        <button
          type="button"
          onClick={() => onEquipar?.(null)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
        >
          Quitar titulo
        </button>
      )}

      {equipable && !equipping && (
        <button
          type="button"
          onClick={() => onEquipar?.(medal.id)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-600/15 px-2 py-1.5 text-[11px] font-bold text-violet-300 transition-colors hover:bg-violet-600/25"
        >
          <Trophy size={11} />
          Equipar titulo
        </button>
      )}
    </div>
  );
};

// ======================================================
// BARRA DE NIVEL
// ======================================================
//
// En el tope de niveles la barra se llena entera y el texto
// cambia: decir "faltan 0 XP para el nivel 61" cuando el 61 no
// existe seria un fallo de la interfaz.
export const LevelBar: React.FC<{
  nivel: number;
  rango: string;
  xp: number;
  progreso: number;
  falta: number;
  enNivelMaximo: boolean;
  compacto?: boolean;
}> = ({ nivel, rango, xp, progreso, falta, enNivelMaximo, compacto = false }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black text-white">Nivel {nivel}</span>
        <span className="text-[11px] font-semibold text-violet-300">{rango}</span>
      </div>

      <span className="font-mono text-xs text-zinc-400">
        {xp.toLocaleString('es-ES')} XP
      </span>
    </div>

    <div className="h-2.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-700 ease-out"
        style={{ width: `${Math.round(progreso * 100)}%` }}
      />
    </div>

    {!compacto && (
      <p className="text-[11px] text-zinc-500">
        {enNivelMaximo ? (
          <span className="text-amber-300">
            Has alcanzado el nivel maximo. Ya no hay mas por subir.
          </span>
        ) : (
          <>
            Faltan{' '}
            <strong className="font-mono text-zinc-400">{falta.toLocaleString('es-ES')}</strong>{' '}
            XP para el nivel {nivel + 1}
          </>
        )}
      </p>
    )}
  </div>
);

// ======================================================
// CAJA DE ESTADISTICA
// ======================================================

export const StatBox: React.FC<{
  label: string;
  value: number;
  icono?: React.ReactNode;
}> = ({ label, value, icono }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-center">
    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-base font-bold text-white">
      {icono}
      {value.toLocaleString('es-ES')}
    </p>
  </div>
);

/** Reexportado para el panel de admin, que lista el catalogo entero. */
export type { Medal };
