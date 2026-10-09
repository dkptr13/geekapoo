import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  BarChart3,
  Check,
  Loader2,
  Lock,
  RotateCcw,
  Timer,
  Vote,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  TOPE_VOTOS_ESCUCHA,
  calcularPoll,
  leerResumen,
  listenPollVotes,
  votos,
  type PollVoteRow,
} from '../../services/polls';
import type { Poll, PollOption, PollSummary } from '../../types';

// ======================================================
// TARJETA DE ENCUESTA
// ======================================================
//
// Va dentro de la tarjeta del hilo, con la misma paleta que el
// resto de la web (zinc oscuro, violeta, bordes redondeados) para
// que parezca parte de la página y no una pieza pegada encima.
//
// Los resultados NO se escriben aquí: se CUENTAN a partir de los
// documentos de voto, que se escuchan en tiempo real y son la
// verdad. El resumen que guarda el servidor (`pollStats`) solo se
// usa para estadísticas en el panel, nunca para pintar aquí: si
// los dos no coincidieran un día, mandarían los votos.
//
// Reglas de la interacción:
//
//   - Antes de votar se ven las opciones, sin porcentajes.
//   - Después de votar se ven los resultados, con la opción
//     propia marcada.
//   - Sin sesión se ve todo y se pide iniciar sesión al pulsar.
//   - Si el autor no permitió cambiar de voto, las opciones se
//     quedan apagadas y se explica por qué, en vez de desaparecer
//     sin más.
//
// Los votos se escuchan al montar la tarjeta, y no antes: abrir
// la portada con veinte hilos NO abre veinte escuchas, solo una
// por encuesta que se está viendo.

interface PollCardProps {
  threadId: string;
  poll: Poll;
  onVotar: (threadId: string, poll: Poll, optionId: string) => Promise<void>;
  /** Quién puede cerrar la encuesta (autor o equipo). Solo para pintar el botón. */
  puedeCerrar?: boolean;
  onCerrar?: (threadId: string, cerrado: boolean) => Promise<void>;
  /** Votos ya leídos (los usa el panel de administración). */
  votosIniciales?: PollVoteRow[];
  /** `false` si ya hay una lectura hecha y no hace falta escuchar. */
  escuchaVotos?: boolean;
}

export const PollCard: FC<PollCardProps> = ({
  threadId,
  poll,
  onVotar,
  puedeCerrar = false,
  onCerrar,
  votosIniciales,
  escuchaVotos = true,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const [votes, setVotes] = useState<PollVoteRow[]>(votosIniciales ?? []);
  const [cargando, setCargando] = useState(escuchaVotos && !votosIniciales);
  const [votando, setVotando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Un reloj de un segundo: la cuenta atrás baja sola y una
  // encuesta que caduca mientras se mira pasa a "finalizada" sin
  // tener que recargar.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!escuchaVotos) return;
    return listenPollVotes(threadId, (rows) => {
      setVotes(rows);
      setCargando(false);
    });
  }, [threadId, escuchaVotos]);

  // Resumen del servidor, solo si los votos NO caben en la
  // escucha. Con normalidad no se lee nunca: lo que se cuenta son
  // los documentos de voto, que son la verdad.
  const [resumen, setResumen] = useState<PollSummary | null>(null);
  useEffect(() => {
    if (!escuchaVotos) return;

    if (votes.length < TOPE_VOTOS_ESCUCHA) {
      setResumen(null);
      return;
    }

    let vivo = true;
    void leerResumen(threadId)
      .then((r) => {
        if (vivo) setResumen(r);
      })
      .catch(() => {
        // Sin resumen se sigue enseñando lo que haya traído la
        // escucha: mejor un número acotado que una tarjeta vacía.
        if (vivo) setResumen(null);
      });

    return () => {
      vivo = false;
    };
  }, [threadId, escuchaVotos, votes.length]);

  // Con `Math.floor(.../1000)` solo se recalcula una vez por
  // segundo, que es justo cuando cambia algo: la cuenta atrás o el
  // cierre por caducidad.
  const resultado = useMemo(
    () => calcularPoll(poll, votes, currentUser?.uid, ahora, resumen),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poll, votes, currentUser?.uid, Math.floor(ahora / 1000), resumen],
  );

  const votar = async (opcion: PollOption) => {
    setError('');
    const ok = requireAuth('votar en esta encuesta');
    if (!ok) return;

    setVotando(opcion.id);
    try {
      await onVotar(threadId, poll, opcion.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el voto.');
    } finally {
      setVotando(null);
    }
  };

  const cerrar = async () => {
    if (!onCerrar || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await onCerrar(threadId, !poll.isClosed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
    } finally {
      setGuardando(false);
    }
  };

  const restantes = resultado.segundosRestantes;
  const cuentaAtras =
    restantes == null
      ? null
      : restantes >= 3600
        ? `${Math.floor(restantes / 3600)} h ${Math.floor((restantes % 3600) / 60)} min`
        : restantes >= 60
          ? `${Math.floor(restantes / 60)} min`
          : `${restantes} s`;

  return (
    <section
      className="mt-4 overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/30 to-zinc-950/60"
      aria-label="Encuesta del hilo"
    >
      {/* ── Cabecera ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-500/15 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-300">
          <BarChart3 size={13} className="text-violet-400" />
          Encuesta
        </span>

        <span className="flex items-center gap-2 text-[10px] font-semibold">
          {resultado.cerrada ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-zinc-400">
              <Lock size={10} />
              {poll.isClosed ? 'Cerrada' : 'Finalizada'}
            </span>
          ) : (
            cuentaAtras && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                <Timer size={10} />
                {cuentaAtras}
              </span>
            )
          )}

          {puedeCerrar && onCerrar && (
            <button
              type="button"
              onClick={cerrar}
              disabled={guardando}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-semibold text-zinc-400 transition-colors hover:border-violet-500/60 hover:text-violet-300 disabled:opacity-50"
            >
              {guardando ? '...' : poll.isClosed ? 'Reabrir' : 'Cerrar'}
            </button>
          )}
        </span>
      </div>

      {/* ── Pregunta ─────────────────────────────────── */}
      <h4 className="px-4 pt-3.5 text-sm font-bold leading-snug text-white">
        {resultado.question}
      </h4>

      {/* ── Opciones ─────────────────────────────────── */}
      <ul className="space-y-2 px-4 pt-3">
        {resultado.options.map((opcion) => {
          const n = opcion.votes;
          // Con el voto fijo (el autor no permite cambiar de
          // opinión) las opciones no se pueden pulsar: quedan en
          // gris y debajo se explica por qué.
          const bloqueado = resultado.votoFijo;

          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => votar(opcion)}
                disabled={bloqueado || votando !== null}
                title={
                  bloqueado
                    ? 'El autor de la encuesta no permite cambiar de voto'
                    : undefined
                }
                className={`group relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                  opcion.mia
                    ? 'border-violet-400/70 bg-violet-500/10'
                    : 'border-zinc-800 bg-zinc-950/50 hover:border-violet-500/50'
                } ${
                  bloqueado && !opcion.mia
                    ? 'cursor-not-allowed opacity-60'
                    : 'active:scale-[0.99]'
                }`}
              >
                {/* Barra de progreso. Va POR DEBAJO del texto y
                    no encima: si no, el texto se come el color de
                    fondo y deja de leerse. */}
                {resultado.haVotado && n > 0 && (
                  <span
                    className={`geo-barra absolute inset-y-0 left-0 rounded-xl transition-[width] duration-500 ease-out ${
                      opcion.mia
                        ? 'bg-gradient-to-r from-violet-500/45 to-fuchsia-500/25'
                        : 'bg-violet-500/20'
                    }`}
                    style={{ width: `${opcion.porcentaje}%` }}
                    aria-hidden="true"
                  />
                )}

                <span className="relative flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      opcion.mia
                        ? 'border-violet-400 bg-violet-500'
                        : 'border-zinc-600 group-hover:border-violet-400'
                    }`}
                  >
                    {opcion.mia && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>

                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                      opcion.mia ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {opcion.text}
                  </span>

                  {votando === opcion.id && (
                    <Loader2 size={13} className="animate-spin text-violet-300" />
                  )}

                  {resultado.haVotado && (
                    <span className="flex flex-shrink-0 items-baseline gap-1 font-mono">
                      <span className="text-[11px] font-bold text-violet-200">
                        {opcion.porcentaje}%
                      </span>
                      <span className="text-[10px] text-zinc-500">{n}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {cargando && (
        <p className="flex items-center gap-1.5 px-4 pt-2 text-[10px] text-zinc-500">
          <Loader2 size={11} className="animate-spin" />
          Contando los votos...
        </p>
      )}

      {/* ── Pie: total y estado ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="text-[11px] font-semibold text-zinc-400">
          {resultado.totalVotes > 0
            ? `${votos(resultado.totalVotes)} en total`
            : 'Todavía nadie ha votado'}
        </span>

        {resultado.votoFijo ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock size={10} />
            Un voto por persona
          </span>
        ) : resultado.cerrada ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock size={10} />
            {poll.isClosed ? 'El autor la cerró' : 'Se acabó el tiempo'}
          </span>
        ) : resultado.haVotado && poll.allowChangeVote ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-violet-300/80">
            <RotateCcw size={10} />
            Puedes cambiar de opción
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Vote size={10} />
            Un voto por persona
          </span>
        )}
      </div>

      {error && (
        <p className="geo-aparece mx-4 mb-3 flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </section>
  );
};
