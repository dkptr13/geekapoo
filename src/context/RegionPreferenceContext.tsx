import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from './AuthContext';
import { normalizarCodigoRegion } from '../data/streaming';
import {
  guardarRegionGuardada,
  leerRegionGuardada,
  resolverRegion,
} from '../services/regionPreference';

// ======================================================
// REGIÓN PREFERIDA
// ======================================================
// El perfil es la fuente de verdad para una cuenta. El navegador
// guarda la elección mientras no hay sesión, y sirve para
// sincronizar la primera vez que esa persona inicia sesión.
//
// Precedencia al entrar:
//   perfil > navegador > España
//
// Cambiar de región no recarga la página: actualiza este estado y
// la wiki vuelve a consultar solo las filas de la región nueva.
// ======================================================

interface RegionPreferenceContextType {
  region: string;
  setRegion: (code: string) => Promise<void>;
  guardando: boolean;
  error: string | null;
}

const RegionPreferenceContext = createContext<RegionPreferenceContextType | null>(null);

export const RegionPreferenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, updateProfileData } = useAuth();
  const [region, setRegionState] = useState<string>(
    () => resolverRegion(currentUser?.regionPreferida, leerRegionGuardada()).code,
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `updateProfileData` se recrea en cada render de AuthContext.
  // El ref evita que este efecto se dispare solo por eso.
  const updateProfileRef = useRef(updateProfileData);
  useEffect(() => {
    updateProfileRef.current = updateProfileData;
  }, [updateProfileData]);

  const uid = currentUser?.uid ?? null;
  const perfilRegion = currentUser?.regionPreferida;
  const sincronizadoPara = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) {
      sincronizadoPara.current = null;
      return;
    }

    const resuelta = resolverRegion(perfilRegion, leerRegionGuardada());

    setRegionState(resuelta.code);

    if (resuelta.origen === 'profile') {
      guardarRegionGuardada(resuelta.code);
      sincronizadoPara.current = uid;
      setError(null);
      return;
    }

    if (resuelta.origen === 'local') {
      if (sincronizadoPara.current === uid) return;

      sincronizadoPara.current = uid;
      setGuardando(true);

      void updateProfileRef
        .current({ regionPreferida: resuelta.code })
        .then(() => setError(null))
        .catch(() => {
          // La región local sigue valiendo para esta sesión. No se
          // pierde por no poder escribir en el perfil.
          sincronizadoPara.current = null;
          setError(
            'La región se guardó en este dispositivo, pero no se pudo sincronizar con tu perfil.',
          );
        })
        .finally(() => setGuardando(false));

      return;
    }

    // Sin perfil y sin navegador: España. No se escribe nada en el
    // perfil hasta que el usuario elija una región.
    sincronizadoPara.current = uid;
    setError(null);
  }, [uid, perfilRegion]);

  const setRegion = useCallback(
    async (code: string): Promise<void> => {
      const normalized = normalizarCodigoRegion(code);
      if (!normalized) return;

      setRegionState(normalized);
      guardarRegionGuardada(normalized);
      setError(null);

      if (!uid) return;

      setGuardando(true);
      try {
        await updateProfileRef.current({ regionPreferida: normalized });
      } catch {
        setError(
          'La región cambió en este dispositivo, pero no se pudo guardar en tu perfil.',
        );
      } finally {
        setGuardando(false);
      }
    },
    [uid],
  );

  const value = useMemo(
    () => ({ region, setRegion, guardando, error }),
    [region, setRegion, guardando, error],
  );

  return (
    <RegionPreferenceContext.Provider value={value}>
      {children}
    </RegionPreferenceContext.Provider>
  );
};

export function useRegionPreferida(): RegionPreferenceContextType {
  const context = useContext(RegionPreferenceContext);
  if (!context) {
    throw new Error('useRegionPreferida debe usarse dentro de RegionPreferenceProvider');
  }
  return context;
}
