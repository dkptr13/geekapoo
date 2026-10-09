import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { useCommunity } from './CommunityContext';
import { useProgression } from './ProgressionContext';

import {
  KAPO_FALLBACK,
  contextoDesdeSeccion,
  type KapoAnimation,
  type KapoContext,
  type KapoMessage,
} from '../data/kapoDialogues';
import {
  ENFRIADO_EVENTO_MS,
  ENFRIADO_MS,
  debeMostrar,
  elegirMensaje,
  recomendacionDesdeActividad,
} from '../utils/kapo';

// ======================================================
// KAPO-CHAN DINÁMICA
// ======================================================
//
// Este contexto decide QUÉ dice la mascota y CUÁNTO puede hablar.
// El componente `OtakuMascot` solo la pinta: su globo, su
// arrastre y sus animaciones siguen siendo los de siempre.
//
// Aquí no hay un `if` por sección: los textos están en
// `data/kapoDialogues.ts` y las reglas en `utils/kapo.ts`, que
// además se pueden comprobar sin navegador.
//
// ── Los eventos (nivel, medalla) ─────────────────────────
//
// No los inventa este archivo: los SAC de `ProgressionContext`,
// que ya sabe cuándo sube un nivel y cuándo se desbloquea una
// medalla, porque las dos cosas escriben en el documento del
// usuario (`lastLevelUpAt` y `medals`). Así solo hay un sitio
// que mira el progreso, y Kapo no puede felicitar antes de que
// el logro exista de verdad.
//
// ── "Primer hilo" y "primer comentario" ───────────────────
//
// Sedetectan por las medallas que YA existen ("Debut" y "Primera
// Voz"), no por un contador nuevo. Dos motivos: la medalla la
// concede la Cloud Function con la cuenta real (no la que dice el
// cliente), y no hace falta guardar un "ya te lo he dicho" en
// ninguna parte, porque si la medalla existe ya se contó antes.
// Eso garantiza que el mensaje salga UNA vez, sin estado extra.

/** Medallas que merecen felicitación propia. */
const MEDALLA_DEBUT = 'medal_primer_hilo';
const MEDALLA_PRIMERA_VOZ = 'medal_primera_voz';

export interface KapoAccion {
  texto: string;
  tab: string;
  emoji: string;
}

export interface KapoContextType {
  /** Lo que dice ahora mismo. */
  mensaje: KapoMessage;
  /** Ánimo que debe tener la mascota. */
  animacion: KapoAnimation;
  /** `true` si el texto viene del panel de administración. */
  esPropio: boolean;
  /** Botones de acceso rápido. Solo hay algunos en el poke. */
  acciones: KapoAccion[];
  /** El usuario le ha hablado: dice algo ya. */
  poke: () => void;
  /** Avisa de un evento puntual desde fuera (trivia completada). */
  celebrar: (contexto: KapoContext) => void;
  /** Lleva a una pestaña. */
  irA: (tab: string) => void;
}

const Contexto = createContext<KapoContextType | undefined>(undefined);

export const KapoProvider: React.FC<{
  children: React.ReactNode;
  /** La pestaña de la URL, para saber en qué sección está. */
  currentSection?: string;
}> = ({ children, currentSection }) => {
  const { currentUser } = useAuth();
  const { subidaPendiente, medallaPendiente, progreso } = useProgression();
  const { mascotDialogues, animes } = useCommunity();
  const navegar = useNavigate();

  const [mensaje, setMensaje] = useState<KapoMessage>(KAPO_FALLBACK);
  const [animacion, setAnimacion] = useState<KapoAnimation>('idle');
  const [esPropio, setEsPropio] = useState(false);

  // El último dicho y cuándo se dijo. Van en refs porque son
  // estado de la lógica y no algo que pintar: si fueran estado,
  // cada cambio provocaría un repintado de la página entera.
  const ultimoId = useRef<string | null>(null);
  const ultimoMs = useRef<number | null>(null);

  // Los eventos de una sola vez ya han pasado o no pasan nunca.
  const vistos = useRef<Record<string, boolean>>({});

  /**
   * Los textos del panel de administración (`mascot_dialogues`).
   *
   * Se conservan: siguen siendo los que usa el equipo para hablar
   * de forma normal, que es donde se repiten. Los eventos
   * importantes salen del banco de código porque llevan un número
   * dentro (el nivel, el nombre de la medalla) y en Firestore no
   * se pueden generar.
   */
  const bancoPropio = useMemo<KapoMessage[]>(
    () =>
      (mascotDialogues ?? [])
        .filter(Boolean)
        .map((texto, i) => ({
          id: `panel_${i}`,
          context: 'poke' as KapoContext,
          text: texto,
          // Prioridad 0: es lo mismo que un poke, porque llega
          // por un poke.
          priority: 0,
          animation: 'idle' as KapoAnimation,
        })),
    [mascotDialogues],
  );

  const decir = useCallback(
    (
      nuevo: KapoMessage,
      opciones: { inmediato?: boolean; propio?: boolean } = {},
    ) => {
      const ahora = Date.now();
      const enfriado = nuevo.priority >= 50 ? ENFRIADO_EVENTO_MS : ENFRIADO_MS;

      if (
        !opciones.inmediato &&
        !debeMostrar(mensaje, nuevo, ahora, ultimoMs.current, enfriado)
      ) {
        return;
      }

      ultimoId.current = nuevo.id;
      ultimoMs.current = ahora;
      setMensaje(nuevo);
      setAnimacion(nuevo.animation);
      setEsPropio(opciones.propio ?? false);
    },
    [mensaje],
  );

  const celebrar = useCallback(
    (contexto: KapoContext) => {
      decir(elegirMensaje(contexto, ultimoId.current), { inmediato: true });
    },
    [decir],
  );

  // ── Cambiar de sección ───────────────────────────────
  useEffect(() => {
    decir(elegirMensaje(contextoDesdeSeccion(currentSection), ultimoId.current));
  }, [currentSection, decir]);

  // ── Bienvenida: una vez al cargar ────────────────────
  //
  // A los dos segundos y medio, que es cuando la página ya ha
  // dejado de moverse y no se pisa con el mensaje de sección.
  useEffect(() => {
    if (!currentUser) return;
    if (vistos.current.welcome) return;
    vistos.current.welcome = true;

    const t = window.setTimeout(() => {
      decir(elegirMensaje('welcome_back', null));
    }, 2500);

    return () => window.clearTimeout(t);
  }, [currentUser, decir]);

  // ── Subida de nivel ──────────────────────────────────
  useEffect(() => {
    if (!subidaPendiente) return;

    const nivel = subidaPendiente.nivel;
    decir(
      {
        id: `level_up_${nivel}`,
        context: 'level_up',
        // El número va en el texto: un "¡LEVEL UP!" a secas no
        // dice nada, lo que quiere saber el usuario es hasta
        // dónde ha llegado.
        text: `🎊 ¡LEVEL UP! ¡Nivel ${nivel}!`,
        priority: 100,
        animation: 'hype',
      },
      { inmediato: true },
    );
  }, [subidaPendiente, decir]);

  // ── Medalla nueva ────────────────────────────────────
  useEffect(() => {
    if (!medallaPendiente) return;
    celebrar('achievement');
  }, [medallaPendiente, celebrar]);

  // ── Primer hilo / primer comentario ──────────────────
  const medals = progreso?.medals;

  useEffect(() => {
    if (!medals) return;

    // Las dos medals que merecen felicitación propia. Se marcan
    // como vistas aunque ya las tuviera de antes: si no,
    // alguien que vuelve a la web con las medallas puestas vería
    // la felicitación como si fueran nuevas.
    if (medals[MEDALLA_DEBUT] && !vistos.current.first_thread) {
      vistos.current.first_thread = true;
      celebrar('first_thread');
    }

    if (medals[MEDALLA_PRIMERA_VOZ] && !vistos.current.first_comment) {
      vistos.current.first_comment = true;
      celebrar('first_comment');
    }
  }, [medals, celebrar]);

  // ── Recomendación por actividad real ──────────────────
  //
  // Solo se dice algo si hay XP acumulado en alguna sección de
  // la wiki: es decir, si el usuario ha comentado o recibido
  // "Me gusta" ahí. Con cero datos no se inventa un gusto, que es
  // justo lo que hay que evitar.
  const animeXp = progreso?.stats?.animeXp;

  // El catálogo llega como lista y la función de recomendación
  // lo quiere como mapa por id. Se construye aquí, y solo si hay
  // algo que recomendar: si no, no se monta nada.
  const animesPorId = useMemo(() => {
    const mapa: Record<string, { title: string; category?: string; genres?: string[] }> = {};
    (animes ?? []).forEach((a) => {
      mapa[a.id] = { title: a.title, category: a.category, genres: a.genres };
    });
    return mapa;
  }, [animes]);

  useEffect(() => {
    if (!animeXp) return;

    const texto = recomendacionDesdeActividad(animeXp, animesPorId);
    if (!texto) return;
    if (vistos.current.reco) return;
    vistos.current.reco = true;

    // A los 15 segundos: es un mensaje de contexto, no un
    // evento, así que va después de que se haya tranquilidad la
    // página.
    const t = window.setTimeout(() => {
      decir({ id: 'reco_1', context: 'home', text: texto, priority: 10, animation: 'thinking' });
    }, 15_000);

    return () => window.clearTimeout(t);
  }, [animeXp, animesPorId, decir]);

  // ── El poke ──────────────────────────────────────────
  //
  // Alterna entre los textos del panel de administración y el
  // banco de frases. Empieza por los del panel, porque son los
  // que el equipo ha escrito para este momento.
  const indicePropio = useRef(0);

  const poke = useCallback(() => {
    if (bancoPropio.length > 0) {
      const propio = bancoPropio[indicePropio.current % bancoPropio.length];
      indicePropio.current += 1;
      decir(propio, { inmediato: true, propio: true });
      return;
    }

    decir(elegirMensaje('poke', ultimoId.current), { inmediato: true });
  }, [bancoPropio, decir]);

  // ── Botones de acceso rápido ──────────────────────────
  //
  // Solo cuando el usuario le ha hablado. Si estuvieran
  // siempre serían parte fija de la pantalla y taparían
  // contenido, que es justo lo que no debe hacer un bocadillo
  // flotante encima de la web.
  const pokeAbierto = mensaje.context === 'poke';

  const acciones = useMemo<KapoAccion[]>(
    () =>
      pokeAbierto
        ? [
            { texto: 'Trivia', tab: 'trivia', emoji: '🎯' },
            { texto: 'Wiki', tab: 'wiki', emoji: '📚' },
            { texto: 'Comunidad', tab: 'inicio', emoji: '💬' },
          ]
        : [],
    [pokeAbierto],
  );

  const irA = useCallback(
    (tab: string) => {
      navegar(`/?tab=${tab}`);
    },
    [navegar],
  );

  const valor: KapoContextType = {
    mensaje,
    animacion,
    esPropio,
    acciones,
    poke,
    celebrar,
    irA,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useKapo = (): KapoContextType => {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useKapo debe usarse dentro de un KapoProvider');
  return ctx;
};
