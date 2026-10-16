import type { FC } from 'react';
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
  counts: Record<MainTab, number>;
  onChange: (tab: MainTab) => void;
}

const MainTabs: FC<MainTabsProps> = ({ active, counts, onChange }) => {
  return (
    <div
      role="tablist"
      aria-label="Categorías principales"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {MAIN_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60">{counts[tab.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MainTabs;
