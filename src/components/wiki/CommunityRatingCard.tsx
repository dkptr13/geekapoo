import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Star } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import {
  obtenerMiVotoAnime,
  votarAnime,
} from '../../services/animeStats';
import { formatearNumero } from '../../utils/follows';

// ======================================================
// PUNTUACIÓN DE LA COMUNIDAD
// ======================================================
//
// Va en la columna derecha de la ficha, debajo de la ficha
// técnica. Es independiente de:
//
//   - IMDb (`anime.rating`), que es una nota externa.
//   - Me gusta (`likesCount`), que mide popularidad.
//   - Visualizaciones (`viewsCount`), que mide visitas.
//
// Cada usuario tiene un único voto por anime. La Cloud Function
// actualiza suma, contador y media en una transacción; el cliente
// solo lee el agregado y su propio voto.

interface CommunityRatingCardProps {
  animeId: string;
  animeTitle: string;
  sum?: number;
  count?: number;
  avg?: number;
}

function mediaDe(sum: number, count: number, avg?: number): number {
  if (count > 0) {
    return Math.round((sum / count) * 10) / 10;
  }
  return Number.isFinite(avg) ? Math.max(0, Number(avg)) : 0;
}

function textoMedia(media: number): string {
  return media.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export const CommunityRatingCard: FC<CommunityRatingCardProps> = ({
  animeId,
  animeTitle,
  sum = 0,
  count = 0,
  avg = 0,
}) => {
  const { currentUser, requireAuth } = useAuth();

  const [resumen, setResumen] = useState(() => ({
    media: mediaDe(sum, count, avg),
    votos: Math.max(0, count),
  }));
  const [miVoto, setMiVoto] = useState<number | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [cargandoVoto, setCargandoVoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const votoLocal = useRef(false);

  // Al cambiar de serie se vuelve a la copia de los props. Después
  // de votar, los props pueden llegar con la copia cacheada anterior;
  // no deben pisar el resultado que ya devolvió la transacción.
  useEffect(() => {
    votoLocal.current = false;
    setResumen({
      media: mediaDe(sum, count, avg),
      votos: Math.max(0, count),
    });
    setOk('');
    setError('');
  }, [animeId]);

  useEffect(() => {
    if (votoLocal.current) return;
    setResumen({
      media: mediaDe(sum, count, avg),
      votos: Math.max(0, count),
    });
  }, [sum, count, avg]);

  // Voto personal: una lectura por ficha y usuario. No hay listener.
  useEffect(() => {
    let activo = true;

    if (!currentUser?.uid) {
      setMiVoto(null);
      setSeleccion(null);
      setCargandoVoto(false);
      return;
    }

    setCargandoVoto(true);
    void obtenerMiVotoAnime(animeId, currentUser.uid)
      .then((voto) => {
        if (!activo) return;
        setMiVoto(voto);
        setSeleccion(voto);
      })
      .finally(() => {
        if (activo) setCargandoVoto(false);
      });

    return () => {
      activo = false;
    };
  }, [animeId, currentUser?.uid]);

  const estrellas = useMemo(
    () => Array.from({ length: 10 }, (_, i) => i + 1),
    [],
  );
  const nivelVisible = hover ?? seleccion ?? 0;
  const votosTexto =
    resumen.votos === 1 ? '1 voto' : `${formatearNumero(resumen.votos)} votos`;

  const votar = async () => {
    if (!currentUser) {
      requireAuth('votar esta serie');
      return;
    }
    if (seleccion === null) {
      setError('Elige una puntuación del 1 al 10.');
      return;
    }

    setGuardando(true);
    setError('');
    setOk('');
    try {
      const resultado = await votarAnime(animeId, seleccion);
      votoLocal.current = true;
      setResumen({ media: resultado.media, votos: resultado.votos });
      setMiVoto(resultado.miVoto);
      setSeleccion(resultado.miVoto);
      setOk('¡Voto guardado!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar tu voto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">
          Puntuación de la comunidad
        </h3>
        <p className="mt-0.5 text-[10px] text-zinc-500">
          Votos de 1 a 10 de las personas registradas.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star size={22} className="fill-amber-400 text-amber-400" />
          <span className="font-mono text-2xl font-black text-white">
            {textoMedia(resumen.media)}
            <span className="ml-0.5 text-sm font-bold text-zinc-500">/10</span>
          </span>
        </div>
        <span className="text-[11px] font-semibold text-zinc-400">
          {votosTexto}
        </span>
      </div>

      {resumen.votos === 0 && (
        <p className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2 text-[10px] leading-relaxed text-violet-200/80">
          Todavía no hay votos. Sé quien estrene la puntuación de{' '}
          {animeTitle}.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-zinc-300">
          {miVoto !== null
            ? `Tu puntuación: ${miVoto}/10`
            : 'Selecciona tu puntuación'}
        </p>

        <div
          className="flex flex-wrap items-center gap-0.5"
          role="group"
          aria-label="Puntuación del 1 al 10"
          onMouseLeave={() => setHover(null)}
        >
          {estrellas.map((n) => {
            const activa = n <= nivelVisible;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSeleccion(n);
                  setOk('');
                  setError('');
                }}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(null)}
                aria-label={`Puntuar con ${n} de 10`}
                aria-pressed={seleccion === n}
                className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={19}
                  className={
                    activa
                      ? 'fill-violet-400 text-violet-400'
                      : 'text-zinc-600'
                  }
                />
              </button>
            );
          })}
          {seleccion !== null && (
            <span className="ml-1 font-mono text-[11px] font-bold text-violet-300">
              {seleccion}/10
            </span>
          )}
        </div>

        {cargandoVoto && (
          <p className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Loader2 size={11} className="animate-spin" />
            Cargando tu voto...
          </p>
        )}

        <button
          type="button"
          onClick={() => void votar()}
          disabled={guardando || (currentUser !== null && seleccion === null)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando && <Loader2 size={13} className="animate-spin" />}
          {!currentUser
            ? 'Inicia sesión para votar'
            : miVoto !== null
              ? 'Modificar mi voto'
              : 'Votar esta serie'}
        </button>

        {error && (
          <p className="flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[10px] text-red-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {ok && (
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 size={12} />
            {ok}
          </p>
        )}

        {miVoto !== null && (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Puedes cambiar tu voto cuando quieras; no se crea un voto
            adicional.
          </p>
        )}
      </div>
    </section>
  );
};
