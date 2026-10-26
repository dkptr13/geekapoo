import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  MAX_POR_CONSULTA,
  MAX_POR_CONSULTA_CHAT,
  REACCIONES_VACIAS,
  REACTIONS,
  clavesParaAgrupar,
  consultasDeReacciones,
  reactionKey,
  sumar,
  type ObjetivoReaccion,
  type ReaccionesDeObjetivo,
} from '../services/reactions';
import type { ReactionCounts, ReactionTargetType, ReactionType } from '../types';

export type { ObjetivoReaccion } from '../services/reactions';

// ======================================================
// LECTURA DE LAS REACCIONES DE LO QUE SE ESTÁ VIENDO
// ======================================================
//
// Los recuentos NO salen del hilo ni del comentario: salen de los
// documentos de `reactions`, que son la verdad y además ya traen
// el nombre de quien reaccionó. El `reactionCounts` que hay en el
// documento es la caché que escribe el servidor, y se usa para
// ordenar y sacar estadísticas, no para pintar.
//
// ── Consultas separadas: las reglas no son un filtro ──────
//
// Hilos y comentarios son públicos, pero las reacciones a mensajes
// de chat solo las puede leer un miembro del chat. Firestore no
// aplica la regla después de consultar: si una consulta puede
// devolver documentos de un chat ajeno, la deniega entera. Por eso
// no se piden todos los `targetId` en una sola escucha:
//
//   · hilo / comentario → `targetType == ...` + `targetId in [...]`
//   · mensaje            → además `chatId == ...`
//
// `consultasDeReacciones` hace ese reparto y omite los mensajes sin
// `chatId` (documentos viejos): sin ese campo no hay forma segura de
// saber a qué chat pertenecen.
//
// ── Por qué varias escuchas y no una por reacción ─────────
//
// Una escucha por cada botón de "reaccionar" de la pantalla
// serían cientos en un hilo con muchos comentarios. Aquí se
// agrupan los objetivos con un `in` sobre `targetId` (el límite
// de Firestore es 30): de 25 en 25 para lo público y de 8 en 8
// para chats, porque la regla de chat lee el chat y cada mensaje
// y esas lecturas tienen su propio presupuesto.
//
// ── OJO: la consulta y el mapa usan dos formatos distintos ──
//
// La consulta pide el `targetId` CRUDO ("demo-thread-kaguya"),
// que es el valor del campo en Firestore. El mapa de la interfaz
// se indexa con `reactionKey` ("thread_demo-thread-kaguya"), que
// lleva el tipo dentro para que un hilo y un comentario con el
// mismo id no se pisen.
//
// Confundir los dos hacía que la consulta devolviera CERO
// documentos siempre, sin ningún error: se buscaban reacciones
// cuyo `targetId` fuera "thread_demo-thread-kaguya", y eso no
// existe. Solo se veía la reacción propia, que venía de la escucha
// global de "mis reacciones", y parecía que los contadores no
// funcionaban. De ahí las firmas separadas y los asserts que lo
// cubren en `tests/logica.reacciones.ts`.
//
// La escucha global de "mis reacciones" ya no existe: pedía todos
// los documentos del usuario sin delimitar el tipo ni el chat, y
// con las reglas nuevas esa consulta no se puede autorizar. La
// reacción propia llega en la consulta de su objetivo, que ya
// trae `userId`.

interface TrozoReacciones {
  de: Record<string, ReaccionesDeObjetivo>;
  mias: Record<string, ReactionType>;
}

export interface UseReacciones {
  /** Recuentos y nombres, por `reactionKey(tipo, id)`. */
  de: Record<string, ReaccionesDeObjetivo>;
  /** La reacción que tiene puesta quien mira, por `reactionKey`. */
  mias: Record<string, ReactionType>;
  /** `true` hasta que han llegado los primeros datos. */
  cargando: boolean;
}

export function useReacciones(objetivos: ObjetivoReaccion[]): UseReacciones {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? null;

  const [de, setDe] = useState<Record<string, ReaccionesDeObjetivo>>({});
  const [mias, setMias] = useState<Record<string, ReactionType>>({});
  const [cargando, setCargando] = useState(true);

  // La lista de objetivos llega nueva en cada render, así que no
  // puede ser la dependencia del efecto directamente: reiniciaría
  // todas las escuchas en cada repintado. La firma incluye tipo,
  // chat e id; dos pantallas con lo mismo no reinician nada, y un
  // cambio de chat sí.
  const firma = useMemo(
    () =>
      objetivos
        .map((o) => `${o.targetType}\u0000${o.chatId ?? ''}\u0000${o.targetId}`)
        .sort()
        .join('\u0001'),
    [objetivos],
  );

  const { consultas, claves } = useMemo(
    () => ({
      consultas: consultasDeReacciones(objetivos),
      claves: clavesParaAgrupar(objetivos),
    }),
    // `objetivos` está representado por `firma`: mismos datos, misma
    // firma. Así el efecto no se reinicia por una lista nueva con el
    // mismo contenido.
    [firma],
  );

  // ── Recuentos de todo lo visible ─────────────────────────
  useEffect(() => {
    if (consultas.length === 0) {
      setDe({});
      setMias({});
      setCargando(false);
      return;
    }

    setCargando(true);

    // Cada trabajo es un trozo de una consulta. El `nombre` los
    // distingue para poder reemplazar solo su parte al repintar.
    const trabajos = consultas.flatMap((grupo) => {
      // En chats el tope es menor: la regla lee el chat y cada
      // mensaje para comprobar que la reacción no apunta a otro
      // sitio, y esas lecturas cuentan en el presupuesto de reglas.
      const tam =
        grupo.targetType === 'chat_message'
          ? MAX_POR_CONSULTA_CHAT
          : MAX_POR_CONSULTA;
      const trozos: string[][] = [];
      for (let i = 0; i < grupo.ids.length; i += tam) {
        trozos.push(grupo.ids.slice(i, i + tam));
      }

      return trozos.map((ids) => {
        const nombre = `${grupo.targetType}::${grupo.chatId ?? ''}::${ids[0]}::${ids.length}`;
        const consulta = grupo.targetType === 'chat_message' && grupo.chatId
          ? query(
              collection(db, REACTIONS),
              where('targetType', '==', 'chat_message'),
              where('chatId', '==', grupo.chatId),
              where('targetId', 'in', ids),
              limit(700),
            )
          : query(
              collection(db, REACTIONS),
              where('targetType', '==', grupo.targetType),
              where('targetId', 'in', ids),
              limit(700),
            );

        return { nombre, consulta, grupo };
      });
    });

    // Un mapa por trozo: cada escucha solo conoce su parte y al
    // recibir datos vuelve a pintar el conjunto entero.
    const porTrozo = new Map<string, TrozoReacciones>();
    // Cuáles han respondido AL MENOS UNA VEZ. Con esto se sabe
    // cuándo dejar de mostrar el estado de carga, sin contar
    // snapshots: los repintados posteriores no son la primera
    // respuesta.
    const respondidos = new Set<string>();
    let vivo = true;

    const repintar = (cargando: boolean) => {
      if (!vivo) return;
      const junto: Record<string, ReaccionesDeObjetivo> = {};
      const miasJunto: Record<string, ReactionType> = {};
      porTrozo.forEach((trozo) => {
        Object.entries(trozo.de).forEach(([k, v]) => {
          junto[k] = v;
        });
        Object.entries(trozo.mias).forEach(([k, v]) => {
          miasJunto[k] = v;
        });
      });
      setDe(junto);
      setMias(miasJunto);
      setCargando(cargando);
    };

    const unsubs = trabajos.map(({ nombre, consulta, grupo }) =>
      onSnapshot(
        consulta,
        (snap) => {
          const contadores: Record<string, ReactionCounts> = {};
          const nombres: Record<string, Record<string, string[]>> = {};
          const mios: Record<string, ReactionType> = {};
          const idsVistos = new Set<string>();

          snap.docs.forEach((d) => {
            const data = d.data() as {
              targetId?: string;
              targetType?: string;
              chatId?: string;
              type?: ReactionType;
              userName?: string;
              userId?: string;
            };
            if (!data.targetId || !data.type) return;

            // Defensa extra: la consulta ya filtra por tipo/chat,
            // pero nunca se agrupa un documento de otro ámbito.
            if (grupo.targetType === 'chat_message') {
              if (data.targetType !== 'chat_message') return;
              if (data.chatId !== grupo.chatId) return;
            } else if (data.targetType !== grupo.targetType) {
              return;
            }

            const key = reactionKey(grupo.targetType, data.targetId);
            // Solo se guarda lo que se ha pedido. Sin este filtro,
            // un objetivo con el mismo id pero de otra pantalla se
            // colaría en el mapa.
            if (!claves.has(key)) return;

            contadores[key] = sumar(contadores[key] ?? {}, data.type, 1);

            const quien = data.userName || data.userId || '';
            if (quien) {
              const lista = nombres[key] ?? {};
              lista[data.type] = [...(lista[data.type] ?? []), quien];
              nombres[key] = lista;
            }

            if (uid && data.userId === uid) {
              mios[key] = data.type;
            }

            idsVistos.add(key);
          });

          const nuevos: Record<string, ReaccionesDeObjetivo> = {};
          idsVistos.forEach((key) => {
            const counts = contadores[key] ?? {};
            nuevos[key] = {
              counts,
              nombres: nombres[key] ?? {},
              total: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
            };
          });

          porTrozo.set(nombre, { de: nuevos, mias: mios });
          respondidos.add(nombre);
          repintar(respondidos.size < trabajos.length);
        },
        (e) => {
          console.error('[Reacciones] Error en una escucha de reacciones:', e);
          // No se dejan datos viejos de este trozo: si la consulta
          // ya no está autorizada, no se puede seguir enseñando lo
          // que se leyó antes.
          porTrozo.set(nombre, { de: {}, mias: {} });
          respondidos.add(nombre);
          repintar(respondidos.size < trabajos.length);
        },
      ),
    );

    return () => {
      vivo = false;
      unsubs.forEach((u) => u());
    };
  }, [consultas, claves, uid]);

  return { de, mias, cargando };
}

/** Atajo: los recuentos de un objetivo concreto. */
export function reaccionesDe(
  de: Record<string, ReaccionesDeObjetivo>,
  targetType: ReactionTargetType,
  targetId: string,
): ReaccionesDeObjetivo {
  return de[reactionKey(targetType, targetId)] ?? REACCIONES_VACIAS;
}
