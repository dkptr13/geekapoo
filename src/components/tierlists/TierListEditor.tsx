import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  ImagePlus,
  Loader2,
  Lock,
  Globe,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Trophy,
  Upload,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { uploadCommunityImage } from '../../services/imageUpload';
import { cargarImagen } from '../../services/imageCanvas';
import { dimsValidas, type ImageDims } from '../../utils/imagenes';
import {
  COLORES_NIVEL,
  TIER_LIMITS,
  elementosDe,
  moverElemento,
  nivelesIniciales,
  nuevoId,
  quitarElemento,
  validarTierList,
  type EditorDraft,
} from '../../utils/tierlists';
import { CLUB_CATEGORIES } from '../../types';
import type {
  ClubCategory,
  TierItem,
  TierRow,
} from '../../types';
import type { TierResult } from '../../services/tierlists';
import { TierListView } from './TierListView';

// ======================================================
// EDITOR DE TIER LISTS
// ======================================================
//
// Creador visual por niveles (S/A/B/C/D/F...), todo
// personalizable: nombres, colores, orden, añadir y quitar
// niveles (mínimo uno). Los elementos son tarjetas con imagen
// que se mueven entre filas.
//
// Cómo se mueve (ratón Y dedo):
//
//   - Arrastrar y soltar entre filas o sobre otra tarjeta
//     (para colocarse delante de ella).
//   - Tocar una tarjeta para seleccionarla y tocar después la
//     fila o la tarjeta destino.
//   - Botones ‹ › en cada tarjeta para pasarla a la fila
//     anterior o siguiente sin arrastrar.
//
// Todo cambio se pinta al instante: el estado manda y no hay
// escrituras intermedias en Firestore.
//
// El borrador se guarda en el navegador mientras se edita
// (solo al crear, no al editar una existente): si se cambia
// de sección sin querer, al volver sigue ahí. Cerrar con
// cambios pide confirmación.
// ======================================================

interface TierListEditorProps {
  /** Borrador inicial (editar o plantilla). Sin él, borrador guardado o vacío. */
  initial?: Partial<EditorDraft>;
  /** Origen si nace como copia (se guarda al publicar). */
  originId?: string;
  originTitle?: string;
  /** Club que puede verla (ofrece visibilidad de club). */
  clubId?: string;
  clubName?: string;
  modo: 'nuevo' | 'editar';
  /** Guarda (crear o actualizar, lo decide el padre). */
  onGuardar: (datos: EditorDraft & { originId?: string; originTitle?: string; clubId?: string }) => Promise<TierResult>;
  /** Tras guardar bien, con el id nuevo. */
  onGuardado?: (tierListId: string) => void;
  onClose: () => void;
}

function borradorVacio(visibilidad: 'public' | 'club'): EditorDraft {
  return {
    title: '',
    description: '',
    category: 'anime-manga',
    tiers: nivelesIniciales(),
    items: [],
    placement: {},
    poolOrder: { pool: [] },
    voting: { enabled: false, allowChange: false },
    visibility: visibilidad,
  };
}

export const TierListEditor: React.FC<TierListEditorProps> = ({
  initial,
  originId,
  originTitle,
  clubId,
  clubName,
  modo,
  onGuardar,
  onGuardado,
  onClose,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const { animes, characters } = useCommunity();

  const [draft, setDraft] = useState<EditorDraft>(() => ({
    ...borradorVacio(clubId ? 'club' : 'public'),
    ...initial,
    tiers: initial?.tiers ? initial.tiers.map((t) => ({ ...t })) : nivelesIniciales(),
    items: initial?.items ? initial.items.map((i) => ({ ...i })) : [],
    placement: { ...(initial?.placement ?? {}) },
    poolOrder: Object.fromEntries(
      Object.entries(initial?.poolOrder ?? { pool: [] }).map(([k, v]) => [k, [...v]]),
    ),
  }));

  // Foto tomada al abrir: cerrar sin cambios no pregunta.
  const [fotoInicial] = useState(() => JSON.stringify(draft));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sucio = JSON.stringify({ ...draft, coverUrl: draft.coverUrl ?? '' }) !== fotoInicial;

  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [soltarEn, setSoltarEn] = useState<string | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queriendoCerrar, setQueriendoCerrar] = useState(false);

  // ── Borrador en el navegador (solo al crear) ──────────
  const claveBorrador = currentUser ? `geekapoo:tierdraft:${currentUser.uid}` : null;

  // Al abrir sin `initial`, se recupera lo que hubiera.
  useEffect(() => {
    if (initial || !claveBorrador) return;
    try {
      const raw = localStorage.getItem(claveBorrador);
      if (!raw) return;
      const guardado = JSON.parse(raw) as Partial<EditorDraft>;
      if (guardado && (guardado.title || (guardado.items ?? []).length > 0)) {
        setDraft((prev) => ({ ...prev, ...guardado }));
      }
    } catch {
      // Borrador corrupto: se empieza de cero.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoguardado con espera.
  const timerBorrador = useRef<number | null>(null);
  useEffect(() => {
    if (modo !== 'nuevo' || !claveBorrador) return;
    if (timerBorrador.current !== null) window.clearTimeout(timerBorrador.current);
    timerBorrador.current = window.setTimeout(() => {
      try {
        localStorage.setItem(claveBorrador, JSON.stringify(draft));
      } catch {
        // Sin almacenamiento no hay borrador. Nada más.
      }
    }, 500);
    return () => {
      if (timerBorrador.current !== null) window.clearTimeout(timerBorrador.current);
    };
  }, [draft, modo, claveBorrador]);

  const niveles = useMemo(
    () =>
      [...draft.tiers].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.id < b.id ? -1 : 1;
      }),
    [draft.tiers],
  );

  /** Elementos como mapa (lo que espera `elementosDe`). */
  const itemsMapa = useMemo(() => {
    const mapa: Record<string, Omit<TierItem, 'id'>> = {};
    for (const item of draft.items) {
      const { id, ...def } = item;
      mapa[id] = def;
    }
    return mapa;
  }, [draft.items]);

  /** Filas del tablero: niveles + pool al final. */
  const filas: { id: string; label: string; color: string; esPool: boolean }[] = [
    ...niveles.map((t) => ({ id: t.id, label: t.label, color: t.color, esPool: false })),
    { id: 'pool', label: 'Sin clasificar', color: '#52525b', esPool: true },
  ];

  const colocar = (itemId: string, destino: string, indice = -1) => {
    setDraft((prev) => {
      const r = moverElemento(prev.placement, prev.poolOrder, itemId, destino, indice);
      return { ...prev, placement: r.placement, poolOrder: r.poolOrder };
    });
    setSeleccionado(null);
  };

  const moverVecino = (itemId: string, dir: -1 | 1) => {
    const actual = draft.placement[itemId] ?? 'pool';
    const i = filas.findIndex((f) => f.id === actual);
    const destino = filas[Math.min(filas.length - 1, Math.max(0, i + dir))];
    if (destino && destino.id !== actual) colocar(itemId, destino.id);
  };

  const borrarItem = (itemId: string) => {
    setDraft((prev) => {
      const r = quitarElemento(prev.placement, prev.poolOrder, itemId, true, prev.items);
      return { ...prev, placement: r.placement, poolOrder: r.poolOrder, items: r.items };
    });
    if (seleccionado === itemId) setSeleccionado(null);
  };

  const alSoltar = (e: React.DragEvent, destino: string, indice = -1) => {
    e.preventDefault();
    e.stopPropagation();
    setSoltarEn(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) colocar(itemId, destino, indice);
  };

  const alTocarFila = (tierId: string) => {
    if (seleccionado) colocar(seleccionado, tierId);
  };

  const alTocarTarjeta = (itemId: string, tierId: string, indice: number) => {
    if (seleccionado && seleccionado !== itemId) {
      colocar(seleccionado, tierId, indice);
    } else {
      setSeleccionado(seleccionado === itemId ? null : itemId);
    }
  };

  // ── Niveles ─────────────────────────────────────────
  const cambiarNivel = (id: string, cambios: Partial<TierRow>) => {
    setDraft((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, ...cambios } : t)),
    }));
  };

  const subirNivel = (id: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const ordenados = [...prev.tiers].sort((a, b) => a.order - b.order);
      const i = ordenados.findIndex((t) => t.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ordenados.length) return prev;
      const a = ordenados[i];
      const b = ordenados[j];
      return {
        ...prev,
        tiers: prev.tiers.map((t) =>
          t.id === a.id ? { ...t, order: b.order } : t.id === b.id ? { ...t, order: a.order } : t,
        ),
      };
    });
  };

  const borrarNivel = (id: string) => {
    setDraft((prev) => {
      if (prev.tiers.length <= TIER_LIMITS.minTiers) return prev;
      // Sus elementos vuelven al pool, no se pierden.
      let placement = { ...prev.placement };
      let poolOrder = { ...prev.poolOrder };
      for (const itemId of Object.keys(placement)) {
        if (placement[itemId] === id) {
          const r = moverElemento(placement, poolOrder, itemId, 'pool');
          placement = r.placement;
          poolOrder = r.poolOrder;
        }
      }
      return {
        ...prev,
        tiers: prev.tiers.filter((t) => t.id !== id),
        placement,
        poolOrder,
      };
    });
    if (seleccionado && draft.placement[seleccionado] === id) setSeleccionado(null);
  };

  const [nuevoNivel, setNuevoNivel] = useState('');
  const anadirNivel = () => {
    const label = nuevoNivel.trim().slice(0, TIER_LIMITS.tierLabel);
    if (!label) return;
    if (draft.tiers.length >= TIER_LIMITS.maxTiers) {
      setError(`Como máximo ${TIER_LIMITS.maxTiers} niveles.`);
      return;
    }
    const maxOrder = draft.tiers.reduce((m, t) => Math.max(m, t.order), -1);
    setDraft((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          id: nuevoId('t'),
          label,
          color: COLORES_NIVEL[prev.tiers.length % COLORES_NIVEL.length],
          order: maxOrder + 1,
        },
      ],
    }));
    setNuevoNivel('');
    setError(null);
  };

  // ── Elementos: catálogo ─────────────────────────────
  const [pestana, setPestana] = useState<'personajes' | 'anime' | 'subir'>('personajes');
  const [busqueda, setBusqueda] = useState('');

  const catalogoPersonajes = useMemo(() => Object.values(characters).flat(), [characters]);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (pestana === 'anime') {
      return animes
        .filter((a) => !q || a.title.toLowerCase().includes(q))
        .slice(0, 30)
        .map((a) => ({ id: `anime:${a.id}`, nombre: a.title, imagen: a.coverUrl }));
    }
    return catalogoPersonajes
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 30)
      .map((p) => ({ id: `character:${p.id}`, nombre: p.name, imagen: p.imageUrl }));
  }, [pestana, busqueda, animes, catalogoPersonajes]);

  const anadirDelCatalogo = (refId: string, nombre: string, imagen: string) => {
    const [kind, id] = refId.split(':');
    if (draft.items.some((i) => i.ref?.kind === kind && i.ref?.id === id)) return;
    if (draft.items.length >= TIER_LIMITS.maxItems) {
      setError(`Como máximo ${TIER_LIMITS.maxItems} elementos.`);
      return;
    }
    const item: TierItem = {
      id: nuevoId('item'),
      name: nombre.slice(0, TIER_LIMITS.itemName),
      imageUrl: imagen,
      ref: { kind: kind as 'anime' | 'character', id },
    };
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, item],
      placement: { ...prev.placement, [item.id]: 'pool' },
      poolOrder: { ...prev.poolOrder, pool: [...(prev.poolOrder.pool ?? []), item.id] },
    }));
  };

  // ── Elementos: subida propia ────────────────────────
  const [nombreSubida, setNombreSubida] = useState('');
  const [archivoSubida, setArchivoSubida] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const anadirSubida = async () => {
    if (!archivoSubida || subiendo) return;
    if (!currentUser) {
      requireAuth('subir imágenes a tu tier list');
      return;
    }
    const nombre = nombreSubida.trim() || archivoSubida.name.replace(/\.[^.]+$/, '');
    if (!nombre) {
      setError('Ponle un nombre al elemento.');
      return;
    }
    setSubiendo(true);
    setError(null);
    try {
      const { uploadCommunityImage } = await import('../../services/imageUpload');
      const url = await uploadCommunityImage(archivoSubida, currentUser.uid);
      let dims: ImageDims | null = null;
      try {
        const img = await cargarImagen(archivoSubida);
        if (Number.isInteger(img.naturalWidth) && Number.isInteger(img.naturalHeight)) {
          dims = { width: img.naturalWidth, height: img.naturalHeight };
        }
      } catch {
        dims = null;
      }
      const item: TierItem = {
        id: nuevoId('item'),
        name: nombre.slice(0, TIER_LIMITS.itemName),
        imageUrl: url,
        ...(dims ? { width: dims.width, height: dims.height } : {}),
      };
      setDraft((prev) => ({
        ...prev,
        items: [...prev.items, item],
        placement: { ...prev.placement, [item.id]: 'pool' },
        poolOrder: { ...prev.poolOrder, pool: [...(prev.poolOrder.pool ?? []), item.id] },
      }));
      setArchivoSubida(null);
      setNombreSubida('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  // ── Portada ─────────────────────────────────────────
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const subirPortada = async (file: File) => {
    if (!currentUser) {
      requireAuth('subir la portada');
      return;
    }
    setSubiendoPortada(true);
    setError(null);
    try {
      const { uploadCommunityImage } = await import('../../services/imageUpload');
      const url = await uploadCommunityImage(file, currentUser.uid);
      setDraft((prev) => ({ ...prev, coverUrl: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la portada.');
    } finally {
      setSubiendoPortada(false);
    }
  };

  // ── Guardar ─────────────────────────────────────────
  const guardar = async () => {
    if (guardando) return;
    const errorValidacion = validarTierList({
      ...draft,
      title: draft.title,
      description: draft.description,
      clubId,
    });
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const res = await onGuardar({
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        originId,
        originTitle,
        clubId: draft.visibility === 'club' ? clubId : undefined,
      });
      if (!res.ok) {
        setError(res.error ?? 'No se pudo guardar la tier list.');
        setGuardando(false);
        return;
      }
      try {
        if (modo === 'nuevo' && claveBorrador) localStorage.removeItem(claveBorrador);
      } catch {
        // Nada.
      }
      if (res.tierListId) onGuardado?.(res.tierListId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la tier list.');
      setGuardando(false);
    }
  };

  const cerrar = () => {
    if (sucio && !queriendoCerrar) {
      setQueriendoCerrar(true);
      return;
    }
    onClose();
  };

  // Vista previa con los datos actuales.
  const previa = {
    id: 'vista-previa',
    authorId: currentUser?.uid ?? '',
    authorName: currentUser?.displayName || currentUser?.username || '',
    authorAvatar: currentUser?.avatarUrl || '',
    title: draft.title.trim() || 'Sin título',
    description: draft.description,
    category: draft.category,
    tiers: Object.fromEntries(draft.tiers.map((t) => [t.id, { label: t.label, color: t.color, order: t.order }])),
    items: Object.fromEntries(
      draft.items.map((i) => {
        const { id, ...def } = i;
        return [id, def];
      }),
    ),
    placement: draft.placement,
    poolOrder: draft.poolOrder,
    coverUrl: draft.coverUrl,
    visibility: draft.visibility,
    voting: draft.voting,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-400">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {modo === 'editar' ? 'Editar tier list' : 'Nueva tier list'}
                {originTitle && (
                  <span className="ml-2 text-[11px] font-normal text-zinc-500">
                    basada en “{originTitle}”
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-500">
                Arrastra o toca para colocar. Todo se guarda al pulsar Guardar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVistaPrevia((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                vistaPrevia
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              <Eye size={13} />
              <span className="hidden sm:inline">Vista previa</span>
            </button>
            <button
              type="button"
              onClick={cerrar}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {queriendoCerrar && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-5 py-2.5">
            <span className="text-[11px] font-semibold text-amber-300">
              Tienes cambios sin guardar. ¿Cerrar y perderlos?
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-500"
            >
              Sí, descartar
            </button>
            <button
              type="button"
              onClick={() => setQueriendoCerrar(false)}
              className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700"
            >
              Seguir editando
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {vistaPrevia ? (
            <TierListView tier={previa} />
          ) : (
            <div className="space-y-6">
              {/* ── Tablero ─────────────────────────── */}
              <section className="space-y-1.5">
                {filas.map((fila) => {
                  const elementos = elementosDe(itemsMapa, draft.poolOrder, fila.id);
                  return (
                    <div
                      key={fila.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setSoltarEn(fila.id);
                      }}
                      onDragLeave={() => setSoltarEn((s) => (s === fila.id ? null : s))}
                      onDrop={(e) => alSoltar(e, fila.id)}
                      onClick={() => alTocarFila(fila.id)}
                      className={`flex min-h-16 overflow-hidden rounded-xl border transition-colors ${
                        soltarEn === fila.id
                          ? 'border-violet-400 bg-violet-500/10'
                          : fila.esPool
                            ? 'border-dashed border-zinc-700 bg-zinc-950/40'
                            : 'border-zinc-800 bg-zinc-950/60'
                      }`}
                    >
                      <div
                        className="flex w-14 flex-shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-2 sm:w-16"
                        style={{ backgroundColor: `${fila.color}26` }}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-zinc-950 sm:h-8 sm:w-8 sm:text-sm"
                          style={{ backgroundColor: fila.color }}
                        >
                          {fila.esPool ? '?' : fila.label.slice(0, 2)}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-500">
                          {elementos.length}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5 p-1.5">
                        {elementos.length === 0 && (
                          <span className="px-1 py-3 text-[10px] text-zinc-600">
                            {fila.esPool
                              ? 'Aquí caen los elementos sin clasificar. Toca o arrastra para colocarlos.'
                              : 'Vacío: arrastra o toca un elemento para ponerlo aquí.'}
                          </span>
                        )}
                        {elementos.map((el, idx) => (
                          <TileEditor
                            key={el.id}
                            item={el}
                            seleccionado={seleccionado === el.id}
                            onArrastre={(e) => {
                              e.dataTransfer.setData('text/plain', el.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onSoltarEncima={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSoltarEn(null);
                              const id = e.dataTransfer.getData('text/plain');
                              if (id && id !== el.id) {
                                const r = moverElemento(
                                  draft.placement,
                                  draft.poolOrder,
                                  id,
                                  fila.id,
                                  idx,
                                );
                                setDraft((prev) => ({
                                  ...prev,
                                  placement: r.placement,
                                  poolOrder: r.poolOrder,
                                }));
                                setSeleccionado(null);
                              }
                            }}
                            onTocar={() => alTocarTarjeta(el.id, fila.id, idx)}
                            onVecino={(dir) => moverVecino(el.id, dir)}
                            onBorrar={() => borrarItem(el.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {seleccionado && (
                  <p className="text-[10px] text-violet-300">
                    Elemento seleccionado: toca una fila o otra tarjeta para moverlo, o usa ‹ ›.
                  </p>
                )}
              </section>

              {/* ── Elementos ───────────────────────── */}
              <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <h3 className="text-xs font-bold text-white">Añadir elementos</h3>
                <div className="flex gap-1.5">
                  {(
                    [
                      ['personajes', 'Personajes'],
                      ['anime', 'Anime'],
                      ['subir', 'Subir imagen'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPestana(id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        pestana === id
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {pestana === 'subir' ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:border-violet-500/50 hover:text-white">
                        <ImagePlus size={13} />
                        {archivoSubida ? archivoSubida.name : 'Elegir imagen'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setArchivoSubida(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={nombreSubida}
                        onChange={(e) => setNombreSubida(e.target.value)}
                        placeholder="Nombre del elemento"
                        maxLength={TIER_LIMITS.itemName}
                        className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={anadirSubida}
                        disabled={!archivoSubida || subiendo}
                        className="flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                      >
                        {subiendo ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Añadir
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      JPG, PNG, WebP, GIF o AVIF · máx. 10 MB. Se guarda el original.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search
                        size={13}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={`Buscar ${pestana === 'anime' ? 'anime' : 'personaje'}...`}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    {resultados.length === 0 ? (
                      <p className="text-[11px] text-zinc-600">
                        Sin resultados. Prueba con otro nombre.
                      </p>
                    ) : (
                      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {resultados.map((r) => {
                          const anadido = draft.items.some(
                            (i) => i.ref?.id === r.id.split(':')[1],
                          );
                          return (
                            <li
                              key={r.id}
                              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5"
                            >
                              {r.imagen ? (
                                <img
                                  src={r.imagen}
                                  alt=""
                                  loading="lazy"
                                  className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs">
                                  ✨
                                </span>
                              )}
                              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-zinc-200">
                                {r.nombre}
                              </span>
                              <button
                                type="button"
                                disabled={anadido}
                                onClick={() => anadirDelCatalogo(r.id, r.nombre, r.imagen)}
                                title={anadido ? 'Ya está en la lista' : 'Añadir a la lista'}
                                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:cursor-default disabled:bg-zinc-800 disabled:text-zinc-500"
                              >
                                {anadido ? <Check size={12} /> : <Plus size={12} />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              {/* ── Niveles ─────────────────────────── */}
              <section className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <h3 className="text-xs font-bold text-white">Niveles</h3>
                <ul className="space-y-1.5">
                  {niveles.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={t.color}
                        onChange={(e) => cambiarNivel(t.id, { color: e.target.value })}
                        title={`Color de ${t.label}`}
                        className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={t.label}
                        onChange={(e) =>
                          cambiarNivel(t.id, {
                            label: e.target.value.slice(0, TIER_LIMITS.tierLabel),
                          })
                        }
                        maxLength={TIER_LIMITS.tierLabel}
                        className="w-16 flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-center text-xs font-black text-white focus:border-violet-500 focus:outline-none"
                      />
                      <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-600">
                        {elementosDe(itemsMapa, draft.poolOrder, t.id).length} elementos
                      </span>
                      <button
                        type="button"
                        onClick={() => subirNivel(t.id, -1)}
                        disabled={i === 0}
                        title="Subir nivel"
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-25"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => subirNivel(t.id, 1)}
                        disabled={i === niveles.length - 1}
                        title="Bajar nivel"
                        className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-25"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => borrarNivel(t.id)}
                        disabled={draft.tiers.length <= TIER_LIMITS.minTiers}
                        title="Eliminar nivel (sus elementos vuelven al pool)"
                        className="rounded-md p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-25"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={nuevoNivel}
                    onChange={(e) => setNuevoNivel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        anadirNivel();
                      }
                    }}
                    placeholder="Nuevo nivel (p. ej. TOP)"
                    maxLength={TIER_LIMITS.tierLabel}
                    className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={anadirNivel}
                    className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-200 hover:bg-zinc-700"
                  >
                    <Plus size={12} />
                    Añadir
                  </button>
                </div>
              </section>

              {/* ── Ajustes ─────────────────────────── */}
              <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <h3 className="text-xs font-bold text-white">Ajustes</h3>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-zinc-300">
                    Título
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, title: e.target.value.slice(0, TIER_LIMITS.title) }))
                    }
                    placeholder="Mi ranking de openings"
                    maxLength={TIER_LIMITS.title}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-zinc-300">
                    Descripción <span className="font-normal text-zinc-600">(opcional)</span>
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        description: e.target.value.slice(0, TIER_LIMITS.description),
                      }))
                    }
                    rows={2}
                    placeholder="Por qué este orden..."
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-zinc-300">
                      Categoría
                    </label>
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, category: e.target.value as ClubCategory }))
                      }
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                    >
                      {CLUB_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="mb-1 block text-[11px] font-bold text-zinc-300">
                      Portada <span className="font-normal text-zinc-600">(opcional)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {draft.coverUrl ? (
                        <>
                          <img
                            src={draft.coverUrl}
                            alt=""
                            className="h-9 w-16 rounded-lg border border-zinc-800 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, coverUrl: undefined }))}
                            className="text-[11px] font-semibold text-zinc-500 hover:text-red-400"
                          >
                            Quitar
                          </button>
                        </>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-zinc-700 px-3 py-2 text-[11px] font-semibold text-zinc-400 hover:border-violet-500/50 hover:text-white">
                          <Upload size={12} />
                          {subiendoPortada ? 'Subiendo...' : 'Subir portada'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={subiendoPortada}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void subirPortada(f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={draft.voting.enabled}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          voting: { ...p.voting, enabled: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-violet-500"
                    />
                    <span className="text-[11px] leading-snug text-zinc-300">
                      Permitir votar el nivel favorito
                      <span className="block text-[10px] text-zinc-500">
                        Un voto por persona, con resultados en vivo.
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 ${
                      draft.voting.enabled ? 'cursor-pointer' : 'opacity-40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={draft.voting.allowChange}
                      disabled={!draft.voting.enabled}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          voting: { ...p.voting, allowChange: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-violet-500"
                    />
                    <span className="text-[11px] leading-snug text-zinc-300">
                      Permitir cambiar de voto
                    </span>
                  </label>
                </div>
                {clubId ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, visibility: 'public' }))}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
                        draft.visibility === 'public'
                          ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Globe size={12} />
                      Pública
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, visibility: 'club' }))}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors ${
                        draft.visibility === 'club'
                          ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Lock size={12} />
                      Solo {clubName ?? 'el club'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">
                    Se publicará como visible para toda la comunidad.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex-shrink-0 border-t border-zinc-800 p-4">
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
              <p className="text-[11px] text-red-300">{error}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cerrar}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{guardando ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Crear tier list'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// TARJETA DE ELEMENTO EN EL EDITOR
// ======================================================

const TileEditor: React.FC<{
  item: TierItem;
  seleccionado: boolean;
  onArrastre: (e: React.DragEvent) => void;
  onSoltarEncima: (e: React.DragEvent) => void;
  onTocar: () => void;
  onVecino: (dir: -1 | 1) => void;
  onBorrar: () => void;
}> = ({ item, seleccionado, onArrastre, onSoltarEncima, onTocar, onVecino, onBorrar }) => (
  <span
    draggable
    onDragStart={onArrastre}
    onDragOver={(e) => e.preventDefault()}
    onDrop={onSoltarEncima}
    onClick={(e) => {
      e.stopPropagation();
      onTocar();
    }}
    title={item.name}
    className={`group/tile relative h-14 w-14 flex-shrink-0 cursor-grab overflow-hidden rounded-lg border bg-zinc-900 transition-all active:cursor-grabbing sm:h-16 sm:w-16 ${
      seleccionado ? 'border-violet-400 ring-2 ring-violet-500/50' : 'border-zinc-700/60'
    }`}
  >
    {item.imageUrl ? (
      <img
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="flex h-full w-full items-center justify-center p-0.5 text-center text-[9px] font-semibold leading-tight text-zinc-300">
        {item.name}
      </span>
    )}
    {/* Controles: ‹ › para cambiar de fila sin arrastrar
        (imprescindible con dedo), × para quitar. */}
    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-0.5 py-px opacity-100 transition-opacity sm:opacity-0 sm:group-hover/tile:opacity-100 sm:group-focus-within/tile:opacity-100">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onVecino(-1);
        }}
        aria-label="A la fila anterior"
        className="rounded p-0.5 text-white hover:bg-white/20"
      >
        <ChevronLeft size={11} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onBorrar();
        }}
        aria-label={`Quitar ${item.name}`}
        className="rounded p-0.5 text-white hover:bg-red-500/60"
      >
        <X size={11} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onVecino(1);
        }}
        aria-label="A la fila siguiente"
        className="rounded p-0.5 text-white hover:bg-white/20"
      >
        <ChevronRight size={11} />
      </button>
    </span>
  </span>
);
