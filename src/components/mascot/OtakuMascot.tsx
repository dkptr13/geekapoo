import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  ChevronUp,
  Bell,
  BellOff,
  Minus,
} from 'lucide-react';

import { useKapo } from '../../context/KapoContext';
import { etiquetaFrecuencia } from '../../utils/kapoPrefs';

interface OtakuMascotProps {
  currentSection?: string;
}

// Ya no hay diálogos de reserva aquí. Los texts decide
// `KapoContext`: si no hay nada que decir, el banco de
// `data/kapoDialogues.ts` siempre tiene algo, así que la mascota
// no puede quedarse sin texto mientras Firestore responde.

// ======================================================
// UMBRALES DEL ARRASTRE
// ======================================================
// Velocidad, en píxeles por milisegundo, a partir de la cual el
// gesto cuenta como "tirarla" y no como "soltarla".
//
// 1.6 px/ms son unos 1600 px/s: un tirón rápido y deliberado. A
// 0.75 (unos 750 px/s) se disparaba con arrastrar un poco, que es
// justo lo que no quería: el gesto normal de moverla de sitio
// acababa siempre en hide-y-show.
//
// Se mide sobre los últimos 120ms, no sobre todo el recorrido:
// un arrastre lento y largo acaba con una velocidad baja en el
// momento de soltar, que es lo que se quiere.
const FAST_DRAG_SPEED = 1.6;

// Distancia total recorrida mínima para llegar a disappear.
//
// La velocidad sola no basta: un temblor del ratón o un roce del
// dedo pueden dar una velocidad alta durante un instante sin que
// la mascota se haya movido de verdad. Con 120px de recorrido se
// descarta ese caso: si no se ha desplazado, no hay nada que
// lanzar.
const MIN_FLING_DISTANCE = 120;

// Por debajo de este desplazamiento en píxeles el gesto se
// considera un clic, no un arrastre. Existe porque los táctil
// generan unos pocos píxeles de deriva al solo pulsar, y sin esto
// la mascota se movería al intentar hablar con ella.
const DRAG_THRESHOLD = 8;

// No se puede soltar por encima del Navbar (4rem), ni pegada a
// los bordes.
const MIN_TOP = 72;
const MARGIN = 20;

/**
 * Las dos interfaces de la mascota.
 *
 * Arriba (scroll en 0): se ancla bajo el Navbar y el globo se abre
 * POR DEBAJO, porque arriba no cabe.
 *
 * Abajo (scroll): se suelta de la esquina y flota, como un widget
 * de chat cualquiera, para no tapar el texto que se está leyendo,
 * y el globo vuelve a abrirse por encima.
 *
 * Cambiar de pestaña cuenta como "arriba": es una pantalla nueva y
 * empieza por el principio.
 */
const DOCK_TOP = 80;

/** Píxeles de scroll a partir de los cuales pasa a flotar abajo. */
const DOCK_SCROLL_THRESHOLD = 24;

// Ventana de tiempo, en ms, para medir la velocidad.
const VELOCITY_WINDOW = 120;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Point {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  /** Distancia entre el puntero y la esquina de la mascota, para
   *  que no salte al agarrarla por un punto que no sea el centro. */
  offsetX: number;
  offsetY: number;
  /**
   * Medida de la MASCOTA, no de la caja con el globo.
   *
   * El globo va en posición absoluta y sobresale hacia la
   * izquierda, así que medir el contenedor entero daba un ancho
   * enorme y la posición acababa calculada con el margen
   * equivocado: la mascota se salía por la izquierda al abrirse
   * el texto.
   */
  width: number;
  height: number;
  startX: number;
  startY: number;
  /**
   * Dónde estaba la mascota al empezar a sujetarla, en píxeles
   * medidos desde la esquina de la ventana.
   *
   * Se guarda para engancharla a esa posición en el PRIMER
   * movimiento de verdad, y no al pulsar. Si se hace al pulsar, un
   * simple clic ya la convertía de "anclada en la esquina" a
   * "posicionada al píxel", y por eso parecía que te seguía.
   */
  anchorX: number;
  anchorY: number;
  moved: boolean;
  samples: { x: number; y: number; t: number }[];
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/** Ancho máximo del globo de diálogo (w-72 del CSS). */
const BUBBLE_W = 288;

/**
 * Mantiene a la mascota dentro de la pantalla.
 *
 * Se mide en dos ejes porque el globo de diálogo sale hacia la
 * IZQUIERDA desde la mascota:
 *
 *   - Derecha: la mascota no puede pasar de `anchoPantalla -
 *     ancho - margen`. Si pasara, se salía por la derecha.
 *
 *   - Izquierda: hay que reservar el ancho del globo, o el texto
 *     quedaba fuera de la pantalla al hablar con ella. Como el
 *     globo se ancla a la derecha de la mascota y sobresale por
 *     su izquierda, el hueco que hace falta NO es el ancho entero
 *     del globo, sino el exceso sobre el ancho de la mascota:
 *     `bubbleW - ancho`. Por eso en pantallas anchas la mascota
 *     puede estar bastante a la izquierda sin que el texto se
 *     corte.
 *
 * El límite izquierdo se recorta a lo que hay disponible: en una
 * ventana estrecha no caben el globo entero y la mascota. Si el
 * mínimo acabara por detrás del máximo, el clamp la empujaría al
 * borde derecho y desaparecería, que es justo el fallo que había.
 */
const keepOnScreen = (p: Point, width: number, height: number): Point => {
  const maxX = window.innerWidth - width - MARGIN;
  const needsRoom = Math.max(0, BUBBLE_W - width);
  const minX = Math.min(MARGIN + needsRoom, maxX);

  return {
    x: clamp(p.x, minX, maxX),
    y: clamp(p.y, MIN_TOP, window.innerHeight - height - MARGIN),
  };
};

export const OtakuMascot: React.FC<OtakuMascotProps> = ({ currentSection }) => {
  // El texto y el estado de ánimo los decide `KapoContext`, que
  // es quien sabe qué está pasando en la web (qué sección, si
  // subiste de nivel, si hay trivia nueva). Aquí solo se pinta.
  const {
    mensaje,
    animacion,
    origen,
    opciones,
    preferencias,
    poke,
    responder,
    abrirDialogo,
    cerrarDialogo,
    alternarEspontaneos,
    cambiarFrecuencia,
  } = useKapo();

  const [isMinimized, setIsMinimized] = useState(false);
  // El índice de diálogo y el humor ya no se llevan aquí: el
  // humor lo pone el contexto y el texto sale de `mensaje`.
  const [mood, setMood] = useState<'idle' | 'happy' | 'thinking' | 'hype'>('idle');
  const [interactionCount, setInteractionCount] = useState(0);
  // Empieza cerrado y lo abre el primer mensaje real. Así, si el
  // usuario cerró a Kapo hace poco, no aparece un bocadillo vacío
  // con el saludo neutro.
  const [showBubble, setShowBubble] = useState(false);

  // ======================================================
  // ARRASTRE
  // ======================================================
  // null = en su sitio de siempre (abajo a la derecha). Cualquier
  // otro valor son píxeles medidos desde la esquina de la
  // ventana, que es como se posiciona un elemento "fixed".
  const [pos, setPos] = useState<Point | null>(null);
  const isPositioned = pos !== null;
  /** ¿La página está scrolleada? Decide si la mascota flota abajo. */
  const [scrolled, setScrolled] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Cuando se ha ido volando no se pinta hasta que se la llame
  // de vuelta.
  const [fled, setFled] = useState(false);
  const [recallTaps, setRecallTaps] = useState(0);

  const dragStateRef = useRef<DragState | null>(null);
  const dragElRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const mascotButtonRef = useRef<HTMLButtonElement>(null);
  const minimizedButtonRef = useRef<HTMLButtonElement>(null);
  // Se pone a true cuando el usuario pide hablar: el foco debe ir
  // al bocadillo para que el teclado y el lector de pantalla lo
  // alcancen. En los mensajes espontáneos no se roba el foco.
  const focusBubbleRef = useRef(false);
  const focusMinimizedRef = useRef(false);

  // Vuelo en curso. Se guarda para poder cancelarlo: las
  // animaciones de la huida se crean con "fill: forwards", así que
  // sin esto se quedan pegadas al nodo y compiten entre sí.
  const flingAnimRef = useRef<Animation | null>(null);

  // Un único temporizador para volver al humor "idle". Si se
  // creara uno por cada toque, ocho toques dejaban ocho
  // temporizadores pendientes disparando lo mismo.
  const moodTimerRef = useRef<number | null>(null);

  // El navegador dispara un "click" aunque el puntero se haya
  // movido mucho. Con esta bandera, ese clic no cuenta como
  // tocar a la mascota y no salta el diálogo al terminar de
  // arrastrar.
  const suppressClickRef = useRef(false);

  // Para sacar a la mascota volando.
  const fling = useCallback((vx: number, vy: number) => {
    const el = dragElRef.current;
    if (!el || prefersReducedMotion()) {
      setFled(true);
      return;
    }

    const speed = Math.hypot(vx, vy) || 1;
    // Se va en la dirección exacta del gesto. La distancia es
    // mayor que la ventana en cualquiera de los ejes, así que
    // sale por el lado por el que se estaba tirando aunque el
    // gesto fuera casi vertical.
    const far = Math.max(window.innerWidth, window.innerHeight) + 400;
    const dx = (vx / speed) * far;
    const dy = (vy / speed) * far;

    if (typeof el.animate !== 'function') {
      setFled(true);
      return;
    }

    // Se cancela el vuelo anterior antes de lanzar el nuevo. Con
    // "fill: forwards" la transformación se queda pegada al nodo
    // para siempre, así que echar a la mascota dos veces seguidas
    // dejaba dos transformaciones compitiendo y el movimiento se
    // ralentizaba a cada intento.
    //
    // Se cancela solo la que guardamos, no todas las del elemento:
    // getAnimations() también devuelve las transiciones del CSS
    // y hay que dejarlas intactas.
    flingAnimRef.current?.cancel();
    flingAnimRef.current = null;

    const anim = el.animate(
      [
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
      ],
      {
        duration: 460,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards',
      },
    );

    flingAnimRef.current = anim;

    // "finished" y no un temporizador: si la animación se cancela
    // (por ejemplo porque el usuario cambia de pestaña), no debe
    // esconder la mascota a media huida.
    anim.finished
      .then(() => {
        flingAnimRef.current = null;
        setFled(true);
      })
      .catch(() => {
        /* cancelada: se deja donde estaba */
      });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    const el = dragElRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // SIN setPointerCapture a propósito.
    //
    // Con la captura activada desde el pointerdown, el navegador
    // redirige el "click" al elemento que capturó, que es este
    // div, y el <button> de la mascota deja de recibirlo: tocar
    // para hablar no hacía nada. Los eventos de puntero ya llegan
    // aquí dentro sin captura, porque la mascota es un recuadro
    // pequeño que el dedo no llega a abandonar mientras se arrastra.
    //
    // La medida es la del CONTENEDOR, no la del botón, y es
    // importante que coincidan con lo que se posiciona: el
    // "left/top" va en el <aside>, y ese aside empieza más a la
    // izquierda que el botón por la columna de botones de al
    // lado. Medir el botón y posicionar el aside mezclaba las dos
    // medidas, y la mascota se iba fuera por la derecha.
    const box = rect;

    dragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - box.left,
      offsetY: e.clientY - box.top,
      width: box.width,
      height: box.height,
      startX: e.clientX,
      startY: e.clientY,
      anchorX: box.left,
      anchorY: box.top,
      moved: false,
      samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }],
    };

    // Aquí NO se ancla ni se marca como arrastrando.
    //
    // Antes se hacía en este punto y por eso un simple clic ya
    // dejaba a la mascota suelta del anclaje de la esquina: pasaba
    // a posicionarse por píxeles sin que nadie la hubiera movido, y
    // en el móvil, al tocar para hablar, se veía un tirón.
    //
    // Ahora solo se guarda el gesto. El enganche ocurre en
    // onPointerMove, cuando el puntero se ha movido de verdad.
    suppressClickRef.current = false;

    // Desde aquí el gesto se sigue en WINDOW, no sobre la mascota,
    // para que no se pierda ni un movimiento aunque el puntero se
    // aleje del recuadro a mitad del tirón.
    trackingRef.current = { move: onPointerMove, up: endDrag, cancel: onPointerCancel };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', onPointerCancel);

    // El globo de diálogo NO se oculta aquí.
    //
    // Se hacía antes y provocaba dos fallos: la caja encogía al
    // desaparecer el globo, así que la mascota se separaba del
    // cursor justo al empezar a arrastrarla.
  };

  // ======================================================
  // SEGUIMIENTO DEL GESTO
  // ======================================================
  // "pointermove" y "pointerup" se escuchan en WINDOW, no en la
  // mascota.
  //
  // Escucharlos en el elemento solo funciona si el puntero nunca
  // lo abandona. Al tirar fuerte el ratón sale del recuadro entre
  // un evento y el siguiente, y entonces ocurría justo lo que
  // pasaba: la mascota se quedaba quieta y, al volver a pasar
  // por encima, saltaba a seguir al cursor. Y el "pointerup" fuera
  // del recuadro no llegaba nunca, así que el gesto no se cerraba
  // y la mascota no se echaba.
  //
  // Tampoco se usa setPointerCapture, que sería la otra solución:
  // captura el puntero pero se queda con el "click", y entonces el
  // <button> de la mascota deja de recibirlo (tocar para hablar no
  // haría nada). Con window no hay captura, el clic sigue llegando
  // al botón con normalidad y el arrastre se sigue entero.

  /** Las tres escuchas vivas de este gesto, para poder quitarlas. */
  const trackingRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  } | null>(null);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragStateRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true;
      suppressClickRef.current = true;

      // Primer movimiento real: AHORA sí se suelta del anclaje de
      // la esquina y se posiciona al píxel. Hasta aquí la mascota
      // sigue donde estaba, así que un clic no la mueve nunca.
      setPos({ x: d.anchorX, y: d.anchorY });
      setDragging(true);
    }

    d.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    // Se guardan solo los últimos: la velocidad se mide sobre una
    // ventana, y samples más viejos no cuentan para nada.
    if (d.samples.length > 12) d.samples.shift();

    if (!d.moved) return;

    setPos(keepOnScreen({ x: e.clientX - d.offsetX, y: e.clientY - d.offsetY }, d.width, d.height));
  }, []);

  // Se quitan las tres escuchas juntas. Van en un ref y no se
  // guardan referencias directas a los handlers para que "endDrag"
  // y "onPointerCancel" puedan llamar aquí sin crear un ciclo en
  // el que cada uno necesita al otro.
  const stopTracking = useCallback(() => {
    const t = trackingRef.current;
    if (!t) return;
    window.removeEventListener('pointermove', t.move);
    window.removeEventListener('pointerup', t.up);
    window.removeEventListener('pointercancel', t.cancel);
    trackingRef.current = null;
  }, []);

  const endDrag = useCallback((e: PointerEvent) => {
    const d = dragStateRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    dragStateRef.current = null;
    setDragging(false);
    stopTracking();

  // El clic del navegador llega justo después de este evento.
  // Se limpia la bandera en el siguiente ciclo para no anular
  // el clic de verdad, solo el que provoca un arrastre.
  //
  // Antes esto era un "return" temprano y por eso la mascota
  // nunca se iba: todo arrastre real tiene d.moved a true, así
  // que salía siempre por aquí y la velocidad de abajo no
  // llegaba a calcularse nunca.
  if (d.moved) {
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  // Velocidad: entre el primer y el último punto de los últimos
  // 120ms.
  const last = d.samples[d.samples.length - 1];
  const first = d.samples.find((s) => last.t - s.t <= VELOCITY_WINDOW) ?? d.samples[0];
  const dt = Math.max(last.t - first.t, 1);
  const vx = (last.x - first.x) / dt;
  const vy = (last.y - first.y) / dt;

  // Distancia total recorrida, no solo la de los últimos 120ms.
  const travelled = Math.hypot(last.x - d.startX, last.y - d.startY);

  if (travelled >= MIN_FLING_DISTANCE && Math.hypot(vx, vy) >= FAST_DRAG_SPEED) {
    fling(vx, vy);
  }
  }, [fling, stopTracking]);

  const onPointerCancel = useCallback((e: PointerEvent) => {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
      setDragging(false);
      stopTracking();
    }
  }, [stopTracking]);

  useEffect(() => {
    // En el chat NO se sigue el scroll de la ventana: allí la
    // lista de mensajes se desplaza por dentro, así que la
    // ventana no debería moverse. Si se mueve, es un fallo del
    // layout, y la mascota no tiene por qué caer al fondo por
    // eso. En el resto de pestañas, que son páginas largas de
    // verdad, sí se sigue.
    if (currentSection === 'chats') {
      setScrolled(false);
      return;
    }

    const onScroll = () => {
      const abajo = window.scrollY > DOCK_SCROLL_THRESHOLD;
      setScrolled(abajo);
      // Scrollear devuelve la mascota al anclaje: si estaba
      // apartada a mano, se olvida la posición. Scrollear es una
      // señal clara de que quiere el comportamiento normal.
      if (abajo) setPos(null);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentSection]);

  // Cambiar de pestaña es empezar de cero: la mascota vuelve arriba,
  // sin arrastre y sin vuelo a medias.
  useEffect(() => {
    setPos(null);
    setScrolled(false);
    flingAnimRef.current?.cancel();
    flingAnimRef.current = null;
  }, [currentSection]);

  // Si la mascota se desmonta a mitad de un gesto (se echa, se
  // cambia de pestaña y se desmonta el árbol), las escuchas de
  // window se quedan colgadas.
  useEffect(() => stopTracking, [stopTracking]);

  // Si la ventana se encoge (o se gira el móvil) mientras la
  // mascota está desplazada, sus coordenadas pueden quedar fuera de
  // la vista. Aquí se vuelven a meter dentro con la misma regla que
  // se usa al arrastrar.
  useEffect(() => {
    if (!isPositioned) return;

    const onResize = () => {
      const el = dragElRef.current;
      const w = el?.offsetWidth ?? 0;
      const h = el?.offsetHeight ?? 0;
      setPos((p) => (p ? keepOnScreen(p, w, h) : p));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // Depende del SÍ o del NO, no del objeto: "pos" es un objeto
    // nuevo en cada movimiento del ratón, y con él de dependencia
    // esta escucha se daba de alta y de baja en cada frame.
  }, [isPositioned]);

  // ======================================================
  // DESPEDIRSE
  // ======================================================
  // La X no la minimiza: la echa. Se usa el mismo vuelo que al
  // tirarla, pero hacia abajo y a un lado, como si se saliera de
  // la pantalla por donde tiene el botón de cierre.
  const dismiss = () => {
    if (dragStateRef.current) return;
    cerrarDialogo();
    fling(260, 520);
  };

  // ======================================================
  // LLAMAR DE VUELTA
  // ======================================================
  // Tres toques en la esquina. El contador se ve para que se
  // sepa que los toques cuentan y no ignored.
  const handleRecall = () => {
    const next = recallTaps + 1;
    if (next >= 3) {
      // Si se la llama mientras todavía está volando, esa
      // animación sigue con "fill: forwards" y la mantiene
      // desplazada fuera de la pantalla, por mucho que el CSS la
      // devuelva a su sitio: las animaciones ganan a las clases.
      // Sin esto, llamarla deprisa la dejaba invisible.
      flingAnimRef.current?.cancel();
      flingAnimRef.current = null;

      setFled(false);
      setRecallTaps(0);
      // Vuelve a su sitio de siempre, no a donde se soltó.
      setPos(null);
      setIsMinimized(false);
      setShowBubble(true);
      abrirDialogo();
      if (mensaje.id === 'fallback') poke();
      return;
    }
    setRecallTaps(next);
  };

  // El "golpe" al tocarla: crece de golpe, se pasa un poco y
  // vuelve a su sitio. Se lanza con la Web Animations API en vez
  // de con una clase CSS porque así reinicia sola en cada clic,
  // incluso si se pulsan varios seguidos muy rápido. Con una clase
  // habría que esperar a que termine la anterior y se perderían.
  const popAvatar = () => {
    const el = avatarRef.current;
    if (!el || prefersReducedMotion()) return;
    if (typeof el.animate !== 'function') return;

    if (typeof el.getAnimations === 'function') {
      el.getAnimations().forEach((a) => a.cancel());
    }

    const anim = el.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.3)', offset: 0.3 },
        { transform: 'scale(0.93)', offset: 0.65 },
        { transform: 'scale(1)' },
      ],
      { duration: 460, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );

    // Cancelar el golpe anterior rechaza su promesa "finished", y
    // sin este catch el navegador canta un "Uncaught (in promise)"
    // en la consola cada vez que se toca dos veces seguidas.
    anim.finished.catch(() => {
      /* reemplazada por la siguiente */
    });
  };

  // El humor lo marca `KapoContext` (un evento importante como
  // subir de nivel tiene que verse, aunque a los tres segundos
  // vuelva a idle). Antes lo elegía este archivo con un `if` por
  // sección, que es justo lo que había que evitar: con cinco
  // pestañas más habría que tocar dos sitios cada vez.
  useEffect(() => {
    setMood(animacion);
  }, [animacion]);

  /**
   * La animación del globo, según lo que esté diciendo.
   *
   * Un "geo-key" cambia cuando cambia el mensaje, que es lo que
   * hace que la animación se repita: si solo cambiara la clase,
   * el navegador no volvería a arrancar la animación.
   *
   * Los eventos importantes (nivel, medalla, trivia) brillan; los
   * mensajes de contexto solo dan un rebote corto.
   */
  const evento = mensaje.context;
  const eventoImportante =
    evento === 'level_up' ||
    evento === 'achievement' ||
    evento === 'trivia_done' ||
    evento === 'first_thread' ||
    evento === 'first_comment' ||
    evento === 'first_message' ||
    evento === 'club' ||
    evento === 'reaction' ||
    evento === 'login' ||
    evento === 'register';

  const geoEvento = eventoImportante ? 'geo-kapo-brillo' : 'geo-kapo-habla';

  // Un evento importante abre el bocadillo aunque el usuario lo
  // hubiera cerrado antes: es justo lo que ha pedido ver. Un
  // espontáneo también se abre, pero el contexto ya se encarga de
  // respetar el silencio y las frecuencias.
  useEffect(() => {
    if (mensaje.id === 'fallback') {
      setShowBubble(false);
      return;
    }
    // Un evento importante puede sacarla de la píldora minimizada:
    // el usuario puede querer silencio, pero una medalla o un nivel
    // son justo lo que pidió ver. Un espontáneo NO la saca.
    if (origen === 'evento' && mensaje.priority >= 50) {
      setIsMinimized(false);
    }
    setShowBubble(true);
    abrirDialogo();
  }, [mensaje, origen, abrirDialogo]);

  // El foco va al bocadillo solo cuando el usuario ha pulsado a
  // Kapo. Si se moviera en cada respuesta, se perdería el foco del
  // botón que acaba de elegir.
  useEffect(() => {
    if (!focusBubbleRef.current || !showBubble || !bubbleRef.current) return;
    focusBubbleRef.current = false;
    // Ya está montado en este commit: no hace falta esperar a otro
    // frame, y así el foco no se pierde si el mensaje cambia dos
    // veces seguidas.
    bubbleRef.current.focus();
  }, [mensaje, showBubble]);

  // Escape cierra el diálogo, salvo que el usuario esté escribiendo
  // en otro sitio (un comentario, el chat...), donde Escape puede
  // significar otra cosa.
  useEffect(() => {
    if (!showBubble) return;

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const activo = document.activeElement as HTMLElement | null;
      const esCampo =
        activo &&
        (activo.tagName === 'INPUT' ||
          activo.tagName === 'TEXTAREA' ||
          activo.tagName === 'SELECT' ||
          activo.isContentEditable);
      const dentroDelBocadillo =
        activo && bubbleRef.current?.contains(activo);
      if (esCampo && !dentroDelBocadillo) return;

      e.stopPropagation();
      setShowBubble(false);
      cerrarDialogo();
      mascotButtonRef.current?.focus();
    };

    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [showBubble, cerrarDialogo]);

  const cerrarBocadillo = () => {
    setShowBubble(false);
    cerrarDialogo();
    mascotButtonRef.current?.focus();
  };

  const minimizar = () => {
    setShowBubble(false);
    cerrarDialogo();
    focusMinimizedRef.current = true;
    setIsMinimized(true);
  };

  // Al minimizar con el teclado, el foco no debe caer al body.
  useEffect(() => {
    if (!isMinimized || !focusMinimizedRef.current) return;
    focusMinimizedRef.current = false;
    minimizedButtonRef.current?.focus();
  }, [isMinimized]);

  const handlePoke = () => {
    // Viene de arrastrar, no de tocar.
    if (suppressClickRef.current) return;

    popAvatar();

    // El texto y el humor los decide el contexto. Aquí solo se
    // avisa de que le han hablado.
    setInteractionCount((c) => c + 1);
    setShowBubble(true);
    focusBubbleRef.current = true;
    abrirDialogo();
    poke();

    // Un solo temporizador reutilizado. Crear uno por toque
    // dejaba todos apilados: a la octava pulsación había ocho
    // temporizadores esperando para poner el mismo humor.
    if (moodTimerRef.current !== null) {
      window.clearTimeout(moodTimerRef.current);
    }
    moodTimerRef.current = window.setTimeout(() => {
      moodTimerRef.current = null;
      setMood('idle');
    }, 3000);
  };

  // ======================================================
  // RECOLOCAR AL ABRIR EL DIÁLOGO
  // ======================================================
  // El globo sale hacia la izquierda desde la mascota. Si la
  // mascota quedó muy a la izquierda, abrir el diálogo lo sacaba
  // de la pantalla. Aquí, al abrirse, se comprueba su ancho real
  // y se empuja a la derecha lo justo para que quepa entero.
  useEffect(() => {
    if (!pos || !showBubble || dragging) return;

    const el = dragElRef.current;
    if (!el) return;

    // Se mide el globo de verdad, no los 288px del CSS: si el
    // texto es más corto, exigiría más hueco del necesario y
    // dejaría a la mascota más lejos de la cuenta.
    const bubble = el.querySelector<HTMLElement>('[data-mascot-bubble]');
    const bubbleW = bubble?.offsetWidth ?? BUBBLE_W;

    setPos((p) => {
      if (!p) return p;
      const needsRoom = Math.max(0, bubbleW - el.offsetWidth);
      const nextX = clamp(
        p.x,
        MARGIN + needsRoom,
        window.innerWidth - el.offsetWidth - MARGIN,
      );
      // Se devuelve el MISMO objeto cuando no hay nada que mover.
      // Si no, el efecto volvería a dispararse sin parar: depende
      // de "pos" y escribirlo con un objeto nuevo siempre provoca
      // otro render, y otro efecto.
      if (nextX === p.x) return p;
      return { x: nextX, y: p.y };
    });
    // A propósito NO depende de "pos".
    //
    // Esta efecto existe para recolocar la mascota cuando el globo
    // se abre. Depender de "pos" lo hacía dispararse en cada
    // movemento del ratón, y cada pasada mide un offsetWidth: un
    // layout forzado por frame, que es lo que hace que el arrastre
    // vaya a tirones.
    //
    // Mientras se arrastra no hace falta: "keepOnScreen" ya
    // reserva el hueco del globo en cada movimiento, así que la
    // mascota nunca sale con el texto cortado.
  }, [showBubble, dragging]);

  // Posición en estilos: si se ha movido a mano, coordenadas
  // exactas; si no, el anclaje de siempre, que son dos: bajo el
  // navbar con la página arriba, o flotando abajo al scrollear.
  const positionStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
    : scrolled
      ? { right: MARGIN, bottom: MARGIN, top: 'auto' }
      : { right: MARGIN, top: DOCK_TOP, bottom: 'auto' };

  // Arriba el globo no cabe: se abre hacia abajo.
  const bubbleBelow = !pos && !scrolled;

  const motionClass = dragging
    ? 'select-none touch-none'
    : 'transition-all duration-300';

  // Solo la pulsación se atiende en el nodo. El resto del gesto va
  // por window (ver "SEGUIMIENTO DEL GESTO").
  const dragHandlers = {
    onPointerDown,
  };

  // ======================================================
  // FUERA DE PANTALLA
  // ======================================================
  // Tras una huida solo queda una huella en la esquina. Tres
  // toques y vuelve a su sitio de siempre.
  if (fled) {
    return (
      <button
        onClick={handleRecall}
        aria-label={`Llamar a Kapo-chan (${recallTaps} de 3 toques)`}
        title={`Kapo-chan se fue. Toca ${3 - recallTaps} ${3 - recallTaps === 1 ? 'vez más' : 'veces más'} para que vuelva`}
        className="group fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-violet-500/40 bg-zinc-900/60 text-sm text-zinc-600 opacity-40 transition-all hover:border-violet-400 hover:text-violet-300 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <span className="text-base">🐾</span>
        {recallTaps > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
            {recallTaps}
          </span>
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <aside
        aria-label="Mascota Otaku"
        className={`fixed z-40 cursor-grab active:cursor-grabbing ${motionClass}`}
        style={positionStyle}
      >
        <div ref={dragElRef} {...dragHandlers} className="touch-none">
          <button
            ref={minimizedButtonRef}
            onClick={() => {
              if (suppressClickRef.current) return;
              setIsMinimized(false);
              setShowBubble(true);
              focusBubbleRef.current = true;
              abrirDialogo();
              // Si nunca ha dicho nada (o se quedó en el saludo
              // neutro), se le pide algo nuevo al abrirla.
              if (mensaje.id === 'fallback') poke();
            }}
            className="flex items-center gap-2 rounded-full border border-violet-500/40 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-violet-300 shadow-xl shadow-violet-950/40 backdrop-blur-md transition-all hover:scale-105 hover:border-violet-400"
            title="Abrir mascota Kapo-chan"
            aria-label="Abrir a Kapo-chan"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75 motion-reduce:animate-none"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500"></span>
            </span>
            <span className="text-sm">🐾</span>
            <span>Kapo-chan</span>
            <ChevronUp size={14} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Mascota Otaku"
      className={`fixed z-40 cursor-grab active:cursor-grabbing ${motionClass}`}
      style={positionStyle}
    >
      <div ref={dragElRef} {...dragHandlers}>
        {/* El globo va FUERA del flujo normal: en posición
            absoluta y con "right-0" para que crezca hacia la
            izquierda, sin empujar nunca a la mascota.

            Antes estaba en el flujo, así que al abrirse la metía
            hacia abajo y, si estaba cerca del borde inferior, se
            salía de la pantalla. Al ser absoluta, la caja de la
            mascota mide siempre lo mismo y el arrastre no da
            saltos al abrirse o cerrarse el texto. */}
        <div className="relative">
          {showBubble && (
            /* "max-w-[calc(100vw-2.5rem)]" para que en pantallas
               estrechas el globo no desborde por la izquierda: en
               un móvil de 375px no caben los 288px del ancho fijo
               más la mascota. */
            <div
              ref={bubbleRef}
              data-mascot-bubble=""
              role="dialog"
              aria-label="Diálogo de Kapo-chan"
              aria-describedby="kapo-mensaje-texto"
              tabIndex={-1}
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute right-0 z-10 w-72 max-w-[calc(100vw-2.5rem)] cursor-auto rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-3.5 shadow-2xl shadow-violet-950/50 backdrop-blur-md transition-all focus:outline-none ${
                bubbleBelow ? 'top-full mt-2' : 'bottom-full mb-2'
              } ${geoEvento}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-violet-400">
                  <Sparkles size={13} className="shrink-0 animate-pulse text-violet-400 motion-reduce:animate-none" />
                  <span className="truncate">Kapo-chan (Mascota Otaku)</span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={alternarEspontaneos}
                    aria-pressed={preferencias.espontaneos}
                    aria-label="Comentarios espontáneos de Kapo-chan"
                    title={
                      preferencias.espontaneos
                        ? 'Silenciar comentarios espontáneos'
                        : 'Activar comentarios espontáneos'
                    }
                    className="rounded p-1 text-zinc-400 transition-colors hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    {preferencias.espontaneos ? <Bell size={12} /> : <BellOff size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={minimizar}
                    aria-label="Minimizar a Kapo-chan"
                    title="Minimizar"
                    className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={cerrarBocadillo}
                    aria-label="Cerrar el diálogo de Kapo-chan"
                    title="Cerrar diálogo"
                    className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              <div className="mt-1.5 max-h-[min(45vh,18rem)] touch-pan-y overflow-y-auto overscroll-contain pr-0.5">
                <p
                  id="kapo-mensaje-texto"
                  className="text-xs leading-relaxed text-zinc-200"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {mensaje.text}
                </p>

                {/* Respuestas de la conversación. Solo salen cuando
                    el mensaje las trae; no son botones fijos de la
                    pantalla. */}
                {opciones.length > 0 && (
                  <div
                    className="mt-2.5 flex flex-col gap-1.5"
                    role="group"
                    aria-label="Respuestas de Kapo-chan"
                  >
                    {opciones.map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => responder(opcion.id)}
                        className="flex w-full items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1.5 text-left text-[11px] font-semibold text-violet-100 transition-colors hover:border-violet-400/60 hover:bg-violet-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                      >
                        <span aria-hidden="true">{opcion.emoji}</span>
                        <span>{opcion.texto}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* El ritmo solo se muestra cuando el usuario ha
                  abierto la conversación: en un mensaje espontáneo
                  sería un ajuste de más. El silencio sí queda
                  siempre a mano en la cabecera. */}
              {origen === 'usuario' && (
                <div className="mt-2 flex items-center justify-between border-t border-zinc-800/80 pt-1.5 text-[10px] text-zinc-500">
                  <span>Ritmo</span>
                  <button
                    type="button"
                    onClick={cambiarFrecuencia}
                    title="Cambiar cada cuánto habla Kapo-chan por su cuenta"
                    className="rounded px-1 py-0.5 font-semibold text-violet-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    {etiquetaFrecuencia(preferencias.frecuencia)}
                  </button>
                </div>
              )}

              {/* La flecha va siempre en el lado del globo que toca
                  a la mascota: abajo si el globo cuelga por debajo,
                  arriba si está por encima. */}
              <div
                className={`absolute right-8 h-3 w-3 rotate-45 bg-zinc-900 ${
                  bubbleBelow
                    ? '-top-2 border-l border-t border-violet-500/30'
                    : '-bottom-2 border-b border-r border-violet-500/30'
                }`}
              />
            </div>
          )}

          {/* Mascot Avatar and Interactive Controls */}
          <div className="flex items-end justify-end gap-2">
            {/* Action buttons */}
            <div className="mb-1 flex touch-none flex-col gap-1.5">
              <button
                onClick={handlePoke}
                aria-label="Abrir conversación con Kapo-chan"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-xs text-zinc-300 shadow transition-all hover:border-violet-500 hover:text-violet-300 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Hablar con Kapo-chan"
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={dismiss}
                aria-label="Echar a Kapo-chan"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-xs text-zinc-400 shadow transition-all hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Echar a Kapo-chan"
              >
                <X size={13} />
              </button>
            </div>

            {/* Interactive Anime Chibi Character */}
      <button
        ref={mascotButtonRef}
        onClick={handlePoke}
        aria-label="Hablar con Kapo-chan"
        aria-expanded={showBubble}
        className={`group relative flex touch-none cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-2 shadow-2xl backdrop-blur-md transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
          animacion === 'hype'
            ? 'scale-105 border-fuchsia-500 bg-gradient-to-b from-fuchsia-950/80 to-zinc-900 shadow-fuchsia-900/50'
            : animacion === 'happy'
              ? 'border-violet-400 bg-gradient-to-b from-violet-950/80 to-zinc-900 shadow-violet-900/50'
              : 'border-violet-500/40 bg-zinc-900/90 shadow-violet-950/40 hover:scale-105 hover:border-violet-400 hover:bg-violet-950/40'
        }`}
        // La animación de evento va en el botón de la mascota, no
        // solo en el globo: si el usuario ha cerrado el globo (o
        // nunca se abrió), el brillo tiene que verse igualmente.
        data-k-evento={evento}
        data-k-geo={geoEvento}
      >
              {/* Mascot SVG Chibi Otaku Character */}
              <div
                ref={avatarRef}
                className="relative h-16 w-16 select-none will-change-transform"
              >
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  {/* Cat / Fox Ears with neon inner */}
                  <polygon points="20,38 32,8 44,32" fill="#7c3aed" />
                  <polygon points="25,32 32,16 38,30" fill="#f43f5e" />

                  <polygon points="80,38 68,8 56,32" fill="#7c3aed" />
                  <polygon points="75,32 68,16 62,30" fill="#f43f5e" />

                  {/* Head Body */}
                  <ellipse cx="50" cy="54" rx="34" ry="30" fill="#18181b" stroke="#a78bfa" strokeWidth="2.5" />

                  {/* Hair bang locks */}
                  <path d="M 28 32 Q 50 42 72 32 Q 60 48 48 46 Q 36 48 28 32 Z" fill="#6d28d9" />

                  {/* Eyes depending on mood */}
                  {mood === 'happy' || mood === 'hype' ? (
                    <>
                      {/* Happy crescent squinting anime eyes ^ ^ */}
                      <path d="M 34 52 Q 40 44 46 52" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 54 52 Q 60 44 66 52" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
                      {/* Anime blush */}
                      <circle cx="30" cy="58" r="4" fill="#fb7185" opacity="0.6" />
                      <circle cx="70" cy="58" r="4" fill="#fb7185" opacity="0.6" />
                    </>
                  ) : mood === 'thinking' ? (
                    <>
                      <circle cx="39" cy="52" r="4" fill="#38bdf8" />
                      <circle cx="61" cy="50" r="3.5" fill="#38bdf8" />
                      <circle cx="41" cy="50" r="1.5" fill="#ffffff" />
                      <circle cx="63" cy="48" r="1.5" fill="#ffffff" />
                      {/* Sweat drop */}
                      <path d="M 72 40 Q 75 46 72 48 Q 69 46 72 40 Z" fill="#38bdf8" />
                    </>
                  ) : (
                    <>
                      {/* Sparkly anime eyes */}
                      <circle cx="39" cy="53" r="5" fill="#c084fc" />
                      <circle cx="61" cy="53" r="5" fill="#c084fc" />
                      <circle cx="41" cy="51" r="2" fill="#ffffff" />
                      <circle cx="63" cy="51" r="2" fill="#ffffff" />
                      {/* Gentle blush */}
                      <ellipse cx="29" cy="59" rx="3" ry="1.5" fill="#fb7185" opacity="0.5" />
                      <ellipse cx="71" cy="59" rx="3" ry="1.5" fill="#fb7185" opacity="0.5" />
                    </>
                  )}

                  {/* Mouth */}
                  {mood === 'happy' || mood === 'hype' ? (
                    <path d="M 44 61 Q 50 68 56 61 Z" fill="#f43f5e" />
                  ) : mood === 'thinking' ? (
                    <ellipse cx="50" cy="62" rx="2" ry="3" fill="#e4e4e7" />
                  ) : (
                    <path d="M 44 61 Q 47 64 50 62 Q 53 64 56 61" fill="none" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" />
                  )}

                  {/* Little paws holding bottom */}
                  <ellipse cx="36" cy="78" rx="6" ry="4" fill="#a78bfa" />
                  <ellipse cx="64" cy="78" rx="6" ry="4" fill="#a78bfa" />
                </svg>

                {/* Status pulse badge */}
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none"></span>
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-emerald-500"></span>
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-zinc-400 group-hover:text-violet-300">
                <span>¡Tócame!</span>
                {interactionCount > 0 && <span className="text-violet-400">♥{interactionCount}</span>}
              </div>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
