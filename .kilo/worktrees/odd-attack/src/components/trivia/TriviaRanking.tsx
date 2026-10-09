import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Flame, Loader2, Trophy } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { MEDALLAS_PODIO, leerRanking, type FilaRanking } from '../../services/trivia';

// ======================================================
// RANKING DE LA TRIVIA
// ======================================================
//
// Sale al final de la trivia y también se puede ver antes de
// jugar. Tres periodos: el del día (que es el que está en juego
// ahora), el de la semana y el histórico.
//
// Se pinta con un `getDoc` y no con una escucha porque cambia muy
// pocas veces al día (solo cuando alguien juega) y no tiene
// sentido tener un listener abierto en una pantalla que se mira un
// momento.

type Periodo = 'diario' | 'semanal' | 'historico';

const PERIODOS: { id: Periodo; etiqueta: string }[] = [
  { id: 'diario', etiqueta: 'Hoy' },
  { id: 'semanal', etiqueta: 'Semanal' },
  { id: 'historico', etiqueta: 'Histórico' },
];

export const TriviaRanking: FC<{ fecha: string }> = ({ fecha }) => {
  const { currentUser } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>('diario');
  const [filas, setFilas] = useState<FilaRanking[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setCargando(true);

    leerRanking(periodo, fecha)
      .then((r) => {
        if (vivo) setFilas(r.filas);
      })
      .catch((e) => console.error('[Trivia] No se pudo leer el ranking:', e))
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, [periodo, fecha]);

  // La fila propia se busca aunque no esté en las veinte
  // primeras: si el jugador ha jugado y sigue por el puesto 40,
  // quiere verse igual, y el `top 20` es para el podio.
  const propia = currentUser ? filas.find((f) => f.userId === currentUser.uid) : undefined;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <Trophy size={14} className="text-amber-400" />
          Ranking de trivia
        </h3>

        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                periodo === p.id
                  ? 'bg-violet-600/30 text-violet-200 ring-1 ring-violet-500/40'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="flex items-center justify-center gap-2 py-6 text-[11px] text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Cargando clasificación...
        </p>
      ) : filas.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-zinc-500">
          Nadie ha jugado todavía a este periodo. Sé el primero.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {filas.map((f) => (
            <li
              key={f.userId}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                f.userId === currentUser?.uid
                  ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                  : ''
              }`}
            >
              <span className="w-7 flex-shrink-0 text-center font-mono text-[11px] font-bold">
                {MEDALLAS_PODIO[f.posicion - 1] ?? <span className="text-zinc-500">{f.posicion}</span>}
              </span>

              {f.avatarUrl ? (
                <img
                  src={f.avatarUrl}
                  alt=""
                  className="h-5 w-5 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[9px]">
                  {f.userName.slice(0, 1).toUpperCase()}
                </span>
              )}

              <span className="min-w-0 flex-1 truncate font-semibold text-zinc-200">
                {f.userName}
                {f.userId === currentUser?.uid && (
                  <span className="ml-1 text-[10px] text-violet-400">(tú)</span>
                )}
              </span>

              {f.streak > 1 && (
                <span className="hidden items-center gap-0.5 text-[10px] text-orange-400 sm:flex">
                  <Flame size={9} />
                  {f.streak}
                </span>
              )}

              <span className="flex-shrink-0 font-mono text-[11px] font-bold text-violet-300">
                {f.points}
              </span>
            </li>
          ))}
        </ul>
      )}

      {propia && propia.posicion > 20 && (
        <p className="mt-2 border-t border-zinc-800 pt-2 text-center text-[11px] text-zinc-400">
          Estás en el puesto <span className="font-mono font-bold text-violet-300">#{propia.posicion}</span>{' '}
          con <span className="font-mono font-bold">{propia.points}</span> puntos
          {propia.quizzes > 0 && ` · ${propia.quizzes} trivia(s) · ${propia.correct} aciertos`}
        </p>
      )}
    </section>
  );
};
