import { useState } from 'react';
import type { FC } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';

import { DURACIONES, LIMITS } from '../../services/polls';
import type { NewPollInput } from '../../types';

// ======================================================
// FORMULARIO DE LA ENCUESTA (al publicar un hilo)
// ======================================================
//
// Va dentro del formulario de "Publicar Nuevo Hilo", debajo del
// contenido. Está apagado por defecto: una encuesta es un extra,
// y el hilo se publica igual sin ella.
//
// El borrador se guarda en el padre (`HomeFeed`), que es quien
// llama a `normalizarPoll()` y lo manda a Firestore. Aquí solo se
// recogen los datos y se avisa de lo que no cuadra.

export interface PollDraft {
  question: string;
  options: string[];
  duration: string;
  allowChangeVote: boolean;
}

export const POLL_VACIO: PollDraft = {
  question: '',
  options: ['', ''],
  duration: '',
  allowChangeVote: false,
};

interface PollComposerProps {
  value: PollDraft;
  onChange: (value: PollDraft) => void;
  /** Texto de error que viene de `normalizarPoll` al publicar. */
  error?: string;
}

/** Dos opciones de arranque, que es el mínimo que admite la encuesta. */
const MIN = LIMITS.minOptions;

export const PollComposer: FC<PollComposerProps> = ({ value, onChange, error }) => {
  const cambiar = (parcial: Partial<PollDraft>) => onChange({ ...value, ...parcial });

  const cambiarOpcion = (i: number, texto: string) => {
    const options = [...value.options];
    options[i] = texto;
    cambiar({ options });
  };

  const anadir = () => {
    if (value.options.length >= LIMITS.maxOptions) return;
    cambiar({ options: [...value.options, ''] });
  };

  const quitar = (i: number) => {
    if (value.options.length <= MIN) return;
    const options = value.options.filter((_, idx) => idx !== i);
    cambiar({ options });
  };

  const usadas = value.options.map((o) => o.trim()).filter(Boolean).length;
  const valida =
    value.question.trim().length > 0 && usadas >= MIN && usadas <= LIMITS.maxOptions;

  return (
    <div className="space-y-3 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-violet-400" />
        <h4 className="text-xs font-bold text-white">Encuesta</h4>
      </div>

      <input
        type="text"
        value={value.question}
        onChange={(e) => cambiar({ question: e.target.value })}
        placeholder="¿Quién gana este combate?"
        maxLength={LIMITS.question}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
      />

      <ul className="space-y-2">
        {value.options.map((opcion, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[10px] font-bold text-zinc-400">
              {i + 1}
            </span>
            <input
              type="text"
              value={opcion}
              onChange={(e) => cambiarOpcion(i, e.target.value)}
              placeholder={`Opción ${i + 1}`}
              maxLength={LIMITS.option}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => quitar(i)}
              disabled={value.options.length <= MIN}
              title={
                value.options.length <= MIN
                  ? `Hacen falta al menos ${MIN} opciones`
                  : 'Quitar esta opción'
              }
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={anadir}
          disabled={value.options.length >= LIMITS.maxOptions}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet-500/50 px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Añadir opción
        </button>

        <span className="font-mono text-[10px] text-zinc-500">
          {usadas}/{LIMITS.maxOptions} opciones
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="poll-duracion"
            className="mb-1 block text-[11px] font-medium text-zinc-400"
          >
            Duración
          </label>
          <select
            id="poll-duracion"
            value={value.duration}
            onChange={(e) => cambiar({ duration: e.target.value })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            {DURACIONES.map((d) => (
              <option key={d.value || 'sin-limite'} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-2 self-end rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
          <input
            type="checkbox"
            checked={value.allowChangeVote}
            onChange={(e) => cambiar({ allowChangeVote: e.target.checked })}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-violet-500"
          />
          <span className="text-[11px] leading-snug text-zinc-300">
            Permitir cambiar de voto
            <span className="block text-[10px] text-zinc-500">
              Si está apagado, cada persona vota una sola vez.
            </span>
          </span>
        </label>
      </div>

      {/* El aviso solo aparece cuando ya se ha intentado
          publicar: mientras se escribe la encuesta molesta estar
          spotting errores de tipografía en cada pulsación. */}
      {error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      )}

      {!valida && !error && (
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Escribe la pregunta y deja al menos {MIN} opciones. Si la dejas sin
          escribir, el hilo se publica igual y sin encuesta.
        </p>
      )}
    </div>
  );
};

/** Convierte el borrador del formulario en lo que espera el servicio. */
export function draftANewPoll(draft: PollDraft): NewPollInput {
  return {
    question: draft.question,
    options: draft.options,
    duration: draft.duration,
    allowChangeVote: draft.allowChangeVote,
  };
}
