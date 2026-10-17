import React from 'react';
import { MessageCircle, Heart, Flame, Trophy, UserPlus, Users, Star, Calendar } from 'lucide-react';

import { formatearNumero } from '../../utils/follows';
import { textoDias } from '../../utils/profile';
import type { PerfilStats } from '../../types/profile';

// ======================================================
// ESTADÍSTICAS DEL PERFIL
// ======================================================
//
// Tarjetas pequeñas con un número grande. El formato ya existe en
// el proyecto (`StatBox` en `MedalCard.tsx`, y el panel de
// gamificación), así que la pregunta era si copiarlo otra vez.
//
// La respuesta es que aquí NO se copia, y el motivo es concreto:
// las cajas de este perfil necesitan dos cosas que `StatBox` no
// tiene.
//
//   · El NÚMERO YA FORMATEADO, no un `number`. `StatBox` llama a
//     `toLocaleString`, que depende de los datos de idioma del
//     navegador: en una instalación de Node sin ICU sale "1284"
//     sin separador, y en un navegador con español raro o
//     inglés sale "1,284". `formatearNumero` agrupa los dígitos a
//     mano y da el mismo resultado en todas partes. Ver el aviso
//     en `utils/follows`.
//
//   · Some CASOS SENSIBLES: una tarjeta que abre el modal de
//     seguidores, y un número que aún no se sabe. `StatBox` es un
//     `div` sincrónico y no tiene dónde meter un botón.
//
// Son dos diferencias que cambian el contrato del componente, no
// el aspecto: por eso son dos componentes y no uno con props.
//
// ── El ancho de la rejilla ────────────────────────────────
//
// Dos columnas en móvil, cuatro en `sm`, seis en `lg`. La última
// decisión (seis) es la que hace que en un monitor se lean de un
// vistazo sin quedar una fila huérfana abajo. Con cinco quedaría una
// segunda fila con una sola caja, que es lo que más descuadra un
// grid.

const Stat: React.FC<{
  label: string;
  value: string;
  icono: React.ReactNode;
  /** Color del icono. */
  tono?: string;
}> = ({ label, value, icono, tono = 'text-violet-400' }) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
      <span className={tono}>{icono}</span>
      {label}
    </p>
    <p className="mt-0.5 font-mono text-base font-bold text-white">{value}</p>
  </div>
);

/**
 * Una caja que además es un botón.
 *
 * El texto de "no lo sé todavía" va en el propio número, y no en
 * un `title` aparte: un "—" sin explicación parece un cero mal
 * formateado. Con el `title` se explica al que pasa el ratón, pero
 * el que va con prisa solo ve el guion, y por eso el número es el
 * que lleva el aviso.
 */
const StatBoton: React.FC<{
  label: string;
  value: string;
  cargando: boolean;
  icono: React.ReactNode;
  tono: string;
  onClick: () => void;
  /** A quién se le avisa en el tooltip. */
  nombre: string;
}> = ({ label, value, cargando, icono, tono, onClick, nombre }) => (
  <button
    type="button"
    onClick={onClick}
    title={cargando ? `Cargando ${label}...` : `Ver ${label.toLowerCase()} de ${nombre}`}
    className="chat-boton rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center transition-colors hover:border-violet-400/40 hover:bg-white/[0.05]"
  >
    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
      <span className={tono}>{icono}</span>
      {label}
    </p>
    <p className="mt-0.5 font-mono text-base font-bold text-white">{value}</p>
  </button>
);

export const ProfileStats: React.FC<{
  stats: PerfilStats;
  /**
   * Abre la lista de seguidores o de seguidos.
   *
   * Viene por prop y no de `FollowsContext` a propósito: este
   * componente no sabe nada de seguimientos, y si lo supiera
   * habría que acordarse de envolverlo. La decisión de qué pasa al
   * pulsar la toma quien lo monta, que es quien tiene el modal.
   */
  onVerLista: (lista: 'followers' | 'following') => void;
  /** Cómo se llama la persona, para los tooltips. */
  nombre: string;
  /**
   * `true` si aún no hay contador. Sale un guion en vez de un 0,
   * que es un dato que alguien se creería si va con prisa.
   */
  cargandoSeguidores?: boolean;
  cargandoSeguidos?: boolean;
}> = ({
  stats,
  onVerLista,
  nombre,
  cargandoSeguidores = false,
  cargandoSeguidos = false,
}) => (
  <section className="space-y-3">
    <h2 className="flex items-center gap-2 text-base font-bold text-white">
      <Star size={16} className="text-violet-400" />
      Estadísticas
    </h2>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <Stat
        label="Hilos"
        value={formatearNumero(stats.hilos)}
        icono={<MessageCircle size={12} />}
      />
      <Stat
        label="Comentarios"
        value={formatearNumero(stats.comentarios)}
        icono={<MessageCircle size={12} />}
        tono="text-sky-400"
      />
      <Stat
        label="Me gusta"
        value={formatearNumero(stats.meGusta)}
        icono={<Heart size={12} />}
        tono="text-pink-400"
      />
      <Stat
        label="Reacciones"
        value={formatearNumero(stats.reacciones)}
        icono={<Flame size={12} />}
        tono="text-orange-400"
      />
      <Stat
        label="Medallas"
        value={formatearNumero(stats.medallas)}
        icono={<Trophy size={12} />}
        tono="text-amber-400"
      />
      <Stat
        label="En la comunidad"
        value={textoDias(stats.dias)}
        icono={<Calendar size={12} />}
        tono="text-zinc-400"
      />
    </div>

    {/*
      Seguidores y seguidos aparecen TAMBIÉN en la cabecera. Es a
      propósito, aunque un purista lo llamaría duplicado, y el
      motivo es que cumplen dos papeles distintos:

        · En la cabecera ("1.284 seguidores · 347 seguidos") son
          texto de identidad: se leen de un vistazo, junto al
          nombre, y contestan "¿es alguien de la comunidad?" antes
          de que el usuario llegue a nada.

        · Aquí son dos cajas grandes con su botón, que es donde se
          entra a la lista. Es la pregunta siguiente: no "¿cuánta
          gente tiene?" sino "¿quién es?".

      Si solo estuvieran en uno de los dos sitios, el otro trabajo
      se pierde: en la cabecera no caben dos cajas, y entre los
      números sin botón nadie sabría que hay una lista debajo.

      Con "—" mientras no se sabe el número. Poner un 0 aquí es
      peor que no enseñar nada: alguien que va con prisa se lo
      creería, y creería que una persona con mil seguidores no
      tiene ninguno.
    */}
    <div className="grid grid-cols-2 gap-3">
      <StatBoton
        label="Seguidores"
        value={cargandoSeguidores ? '—' : formatearNumero(stats.seguidores)}
        cargando={cargandoSeguidores}
        icono={<Users size={12} />}
        tono="text-violet-400"
        onClick={() => onVerLista('followers')}
        nombre={nombre}
      />
      <StatBoton
        label="Seguidos"
        value={cargandoSeguidos ? '—' : formatearNumero(stats.seguidos)}
        cargando={cargandoSeguidos}
        icono={<UserPlus size={12} />}
        tono="text-fuchsia-400"
        onClick={() => onVerLista('following')}
        nombre={nombre}
      />
    </div>

    {/*
      El XP total y el nivel NO salen aquí como dos cajas más: ya
      están en la cabecera, con su barra, que es donde se miran
      sin bajar. Repitirlos un scroll más abajo solo haría que el
      perfil pareciera más largo y que los dos sitios se
      desincronizasen si uno cambiara.
    */}
    <p className="text-[11px] text-zinc-500">
      {formatearNumero(stats.xp)} XP acumulados en el nivel que ves arriba
    </p>
  </section>
);