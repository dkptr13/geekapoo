import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle2,
  Flame,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  MENSAJE_ERROR,
  claveDia,
  escucharMiResultado,
  enviarTrivia,
  triviaDeHoy,
  type ErrorTrivia,
  type ResultadoCorregido,
  type TriviaDelDia,
} from '../../services/trivia';
import { TriviaRanking } from './TriviaRanking';
import type { TriviaQuestion, TriviaResult } from '../../types/trivia';

// ======================================================
// TRIVIA DIARIA
// ======================================================
//
// El juego entero en una pantalla: las tres preguntas seguidas y,
// al final, el resultado con el XP.
//
// ── Por qué las respuestas se mandan al FINAL ────────────
//
// Podría mandarse cada respuesta al elegirla, y así un corte de
// conexión a la tercera no perdería las dos primeras. Se manda
// todo junto porque las reglas dan "una trivia por día y por
// persona": si se mandara cada una, el jugador que cerrara la
// pestaña a mitad habría consumido el día sin haber acertado
// nada, que es la peor forma de perder. Perder el progreso de
// una partida a medio hacer es mucho más barato que perder el
// día.
//
// Mientras se juega, las respuestas están solo en el estado de
// React. Si se recarga, se empieza otra vez: es la misma
// consecuencia y no merece la pena guardarlas en el navegador.

// Fases del juego. Se pintan de una en una para que el jugador
// sepa en cuál está sin que haya que explicarlo.
type Fase = 'jugando' | 'enviando' | 'resultado';

interface Props {
  /** Abre la trivia desde Kapo-chan sin cambiar de pestaña. */
  resaltada?: boolean;
}

export const DailyTriviaView: FC<Props> = ({ resaltada = false }) => {
  const { currentUser, requireAuth, openAuth } = useAuth();

  const hoy = claveDia();

  const [trivia, setTrivia] = useState<TriviaDelDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorTrivia | null>(null);

  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [indice, setIndice] = useState(0);
  const [fase, setFase] = useState<Fase>('jugando');

  const [resultado, setResultado] = useState<(TriviaResult & Partial<ResultadoCorregido>) | null>(
    null,
  );

  // ── Cargar la trivia del día ───────────────────────────
  useEffect(() => {
    let vivo = true;
    setCargando(true);

    triviaDeHoy(hoy)
      .then((t) => {
        if (!vivo) return;
        setTrivia(t);
        if (!t) setError('sin-trivia');
      })
      .catch((e) => {
        console.error('[Trivia] No se pudo cargar la trivia de hoy:', e);
        if (vivo) setError('desconocido');
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, [hoy]);

  // ── Escuchar el resultado ──────────────────────────────
  //
  // Es una escucha y no un `getDoc` porque las notas las escribe
  // la Cloud Function DESPUÉS del envío: con una sola lectura se
  // vería el documento a medio corregir y la pantalla se quedaría
  // ahí mostrando "correct: 0".
  useEffect(() => {
    return escucharMiResultado(currentUser?.uid, hoy, (r) => {
      if (r) setResultado(r);
    });
  }, [currentUser?.uid, hoy]);

  const pregunta: TriviaQuestion | undefined = trivia?.questions[indice];

  const respondida = (id: string) => respuestas[id] !== undefined;

  const elegir = useCallback(
    (opcion: number) => {
      if (!pregunta || respondida(pregunta.id)) return;
      setRespuestas((r) => ({ ...r, [pregunta.id]: opcion }));
    },
    [pregunta, respuestas],
  );

  const siguiente = () => {
    if (!trivia) return;
    if (indice < trivia.questions.length - 1) {
      setIndice(indice + 1);
      return;
    }
    enviar();
  };

  const enviar = async () => {
    if (!currentUser) {
      requireAuth('jugar a la trivia diaria');
      return;
    }

    setFase('enviando');
    setError(null);

    try {
      await enviarTrivia(currentUser.uid, hoy, respuestas);
    } catch (e) {
      const motivo = (e as { motivo?: ErrorTrivia })?.motivo ?? 'desconocido';
      setError(motivo);
      // Se vuelve a "jugando" solo si de verdad se puede seguir:
      // si el problema es que ya la había hecho, no tiene sentido
      // dejarla pulsar "enviar" otra vez.
      setFase(motivo === 'ya-hecha' ? 'resultado' : 'jugando');
    }
  };

  // Las notas solo están cuando la función ha escrito `correct`.
  const corregido = typeof resultado?.correct === 'number';
  const hayResultado = fase === 'resultado' || corregido;

  // ── Estados que no son juego ───────────────────────────
  if (cargando) {
    return (
      <EstadoCargando />
    );
  }

  if (!currentUser) {
    return (
      <Aviso
        icono={<Brain size={28} className="text-violet-400" />}
        titulo="La trivia es para cuentas con nombre"
        texto="Inicia sesión para jugar a la trivia diaria y sumarte a la clasificación."
        boton={{ texto: 'Iniciar sesión', onClick: () => openAuth('login') }}
      />
    );
  }

  if (!trivia) {
    return (
      <Aviso
        icono={<Calendar size={28} className="text-zinc-500" />}
        titulo={error === 'sin-trivia' ? 'Hoy no hay trivia' : 'No se pudo cargar'}
        texto={MENSAJE_ERROR[error ?? 'sin-trivia']}
      />
    );
  }

  // ── Resultado ──────────────────────────────────────────
  if (hayResultado && resultado) {
    return (
      <ResultadoFinal
        resultado={resultado}
        corregido={corregido}
        error={error}
        streak={resultado.streak ?? 0}
      />
    );
  }

  // ── Juego ──────────────────────────────────────────────
  const total = trivia.questions.length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-4">
      <Cabecera
        indice={indice}
        total={total}
        label={trivia.label}
        fecha={hoy}
        resaltada={resaltada}
      />

      {error && (
        <p className="geo-aparece flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle size={14} className="flex-shrink-0" />
          {MENSAJE_ERROR[error]}
        </p>
      )}

      {pregunta && (
        <TarjetaPregunta
          pregunta={pregunta}
          elegida={respuestas[pregunta.id]}
          bloqueada={respondida(pregunta.id)}
          onElegir={elegir}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-500">
          Las respuestas se envían al terminar. {respuestas.length} de {total} contestadas.
        </p>

        <button
          type="button"
          onClick={siguiente}
          disabled={fase === 'enviando' || !pregunta || !respondida(pregunta.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-violet-600/25"
        >
          {fase === 'enviando' ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Enviando...
            </>
          ) : indice < total - 1 ? (
            'Siguiente'
          ) : (
            'Ver resultado'
          )}
        </button>
      </div>

      <TriviaRanking fecha={hoy} />
    </div>
  );
};

// ======================================================
// PIEZAS
// ======================================================

const Cabecera: FC<{ indice: number; total: number; label?: string; fecha: string; resaltada: boolean }> = ({
  indice,
  total,
  label,
  fecha,
  resaltada,
}) => (
  <header
    className={`rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-zinc-950 p-4 sm:p-5 ${
      resaltada ? 'ring-2 ring-violet-500/40' : ''
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="flex items-center gap-2 text-base font-black text-white sm:text-lg">
        <Brain size={20} className="text-violet-400" />
        Trivia diaria
      </h1>
      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-violet-300">
        Pregunta {Math.min(indice + 1, total)}/{total}
      </span>
    </div>

    <p className="mt-1 text-[11px] text-zinc-500">
      {label ? `${label} · ` : ''}
      {fecha}
    </p>

    {/* Progreso: tres rayas, la última activa. */}
    <div className="mt-3 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i < indice ? 'bg-violet-500' : i === indice ? 'bg-violet-400' : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  </header>
);

const TarjetaPregunta: FC<{
  pregunta: TriviaQuestion;
  elegida: number | undefined;
  bloqueada: boolean;
  onElegir: (opcion: number) => void;
}> = ({ pregunta, elegida, bloqueada, onElegir }) => (
  <section className="geo-pop-in rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {pregunta.category && (
        <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
          {pregunta.category}
        </span>
      )}
      {pregunta.difficulty && <Dificultad nivel={pregunta.difficulty} />}
    </div>

    <h2 className="text-sm font-bold leading-relaxed text-white sm:text-base">
      {pregunta.question}
    </h2>

    <ul className="mt-4 space-y-2">
      {pregunta.options.map((opcion, i) => {
        const esLaElegida = elegida === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onElegir(i)}
              disabled={bloqueada}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-150 active:scale-[0.99] ${
                bloqueada ? 'cursor-default' : 'hover:border-violet-500/60'
              } ${
                esLaElegida
                  ? 'border-violet-400/70 bg-violet-500/15 text-white'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-300'
              }`}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${
                  esLaElegida ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">{opcion}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </section>
);

const Dificultad: FC<{ nivel: string }> = ({ nivel }) => {
  const color =
    nivel === 'facil'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : nivel === 'dificil'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {nivel}
    </span>
  );
};

const ResultadoFinal: FC<{
  resultado: TriviaResult & Partial<ResultadoCorregido>;
  corregido: boolean;
  error: ErrorTrivia | null;
  streak: number;
}> = ({ resultado, corregido, error, streak }) => {
  const correct = resultado.correct ?? 0;
  const total = resultado.total ?? 0;
  const xp = resultado.xp;
  const xpGanado = resultado.xpGanado ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-4">
      <section
        className={`rounded-2xl border p-5 text-center sm:p-7 ${
          correct === total && total > 0
            ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-zinc-950'
            : 'border-violet-500/25 bg-gradient-to-b from-violet-950/30 to-zinc-950'
        }`}
      >
        <span className="mb-2 block text-3xl" aria-hidden="true">
          {correct === total && total > 0 ? '🎉' : correct > 0 ? '👏' : '😌'}
        </span>

        <h2 className="text-lg font-black text-white">
          {correct === total && total > 0 ? '¡Trivia perfecta!' : 'Trivia completada'}
        </h2>

        <p className="mt-1 font-mono text-sm text-zinc-300">
          {correct}/{total} respuestas correctas
        </p>

        {/* ── El XP, desglosado ─────────────────────────
            Se enseña cada término por separado porque el jugador
            acaba de jugar y quiere entender de dónde sale la
            cifra. Los números los pone la Cloud Function, no se
            calculan aquí. */}
        {corregido && xp && (
          <div className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
            <LineaXp texto="Por completar" valor={xp.completed} />
            <LineaXp texto={`${correct} acertada(s)`} valor={xp.correct} />
            {xp.perfect > 0 && <LineaXp texto="Bonus perfecto" valor={xp.perfect} />}
            {xp.streak > 0 && (
              <LineaXp texto={`Bonus de racha (${streak} días)`} valor={xp.streak} />
            )}
            <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 text-sm font-bold text-violet-300">
              <span>Total</span>
              <span className="font-mono">+{xpGanado} XP</span>
            </div>
          </div>
        )}

        {streak > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
            <Flame size={13} />
            {streak === 1 ? '¡Primera trivia!' : `🔥 ${streak} días seguidos`}
          </p>
        )}
      </section>

      {!corregido && (
        <p className="geo-aparece flex items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-xs text-violet-200">
          <Loader2 size={14} className="animate-spin" />
          {error === 'ya-hecha'
            ? 'Esta trivia ya estaba corregida. Actualizando...'
            : 'Guardando tu resultado y contando los XP...'}
        </p>
      )}

      {error && error !== 'ya-hecha' && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle size={14} />
          {MENSAJE_ERROR[error]}
        </p>
      )}

      {/* ── Explicaciones ─────────────────────────────
          Vienen en el resultado, ya corregidas: son el único
          momento en que se puede enseñar la respuesta buena sin
          que se pueda leer antes de jugar. */}
      {corregido && Object.keys(resultado.explicaciones ?? {}).length > 0 && (
        <Explicaciones
          explicaciones={resultado.explicaciones ?? {}}
          date={resultado.date}
        />
      )}

      <TriviaRanking fecha={resultado.date} />
    </div>
  );
};

const LineaXp: FC<{ texto: string; valor: number }> = ({ texto, valor }) => (
  <div className="flex items-center justify-between text-[11px]">
    <span className="text-zinc-400">{texto}</span>
    <span className="font-mono font-bold text-zinc-200">+{valor} XP</span>
  </div>
);

const Explicaciones: FC<{ explicaciones: Record<string, string>; date: string }> = ({
  explicaciones,
  date,
}) => (
  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
    <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-200">
      <Sparkles size={13} className="text-violet-400" />
      Explicaciones
    </h3>
    <ul className="mt-2 space-y-2">
      {Object.entries(explicaciones).map(([id, texto]) => (
        <li key={id} className="flex gap-2 text-[11px] leading-relaxed text-zinc-400">
          <span className="font-mono text-violet-400">#{id.replace(/\D/g, '') || '·'}</span>
          <span>{texto}</span>
        </li>
      ))}
    </ul>
    <p className="mt-2 text-[10px] text-zinc-600">
      Explicaciones de la trivia del {date}.
    </p>
  </section>
);

const EstadoCargando = () => (
  <div className="flex min-h-[320px] items-center justify-center">
    <div className="text-center">
      <Loader2 size={28} className="mx-auto mb-3 animate-spin text-violet-400" />
      <p className="text-xs text-zinc-500">Buscando la trivia de hoy...</p>
    </div>
  </div>
);

const Aviso: FC<{
  icono: React.ReactNode;
  titulo: string;
  texto: string;
  boton?: { texto: string; onClick: () => void };
}> = ({ icono, titulo, texto, boton }) => (
  <div className="flex min-h-[320px] items-center justify-center px-4">
    <div className="max-w-sm text-center">
      <div className="mb-3 flex justify-center">{icono}</div>
      <h2 className="text-sm font-bold text-white">{titulo}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{texto}</p>
      {boton && (
        <button
          type="button"
          onClick={boton.onClick}
          className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
        >
          {boton.texto}
        </button>
      )}
    </div>
  </div>
);
