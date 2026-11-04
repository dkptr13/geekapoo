import { useEffect, useMemo, useRef, useState } from 'react';
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
  calcularPoll,
  fechaResumenEnMs,
  votos,
  type PollVoteRow,
} from '../../services/polls';
import {
  listenChatPollSummary,
  listenMyChatPollVote,
  setChatPollClosed,
  voteChatPoll,
} from '../../services/chatPolls';
import type { Poll, PollSummary } from '../../types';

// ======================================================
// ENCUESTA DENTRO DE UN MENSAJE DE CHAT
// ======================================================
//
// La versión compacta de `PollCard` (hilos) para las burbujas.
//
// Los totales vienen de `pollStats/summary`, que mantiene la Cloud
// Function; el cliente solo lee su propio voto. Antes esta tarjeta
// contaba toda la subcolección `pollVotes` y cualquier miembro del
// chat podía ver quién había votado qué.
//
// Las escuchas se abren al montar la tarjeta. En un historial
// con varias encuestas hay una escucha por tarjeta visible,
// igual que en los hilos. Es una escucha del resumen y, si hay
// sesión, otra del voto propio.
//
// Cerrar la encuesta lo puede hacer el autor del mensaje y, en
// chats de club, los moderadores (`puedeCerrar` lo decide el
// padre; la garantía está en las reglas).
// ======================================================

interface ChatPollCardProps {
  chatId: string;
  messageId: string;
  poll: Poll;
  puedeCerrar?: boolean;
}

export const ChatPollCard: FC<ChatPollCardProps> = ({
  chatId,
  messageId,
  poll,
  puedeCerrar = false,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const [miVoto, setMiVoto] = useState<PollVoteRow | null>(null);
  const [resumen, setResumen] = useState<PollSummary | null>(null);
  const [cargando, setCargando] = useState(true);
  const [votando, setVotando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const votoPendienteRef = useRef<{ anterior: number | null } | null>(null);

  // La cuenta atrás baja sola y una encuesta que caduca
  // mientras se mira pasa a "finalizada" sin recargar.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setCargando(true);
    const parar: (() => void)[] = [];

    parar.push(
      listenChatPollSummary(chatId, messageId, (nuevo, e) => {
        const pendiente = votoPendienteRef.current;
        if (pendiente) {
          const actualizado = fechaResumenEnMs(nuevo);
          const esNueva =
            Boolean(nuevo) &&
            (pendiente.anterior === null ||
              (actualizado !== null && actualizado > pendiente.anterior));
          if (!esNueva) {
            setCargando(false);
            return;
          }
          votoPendienteRef.current = null;
        }

        setResumen(nuevo);
        if (e) setError('No se pudieron cargar los resultados.');
        setCargando(false);
      }),
    );

    if (currentUser?.uid) {
      parar.push(
        listenMyChatPollVote(chatId, messageId, currentUser.uid, (voto, e) => {
          setMiVoto(voto);
          if (e) setError('No se pudo comprobar tu voto.');
          setCargando(false);
        }),
      );
    } else {
      setMiVoto(null);
    }

    return () => parar.forEach((f) => f());
  }, [chatId, messageId, currentUser?.uid]);

  const resultado = useMemo(
    () =>
      calcularPoll(
        poll,
        miVoto ? [miVoto] : [],
        currentUser?.uid,
        ahora,
        resumen,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poll, miVoto, currentUser?.uid, Math.floor(ahora / 1000), resumen],
  );

  const votar = async (optionId: string) => {
    setError('');
    const ok = requireAuth('votar en esta encuesta');
    if (!ok || !currentUser) return;

    const anteriorResumen = resumen;
    const anteriorVoto = miVoto;

    if (miVoto?.optionId !== optionId) {
      const anterior = miVoto?.optionId ?? null;
      votoPendienteRef.current = { anterior: fechaResumenEnMs(resumen) };
      setMiVoto({
        id: currentUser.uid,
        userId: currentUser.uid,
        optionId,
      });
      setResumen((prev) => {
        const options = { ...(prev?.options ?? {}) };
        if (anterior) {
          const restantes = (options[anterior] ?? 0) - 1;
          if (restantes > 0) options[anterior] = restantes;
          else delete options[anterior];
        }
        options[optionId] = (options[optionId] ?? 0) + 1;
        return {
          ...(prev ?? { options: {}, totalVotes: 0 }),
          options,
          totalVotes: (prev?.totalVotes ?? 0) + (anterior ? 0 : 1),
        };
      });
    }

    setVotando(optionId);
    try {
      await voteChatPoll(chatId, messageId, poll, optionId, currentUser.uid);
    } catch (e) {
      votoPendienteRef.current = null;
      setResumen(anteriorResumen);
      setMiVoto(anteriorVoto);
      setError(e instanceof Error ? e.message : 'No se pudo registrar el voto.');
    } finally {
      setVotando(null);
    }
  };

  const cerrar = async () => {
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      await setChatPollClosed(chatId, messageId, !poll.isClosed);
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
    <div
      className="mt-1.5 w-full max-w-72 overflow-hidden rounded-xl border border-violet-500/25 bg-zinc-950/70"
      aria-label="Encuesta del mensaje"
    >
      {/* ── Cabecera ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-violet-500/15 px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <BarChart3 size={11} className="text-violet-400" />
          Encuesta
        </span>

        <span className="flex items-center gap-1.5 text-[10px] font-semibold">
          {resultado.cerrada ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/80 px-1.5 py-px text-zinc-400">
              <Lock size={9} />
              {poll.isClosed ? 'Cerrada' : 'Finalizada'}
            </span>
          ) : (
            cuentaAtras && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-emerald-300">
                <Timer size={9} />
                {cuentaAtras}
              </span>
            )
          )}

          {puedeCerrar && (
            <button
              type="button"
              onClick={cerrar}
              disabled={guardando}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-1.5 py-px font-semibold text-zinc-400 transition-colors hover:border-violet-500/60 hover:text-violet-300 disabled:opacity-50"
            >
              {guardando ? '...' : poll.isClosed ? 'Reabrir' : 'Cerrar'}
            </button>
          )}
        </span>
      </div>

      {/* ── Pregunta ─────────────────────────────────── */}
      <p className="px-2.5 pt-2 text-xs font-bold leading-snug text-white">
        {resultado.question}
      </p>

      {/* ── Opciones ─────────────────────────────────── */}
      <ul className="space-y-1.5 px-2.5 pt-2">
        {resultado.options.map((opcion) => {
          const n = opcion.votes;
          const bloqueado = resultado.votoFijo;

          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => votar(opcion.id)}
                disabled={bloqueado || votando !== null}
                title={
                  bloqueado
                    ? 'El autor de la encuesta no permite cambiar de voto'
                    : undefined
                }
                className={`group relative w-full overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-all duration-150 ${
                  opcion.mia
                    ? 'border-violet-400/70 bg-violet-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-violet-500/50'
                } ${
                  bloqueado && !opcion.mia
                    ? 'cursor-not-allowed opacity-60'
                    : 'active:scale-[0.99]'
                }`}
              >
                {resultado.haVotado && n > 0 && (
                  <span
                    className={`absolute inset-y-0 left-0 rounded-lg transition-[width] duration-200 ease-out ${
                      opcion.mia
                        ? 'bg-gradient-to-r from-violet-500/45 to-fuchsia-500/25'
                        : 'bg-violet-500/20'
                    }`}
                    style={{ width: `${opcion.porcentaje}%` }}
                    aria-hidden="true"
                  />
                )}

                <span className="relative flex items-center gap-1.5">
                  <span
                    className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      opcion.mia
                        ? 'border-violet-400 bg-violet-500'
                        : 'border-zinc-600 group-hover:border-violet-400'
                    }`}
                  >
                    {opcion.mia && <Check size={9} className="text-white" strokeWidth={3} />}
                  </span>

                  <span
                    className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${
                      opcion.mia ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {opcion.text}
                  </span>

                  {votando === opcion.id && (
                    <Loader2 size={12} className="animate-spin text-violet-300" />
                  )}

                  {resultado.haVotado && (
                    <span className="flex flex-shrink-0 items-baseline gap-1 font-mono">
                      <span className="text-[10px] font-bold text-violet-200">
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
        <p className="flex items-center gap-1.5 px-2.5 pt-1.5 text-[10px] text-zinc-500">
          <Loader2 size={10} className="animate-spin" />
          Cargando resultados...
        </p>
      )}

      {/* ── Pie: total y estado ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-2">
        <span className="text-[10px] font-semibold text-zinc-400">
          {resultado.totalVotes > 0
            ? `${votos(resultado.totalVotes)} en total`
            : 'Todavía nadie ha votado'}
        </span>

        {resultado.votoFijo ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock size={9} />
            Un voto por persona
          </span>
        ) : resultado.cerrada ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock size={9} />
            {poll.isClosed ? 'El autor la cerró' : 'Se acabó el tiempo'}
          </span>
        ) : resultado.haVotado && poll.allowChangeVote ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-violet-300/80">
            <RotateCcw size={9} />
            Puedes cambiar de opción
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
            <Vote size={9} />
            Un voto por persona
          </span>
        )}
      </div>

      {error && (
        <p className="mx-2.5 mb-2 flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-300">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}

    </div>
  );
};
