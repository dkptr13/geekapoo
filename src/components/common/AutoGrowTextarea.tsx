import { useEffect, useRef } from 'react';
import type { FC, RefObject, TextareaHTMLAttributes } from 'react';

// ======================================================
// TEXTAREA QUE CRECE CON EL CONTENIDO
// ======================================================
//
// Un `textarea` normal mantiene una altura fija y, cuando el texto
// llega al borde, el navegador puede acabar enseñando una barra
// horizontal si algún estilo lo fuerza. Aquí se ajusta la altura al
// contenido hasta un máximo; a partir de ahí se activa el scroll
// VERTICAL. Nunca hay scroll horizontal.
//
// Se usa en hilos, comentarios y chat. El `ref` externo es el mismo
// que necesitan las menciones y la inserción de emojis en el cursor.

interface AutoGrowTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Ref compartido con quien inserta emojis o menciones. */
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /** Altura máxima en píxeles antes de activar el scroll vertical. */
  maxHeight?: number;
  /** Altura mínima en píxeles. */
  minHeight?: number;
}

export const AutoGrowTextarea: FC<AutoGrowTextareaProps> = ({
  inputRef,
  maxHeight = 200,
  minHeight = 0,
  className = '',
  value,
  ...props
}) => {
  const interno = useRef<HTMLTextAreaElement>(null);

  const asignarRef = (el: HTMLTextAreaElement | null) => {
    interno.current = el;
    if (inputRef) inputRef.current = el;
  };

  useEffect(() => {
    const el = interno.current;
    if (!el) return;

    const ajustar = () => {
      el.style.height = 'auto';
      // `scrollHeight` no incluye el borde; con `border-box`,
      // sumarlo evita que el contenido quede 2 px justos y salga
      // un scroll vertical que no hace falta.
      const borde = el.offsetHeight - el.clientHeight;
      const contenido = el.scrollHeight + borde;
      const alto = Math.min(Math.max(contenido, minHeight), maxHeight);
      el.style.height = `${alto}px`;
      el.style.overflowY = contenido > maxHeight ? 'auto' : 'hidden';
    };

    ajustar();
    // Al cambiar el ancho (móvil girado, ventana redimensionada)
    // cambian los saltos de línea y, con ellos, la altura.
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [value, maxHeight, minHeight]);

  return (
    <textarea
      ref={asignarRef}
      value={value}
      className={`box-border w-full resize-none overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${className}`}
      {...props}
    />
  );
};
