import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FC, ReactNode } from 'react';

import {
  DEFAULT_SETTINGS,
  createWeeklyWork,
  deleteWeeklyWork,
  moveWeeklyWork,
  saveSiteSettings,
  subscribeSiteSettings,
  subscribeWeeklyWorks,
  updateWeeklyWork,
  type NewWeeklyWorkInput,
} from '../services/siteContent';

import type { SiteSettings, WeeklyWork } from '../types';

// ======================================================
// CONTENIDO DEL SITIO
// ======================================================
// El texto de bienvenida y el logo se muestran en toda la
// aplicación (navbar, portada), así que viven aquí y no en el
// contexto de la comunidad, que es de otra cosa.
//
// Arrancan con los valores por defecto y se sustituyen en
// cuanto llega el listener de Firestore, de forma que la web
// nunca aparece en blanco esperando a la red.
// ======================================================

interface SiteContentType {
  settings: SiteSettings;
  /** true cuando los ajustes vienen de Firestore, no de los valores por defecto. */
  settingsLoaded: boolean;

  saveSettings: (patch: Partial<SiteSettings>) => Promise<{ ok: boolean; error?: string }>;

  weeklyWorks: WeeklyWork[];
  addWeeklyWork: (input: NewWeeklyWorkInput) => Promise<{ ok: boolean; error?: string }>;
  editWeeklyWork: (workId: string, patch: Partial<NewWeeklyWorkInput>) => Promise<{ ok: boolean; error?: string }>;
  removeWeeklyWork: (workId: string) => Promise<{ ok: boolean; error?: string }>;
  moveWork: (workId: string, direction: 'up' | 'down') => Promise<void>;
}

const SiteContentContext = createContext<SiteContentType | undefined>(undefined);

export const SiteContentProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [weeklyWorks, setWeeklyWorks] = useState<WeeklyWork[]>([]);

  // ── Ajustes ──────────────────────────────────────────
  useEffect(
    () =>
      subscribeSiteSettings(
        (data) => {
          setSettings(data);
          setSettingsLoaded(true);
        },
        () => setSettingsLoaded(true),
      ),
    [],
  );

  // ── Obras de la semana ──────────────────────────────
  useEffect(
    () =>
      subscribeWeeklyWorks(
        setWeeklyWorks,
        (e) => console.error('[Site] Error al leer las obras:', e),
      ),
    [],
  );

  const saveSettings = useCallback(async (patch: Partial<SiteSettings>) => {
    try {
      await saveSiteSettings(patch);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: messageOf(e, 'No se pudieron guardar los ajustes.') };
    }
  }, []);

  const addWeeklyWork = useCallback(async (input: NewWeeklyWorkInput) => {
    try {
      await createWeeklyWork(input);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: messageOf(e, 'No se pudo añadir la obra.') };
    }
  }, []);

  const editWeeklyWork = useCallback(
    async (workId: string, patch: Partial<NewWeeklyWorkInput>) => {
      try {
        await updateWeeklyWork(workId, patch);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: messageOf(e, 'No se pudo guardar la obra.') };
      }
    },
    [],
  );

  const removeWeeklyWork = useCallback(async (workId: string) => {
    try {
      await deleteWeeklyWork(workId);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: messageOf(e, 'No se pudo eliminar la obra.') };
    }
  }, []);

  const moveWork = useCallback(
    async (workId: string, direction: 'up' | 'down') => {
      try {
        await moveWeeklyWork(workId, direction, weeklyWorks);
      } catch (e) {
        console.error('[Site] No se pudo reordenar la obra:', e);
      }
    },
    [weeklyWorks],
  );

  const value = useMemo(
    () => ({
      settings,
      settingsLoaded,
      saveSettings,
      weeklyWorks,
      addWeeklyWork,
      editWeeklyWork,
      removeWeeklyWork,
      moveWork,
    }),
    [
      settings,
      settingsLoaded,
      saveSettings,
      weeklyWorks,
      addWeeklyWork,
      editWeeklyWork,
      removeWeeklyWork,
      moveWork,
    ],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent debe usarse dentro de SiteContentProvider');
  return ctx;
};

function messageOf(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    if (e.message.includes('permission-denied')) {
      return 'No tienes permiso. Comprueba que tu cuenta es admin y que las reglas están desplegadas.';
    }
    return e.message;
  }
  return fallback;
}
