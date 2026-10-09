import { useState } from 'react';
import type { FC, ChangeEvent, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

import { ALTURA_CARD_PERSONAJE } from '../../utils/layout';
import { MAX_TAG } from '../../utils/tags';

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

/**
 * Etiqueta, campo y aviso. Va suelto porque no siempre el campo es
 * un input: `TagsField` es una lista de botones con chips, y
 * meterlos dentro de un <label> haría que al pinchar un chip se
 * partiese el foco al input que no existe.
 */
const FieldBody: FC<FieldShellProps> = ({ label, error, hint, children }) => (
  <>
    <span className="mb-1 block text-[11px] font-semibold text-zinc-300">{label}</span>
    {children}
    {error ? (
      <span className="mt-1 block text-[10px] text-red-400">{error}</span>
    ) : hint ? (
      <span className="mt-1 block text-[10px] text-zinc-600">{hint}</span>
    ) : null}
  </>
);

const FieldShell: FC<FieldShellProps> = ({ label, error, hint, children }) => (
  <label className="block">
    <FieldBody label={label} error={error} hint={hint}>
      {children}
    </FieldBody>
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
  /**
   * Paso de las flechitas del campo.
   *
   * Por defecto 1 (enteros). Se baja a 0.1 solo donde tiene
   * sentido un decimal: los números de episodio, porque las OVAs
   * van entre dos capítulos (15.5). Ver `NumberField`.
   */
  step?: number;
}

/**
 * El estado se mantiene como string a propósito. Si se
 * guardara como number, al borrar el campo para escribir el
 * siguiente año el valor sería NaN y el input se quedaría
 * bloqueado sin poder escribir.
 *
 * `step` es lo que hace que el campo acepte decimales. Un
 * `<input type="number">` sin `step` vale por 1, y el navegador
 * entonces considera "15.5" un valor inválido: avisa en rojo y,
 * según el navegador, no deja ni escribirlo. Con `step="0.1"` el
 * 15.5 se puede teclear y las flechitas del campo avanzan de
 * decimal en decimal.
 *
 * Por eso existe la prop y no se pone `step="0.1"` siempre: en un
 * año, en un número de temporada o en un número de votos, las
 * flechitas saltando a 1985.3 no ayudan de nada.
 */
export const NumberField: FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  step = 1,
}) => (
  <FieldShell label={label} error={error} hint={hint}>
    <input
      type="number"
      step={step}
      min={0}
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

// ── Etiquetas ────────────────────────────────────────

interface TagsFieldProps {
  label: string;
  /** Etiquetas elegidas, tal cual se guardarán. */
  value: string[];
  onChange: (value: string[]) => void;
  /**
   * Etiquetas que se ofrecen con un clic, normalmente las que ya
   * usan los personajes de la misma serie. No es una lista
   * cerrada: el campo acepta cualquier texto.
   */
  suggestions?: string[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

/**
 * Etiquetas de texto libre, como las que salen bajo el nombre del
 * personaje en la wiki (#Destacados, #Meme Queen...).
 *
 * No es un <select multiple> porque el catálogo de etiquetas no
 * está cerrado y porque quitar una tiene que ser un clic. Se
 * escriben en el campo y se confirman con Enter o con una coma, y
 * cada una sale como una chapa con su ×. El "#" se pone solo: en
 * la wiki se escribe delante, y si el autor lo escribiera también
 * acabaría en "#Destacados" dentro de la chapa.
 *
 * La comparación para no repetir es sin mayúsculas, porque "Meme
 * Queen" y "meme queen" en la wiki son dos etiquetas distintas y
 * solo una aparecería en el buscador.
 */
export const TagsField: FC<TagsFieldProps> = ({
  label,
  value,
  onChange,
  suggestions = [],
  error,
  hint,
  placeholder = 'Escribe una y pulsa Enter',
}) => {
  const [draft, setDraft] = useState('');

  const existe = (tag: string) => value.some((t) => t.toLowerCase() === tag.toLowerCase());

  const limpiar = (raw: string) =>
    raw
      .trim()
      .replace(/^#+/, '')
      .slice(0, MAX_TAG);

  // Descarta lo vacío y lo repetido, contando también lo que se
  // acaba de añadir en la misma tanda: escribir "a, a" dejaba dos
  // chapas iguales con la misma clave de React.
  const sinRepetir = (tags: string[], yaEnElCampo = false): string[] => {
    const vistas = new Set(yaEnElCampo ? value.map((t) => t.toLowerCase()) : []);
    return tags.filter((t) => {
      if (!t) return false;
      const clave = t.toLowerCase();
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    });
  };

  const add = (raw: string) => {
    const [tag] = sinRepetir([limpiar(raw)], true);
    if (!tag) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  // La coma sirve de "ya está esta": escribirla añade lo que haya
  // detrás y deja el resto en el campo para seguir escribiendo.
  const handleChange = (next: string) => {
    if (!next.includes(',')) {
      setDraft(next);
      return;
    }
    const partes = next.split(',');
    const nuevas = sinRepetir(partes.slice(0, -1).map(limpiar), true);
    setDraft(partes[partes.length - 1].replace(/^\s+/, ''));
    if (nuevas.length > 0) onChange([...value, ...nuevas]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(draft);
      return;
    }
    // Backspace con el campo vacío quita la última etiqueta: es lo
    // que se espera en un campo de chips, aunque no haya nada
    // escrito que borrar.
    if (e.key === 'Backspace' && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const pendientes = suggestions
    .map((s) => s.trim())
    .filter((s) => s !== '' && !existe(s))
    .filter((s, i, todas) => todas.findIndex((o) => o.toLowerCase() === s.toLowerCase()) === i)
    .slice(0, 12);

  return (
    <div className="block">
      <FieldBody label={label} error={error} hint={hint}>
        {value.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {value.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 py-0.5 pl-2 pr-1 text-[11px] font-semibold text-zinc-300"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  title={`Quitar #${tag}`}
                  aria-label={`Quitar la etiqueta ${tag}`}
                  className="rounded-md p-0.5 text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={placeholder}
          className={`${baseInput} ${error ? invalid : idle}`}
        />

        {pendientes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-600">Ya usadas:</span>
            {pendientes.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => add(tag)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </FieldBody>
    </div>
  );
};

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
 * ── ESTO ESTÁ A MEDIAS DE RETIRARSE. LÉELO ANTES DE USARLO ────────
 *
 * Existía antes que el editor de recorte (`components/common/CropEditor.tsx`)
 * y hacía lo mismo con menos: guardar un `object-position` para que el
 * CSS decidiera, al pintar, qué parte se veía. No había ni movimiento
 * libre ni zoom.
 *
 * El editor nuevo hace el trabajo mejor y hornea el recorte en el
 * archivo, así que para imágenes nuevas esto ya no hace falta: la
 * proporción de la imagen ES la del destino, y un `object-position`
 * sobre una imagen que no hay que recortar no tiene nada que mover.
 *
 * ── LO QUE QUEDA POR QUÉ ──────────────────────────────────────────
 *
 * El catálogo entero tiene imágenes subidas con el sistema viejo, sin
 * recortar. Esas sí necesitan esto, porque siguen siendo más grandes
 * que la caja donde se pintan.
 *
 * ── CÓMO SE MIGRAN ────────────────────────────────────────────────
 *
 * Subiendo la imagen otra vez por el editor de recorte. Entonces se
 * guarda ya con la proporción correcta y este `*Focus` sobra y se
 * puede borrar.
 *
 * ── POR QUÉ HAY QUE DEJAR ESTO FUNCIONANDO ────────────────────────
 *
 * Porque si se quita sin más, las imágenes viejas se quedan congeladas
 * en el centro, que es como estaban antes de que existiera nada de
 * esto: no pierden nada, pero tampoco se arreglan. Con esto se pueden
 * arreglar una a una.
 *
 * ── Y SI SE USA PARA UNA IMAGEN NUEVA, NO HACE NADA ───────────────
 *
 * El `object-position` se aplica sobre una imagen que ya está
 * recortada a la medida de la caja. Si la imagen cabe justa, el
 * estilo no tiene recorrido. No rompe nada; simplemente no se nota.
 * Ese es el motivo de que sea mejor una cosa que otra y no las dos.
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
