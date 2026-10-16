import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ALL_ANIME_CATEGORIES } from '../../data/animeCategories';
import {
  ESTADOS_WIKI,
  contarFiltrosActivos,
  type FiltrosAvanzados,
  type MainTab,
  type OrdenWiki,
} from '../../utils/wikiFilter';

// ======================================================
// BOTÓN DE FILTROS AVANZADOS + PANEL + PASTILLAS
// ======================================================
// El botón va a la izquierda del buscador y abre un panel
// ABSOLUTO: no empuja las tarjetas ni deforma la cabecera.
// Se cierra al pulsar de nuevo, al hacer clic fuera o con
// Escape. En móvil ocupa casi todo el ancho disponible.
//
// Las pastillas (`ChipsFiltros`) van aparte, debajo de las
// pestañas, para que los filtros activos se vean y se puedan
// quitar de uno en uno sin abrir el panel.
// ======================================================

const ORDENES: { id: OrdenWiki; label: string }[] = [
  { id: 'defecto', label: 'Por defecto' },
  { id: 'az', label: 'Alfabético: A-Z' },
  { id: 'za', label: 'Alfabético: Z-A' },
  { id: 'nuevos', label: 'Más recientes' },
  { id: 'antiguos', label: 'Más antiguos' },
  { id: 'valorados', label: 'Mejor valorados' },
];

const NOTAS = [0, 6, 7, 8, 9];

interface AdvancedFiltersProps {
  tab: MainTab;
  filtros: FiltrosAvanzados;
  onChange: (f: FiltrosAvanzados) => void;
  onClear: () => void;
  generos: string[];
  rangoAnios: { min: number; max: number } | null;
}

export const AdvancedFilters: FC<AdvancedFiltersProps> = ({
  tab,
  filtros,
  onChange,
  onClear,
  generos,
  rangoAnios,
}) => {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const activos = contarFiltrosActivos(filtros);

  // Clic fuera o Escape cierran el panel. El listener vive solo
  // mientras está abierto, para no escuchar siempre.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: MouseEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsar);
    document.addEventListener('keydown', alTeclado);
    return () => {
      document.removeEventListener('mousedown', alPulsar);
      document.removeEventListener('keydown', alTeclado);
    };
  }, [abierto]);

  // Los hilos no tienen género, año, estado ni nota: su
  // filtro propio es la categoría del foro. Los capítulos
  // tienen nota propia pero el resto es de su anime.
  const esAnime = tab === 'all' || tab === 'series' || tab === 'movies';
  const conNota = esAnime || tab === 'episodes';
  const conCategoriaForo = tab === 'threads';
  const estadosVisibles =
    tab === 'movies' ? ESTADOS_WIKI.filter((e) => e !== 'En emisión') : [...ESTADOS_WIKI];
  const ordenesVisibles =
    tab === 'characters'
      ? ORDENES.filter((o) => o.id === 'defecto' || o.id === 'az' || o.id === 'za' || o.id === 'valorados')
      : ORDENES;

  const anios: number[] = [];
  if (rangoAnios) {
    for (let y = rangoAnios.max; y >= rangoAnios.min; y--) anios.push(y);
  }

  const toggleGenero = (g: string) => {
    onChange({
      ...filtros,
      generos: filtros.generos.includes(g)
        ? filtros.generos.filter((x) => x !== g)
        : [...filtros.generos, g],
    });
  };

  const toggleEstado = (e: string) => {
    onChange({
      ...filtros,
      estados: filtros.estados.includes(e)
        ? filtros.estados.filter((x) => x !== e)
        : [...filtros.estados, e],
    });
  };

  const toggleCategoria = (c: string) => {
    onChange({
      ...filtros,
      categorias: filtros.categorias.includes(c)
        ? filtros.categorias.filter((x) => x !== c)
        : [...filtros.categorias, c],
    });
  };

  return (
    <div ref={cajaRef} className="relative shrink-0">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Filtros avanzados"
        aria-expanded={abierto}
        title="Filtros avanzados"
        className={`relative rounded-xl border bg-zinc-950 p-2 transition-colors ${
          abierto || activos > 0
            ? 'border-violet-500 text-violet-300'
            : 'border-zinc-800 text-zinc-400 hover:border-violet-500/60 hover:text-white'
        }`}
      >
        <SlidersHorizontal size={16} />
        {activos > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
            {activos}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] space-y-5 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/60">
          {/* CATEGORÍA DEL HILO */}
          {conCategoriaForo && (
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Categoría
              </h4>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {ALL_ANIME_CATEGORIES.map((c) => {
                  const marcado = filtros.categorias.includes(c.name);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCategoria(c.name)}
                      aria-pressed={marcado}
                      className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        marcado
                          ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* GÉNERO */}
          {esAnime && generos.length > 0 && (
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Género
              </h4>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {generos.map((g) => {
                  const marcado = filtros.generos.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGenero(g)}
                      aria-pressed={marcado}
                      className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        marcado
                          ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* AÑO */}
          {esAnime && anios.length > 0 && (
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Año
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="block text-[10px] text-zinc-500">Concreto</span>
                  <select
                    value={filtros.anio ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...filtros,
                        anio: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">—</option>
                    {anios.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] text-zinc-500">Desde</span>
                  <select
                    value={filtros.desde ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...filtros,
                        anio: null,
                        desde: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">—</option>
                    {anios.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] text-zinc-500">Hasta</span>
                  <select
                    value={filtros.hasta ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...filtros,
                        anio: null,
                        hasta: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">—</option>
                    {anios.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          )}

          {/* ESTADO */}
          {esAnime && (
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Estado
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {estadosVisibles.map((e) => {
                  const marcado = filtros.estados.includes(e);
                  return (
                    <button
                      key={e}
                      onClick={() => toggleEstado(e)}
                      aria-pressed={marcado}
                      className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        marcado
                          ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* VALORACIÓN */}
          {conNota && (
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Valoración mínima
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {NOTAS.map((n) => {
                  const marcado = filtros.notaMin === n;
                  return (
                    <button
                      key={n}
                      onClick={() => onChange({ ...filtros, notaMin: n })}
                      aria-pressed={marcado}
                      className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        marcado
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {n === 0 ? 'Todas' : `${n}+`}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ORDENACIÓN */}
          <section>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Ordenación
            </h4>
            <div className="space-y-1">
              {ordenesVisibles.map((o) => {
                const marcado = filtros.orden === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => onChange({ ...filtros, orden: o.id })}
                    aria-pressed={marcado}
                    className={`flex min-h-[36px] w-full items-center rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors ${
                      marcado
                        ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                        : 'border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* LIMPIAR */}
          <button
            onClick={() => {
              onClear();
              setAbierto(false);
            }}
            disabled={activos === 0}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-red-500/50 hover:text-red-300 disabled:opacity-40"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

// ======================================================
// PASTILLAS DE FILTROS ACTIVOS
// ======================================================

interface ChipsFiltrosProps {
  filtros: FiltrosAvanzados;
  onChange: (f: FiltrosAvanzados) => void;
}

export const ChipsFiltros: FC<ChipsFiltrosProps> = ({ filtros, onChange }) => {
  const pastillas: { clave: string; texto: string; quitar: () => void }[] = [];

  for (const g of filtros.generos) {
    pastillas.push({
      clave: `g-${g}`,
      texto: g,
      quitar: () => onChange({ ...filtros, generos: filtros.generos.filter((x) => x !== g) }),
    });
  }
  if (filtros.anio != null) {
    pastillas.push({
      clave: 'anio',
      texto: `${filtros.anio}`,
      quitar: () => onChange({ ...filtros, anio: null }),
    });
  } else if (filtros.desde != null || filtros.hasta != null) {
    pastillas.push({
      clave: 'rango',
      texto: `${filtros.desde ?? '…'}–${filtros.hasta ?? '…'}`,
      quitar: () => onChange({ ...filtros, desde: null, hasta: null }),
    });
  }
  for (const e of filtros.estados) {
    pastillas.push({
      clave: `e-${e}`,
      texto: e,
      quitar: () => onChange({ ...filtros, estados: filtros.estados.filter((x) => x !== e) }),
    });
  }
  if (filtros.notaMin > 0) {
    pastillas.push({
      clave: 'nota',
      texto: `${filtros.notaMin}+`,
      quitar: () => onChange({ ...filtros, notaMin: 0 }),
    });
  }
  for (const c of filtros.categorias) {
    pastillas.push({
      clave: `c-${c}`,
      texto: c,
      quitar: () => onChange({ ...filtros, categorias: filtros.categorias.filter((x) => x !== c) }),
    });
  }
  if (filtros.orden !== 'defecto') {
    pastillas.push({
      clave: 'orden',
      texto: ORDENES.find((o) => o.id === filtros.orden)?.label ?? filtros.orden,
      quitar: () => onChange({ ...filtros, orden: 'defecto' }),
    });
  }

  if (pastillas.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Filtros:
      </span>
      {pastillas.map((p) => (
        <button
          key={p.clave}
          onClick={p.quitar}
          title={`Quitar filtro ${p.texto}`}
          className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-950/40 px-2 py-1 text-[11px] font-semibold text-violet-300 transition-colors hover:border-violet-400"
        >
          {p.texto}
          <X size={11} />
        </button>
      ))}
    </div>
  );
};
