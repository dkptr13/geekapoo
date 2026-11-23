import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

// ======================================================
// ANUNCIOS PARA LECTORES DE PANTALLA
// ======================================================
//
// Las regiones vivas tienen que existir SIEMPRE en el DOM, no
// crearse justo cuando llega el mensaje: un lector de pantalla que
// descubre una región nueva puede no anunciar su contenido.
//
// Se mantienen dos regiones:
//   - polite: resultados normales ("Mensaje enviado").
//   - assertive: errores urgentes ("No se pudo enviar el mensaje").
//
// `role="status"` y `role="alert"` ya llevan la semántica; los
// `aria-live` explícitos sirven para los lectores que no la aplican
// a esos roles.

type Politica = 'polite' | 'assertive';

interface A11yContexto {
  announce: (mensaje: string, politica?: Politica) => void;
}

const Contexto = createContext<A11yContexto>({
  announce: () => {},
});

export function A11yProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const temporizadores = useRef<number[]>([]);

  useEffect(
    () => () => {
      temporizadores.current.forEach((id) => window.clearTimeout(id));
      temporizadores.current = [];
    },
    [],
  );

  const announce = useCallback((mensaje: string, politica: Politica = 'polite') => {
    const limpio = String(mensaje ?? '').replace(/\s+/g, ' ').trim();
    if (!limpio) return;

    // Se vacía primero para que repetir el MISMO texto vuelva a
    // anunciarse. Sin esto, el lector solo lo diría la primera vez.
    const fijar = politica === 'assertive' ? setAssertive : setPolite;
    fijar('');
    const id = window.setTimeout(() => fijar(limpio), 40);
    temporizadores.current.push(id);
  }, []);

  const valor = useMemo(() => ({ announce }), [announce]);

  return (
    <Contexto.Provider value={valor}>
      {children}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {polite}
      </div>

      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertive}
      </div>
    </Contexto.Provider>
  );
}

export function useAnnouncer(): A11yContexto['announce'] {
  return useContext(Contexto).announce;
}
