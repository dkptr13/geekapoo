import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { useClubs } from './ClubsContext';
import { useCommunity } from './CommunityContext';
import { useNotifications } from './NotificationsContext';
import { useProgression } from './ProgressionContext';

import {
  KAPO_FALLBACK,
  KAPO_MENSAJES,
  PRIORIDAD,
  ayudaDeSeccion,
  contextoDesdeSeccion,
  type KapoAnimation,
  type KapoContext,
  type KapoMessage,
} from '../data/kapoDialogues';
import {
  conversacionPorId,
  elegirConversacion,
  type KapoOpcion,
} from '../data/kapoConversations';
import {
  ENFRIADO_EVENTO_MS,
  ENFRIADO_MS,
  contextoDeMedalla,
  debeMostrar,
  elegirMensaje,
  mensajeDeNotificacion,
  recomendacionDesdeActividad,
} from '../utils/kapo';
import {
  SECCIONES_DESCUBRIBLES,
  guardarPreferencias,
  intervaloEspontaneoMs,
  leerPreferencias,
  pausaTrasCierreMs,
  registrarVisita,
  seccionPorDescubrir,
  type KapoFrecuencia,
  type KapoPreferencias,
} from '../utils/kapoPrefs';
import { escucharKapo } from '../utils/kapoEvents';

// ======================================================
// KAPO-CHAN DINÁMICA
// ======================================================
//
// Este contexto decide QUÉ dice la mascota y CUÁNTO puede hablar.
// El componente `OtakuMascot` solo la pinta: su globo, su
// arrastre y sus animaciones siguen siendo los de siempre.
//
// Aquí no hay un `if` por sección: los textos están en
// `data/kapoDialogues.ts`, las conversaciones en
// `data/kapoConversations.ts` y las reglas en `utils/kapo.ts`, que
// además se pueden comprobar sin navegador.
//
// ── Los eventos (nivel, medalla) ─────────────────────────
//
// No los inventa este archivo: los saca de `ProgressionContext`,
// que ya sabe cuándo sube un nivel y cuándo se desbloquea una
// medalla. Así solo hay un sitio que mira el progreso, y Kapo no
// puede felicitar antes de que el logro exista de verdad.
//
// ── "Primer hilo" y "primer comentario" ───────────────────
//
// Salen de la medalla que concede la Cloud Function, no de un
// contador nuevo. Antes se celebraban al cargar si la medalla ya
// existía, así que un veterano veía "¡Tu primer hilo!" cada vez
// que abría la web. Ahora solo se celebra la medalla NUEVA que
// anuncia `ProgressionContext`.
//
// ── Nada de lecturas nuevas ───────────────────────────────
//
// Todo lo que usa ya estaba cargado por la aplicación:
// notificaciones, clubes, chats abiertos, progreso, catálogo y
// feed. Kapo no pide documentos ni abre listeners propios.

export type KapoOrigen = 'seccion' | 'evento' | 'espontaneo' | 'usuario';

export interface KapoContextType {
  /** Lo que dice ahora mismo. */
  mensaje: KapoMessage;
  /** Ánimo que debe tener la mascota. */
  animacion: KapoAnimation;
  /** `true` si el texto viene del panel de administración. */
  esPropio: boolean;
  /** De dónde sale el mensaje: sección, evento, espontáneo o poke. */
  origen: KapoOrigen;
  /** Respuestas disponibles para el mensaje actual. */
  opciones: KapoOpcion[];
  /** Preferencias locales (no van a Firestore). */
  preferencias: KapoPreferencias;
  /** El usuario le ha hablado: dice algo ya. */
  poke: () => void;
  /** Avisa de un evento puntual desde fuera. */
  celebrar: (contexto: KapoContext) => void;
  /** El usuario ha elegido una respuesta del bocadillo. */
  responder: (opcionId: string) => void;
  /** El bocadillo se ha abierto. */
  abrirDialogo: () => void;
  /** El usuario ha cerrado el bocadillo: se respeta su silencio. */
  cerrarDialogo: () => void;
  /** Silencia o reactiva los comentarios espontáneos. */
  alternarEspontaneos: () => void;
  /** Cambia el ritmo: discreto → normal → charlatán. */
  cambiarFrecuencia: () => void;
  /** Lleva a una pestaña. */
  irA: (tab: string) => void;
}

const Contexto = createContext<KapoContextType | undefined>(undefined);

// ======================================================
// AYUDAS DE ENTORNO
// ======================================================

/** ¿El foco está en un campo en el que el usuario escribe? */
function estaEscribiendo(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}

/**
 * ¿Hay una capa modal abierta? No se usa para bloquear un evento
 * importante, solo para no soltar una pregunta espontánea encima
 * de un formulario o del panel de arquitectura.
 */
function hayCapaModal(): boolean {
  if (typeof document === 'undefined') return false;
  const capas = Array.from(
    document.querySelectorAll<HTMLElement>('div.fixed.inset-0'),
  );
  return capas.some((el) => {
    const estilo = window.getComputedStyle(el);
    if (
      estilo.display === 'none' ||
      estilo.visibility === 'hidden' ||
      Number(estilo.opacity || 1) < 0.2
    ) {
      return false;
    }
    return el.getBoundingClientRect().width > window.innerWidth * 0.7;
  });
}

const recortar = (texto: string, max: number): string =>
  texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;

/** Una opción de navegación que tenga sentido en esta sección. */
function atajoDeContexto(contexto: KapoContext): KapoOpcion | null {
  switch (contexto) {
    case 'home':
      return {
        id: 'ir_trivia',
        texto: 'Ir a la trivia',
        emoji: '🧠',
        respuesta: 'Vamos para allá. Tres preguntas y a por la racha.',
        animacion: 'hype',
        tab: 'trivia',
      };
    case 'wiki':
    case 'search':
      return {
        id: 'ir_inicio',
        texto: 'Ver la comunidad',
        emoji: '💬',
        respuesta: 'El feed está lleno de hilos. Seguro que hay uno para ti.',
        animacion: 'happy',
        tab: 'inicio',
      };
    case 'chats':
    case 'club':
      return {
        id: 'ir_inicio',
        texto: 'Ver el feed',
        emoji: '📰',
        respuesta: 'Vamos a ver qué se está cociendo fuera de los chats.',
        animacion: 'happy',
        tab: 'inicio',
      };
    case 'profile':
    case 'achievements':
      return {
        id: 'ir_logros',
        texto: 'Ver mis logros',
        emoji: '🏆',
        respuesta: 'Echa un ojo a la vitrina. Hay más de lo que parece.',
        animacion: 'hype',
        tab: 'logros',
      };
    case 'trivia':
      return {
        id: 'ir_trivia',
        texto: 'Jugar la trivia',
        emoji: '🎯',
        respuesta: 'A por ella. Sin presión... mucha.',
        animacion: 'hype',
        tab: 'trivia',
      };
    case 'extras':
      return {
        id: 'ir_extras',
        texto: 'Ver los extras',
        emoji: '🧰',
        respuesta: 'Hay más herramientas de las que enseña la portada.',
        animacion: 'happy',
        tab: 'extras',
      };
    case 'support':
    case 'error':
      return {
        id: 'ir_soporte',
        texto: 'Abrir Soporte',
        emoji: '📮',
        respuesta: 'Cuéntalo ahí y lo miramos con calma.',
        animacion: 'thinking',
        tab: 'soporte',
      };
    case 'admin':
      return {
        id: 'ir_admin',
        texto: 'Seguir en el panel',
        emoji: '🛠️',
        respuesta: 'Aquí sigo si necesitas una mano con la cola.',
        animacion: 'idle',
        tab: 'admin',
      };
    case 'settings':
      return {
        id: 'ir_perfil',
        texto: 'Ir a mi perfil',
        emoji: '🪞',
        respuesta: 'Vamos a ver cómo queda todo por fuera.',
        animacion: 'happy',
        tab: 'perfil',
      };
    case 'reaction':
      return {
        id: 'ir_logros',
        texto: 'Ver mis logros',
        emoji: '🏆',
        respuesta: 'La vitrina está ahí para algo.',
        animacion: 'hype',
        tab: 'logros',
      };
    case 'first_thread':
    case 'first_comment':
    case 'first_message':
      return {
        id: 'ir_perfil',
        texto: 'Ver mi perfil',
        emoji: '🪞',
        respuesta: 'Mira lo que ya has construido.',
        animacion: 'happy',
        tab: 'perfil',
      };
    case 'level_up':
    case 'achievement':
    case 'trivia_done':
      return {
        id: 'ir_logros',
        texto: 'Ver mis logros',
        emoji: '🏆',
        respuesta: 'La vitrina se está poniendo interesante.',
        animacion: 'hype',
        tab: 'logros',
      };
    case 'login':
    case 'register':
      return {
        id: 'ir_wiki',
        texto: 'Explorar la wiki',
        emoji: '📚',
        respuesta: 'Buena forma de empezar. Hay series para rato.',
        animacion: 'happy',
        tab: 'wiki',
      };
    default:
      return {
        id: 'ir_wiki',
        texto: 'Ir a la wiki',
        emoji: '📚',
        respuesta: 'Vamos a buscar algo que te enganche.',
        animacion: 'happy',
        tab: 'wiki',
      };
  }
}

const ORDEN_FRECUENCIA: KapoFrecuencia[] = ['discreta', 'normal', 'parlanchina'];

const claveSesion = (uid: string) => `geekapoo:kapo:sesion:${uid}`;

function sesionYaVista(uid: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.sessionStorage.getItem(claveSesion(uid)) === '1';
  } catch {
    return false;
  }
}

function marcarSesion(uid: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(claveSesion(uid), '1');
  } catch {
    // Sin sessionStorage se saluda igual; como mucho se repite una
    // vez al recargar, que no es grave.
  }
}

// ======================================================
// PROVIDER
// ======================================================

export const KapoProvider: React.FC<{
  children: React.ReactNode;
  /** La pestaña de la URL, para saber en qué sección está. */
  currentSection?: string;
}> = ({ children, currentSection }) => {
  const { currentUser, authModalOpen, canManage } = useAuth();
  const { subidaPendiente, medallaPendiente, progreso } = useProgression();
  const { mascotDialogues, animes, threads, error: communityError } = useCommunity();
  const { activeRoomId, error: chatError, chatOpen } = useChat();
  const { misClubes, loading: clubesLoading } = useClubs();
  const {
    notifications,
    loading: notificacionesLoading,
    openPanel: panelNotificacionesAbierto,
  } = useNotifications();
  const { search } = useLocation();
  const navegar = useNavigate();

  const [mensaje, setMensaje] = useState<KapoMessage>(KAPO_FALLBACK);
  const [animacion, setAnimacion] = useState<KapoAnimation>('idle');
  const [esPropio, setEsPropio] = useState(false);
  const [origen, setOrigen] = useState<KapoOrigen>('seccion');
  const [opciones, setOpciones] = useState<KapoOpcion[]>([]);
  const [preferencias, setPreferencias] = useState<KapoPreferencias>(() =>
    leerPreferencias(),
  );

  // ── Refs de lógica ───────────────────────────────────
  const ultimoId = useRef<string | null>(null);
  const ultimoMs = useRef<number | null>(null);
  const recientes = useRef<string[]>([]);
  const mensajeRef = useRef<KapoMessage>(KAPO_FALLBACK);
  const opcionesRef = useRef<KapoOpcion[]>([]);
  const origenRef = useRef<KapoOrigen>('seccion');
  const visibleRef = useRef(false);
  const prefsRef = useRef(preferencias);
  const montadoRef = useRef(true);

  // Eventos de una sola vez.
  const vistos = useRef<Record<string, boolean>>({});
  const ultimaCelebracionMs = useRef<number | null>(null);
  const ultimaNotificacionMs = useRef<number | null>(null);
  const ultimaBusquedaVacia = useRef<string | null>(null);
  // Si el primer mensaje se envía dentro de una conversación
  // privada, la felicitación espera a que el usuario salga de ella.
  const primerMensajePendiente = useRef<KapoMessage | null>(null);

  // El poke alterna entre el banco del panel y las conversaciones.
  const indicePropio = useRef(0);
  const pokeCount = useRef(0);

  // Memoria de conversaciones.
  const ultimaConversacion = useRef<string | null>(null);

  // Entorno que leen los temporizadores sin reiniciarse en cada render.
  const contextoSeccion = useMemo(() => {
    // Las pantallas de acceso denegado no deben recibir una frase
    // de administración: no hay panel que gestionar. Lo mismo pasa
    // con Perfil y Ajustes cuando no hay sesión: detrás solo hay un
    // formulario de entrada.
    if (currentSection === 'admin' && !canManage) return 'home' as KapoContext;
    if (!currentUser && (currentSection === 'perfil' || currentSection === 'ajustes')) {
      return 'home' as KapoContext;
    }
    return contextoDesdeSeccion(currentSection);
  }, [currentSection, canManage, currentUser]);

  const hayBusqueda = useMemo(() => {
    // Solo cuenta como búsqueda si se está en la wiki: la URL puede
    // arrastrar `q` al cambiar de pestaña y no queremos que Kapo
    // hable de buscar mientras el usuario está en Chats.
    if (currentSection !== 'wiki') return false;
    try {
      return Boolean(new URLSearchParams(search).get('q')?.trim());
    } catch {
      return false;
    }
  }, [currentSection, search]);

  // Al buscar, las conversaciones hablan de búsqueda aunque la
  // pestaña siga siendo la wiki.
  const contextoInteraccion: KapoContext = hayBusqueda ? 'search' : contextoSeccion;

  const entornoRef = useRef({
    contexto: contextoInteraccion,
    activeRoomId,
    authModalOpen,
    panelNotificacionesAbierto,
    seccion: currentSection ?? 'inicio',
  });

  useEffect(() => {
    entornoRef.current = {
      contexto: contextoInteraccion,
      activeRoomId,
      authModalOpen,
      panelNotificacionesAbierto,
      seccion: currentSection ?? 'inicio',
    };
  }, [
    contextoInteraccion,
    activeRoomId,
    authModalOpen,
    panelNotificacionesAbierto,
    currentSection,
  ]);

  // ====================================================
  // PREFERENCIAS Y VISITAS
  // ====================================================
  useEffect(() => {
    prefsRef.current = preferencias;
    guardarPreferencias(preferencias);
  }, [preferencias]);

  useEffect(() => {
    if (!currentSection) return;
    setPreferencias((p) => registrarVisita(p, currentSection));
  }, [currentSection]);

  useEffect(() => {
    if (!hayBusqueda) return;
    setPreferencias((p) => registrarVisita(p, 'buscar'));
  }, [hayBusqueda]);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Al cambiar de cuenta se olvidan los "una vez por sesión" del
  // usuario anterior. Si no, la segunda persona que entra en el
  // mismo navegador no recibiría su primer mensaje ni su
  // recomendación.
  const uidAnteriorReset = useRef<string | undefined>(undefined);

  useEffect(() => {
    const uid = currentUser?.uid;
    const anterior = uidAnteriorReset.current;
    uidAnteriorReset.current = uid;
    if (anterior === uid) return;

    vistos.current = {};
    ultimaCelebracionMs.current = null;
    ultimaNotificacionMs.current = null;
    ultimaBusquedaVacia.current = null;
    primerMensajePendiente.current = null;

    // El texto anterior puede hablar de las medallas o del anime de
    // otra persona. Se borra al cerrar sesión o cambiar de cuenta,
    // pero no en la primera resolución de la sesión: ahí el mensaje
    // de bienvenida de la sección es inofensivo y evita un parpadeo.
    if (anterior === undefined) return;

    const limpio = { ...KAPO_FALLBACK };
    mensajeRef.current = limpio;
    opcionesRef.current = [];
    origenRef.current = 'seccion';
    ultimoId.current = null;
    ultimoMs.current = null;
    recientes.current = [];
    visibleRef.current = false;
    setMensaje(limpio);
    setOpciones([]);
    setAnimacion('idle');
    setOrigen('seccion');
    setEsPropio(false);
  }, [currentUser?.uid]);

  // ====================================================
  // DECIR
  // ====================================================
  const decir = useCallback(
    (
      nuevo: KapoMessage,
      opcionesDecir: {
        inmediato?: boolean;
        propio?: boolean;
        origen?: KapoOrigen;
        opciones?: KapoOpcion[];
      } = {},
    ): boolean => {
      const ahora = Date.now();
      const origenNuevo = opcionesDecir.origen ?? 'seccion';
      const importante = nuevo.priority >= 50;
      const prefs = prefsRef.current;

      // 1. El usuario ha cerrado el bocadillo: se respeta su
      //    silencio para todo lo que no sea importante ni pedido.
      const pausado =
        prefs.ultimoCierreMs !== null &&
        ahora - prefs.ultimoCierreMs < pausaTrasCierreMs(prefs.frecuencia);
      if (!opcionesDecir.inmediato && !importante && origenNuevo !== 'usuario' && pausado) {
        return false;
      }

      // 2. No interrumpir a quien está escribiendo con mensajes de
      //    sección o espontáneos. Los eventos importantes sí pasan:
      //    una subida de nivel no debería perderse porque el usuario
      //    esté redactando un comentario.
      if (
        !opcionesDecir.inmediato &&
        (origenNuevo === 'seccion' || origenNuevo === 'espontaneo') &&
        estaEscribiendo()
      ) {
        return false;
      }

      // 3. Enfriado y prioridad de siempre.
      const enfriado = importante ? ENFRIADO_EVENTO_MS : ENFRIADO_MS;
      if (
        !opcionesDecir.inmediato &&
        !debeMostrar(mensajeRef.current, nuevo, ahora, ultimoMs.current, enfriado)
      ) {
        return false;
      }

      // 4. Un evento inmediato no pisa una celebración mayor que
      //    acaba de aparecer (nivel 100 sobre medalla 95, por
      //    ejemplo). El poke del usuario sí puede con todo.
      if (
        opcionesDecir.inmediato &&
        origenNuevo !== 'usuario' &&
        mensajeRef.current.priority > nuevo.priority &&
        ahora - (ultimoMs.current ?? 0) < 8_000
      ) {
        return false;
      }

      // 5. Un espontáneo no reemplaza una conversación que el
      //    usuario acaba de abrir.
      if (origenNuevo === 'espontaneo' && visibleRef.current) {
        const edad = ahora - (ultimoMs.current ?? 0);
        if (origenRef.current === 'usuario' || edad < 75_000) return false;
      }

      // Se guarda una copia y no el objeto del banco: si vuelve a
      // tocar la misma frase pasado el enfriado, React debe volver
      // a pintar el bocadillo (y abrirlo si estaba cerrado). Con el
      // mismo objeto, `setState` se lo saltaría.
      const mostrado: KapoMessage = { ...nuevo };

      ultimoId.current = mostrado.id;
      ultimoMs.current = ahora;
      // La memoria de repetición solo guarda frases del banco. Las
      // respuestas y aperturas llevan marca de tiempo y, si se
      // guardaran, echarían fuera las frases útiles sin aportar
      // nada: nunca se repiten dos veces con el mismo id.
      if (KAPO_MENSAJES.some((m) => m.id === mostrado.id)) {
        recientes.current = [
          ...recientes.current.filter((id) => id !== mostrado.id),
          mostrado.id,
        ].slice(-24);
      }
      mensajeRef.current = mostrado;
      opcionesRef.current = opcionesDecir.opciones ?? [];
      origenRef.current = origenNuevo;

      setMensaje(mostrado);
      setAnimacion(mostrado.animation);
      setOpciones(opcionesDecir.opciones ?? []);
      setOrigen(origenNuevo);
      setEsPropio(opcionesDecir.propio ?? false);
      return true;
    },
    [],
  );

  const irA = useCallback(
    (tab: string) => {
      navegar(`/?tab=${tab}`);
    },
    [navegar],
  );

  const abrirDialogo = useCallback(() => {
    visibleRef.current = true;
  }, []);

  const cerrarDialogo = useCallback(() => {
    // Se apunta siempre, aunque el contexto no supiera que el
    // bocadillo estaba abierto: el primer mensaje de sección se
    // pinta sin pasar por `abrirDialogo`.
    visibleRef.current = false;
    setPreferencias((p) => ({ ...p, ultimoCierreMs: Date.now() }));
  }, []);

  const alternarEspontaneos = useCallback(() => {
    setPreferencias((p) => ({ ...p, espontaneos: !p.espontaneos }));
  }, []);

  const cambiarFrecuencia = useCallback(() => {
    setPreferencias((p) => {
      const i = ORDEN_FRECUENCIA.indexOf(p.frecuencia);
      return {
        ...p,
        frecuencia: ORDEN_FRECUENCIA[(i + 1) % ORDEN_FRECUENCIA.length],
      };
    });
  }, []);

  // ====================================================
  // DATOS REALES PARA LAS RESPUESTAS
  // ====================================================
  const bancoPropio = useMemo<KapoMessage[]>(
    () =>
      (mascotDialogues ?? [])
        .filter((texto) => typeof texto === 'string' && texto.trim().length > 0)
        .map((texto, i) => ({
          id: `panel_${i}`,
          context: 'poke' as KapoContext,
          text: texto,
          priority: PRIORIDAD.poke,
          animation: 'idle' as KapoAnimation,
        })),
    [mascotDialogues],
  );

  const animesPorId = useMemo(() => {
    const mapa: Record<string, { title: string; category?: string; genres?: string[] }> = {};
    (animes ?? []).forEach((a) => {
      mapa[a.id] = { title: a.title, category: a.category, genres: a.genres };
    });
    return mapa;
  }, [animes]);

  const recomendacion = useMemo(() => {
    const xp = progreso?.stats?.animeXp;
    return xp ? recomendacionDesdeActividad(xp, animesPorId) : null;
  }, [progreso?.stats?.animeXp, animesPorId]);

  const opcionesGenericas = useCallback(
    (contexto: KapoContext): KapoOpcion[] => {
      const lista: KapoOpcion[] = [
        {
          id: 'ayuda',
          texto: 'Ayuda por aquí',
          emoji: '🧭',
          respuesta: ayudaDeSeccion(contexto),
          animacion: 'thinking',
        },
      ];

      if (recomendacion) {
        lista.push({
          id: 'reco',
          texto: 'Recomiéndame algo',
          emoji: '🍿',
          respuesta: recomendacion,
          animacion: 'happy',
        });
      } else {
        lista.push({
          id: 'planes',
          texto: '¿Qué puedo hacer?',
          emoji: '✨',
          respuesta:
            'Depende de lo que te apetezca: leer la wiki, entrar en un hilo o probar la trivia. Yo te acompaño.',
          animacion: 'happy',
        });
      }

      const atajo = atajoDeContexto(contexto);
      if (atajo) lista.push(atajo);

      lista.push({
        id: 'saludo',
        texto: 'Solo pasaba a saludar',
        emoji: '👋',
        respuesta: 'Saludo aceptado. Aquí estaré si necesitas algo.',
        animacion: 'happy',
      });

      return lista;
    },
    [recomendacion],
  );

  const opcionesGenericasRef = useRef(opcionesGenericas);
  useEffect(() => {
    opcionesGenericasRef.current = opcionesGenericas;
  }, [opcionesGenericas]);

  // ====================================================
  // POKE Y RESPUESTAS
  // ====================================================
  const poke = useCallback(() => {
    const contexto = entornoRef.current.contexto;
    const usarPanel = bancoPropio.length > 0 && pokeCount.current % 4 === 3;
    pokeCount.current += 1;

    if (usarPanel) {
      const propio = bancoPropio[indicePropio.current % bancoPropio.length];
      indicePropio.current += 1;
      decir(
        { ...propio, id: `${propio.id}_${Date.now()}` },
        {
          inmediato: true,
          propio: true,
          origen: 'usuario',
          opciones: opcionesGenericas(contexto),
        },
      );
      return;
    }

    const conversacion = elegirConversacion(contexto, ultimaConversacion.current);
    if (conversacion) {
      ultimaConversacion.current = conversacion.id;
      decir(
        {
          id: `conv_${conversacion.id}_${Date.now()}`,
          context: contexto,
          text: conversacion.apertura,
          priority: PRIORIDAD.poke,
          animation: conversacion.animacion,
        },
        {
          inmediato: true,
          origen: 'usuario',
          opciones: conversacion.opciones,
        },
      );
      return;
    }

    decir(
      elegirMensaje(
        'poke',
        ultimoId.current,
        Math.random(),
        KAPO_MENSAJES,
        recientes.current,
      ),
      {
        inmediato: true,
        origen: 'usuario',
        opciones: opcionesGenericas(contexto),
      },
    );
  }, [bancoPropio, decir, opcionesGenericas]);

  const responder = useCallback(
    (opcionId: string) => {
      const opcion = opcionesRef.current.find((o) => o.id === opcionId);
      if (!opcion) return;

      const nuevo: KapoMessage = {
        id: `resp_${opcion.id}_${Date.now()}`,
        context: mensajeRef.current.context,
        text: opcion.respuesta,
        priority: PRIORIDAD.context,
        animation: opcion.animacion ?? 'happy',
      };

      decir(nuevo, {
        inmediato: true,
        origen: 'usuario',
        opciones: opcion.seguimiento ?? [],
      });

      if (opcion.tab) irA(opcion.tab);
    },
    [decir, irA],
  );

  const celebrar = useCallback(
    (contexto: KapoContext) => {
      decir(
        elegirMensaje(
          contexto,
          ultimoId.current,
          Math.random(),
          KAPO_MENSAJES,
          recientes.current,
        ),
        {
          inmediato: true,
          origen: 'evento',
          opciones: opcionesGenericas(contexto),
        },
      );
    },
    [decir, opcionesGenericas],
  );

  // ====================================================
  // SECCIÓN
  // ====================================================
  useEffect(() => {
    if (authModalOpen) return;
    // En un chat privado no se suelta una frase al entrar: ya hay
    // una conversación en marcha. El poke sigue disponible.
    if (contextoSeccion === 'chats' && activeRoomId) return;

    decir(
      elegirMensaje(
        contextoSeccion,
        ultimoId.current,
        Math.random(),
        KAPO_MENSAJES,
        recientes.current,
      ),
      { origen: 'seccion' },
    );
  }, [contextoSeccion, activeRoomId, authModalOpen, decir]);

  // ====================================================
  // LOGIN / REGISTRO
  // ====================================================
  //
  // La bienvenida normal ya la da el mensaje de sección al cargar.
  // Este efecto solo añade el saludo de sesión cuando la cuenta
  // aparece EN CALIENTE (login o registro), no en cada recarga: la
  // marca de `sessionStorage` evita repetirlo en la misma pestaña.
  const loginProgramado = useRef<string | null>(null);

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      loginProgramado.current = null;
      return;
    }
    if (loginProgramado.current === uid) return;

    // La marca de sesión evita saludar otra vez al recargar la
    // misma pestaña. En una pestaña nueva sí puede saludar, que es
    // lo que se espera de una sesión nueva.
    if (sesionYaVista(uid)) {
      loginProgramado.current = uid;
      return;
    }

    marcarSesion(uid);
    loginProgramado.current = uid;

    const creado = Date.parse(currentUser?.createdAt ?? '');
    const esNuevo = Number.isFinite(creado) && Date.now() - creado < 10 * 60_000;
    const contexto: KapoContext = esNuevo ? 'register' : 'login';
    const conversacion = esNuevo ? conversacionPorId('nuevo') : null;

    const t = window.setTimeout(() => {
      if (!montadoRef.current) return;
      // Si se ha cerrado sesión o cambiado de cuenta en este
      // tiempo, el saludo ya no es de quien está mirando.
      if (uidAnteriorReset.current !== uid) return;
      const base = elegirMensaje(
        contexto,
        ultimoId.current,
        Math.random(),
        KAPO_MENSAJES,
        recientes.current,
      );
      decir(
        { ...base, id: `${contexto}_${uid}_${Date.now()}` },
        {
          inmediato: true,
          origen: 'evento',
          opciones: conversacion?.opciones ?? opcionesGenericasRef.current(contexto),
        },
      );
    }, 1400);

    // A propósito no se cancela al desmontar: en StrictMode el
    // primer montaje se limpia y el segundo no volvería a programar
    // nada. El temporizador es corto y comprueba `montadoRef`.
    void t;
  }, [currentUser?.uid, currentUser?.createdAt, decir]);

  // ====================================================
  // NIVEL
  // ====================================================
  useEffect(() => {
    if (!subidaPendiente) return;

    const nivel = subidaPendiente.nivel;
    decir(
      {
        id: `level_up_${nivel}_${Date.now()}`,
        context: 'level_up',
        text: `🎊 ¡LEVEL UP! ¡Nivel ${nivel}!`,
        priority: PRIORIDAD.level_up,
        animation: 'hype',
      },
      {
        inmediato: true,
        origen: 'evento',
        opciones: opcionesGenericasRef.current('level_up'),
      },
    );
  }, [subidaPendiente, decir]);

  // ====================================================
  // MEDALLAS (incluye primer hilo, primera voz y clubes)
  // ====================================================
  useEffect(() => {
    if (!medallaPendiente) return;

    const ahora = Date.now();
    if (
      ultimaCelebracionMs.current !== null &&
      ahora - ultimaCelebracionMs.current < ENFRIADO_EVENTO_MS
    ) {
      return;
    }
    ultimaCelebracionMs.current = ahora;

    const contexto = contextoDeMedalla(medallaPendiente.id);
    const nombre = medallaPendiente.nombre?.trim() || 'Nueva medalla';

    let texto = `🏆 ¡«${nombre}» desbloqueada!`;
    if (contexto === 'first_thread') {
      texto = `🎉 ¡«${nombre}»! Tu primer hilo ya está en la comunidad.`;
    } else if (contexto === 'first_comment') {
      texto = `💬 ¡«${nombre}»! Ya has dejado tu primera respuesta.`;
    } else if (contexto === 'club') {
      texto = `🏰 ¡«${nombre}»! Los clubes ya te conocen.`;
    } else if (contexto === 'chats') {
      texto = `💬 ¡«${nombre}»! El chat ya forma parte de tu rutina.`;
    }

    const prioridad =
      contexto === 'first_thread'
        ? PRIORIDAD.first_thread
        : contexto === 'first_comment'
          ? PRIORIDAD.first_comment
          : contexto === 'club'
            ? PRIORIDAD.club
            : contexto === 'chats'
              ? PRIORIDAD.club
              : PRIORIDAD.achievement;

    decir(
      {
        id: `medal_${medallaPendiente.id}_${ahora}`,
        context: contexto,
        text: texto,
        priority: prioridad,
        animation: 'hype',
      },
      {
        inmediato: true,
        origen: 'evento',
        opciones: opcionesGenericasRef.current(contexto),
      },
    );
  }, [medallaPendiente, decir]);

  // ====================================================
  // NOTIFICACIONES REALES
  // ====================================================
  const notifUid = useRef<string | null>(null);
  const notifVistas = useRef<Set<string>>(new Set());

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      notifUid.current = null;
      notifVistas.current.clear();
      return;
    }

    if (notificacionesLoading) return;

    // La primera foto de la campana es el punto de partida. Si no
    // se sembrara, al abrir la web Kapo reaccionaría a avisos de
    // hace días como si acabaran de llegar.
    if (notifUid.current !== uid) {
      notifUid.current = uid;
      notifVistas.current = new Set(notifications.map((n) => n.id));
      ultimaNotificacionMs.current = null;
      return;
    }

    const nuevas = notifications.filter((n) => !notifVistas.current.has(n.id));
    if (nuevas.length === 0) return;
    nuevas.forEach((n) => notifVistas.current.add(n.id));

    const noLeidas = nuevas.filter((n) => !n.read);
    if (noLeidas.length === 0) return;

    const utiles = noLeidas.filter((n) => {
      // Los niveles y las medallas ya los cuenta Progression; las
      // sanciones no se airean en un bocadillo.
      if (
        n.type === 'level_up' ||
        n.type === 'achievement' ||
        n.type === 'club_sanction'
      ) {
        return false;
      }
      // Si ya estás dentro del chat, el aviso de mensaje no hace
      // falta: lo estás viendo.
      if (n.type === 'chat_message' && entornoRef.current.activeRoomId) {
        return false;
      }
      return true;
    });
    if (utiles.length === 0) return;

    const peso = (tipo: string): number => {
      switch (tipo) {
        case 'trivia':
          return 6;
        case 'comment_reply':
          return 5;
        case 'comment_thread':
        case 'mention':
          return 4;
        case 'post_like':
        case 'post_reaction':
        case 'comment_like':
        case 'comment_reaction':
          return 3;
        case 'follow':
          return 2;
        default:
          return 1;
      }
    };

    const elegida = [...utiles].sort((a, b) => peso(b.type) - peso(a.type))[0];

    const ahora = Date.now();
    if (
      ultimaNotificacionMs.current !== null &&
      ahora - ultimaNotificacionMs.current < 30_000
    ) {
      return;
    }
    ultimaNotificacionMs.current = ahora;

    if (elegida.type === 'trivia') {
      celebrar('trivia_done');
      return;
    }

    const traducida = mensajeDeNotificacion(elegida);
    if (!traducida) return;

    decir(
      {
        id: `notif_${elegida.id}_${ahora}`,
        context: traducida.context,
        text: traducida.text,
        priority:
          traducida.context === 'trivia_done'
            ? PRIORIDAD.trivia_done
            : PRIORIDAD.reaction,
        animation: 'hype',
      },
      {
        origen: 'evento',
        opciones: opcionesGenericasRef.current(traducida.context),
      },
    );
  }, [
    notifications,
    notificacionesLoading,
    currentUser?.uid,
    decir,
    celebrar,
  ]);

  // ====================================================
  // CLUBES
  // ====================================================
  const clubesUid = useRef<string | null>(null);
  const clubesVistos = useRef<Set<string>>(new Set());
  // Qué usuario ha pasado por una carga real de clubes. Evita
  // sembrar la lista vieja al cambiar de cuenta con Chats abierto.
  const clubesCargandoUid = useRef<string | null>(null);

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      clubesUid.current = null;
      clubesCargandoUid.current = null;
      clubesVistos.current.clear();
      return;
    }
    // `misClubes` solo está cargado de verdad con Chats abierto.
    // Sembrar la lista vacía de fuera de Chats haría que, al entrar,
    // todos los clubes viejos parecieran recién unidos.
    if (!chatOpen) return;
    if (clubesLoading) {
      clubesCargandoUid.current = uid;
      return;
    }
    if (clubesCargandoUid.current !== uid) return;

    if (clubesUid.current !== uid) {
      clubesUid.current = uid;
      clubesVistos.current = new Set(misClubes.map((c) => c.id));
      return;
    }

    const nuevos = misClubes.filter((c) => !clubesVistos.current.has(c.id));
    if (nuevos.length === 0) return;
    nuevos.forEach((c) => clubesVistos.current.add(c.id));

    const club = nuevos[0];
    const extra = nuevos.length > 1 ? ` Y ${nuevos.length - 1} más.` : '';

    decir(
      {
        id: `club_${club.id}_${Date.now()}`,
        context: 'club',
        text: `🏰 ¡Ya estás dentro de ${club.name}!${extra}`,
        priority: PRIORIDAD.club,
        animation: 'hype',
      },
      {
        origen: 'evento',
        opciones: opcionesGenericasRef.current('club'),
      },
    );
  }, [misClubes, clubesLoading, chatOpen, currentUser?.uid, decir]);

  // ====================================================
  // ERRORES (sin repetir el texto técnico)
  // ====================================================
  const errorCombinado = chatError || communityError;
  const ultimoError = useRef<string | null>(null);

  useEffect(() => {
    if (!errorCombinado) {
      ultimoError.current = null;
      return;
    }
    if (ultimoError.current === errorCombinado) return;
    ultimoError.current = errorCombinado;

    const base = elegirMensaje(
      'error',
      ultimoId.current,
      Math.random(),
      KAPO_MENSAJES,
      recientes.current,
    );

    decir(
      { ...base, id: `error_${Date.now()}` },
      {
        inmediato: true,
        origen: 'evento',
        opciones: opcionesGenericasRef.current('error'),
      },
    );
  }, [errorCombinado, decir]);

  // ====================================================
  // AVISOS LOCALES (chat enviado, búsqueda vacía)
  // ====================================================
  useEffect(() => {
    return escucharKapo((detalle) => {
      if (detalle.tipo === 'chat_message') {
        if (vistos.current.first_message) return;
        vistos.current.first_message = true;
        const base = elegirMensaje(
          'first_message',
          ultimoId.current,
          Math.random(),
          KAPO_MENSAJES,
          recientes.current,
        );
        const mensajePrimero = { ...base, id: `first_message_${Date.now()}` };

        // Dentro de una conversación privada no se suelta el
        // bocadillo: se guarda y se enseña al salir.
        if (
          entornoRef.current.contexto === 'chats' &&
          entornoRef.current.activeRoomId
        ) {
          primerMensajePendiente.current = mensajePrimero;
          return;
        }

        decir(mensajePrimero, {
          origen: 'evento',
          opciones: opcionesGenericasRef.current('first_message'),
        });
        return;
      }

      if (detalle.tipo === 'search_empty') {
        const query = (detalle.query ?? '').trim();
        if (!query || ultimaBusquedaVacia.current === query) return;
        ultimaBusquedaVacia.current = query;

        decir(
          {
            id: `search_empty_${Date.now()}`,
            context: 'search',
            text: `🔎 No ha salido nada con «${recortar(query, 60)}». Prueba con menos palabras, el título en inglés o el nombre de un personaje.`,
            priority: PRIORIDAD.error,
            animation: 'thinking',
          },
          {
            inmediato: true,
            origen: 'evento',
            opciones: [
              {
                id: 'buscar_otra',
                texto: 'Probar otra cosa',
                emoji: '🔎',
                respuesta:
                  'Prueba con menos palabras o con el nombre de un personaje. A veces el título que recuerdas no es el real.',
                animacion: 'thinking',
              },
              {
                id: 'buscar_comunidad',
                texto: 'Ver la comunidad',
                emoji: '💬',
                respuesta:
                  'Igual el tema ya está en un hilo. Vamos a mirar.',
                animacion: 'happy',
                tab: 'inicio',
              },
            ],
          },
        );
      }
    });
  }, [decir]);

  // Si el primer mensaje se envió dentro de una conversación,
  // la felicitación se queda esperando hasta que el usuario salga.
  useEffect(() => {
    if (!primerMensajePendiente.current) return;
    if (contextoSeccion === 'chats' && activeRoomId) return;

    const t = window.setTimeout(() => {
      const pendiente = primerMensajePendiente.current;
      if (!pendiente) return;
      if (
        entornoRef.current.contexto === 'chats' &&
        entornoRef.current.activeRoomId
      ) {
        return;
      }
      primerMensajePendiente.current = null;
      decir(pendiente, {
        origen: 'evento',
        opciones: opcionesGenericasRef.current('first_message'),
      });
    }, 1200);

    return () => window.clearTimeout(t);
  }, [contextoSeccion, activeRoomId, decir]);

  // ====================================================
  // RECOMENDACIÓN CON ACTIVIDAD REAL
  // ====================================================
  useEffect(() => {
    if (!recomendacion) return;
    if (vistos.current.reco) return;
    // Si el usuario ha silenciado los espontáneos, la recomendación
    // no se gasta: se guarda para cuando los vuelva a activar.
    if (!preferencias.espontaneos) return;

    const uid = currentUser?.uid;
    const t = window.setTimeout(() => {
      if (!montadoRef.current) return;
      if (uidAnteriorReset.current !== uid) return;
      if (!prefsRef.current.espontaneos) return;
      // La recomendación puede esperar; una conversación privada no.
      if (
        entornoRef.current.contexto === 'chats' &&
        entornoRef.current.activeRoomId
      ) {
        return;
      }
      const dicho = decir(
        {
          id: `reco_${Date.now()}`,
          context: 'home',
          text: recomendacion,
          priority: PRIORIDAD.context,
          animation: 'thinking',
        },
        {
          origen: 'espontaneo',
          opciones: opcionesGenericasRef.current('home'),
        },
      );
      if (dicho) vistos.current.reco = true;
    }, 15_000);

    return () => window.clearTimeout(t);
  }, [recomendacion, preferencias.espontaneos, currentUser?.uid, decir]);

  // ====================================================
  // INACTIVIDAD Y ESPONTÁNEOS
  // ====================================================
  const ultimaActividad = useRef(Date.now());
  const idleMostrado = useRef(false);

  useEffect(() => {
    const tocar = () => {
      ultimaActividad.current = Date.now();
      idleMostrado.current = false;
    };
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    eventos.forEach((evento) =>
      window.addEventListener(evento, tocar, { passive: true }),
    );
    return () =>
      eventos.forEach((evento) => window.removeEventListener(evento, tocar));
  }, []);

  const construirEspontaneo = useCallback((): {
    mensaje: KapoMessage;
    opciones: KapoOpcion[];
  } | null => {
    const contexto = entornoRef.current.contexto;
    const seccionActual = entornoRef.current.seccion;
    const prefs = prefsRef.current;
    const azar = Math.random();

    // 1. Una sección que todavía no ha visitado.
    if (azar < 0.25) {
      const candidata = seccionPorDescubrir(prefs.visitadas, SECCIONES_DESCUBRIBLES);
      if (candidata && candidata.seccion !== seccionActual) {
        return {
          mensaje: {
            id: `desc_${candidata.seccion}_${Date.now()}`,
            context: 'discovery',
            text: `${candidata.emoji} Todavía no te he visto por ${candidata.etiqueta}. ¿Te enseño lo que hay?`,
            priority: PRIORIDAD.discovery,
            animation: 'thinking',
          },
          opciones: [
            {
              id: `desc_ir_${candidata.seccion}`,
              texto: 'Vamos a ver',
              emoji: candidata.emoji,
              respuesta: `¡Genial! Te dejo allí para ${candidata.frase}.`,
              animacion: 'hype',
              tab: candidata.seccion,
            },
            {
              id: 'desc_luego',
              texto: 'Otro día',
              emoji: '🙃',
              respuesta: 'Vale. La puerta sigue abierta.',
              animacion: 'idle',
            },
          ],
        };
      }
    }

    // 2. Una conversación con opciones.
    if (azar < 0.6) {
      const conversacion = elegirConversacion(
        contexto,
        ultimaConversacion.current,
      );
      if (conversacion) {
        ultimaConversacion.current = conversacion.id;
        return {
          mensaje: {
            id: `spont_${conversacion.id}_${Date.now()}`,
            context: contexto,
            text: conversacion.apertura,
            priority: PRIORIDAD.spontaneous,
            animation: conversacion.animacion,
          },
          opciones: conversacion.opciones,
        };
      }
    }

    // 3. Actividad real del feed, si ya está cargada.
    if (azar < 0.75 && threads[0]?.title) {
      const hilo = threads[0];
      return {
        mensaje: {
          id: `spont_hilo_${hilo.id}_${Date.now()}`,
          context: 'community',
          text: `🧵 He visto «${recortar(hilo.title, 70)}» en el feed. Tiene pinta de dar conversación.`,
          priority: PRIORIDAD.spontaneous,
          animation: 'thinking',
        },
        opciones: [
          {
            id: 'hilo_ir',
            texto: 'Voy a mirar',
            emoji: '👀',
            respuesta: '¡Eso es! Se lee mejor con alguien más.',
            animacion: 'happy',
            tab: 'inicio',
          },
          {
            id: 'hilo_luego',
            texto: 'Luego',
            emoji: '⏳',
            respuesta: 'Vale, pero no lo dejes mucho. Los hilos se enfrían.',
            animacion: 'idle',
          },
        ],
      };
    }

    // 4. Pregunta del banco general. Es una pregunta abierta: no
    // se le cuelgan opciones genéricas que no respondan a lo que
    // acaba de preguntar. Si el usuario quiere seguir hablando,
    // puede tocar a Kapo y ahí sí hay conversaciones con opciones.
    return {
      mensaje: elegirMensaje(
        'spontaneous',
        ultimoId.current,
        Math.random(),
        KAPO_MENSAJES,
        recientes.current,
      ),
      opciones: [],
    };
  }, [threads]);

  const construirEspontaneoRef = useRef(construirEspontaneo);
  useEffect(() => {
    construirEspontaneoRef.current = construirEspontaneo;
  }, [construirEspontaneo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const revisar = () => {
      const prefs = prefsRef.current;
      if (!prefs.espontaneos) return;
      if (document.visibilityState !== 'visible') return;

      const ahora = Date.now();
      // Mientras el usuario se mueve, se lee o escribe, no se
      // suelta una pregunta. Se espera a que esté tranquilo.
      if (ahora - ultimaActividad.current < 8_000) return;
      if (estaEscribiendo()) return;
      if (
        entornoRef.current.authModalOpen ||
        entornoRef.current.panelNotificacionesAbierto ||
        hayCapaModal()
      ) {
        return;
      }
      if (
        entornoRef.current.contexto === 'chats' &&
        entornoRef.current.activeRoomId
      ) {
        return;
      }

      // Una conversación abierta por el usuario se respeta.
      if (visibleRef.current && origenRef.current === 'usuario') return;
      if (visibleRef.current && ahora - (ultimoMs.current ?? 0) < 75_000) return;

      if (
        prefs.ultimoCierreMs !== null &&
        ahora - prefs.ultimoCierreMs < pausaTrasCierreMs(prefs.frecuencia)
      ) {
        return;
      }

      if (
        ahora - (ultimoMs.current ?? 0) <
        intervaloEspontaneoMs(prefs.frecuencia)
      ) {
        return;
      }

      // Primero, si lleva mucho sin tocar nada, una frase de
      // compañía. Después, una pregunta o un descubrimiento.
      if (ahora - ultimaActividad.current > 150_000 && !idleMostrado.current) {
        idleMostrado.current = true;
        const base = elegirMensaje(
          'idle',
          ultimoId.current,
          Math.random(),
          KAPO_MENSAJES,
          recientes.current,
        );
        decir(
          { ...base, id: `idle_${Date.now()}` },
          {
            origen: 'espontaneo',
            opciones: opcionesGenericasRef.current(
              entornoRef.current.contexto,
            ),
          },
        );
        return;
      }

      const contenido = construirEspontaneoRef.current();
      if (!contenido) return;
      decir(contenido.mensaje, {
        origen: 'espontaneo',
        opciones: contenido.opciones,
      });
    };

    const id = window.setInterval(revisar, 15_000);
    return () => window.clearInterval(id);
  }, [decir]);

  // ====================================================
  // VALOR
  // ====================================================
  const valor: KapoContextType = {
    mensaje,
    animacion,
    esPropio,
    origen,
    opciones,
    preferencias,
    poke,
    celebrar,
    responder,
    abrirDialogo,
    cerrarDialogo,
    alternarEspontaneos,
    cambiarFrecuencia,
    irA,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useKapo = (): KapoContextType => {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useKapo debe usarse dentro de un KapoProvider');
  return ctx;
};
