import type { FC, ChangeEvent } from 'react';

import { ALTURA_CARD_PERSONAJE } from '../../utils/layout';

// ======================================================
// CAMPOS DE FORMULARIO DEL PANEL
// ======================================================
// En su propio archivo para no repetir el mismo marcado de
// label + input + error en cada editor. Todos avisan del
// cambio con la cadena ya escrita, y solo a propósito
// "number" devuelve number, para no tener que convertirlo
// en cada sitio.
// ======================================================

const baseInput =
  'w-full rounded-lg border bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 ' +
  'focus:outline-none transition-colors';

const idle = 'border-zinc-800 focus:border-violet-500';
const invalid = 'border-red-500/60 focus:border-red-500';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

const FieldShell: FC<FieldShellProps> = ({ label, error, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold text-zinc-300">{label}</span>
    {children}
    {error ? (
      <span className="mt-1 block text-[10px] text-red-400">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-[10px] text-zinc-600">{hint}</span>
    ) : null}
  </label>
);

// ── Texto corto ──────────────────────────────────────

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const TextField: FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
}) => (
  <FieldShell label={label} error={error} hint={hint}>
    <input
      type="text"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${baseInput} ${error ? invalid : idle}`}
    />
  </FieldShell>
);

// ── Texto largo ──────────────────────────────────────

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Se pinta cuando no hay error, como en el resto de campos. */
  hint?: string;
  rows?: number;
  placeholder?: string;
}

export const TextArea: FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  rows = 4,
  placeholder,
}) => (
  <FieldShell label={label} error={error} hint={hint}>

    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`${baseInput} resize-y leading-relaxed ${error ? invalid : idle}`}
    />
  </FieldShell>
);

// ── Número ───────────────────────────────────────────

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

/**
 * El estado se mantiene como string a propósito. Si se
 * guardara como number, al borrar el campo para escribir el
 * siguiente año el valor sería NaN y el input se quedaría
 * bloqueado sin poder escribir.
 */
export const NumberField: FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
}) => (
  <FieldShell label={label} error={error} hint={hint}>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${error ? invalid : idle}`}
    />
  </FieldShell>
);

// ── Desplegable ──────────────────────────────────────

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
}

export const SelectField: FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  hint,
}) => (
  <FieldShell label={label} error={error} hint={hint}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${error ? invalid : idle}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </FieldShell>
);

// ── Encuadre de una imagen ────────────────────────────

interface FocalFieldProps {
  label: string;
  /** URL de la imagen que se quiere encuadrar. */
  src: string;
  value: { x: number; y: number };
  onChange: (value: { x: number; y: number }) => void;
  hint?: string;
  /**
   * Alto del recuadro, como clase de Tailwind.
   *
   * Por defecto usa el de la tarjeta de personaje de la wiki, que
   * es el caso original. La portada, el banner y la miniatura se
   * recortan en recuadros con otras formas, así que para esos se
   * pasa el suyo: si el ajuste no tiene la proporción del destino,
   * no sirve de nada para encuadrar.
   */
  alto?: string;
}

/**
 * Elige a qué parte de la imagen se ancla el recorte.
 *
 * Es un cuadro con la foto y un punto que se arrastra. Con
 * "object-position" al 50% se ve el centro, y moviendo el punto
 * hacia arriba la imagen se desplaza, que es justo lo que hace
 * falta cuando la cabeza queda fuera.
 *
 * El alto del cuadro es el mismo que el de la tarjeta de la
 * wiki, para que lo que se ve aquí sea lo que se verá allí.
 */
export const FocalField: FC<FocalFieldProps> = ({
  label,
  src,
  value,
  onChange,
  hint,
  alto = ALTURA_CARD_PERSONAJE,
}) => {
  const setFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    onChange({
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    });
  };

  const pos = `${value.x * 100}% ${value.y * 100}%`;

  return (
    <FieldShell label={label} hint={hint}>
      <div
        onMouseDown={(e) => {
          setFromEvent(e);
          // Se sigue el arrastre aunque el puntero se salga del
          // cuadro, que es lo normal al buscar el encuadre.
          const seguir = (ev: MouseEvent) => {
            const r = e.currentTarget.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            onChange({
              x: Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)),
              y: Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)),
            });
          };
          const soltar = () => {
            window.removeEventListener('mousemove', seguir);
            window.removeEventListener('mouseup', soltar);
          };
          window.addEventListener('mousemove', seguir);
          window.addEventListener('mouseup', soltar);
        }}
        className={`relative ${alto} w-full cursor-crosshair overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 select-none`}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: pos }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600">
            Sube una imagen primero
          </div>
        )}

        {src && (
          <>
            <div className="pointer-events-none absolute inset-0 border-2 border-violet-400/0" />
            <span
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-violet-500/80 shadow-lg"
              style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
            />
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-zinc-950/80 px-1.5 py-0.5 font-mono text-[9px] text-zinc-300">
              {Math.round(value.x * 100)}% / {Math.round(value.y * 100)}%
            </span>
          </>
        )}
      </div>

      {src && (
        <button
          type="button"
          onClick={() => onChange({ x: 0.5, y: 0.5 })}
          className="mt-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Centrar
        </button>
      )}
    </FieldShell>
  );
};

interface MultiSelectFieldProps {
  label: string;
  /** Nombres de las opciones elegidas, en el orden de la lista. */
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string; color?: string }[];
  error?: string;
  hint?: string;
  max?: number;
}

/**
 * Selección múltiple como botones, no como un <select multiple>.
 *
 * Un <select multiple> obliga a mantener pulsado Ctrl para elegir
 * dos, con el ratón y sobre todo en móvil, y no muestra de un
 * vistazo lo que hay elegido. Con botones se ve el catálogo entero
 * y se marca y desmarca uno a uno.
 *
 * "max" impide pasar de cierta cantidad y avisa en vez de dejar
 * que se pulse un botón que no va a hacer nada.
 */
export const MultiSelectField: FC<MultiSelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  max,
}) => {
  const toggle = (option: string) => {
    const isOn = value.includes(option);

    if (isOn) {
      onChange(value.filter((v) => v !== option));
      return;
    }

    if (max !== undefined && value.length >= max) return;
    // Se añade al final, que es el orden en el que se ha ido
    // eligiendo, y no como la lista de opciones.
    onChange([...value, option]);
  };

  const full = max !== undefined && value.length >= max;

  return (
    <FieldShell label={label} error={error} hint={hint}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isOn = value.includes(o.value);
          const blocked = !isOn && full;

          return (
            <button
              key={o.value}
              type="button"
              disabled={blocked}
              onClick={() => toggle(o.value)}
              title={blocked ? `Máximo ${max} categorías` : o.label}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                o.color ??
                'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
              } ${
                isOn
                  ? 'border-violet-500 bg-violet-950/60 text-violet-200'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {isOn ? '✓ ' : ''}
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
};
