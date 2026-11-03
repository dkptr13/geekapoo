import { type FC, type ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// ======================================================
// APARTADO PLEGABLE DEL PANEL
// ======================================================
// El editor de un anime grew without control: datos, ficha
// técnica, streaming, imágenes, temporadas y personajes, todo
// desplegado a la vez. Con veinte personajes la página era tan
// larga que había que bajar mucho para llegar a las
// temporadas, que es donde se trabaja.
//
// Cada apartado se pliega con un clic en su título. El estado es
// local de cada uno, así que desplegar uno no cierra otro: se
// trabaja con la ficha abierta y el catálogo de personajes
// plegado al lado.
// ======================================================

interface CollapsibleSectionProps {
  title: string;
  /** Icono a la izquierda del título. */
  icon?: ReactNode;
  /**
   * Botones o contadores a la derecha del título.
   *
   * Van FUERA del botón que pliega: dos botones anidados es HTML
   * inválido y el de aquí dentro dejaría de pulsarse.
   */
  actions?: ReactNode;
  /** Si el apartado arranca desplegado. */
  defaultOpen?: boolean;
  /** 'pink' es el color de los personajes; el resto, neutro. */
  tone?: 'neutral' | 'pink';
  /**
   * Avisa al padre de si está abierto. Lo usa el editor de
   * disponibilidad para no consultar Firestore hasta que alguien
   * despliega el apartado.
   */
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  icon,
  actions,
  defaultOpen = false,
  tone = 'neutral',
  onOpenChange,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const pink = tone === 'pink';

  return (
    <section
      className={
        pink
          ? 'space-y-3 rounded-xl border border-pink-500/20 bg-pink-500/5 p-3'
          : 'space-y-3'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setOpen((v) => {
              const siguiente = !v;
              onOpenChange?.(siguiente);
              return siguiente;
            })
          }
          aria-expanded={open}
          title={open ? `Plegar ${title}` : `Desplegar ${title}`}
          className={`flex items-center gap-1.5 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
            pink
              ? open
                ? 'text-pink-200'
                : 'text-pink-300/70 hover:text-pink-200'
              : open
                ? 'text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {icon}
          {title}
          {open ? (
            <ChevronUp size={12} className="flex-shrink-0 opacity-60" />
          ) : (
            <ChevronDown size={12} className="flex-shrink-0 opacity-60" />
          )}
        </button>

        {actions}
      </div>

      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
};
