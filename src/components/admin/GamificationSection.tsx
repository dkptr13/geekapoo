import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Users,
  Wrench,
  Power,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import {
  ajustarXpAdmin,
  concederMedallaAdmin,
  configurar,
  escucharConfiguracion,
  mensajeDeError,
  recalcular,
} from '../../services/gamification';
import { CATALOGO_MEDALLAS } from '../../utils/progression';
import { ESTILO_RAREZA } from '../gamification/MedalCard';
import type { GamificationConfig, Medal } from '../../types/gamification';

// ======================================================
// GAMIFICACION: PANEL DE ADMINISTRACION
// ======================================================
//
// Tres cosas, en este orden:
//
//   1. ACTIVAR. El interruptor de arriba. Sin él, las funciones no
//      conceden nada, porque asi se despliega sin miedo.
//   2. CONFIGURAR. Cuanto XP da cada cosa y como crece la curva.
//   3. CORREGIR. Ajuste manual de XP, medallas a mano y
//      recalculo de un usuario.
//
// TODO lo que se hace aqui pasa por una Cloud Function que
// comprueba el rol en el servidor. Que el boton no se vea no
// importa: lo que manda es la comprobacion de "exigirAdmin".
//
// Los ids de anime de las medallas tematicas NO se ponen aqui a
// mano. Se eligen de un desplegable con los animes que hay, porque
// escribir un id de Firestore a mano es la forma segura de dejar
// una medalla imposible de conseguir.

// ── Estado de una operación ──────────────────────────
type Estado = 'idle' | 'guardando' | 'ok' | 'error';

const useAccion = () => {
  const [estado, setEstado] = useState<Estado>('idle');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const ejecutar = async (fn: () => Promise<string>) => {
    setEstado('guardando');
    setMensaje(null);
    try {
      setMensaje(await fn());
      setEstado('ok');
      return true;
    } catch (e) {
      setMensaje(mensajeDeError(e));
      setEstado('error');
      return false;
    }
  };

  return { estado, mensaje, ejecutar };
};

/** Aviso del resultado de la última acción. */
const Aviso: React.FC<{ estado: Estado; mensaje: string | null }> = ({
  estado,
  mensaje,
}) => {
  if (!mensaje) return null;

  const ok = estado === 'ok';
  return (
    <p
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed ${
        ok
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/20 bg-red-500/10 text-red-400'
      }`}
    >
      {ok ? (
        <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
      )}
      <span className="break-words">{mensaje}</span>
    </p>
  );
};

/** Campo numérico con etiqueta. */
const Num: React.FC<{
  label: string;
  value: number;
  onChange: (n: number) => void;
  ayuda?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, ayuda, disabled }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-zinc-400">{label}</span>
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const n = Number(e.target.value);
        // Se descarta lo que no sea un número en vez de dejar
        // que el campo se quede en blanco y se envie un NaN.
        if (Number.isFinite(n)) onChange(n);
      }}
      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus:border-violet-500 disabled:opacity-50"
    />
    {ayuda && <span className="mt-1 block text-[10px] text-zinc-600">{ayuda}</span>}
  </label>
);

/**
 * Selector de usuario.
 *
 * Antes estos tres formularios pedían el uid en un campo de texto
 * y no había forma de encontrarlo: el uid es una cadena de 20
 * caracteres que sale de la consola de Firebase, y quien
 * administraba no tenía por dónde sacarlo. Ahora se elige a la
 * persona de una lista, buscando por nombre de usuario, nombre
 * visible o ID de chat, que es lo que se conoce de ella.
 *
 * El uid sale a la vista junto al nombre para poder copiarlo si
 * hace falta, pero no hay que escribirlo nunca.
 */
const UserPicker: React.FC<{
  valor: string;
  onChange: (uid: string) => void;
  etiqueta?: string;
}> = ({ valor, onChange, etiqueta = 'Usuario' }) => {
  const { usersList } = useAuth();
  const [buscador, setBuscador] = useState('');

  const filtrados = usersList.filter((u) => {
    const q = buscador.trim().toLowerCase();
    if (!q) return true;
    return [u.username, u.displayName, u.chatId, u.email]
      .filter(Boolean)
      .some((c) => String(c).toLowerCase().includes(q));
  });

  const elegido = usersList.find((u) => u.uid === valor) ?? null;

  return (
    <div className="block">
      <span className="text-[11px] font-semibold text-zinc-400">{etiqueta}</span>

      {elegido ? (
        <div className="mt-1 rounded-lg border border-violet-500/40 bg-violet-500/10 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {elegido.displayName || elegido.username}
              </p>
              <p className="truncate text-[10px] text-zinc-400">
                @{elegido.username} · {elegido.chatId}
              </p>
              <p className="mt-1 truncate font-mono text-[10px] text-zinc-500" title={elegido.uid}>
                {elegido.uid}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Cambiar de usuario"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-violet-500/20 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            placeholder="Buscar por @usuario, nombre o ID de chat..."
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-violet-500"
          />

          <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-800">
            {filtrados.length === 0 ? (
              <li className="px-3 py-3 text-center text-[11px] text-zinc-500">
                Ningún usuario coincide con «{buscador}».
              </li>
            ) : (
              filtrados.map((u) => (
                <li key={u.uid}>
                  <button
                    type="button"
                    onClick={() => onChange(u.uid)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-violet-500/10"
                  >
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[10px] font-bold text-violet-300">
                        {(u.username || '?')[0].toUpperCase()}
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-zinc-200">
                        {u.displayName || u.username}
                      </span>
                      <span className="block truncate text-[10px] text-zinc-500">
                        @{u.username} · {u.chatId}
                      </span>
                    </span>

                    {u.role !== 'user' && (
                      <span className="flex-shrink-0 rounded border border-zinc-700 px-1 py-0.5 text-[9px] font-bold uppercase text-zinc-400">
                        {u.role}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};

/**
 * Las medallas cuya recompensa depende de una serie concreta.
 *
 * El filtro comprueba `tipo === 'xpEnAnime'`, pero TypeScript no
 * lo estrecha dentro de la función de flecha (no lo puede: el
 * filtro se ejecuta antes). Por eso se escribe el type guard a
 * mano, que además deja el tipo del requisito ya narrowed.
 */
const esMedallaDeAnime = (
  m: Medal,
): m is Medal & { requisito: { tipo: 'xpEnAnime'; animeId: string; valor: number } } =>
  m.requisito?.tipo === 'xpEnAnime';

export const GamificationSection: React.FC = () => {
  const { isAdmin } = useAuth();
  const { animes } = useCommunity();

  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [cargando, setCargando] = useState(true);

  const accionConfig = useAccion();
  const accionAjuste = useAccion();
  const accionRecalculo = useAccion();
  const accionMedalla = useAccion();

  // ── Ajuste manual ──────────────────────────────────
  const [ajusteUid, setAjusteUid] = useState('');
  const [ajusteCantidad, setAjusteCantidad] = useState(100);
  const [ajusteNota, setAjusteNota] = useState('');

  // ── Recalcular ─────────────────────────────────────
  const [recalculoUid, setRecalculoUid] = useState('');

  // ── Medalla a mano ────────────────────────────────
  const [medallaUid, setMedallaUid] = useState('');
  const [medallaId, setMedallaId] = useState(CATALOGO_MEDALLAS[0].id);

  // ── Ids de anime para las medallas temáticas ──────
  const [animeMedallas, setAnimeMedallas] = useState<Record<string, string>>({});

  /**
   * La configuración se lee con su propio `onSnapshot`, y no se
   * coge del `useProgression()`.
   *
   * Motivo: este panel va montado dentro del panel de
   * administración, y el `ProgressionProvider` de ahí sigue al
   * usuario de la sesión. Si el panel tomara la configuración de
   * ese contexto, estaría leyendo la de quien está mirando en
   * vez de la global, que es justo lo que hay que configurar.
   */
  useEffect(() => {
    const cancelar = escucharConfiguracion((c) => {
      setConfig(c);
      setAnimeMedallas(c.animeMedallas ?? {});
      setCargando(false);
    });

    return cancelar;
  }, []);

  if (cargando || !config) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <Loader2 size={18} className="animate-spin text-violet-400" />
        <span className="text-sm text-zinc-400">Cargando configuracion...</span>
      </div>
    );
  }

  const guardarConfig = async () => {
    const ok = await accionConfig.ejecutar(async () => {
      const guardada = await configurar({
        activo: config.activo,
        base: config.base,
        exponente: config.exponente,
        nivelesMaximos: config.nivelesMaximos,
        xpPorHito: config.xpPorHito,
        xp: config.xp,
        animeMedallas,
      });
      return 'Configuracion guardada.';
    });
    if (ok) setConfig((c) => (c ? { ...c, animeMedallas } : c));
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Activar ───────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Power size={16} className="text-violet-400" />
              Sistema de experiencia
            </h3>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-zinc-400">
              Mientras esté desactivado, las funciones no conceden nada. Se apaga solo
              al desplegar: así, si algo falla a medio desplegar, no quedan perfiles con
              XP y medallas que haya que recalcular a afterwards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const siguiente = !config.activo;
              setConfig({ ...config, activo: siguiente });
              void(async () => {
                const ok = await accionConfig.ejecutar(async () => {
                  await configurar({ activo: siguiente });
                  return siguiente
                    ? 'Gamificacion activada. A partir de ahora se concede XP.'
                    : 'Gamificacion desactivada. No se concedera mas XP.';
                });
                if (!ok) setConfig({ ...config, activo: !siguiente });
              })();
            }}
            disabled={accionConfig.estado === 'guardando'}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
              config.activo
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
            }`}
          >
            {accionConfig.estado === 'guardando' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Power size={14} />
            )}
            {config.activo ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        <div className="mt-4">
          <Aviso estado={accionConfig.estado} mensaje={accionConfig.mensaje} />
        </div>
      </section>

      {/* ── 2. Configurar ────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Settings2 size={16} className="text-slate-300" />
          Recompensas y curva de niveles
        </h3>

        {/* XP por acción */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Crear un hilo"
            value={config.xp.thread_created ?? 0}
            onChange={(n) =>
              setConfig({ ...config, xp: { ...config.xp, thread_created: n } })
            }
            ayuda="thread_created"
          />
          <Num
            label="Publicar un comentario"
            value={config.xp.comment_created ?? 0}
            onChange={(n) =>
              setConfig({ ...config, xp: { ...config.xp, comment_created: n } })
            }
            ayuda="comment_created"
          />
          <Num
            label="Me gusta en un hilo"
            value={config.xp.thread_like_received ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, thread_like_received: n },
              })
            }
            ayuda="thread_like_received"
          />
          <Num
            label="Me gusta en un comentario"
            value={config.xp.comment_like_received ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, comment_like_received: n },
              })
            }
            ayuda="comment_like_received"
          />
        </div>

        {/* XP por las reacciones y por votar en encuestas.
            Las reacciones son un sistema PARALELO al "Me gusta",
            asi que se pagan aparte y mas barato. Ponerlas a 0
            las apaga sin tocar las de los "me gusta". */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Reacción en un hilo"
            value={config.xp.thread_reaction_received ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, thread_reaction_received: n },
              })
            }
            ayuda="thread_reaction_received"
          />
          <Num
            label="Reacción en un comentario"
            value={config.xp.comment_reaction_received ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, comment_reaction_received: n },
              })
            }
            ayuda="comment_reaction_received"
          />
          {/* El follow va con las reacciones y no con los "me
              gusta" porque lo paga quien RECIBE el seguimiento, y
              solo una vez por persona (ver `onFollowChanged`). A 0
              lo quitas sin más: las medallas de comunidad siguen
              concediéndose, porque van por `followersReceived` y
              no por este XP. */}
          <Num
            label="Alguien te sigue"
            value={config.xp.follow_received ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, follow_received: n },
              })
            }
            ayuda="follow_received"
          />
          <Num
            label="Votar en una encuesta"
            value={config.xp.poll_vote_cast ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, poll_vote_cast: n },
              })
            }
            ayuda="poll_vote_cast"
          />
        </div>

        {/* ── Trivia diaria ───────────────────────────────
            Los cuatro se suman en una sola recompensa cuando la
            Cloud Function corrige el resultado, así que aquí se
            ve lo que aporta cada parte por separado. A 0 el
            término desaparece del total, no se queda a medias. */}
        <h4 className="mt-5 text-xs font-semibold text-zinc-400">
          Trivia diaria
        </h4>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Completar la trivia"
            value={config.xp.trivia_completed ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, trivia_completed: n },
              })
            }
            ayuda="trivia_completed"
          />
          <Num
            label="Acierto"
            value={config.xp.trivia_correct ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, trivia_correct: n },
              })
            }
            ayuda="trivia_correct"
          />
          <Num
            label="Bonus perfecto"
            value={config.xp.trivia_perfect ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, trivia_perfect: n },
              })
            }
            ayuda="trivia_perfect"
          />
          <Num
            label="Bonus de racha"
            value={config.xp.trivia_streak ?? 0}
            onChange={(n) =>
              setConfig({
                ...config,
                xp: { ...config.xp, trivia_streak: n },
              })
            }
            ayuda="trivia_streak"
          />
        </div>

        {/* Curva */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Num
            label="Base de la curva"
            value={config.base}
            onChange={(n) => setConfig({ ...config, base: n })}
            ayuda="Cuanto XP cuesta el nivel 2"
          />
          <Num
            label="Exponente"
            value={config.exponente}
            onChange={(n) => setConfig({ ...config, exponente: n })}
            ayuda="1.5 = cada nivel encarece un poco mas"
          />
          <Num
            label="Nivel maximo"
            value={config.nivelesMaximos}
            onChange={(n) => setConfig({ ...config, nivelesMaximos: n })}
            ayuda="El tope de la progresion"
          />
          <Num
            label="XP por hito de nivel"
            value={config.xpPorHito}
            onChange={(n) => setConfig({ ...config, xpPorHito: n })}
            ayuda="Al cruzar el nivel 5, 10, 25 y 50"
          />
        </div>

        {/* Animes de las medallas temáticas */}
        <div className="space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-[11px] text-zinc-400">
          Las medallas temáticas se consiguen dentro de una serie concreta, así que hay
          que decirles cuál. Sin esto, esa medalla es imposible de ganar.
        </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {CATALOGO_MEDALLAS.filter(esMedallaDeAnime).map((medal) => (
              <label key={medal.id} className="block">
                <span className="text-[11px] font-semibold text-zinc-400">
                  {medal.nombre}
                </span>
                <select
                  value={animeMedallas[medal.requisito.animeId] ?? ''}
                  onChange={(e) =>
                    setAnimeMedallas({
                      ...animeMedallas,
                      [medal.requisito.animeId]: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-violet-500"
                >
                  <option value="">Sin asignar</option>
                  {animes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={guardarConfig}
            disabled={accionConfig.estado === 'guardando'}
            className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-xs font-bold text-violet-300 transition-colors hover:bg-violet-600/30 disabled:opacity-50"
          >
            {accionConfig.estado === 'guardando' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Guardar configuracion
          </button>

          <Aviso estado={accionConfig.estado} mensaje={accionConfig.mensaje} />
        </div>
      </section>

      {/* ── 3. Catálogo de medallas ──────────────────── */}
      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Trophy size={16} className="text-amber-400" />
          Catalogo de medallas
        </h3>

        <p className="text-[11px] text-zinc-500">
          Se redefinen en el codigo, no desde aqui: es lo unico que se puede revisar en
          un pull request. Los requisitos se comprueban en el servidor cada vez que un
          usuario gana XP.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {CATALOGO_MEDALLAS.map((medal) => {
            const estilo = ESTILO_RAREZA[medal.rareza];
            return (
              <div
                key={medal.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
              >
                <span className="text-xl grayscale" title={medal.rareza}>
                  {medal.icono}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{medal.nombre}</p>
                  <p className="truncate text-[10px] text-zinc-500">
                    {medal.requisito
                      ? `${medal.requisito.tipo} >= ${medal.requisito.valor}`
                      : 'Se concede a mano'}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${estilo.chip}`}
                >
                  {estilo.etiqueta}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Corregir incidencias ──────────────────── */}
      <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Wrench size={16} className="text-orange-400" />
          Corregir incidencias
        </h3>

        {!isAdmin && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-300">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              Eres moderador, así que puedes consultar y configurar, pero ajustar XP,
              dar medallas y recalcular usuarios es solo del admin.
            </span>
          </p>
        )}

        {/* Ajuste de XP */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Ajuste manual de XP
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <UserPicker valor={ajusteUid} onChange={setAjusteUid} />

            <Num
              label="Cantidad (negativo para restar)"
              value={ajusteCantidad}
              onChange={setAjusteCantidad}
            />

            <label className="block">
              <span className="text-[11px] font-semibold text-zinc-400">Motivo</span>
              <input
                value={ajusteNota}
                onChange={(e) => setAjusteNota(e.target.value)}
                placeholder="Obligatorio: queda en el historial"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!isAdmin || !ajusteUid || accionAjuste.estado === 'guardando'}
            onClick={async () => {
              await accionAjuste.ejecutar(async () => {
                const r = await ajustarXpAdmin(ajusteUid, ajusteCantidad, ajusteNota);
                return `Listo. Ahora tiene ${r.xp.toLocaleString('es-ES')} XP (nivel ${r.nivel}).`;
              });
            }}
            className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-2 text-xs font-bold text-orange-300 transition-colors hover:bg-orange-500/25 disabled:opacity-50"
          >
            {accionAjuste.estado === 'guardando' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wrench size={14} />
            )}
            Aplicar ajuste
          </button>

          <Aviso estado={accionAjuste.estado} mensaje={accionAjuste.mensaje} />
        </div>

        {/* Recalcular */}
        <div className="space-y-3 border-t border-zinc-800 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Recalcular progreso
          </p>

          <p className="max-w-2xl text-[11px] leading-relaxed text-zinc-500">
            Para los usuarios que ya estaban antes de la gamificación. Las funciones solo
            saltan con contenido nuevo, así que su contenido antiguo no cuenta hasta que
            se recalcula. Es idempotente: repetirlo no vuelve a pagar lo ya pagado.
          </p>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,320px)_auto] sm:items-start">
            <UserPicker valor={recalculoUid} onChange={setRecalculoUid} />

            <button
              type="button"
              disabled={!isAdmin || !recalculoUid || accionRecalculo.estado === 'guardando'}
              onClick={async () => {
                await accionRecalculo.ejecutar(async () => {
                  const r = await recalcular(recalculoUid);
                  return `Concedidas ${r.concedidas}, omitidas ${r.omitidas}.`;
                });
              }}
              className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/15 px-4 py-2 text-xs font-bold text-violet-300 transition-colors hover:bg-violet-600/25 disabled:opacity-50"
            >
              {accionRecalculo.estado === 'guardando' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Users size={14} />
              )}
              Recalcular
            </button>
          </div>

          <Aviso estado={accionRecalculo.estado} mensaje={accionRecalculo.mensaje} />
        </div>

        {/* Medalla a mano */}
        <div className="space-y-3 border-t border-zinc-800 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Medalla a mano
          </p>

          <p className="max-w-2xl text-[11px] leading-relaxed text-zinc-500">
            Para "Miembro Fundador" y para corregir olvidos. Si quitas una medalla con
            requisito automático, el usuario volverá a ganarla en cuanto lo cumpla: solo
            las manuales se pueden quitar de verdad.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <UserPicker valor={medallaUid} onChange={setMedallaUid} />

            <label className="block">
              <span className="text-[11px] font-semibold text-zinc-400">Medalla</span>
              <select
                value={medallaId}
                onChange={(e) => setMedallaId(e.target.value)}
                className="mt-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              >
                {CATALOGO_MEDALLAS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icono} {m.nombre}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!isAdmin || !medallaUid || accionMedalla.estado === 'guardando'}
              onClick={async () => {
                await accionMedalla.ejecutar(async () => {
                  await concederMedallaAdmin(medallaUid, medallaId, false);
                  return 'Medalla concedida.';
                });
              }}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
            >
              Conceder
            </button>

            <button
              type="button"
              disabled={!isAdmin || !medallaUid || accionMedalla.estado === 'guardando'}
              onClick={async () => {
                await accionMedalla.ejecutar(async () => {
                  await concederMedallaAdmin(medallaUid, medallaId, true);
                  return 'Medalla retirada.';
                });
              }}
              className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
            >
              Retirar
            </button>
          </div>

          <Aviso estado={accionMedalla.estado} mensaje={accionMedalla.mensaje} />
        </div>
      </section>
    </div>
  );
};

export default GamificationSection;
