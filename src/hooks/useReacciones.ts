import { useEffect, useMemo, useRef, useState } from 'react';
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
  REACCIONES_VACIAS,
  REACTIONS,
  reactionKey,
  sumar,
  type ReaccionesDeObjetivo,
} from '../services/reactions';
import type { ReactionCounts, ReactionTargetType, ReactionType } from '../types';

// ======================================================
// LECTURA DE LAS REACCIONES DE LO QUE SE ESTÁ VISTA
// ======================================================
//
// Los recuentos NO salen del hilo ni del comentario: salen de los
// documentos de `reactions`, que son la verdad y además ya traen
// el nombre de quien reaccionó. El `reactionCounts` que hay en el
// documento es la caché que escribe el servidor, y se usa para
// ordenar y sacar estadísticas, no para pintar.
//
// ── Por qué una escucha y no una por reacción ──────────────
//
// Una escucha por cada botón de "reaccionar" de la pantalla
// serían cientos en un hilo con muchos comentarios. Aquí se
// agrupan los objetivos de veinticinco en veinticinco con un
// `in` sobre `targetId` (el límite de Firestore es 30) y se
// reparten entre cuatro o cinco escuchas para toda la página.
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
// existe. Solo se veía la reacción propia, que viene de otra
// escucha (la de "mis reacciones", que sí filtraba por
// `userId`), y parecía que los contadores no funcionaban. De ahí
// las dos firmas separadas más abajo, y los asserts que lo
// cubren en `tests/logica.reacciones.ts`.

/** Un objetivo a vigilar: un hilo o un comentario (las respuestas son comentarios). */
export interface ObjetivoReaccion {
  targetType: ReactionTargetType;
  targetId: string;
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
  // todas las escuchas en cada repintado. Lo que se compara son
  // dos TEXTOS (firmas), que solo cambian cuando de verdad hay
  // otro contenido en pantalla.
  //
  // Y son dos, porque hacen falta dos cosas distintas:
  //
  //   - `firmaCrudos` → los `targetId` a pedír en la consulta, que
  //     son los del campo tal cual ("demo-thread-kaguya").
  //   - `firmaClaves` → las claves del mapa ("thread_" + id), con
  //     las que se filtra y se agrupa lo que vuelve.
  //
  // Meter la clave del mapa en la consulta devolvía CERO
  // documentos siempre, sin error ni aviso: se pedían reacciones
  // con targetId = "thread_demo-thread-kaguya", que no existe. Por
  // eso los dos están separados y con nombres explícitos.
  const firmaCrudos = useMemo(
    () => objetivos.map((o) => o.targetId).filter(Boolean).sort().join('|'),
    [objetivos],
  );

  const firmaClaves = useMemo(
    () =>
      objetivos
        .map((o) => reactionKey(o.targetType, o.targetId))
        .filter(Boolean)
        .sort()
        .join('|'),
    [objetivos],
  );

  const crudos = useMemo(() => (firmaCrudos ? firmaCrudos.split('|') : []), [firmaCrudos]);
  const claves = useMemo(
    () => new Set(firmaClaves ? firmaClaves.split('|') : []),
    [firmaClaves],
  );

  // ── Recuentos de todo lo visible ─────────────────────────
  useEffect(() => {
    if (crudos.length === 0) {
      setDe({});
      setCargando(false);
      return;
    }

    // La consulta pide los `targetId` CRUDOS; el agrupado usa las
    // claves con el tipo dentro. Ver las dos firmas de arriba.
    const trozos: string[][] = [];
    for (let i = 0; i < crudos.length; i += MAX_POR_CONSULTA) {
      trozos.push(crudos.slice(i, i + MAX_POR_CONSULTA));
    }

    // Un mapa por trozo: cada escucha solo conoce su parte y
    // al recibir datos vuelve a pintar el conjunto entero.
    const porTrozo = new Map<string, Record<string, ReaccionesDeObjetivo>>();
    // Cuáles han respondido AL MENOS UNA VEZ. Con esto se sabe
    // cuándo dejar de mostrar el estado de carga, sin contar
    // snapshots: los repintados posteriores no son la primera
    // respuesta.
    const respondidos = new Set<string>();
    let vivo = true;

    const repintar = (cargando: boolean) => {
      if (!vivo) return;
      const junto: Record<string, ReaccionesDeObjetivo> = {};
      porTrozo.forEach((trozo) => {
        Object.entries(trozo).forEach(([k, v]) => {
          junto[k] = v;
        });
      });
      setDe(junto);
      setCargando(cargando);
    };

    const unsubs = trozos.map((trozo) => {
      const nombreTrozo = `${trozo[0]}::${trozo.length}`;

      return onSnapshot(
        query(collection(db, REACTIONS), where('targetId', 'in', trozo), limit(700)),
        (snap) => {
          const contadores: Record<string, ReactionCounts> = {};
          const nombres: Record<string, Record<string, string[]>> = {};
          const idsVistos = new Set<string>();

          snap.docs.forEach((d) => {
            const data = d.data() as {
              targetId?: string;
              targetType?: string;
              type?: ReactionType;
              userName?: string;
              userId?: string;
            };
            if (!data.targetId || !data.type) return;

            const key = reactionKey(
              (data.targetType ?? 'thread') as ReactionTargetType,
              data.targetId,
            );
            // Solo se guarda lo que se ha pedido Y es del tipo
            // correcto. Sin este filtro, la consulta (que solo
            // filtra por targetId) también traería las reacciones
            // de un comentario cuando lo que se mira es un hilo
            // con ese mismo id.
            if (!claves.has(key)) return;

            contadores[key] = sumar(contadores[key] ?? {}, data.type, 1);

            const quien = data.userName || data.userId || '';
            if (quien) {
              const lista = nombres[key] ?? {};
              lista[data.type] = [...(lista[data.type] ?? []), quien];
              nombres[key] = lista;
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

          porTrozo.set(nombreTrozo, nuevos);
          respondidos.add(nombreTrozo);
          repintar(respondidos.size < trozos.length);
        },
        (e) => {
          console.error('[Reacciones] Error en una escucha de reacciones:', e);
          respondidos.add(nombreTrozo);
          repintar(respondidos.size < trozos.length);
        },
      );
    });

    return () => {
      vivo = false;
      unsubs.forEach((u) => u());
    };
  }, [crudos, claves]);

  // ── Las mías, en una sola escucha para toda la web ───────
  useEffect(() => {
    if (!uid) {
      setMias({});
      return;
    }

    return onSnapshot(
      query(collection(db, REACTIONS), where('userId', '==', uid), limit(500)),
      (snap) => {
        const mio: Record<string, ReactionType> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as {
            targetId?: string;
            targetType?: string;
            type?: ReactionType;
          };
          if (!data.targetId || !data.type) return;
          mio[reactionKey(
            (data.targetType ?? 'thread') as ReactionTargetType,
            data.targetId,
          )] = data.type;
        });
        setMias(mio);
      },
      (e) => {
        console.error('[Reacciones] Error leyendo mis reacciones:', e);
      },
    );
  }, [uid]);

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
