import type { FC, KeyboardEvent } from 'react';
import { MAIN_TABS, type MainTab } from '../../utils/wikiFilter';

// ======================================================
// PESTAÑAS PRINCIPALES DE LA WIKI
// ======================================================
// Una fila de pestañas con el estilo actual (fondo oscuro,
// activa en morado) y su contador. En móvil se desliza en
// horizontal en vez de partir los nombres en dos líneas.
//
// Los contadores los calcula quien la usa: en búsqueda, sobre
// los resultados; en catálogo, sobre el total. Así siempre van
// sincronizados con lo que se está viendo.

interface MainTabsProps {
  active: MainTab;
  /** Un tipo sin cargar se queda sin número, no con un 0 engañoso. */
  counts: Partial<Record<MainTab, number>>;
  onChange: (tab: MainTab) => void;
}

const MainTabs: FC<MainTabsProps> = ({ active, counts, onChange }) => {
  // Navegación con flechas Inicio/Fin (patrón ARIA de pestañas).
  // Se enfoca y se activa a la vez: en esta interfaz cambiar de
  // pestaña no cuesta una consulta nueva, así que no hace falta
  // separar "enfocar" de "seleccionar".
  const alPulsar = (e: KeyboardEvent<HTMLDivElement>) => {
    const teclas = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!teclas.includes(e.key)) return;
    e.preventDefault();

    const actual = MAIN_TABS.findIndex((t) => t.id === active);
    let siguiente = 0;

    if (e.key === 'Home') siguiente = 0;
    else if (e.key === 'End') siguiente = MAIN_TABS.length - 1;
    else if (e.key === 'ArrowRight') siguiente = (actual + 1) % MAIN_TABS.length;
    else siguiente = (actual - 1 + MAIN_TABS.length) % MAIN_TABS.length;

    const destino = MAIN_TABS[siguiente];
    onChange(destino.id);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`wiki-main-tab-${destino.id}`)
        ?.focus({ preventScroll: true });
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Categorías principales"
      onKeyDown={alPulsar}
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {MAIN_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            id={`wiki-main-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
            {typeof counts[tab.id] === 'number' && (
              // Sin `opacity-60`: el contador es texto y necesita
              // el mismo contraste que la etiqueta de la pestaña.
              <span className="ml-1.5 font-mono">{counts[tab.id]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MainTabs;
