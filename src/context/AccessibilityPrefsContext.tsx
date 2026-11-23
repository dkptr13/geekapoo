import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './AuthContext';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  aplicarPreferenciasAlDocumento,
  elegirPreferenciasIniciales,
  firmaPreferencias,
  normalizarPreferenciasAccesibilidad,
  type AccessibilityPreferences,
} from '../data/accessibilityPreferences';
import {
  configurarSonidos,
  instalarDesbloqueoDeAudio,
} from '../services/sound';

// ======================================================
// PROVEEDOR DE ACCESIBILIDAD
// ======================================================
//
// Fuente única de las preferencias para toda la app.
//
//   Invitado:
//     localStorage `geekapoo:accesibilidad:invitado`.
//
//   Con sesión:
//     `userPrivate/{uid}.accessibility`, que AuthContext ya
//     escucha. No se añade ninguna lectura nueva para aplicar
//     cambios remotos.
//
// Estrategia de sincronización:
//   1. El invitado puede cambiar todo sin cuenta.
//   2. Al iniciar sesión, si el perfil ya tiene preferencias,
//      mandan las del perfil (sincronización entre dispositivos).
//   3. Si el perfil no tiene ninguna y este navegador sí tenía
//      preferencias de invitado, se suben al perfil.
//   4. Cada cambio local se aplica al instante y se guarda en
//      Firestore con debounce. Nunca hay una escritura por cada
//      píxel que se mueve un control.
//   5. Los cambios hechos en otro dispositivo llegan por el
//      listener de `userPrivate` y se aplican solos.

export type AccessibilitySyncStatus =
  | 'local'
  | 'loading'
  | 'saving'
  | 'saved'
  | 'error';

interface AccessibilityPrefsContextValue {
  prefs: AccessibilityPreferences;
  setPref: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
  ) => void;
  updatePrefs: (patch: Partial<AccessibilityPreferences>) => void;
  resetPrefs: () => void;
  /** Estado de la persistencia, para explicarlo en la interfaz. */
  syncStatus: AccessibilitySyncStatus;
  /** `true` si hay sesión y el documento privado ya se ha leído. */
  usingCloud: boolean;
}

const Contexto = createContext<AccessibilityPrefsContextValue | null>(null);

const GUEST_KEY = 'geekapoo:accesibilidad:invitado';
const USER_PREFIX = 'geekapoo:accesibilidad:usuario:';
const LEGACY_KEY = 'geekapoo:accesibilidad';

const FIRMA_DEFECTOS = firmaPreferencias(DEFAULT_ACCESSIBILITY_PREFERENCES);

function leerJson(clave: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const texto = window.localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function leerInvitado(): AccessibilityPreferences {
  const guardado = leerJson(GUEST_KEY) ?? leerJson(LEGACY_KEY);
  return normalizarPreferenciasAccesibilidad(guardado);
}

function guardarInvitado(prefs: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(prefs));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Modo privado o almacenamiento lleno: se mantiene en memoria.
  }
}

function claveUsuario(uid: string): string {
  return `${USER_PREFIX}${uid}`;
}

function leerUsuario(uid: string): AccessibilityPreferences | null {
  const guardado = leerJson(claveUsuario(uid));
  return guardado ? normalizarPreferenciasAccesibilidad(guardado) : null;
}

function guardarUsuario(uid: string, prefs: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(claveUsuario(uid), JSON.stringify(prefs));
  } catch {
    // Sin persistencia local, Firestore sigue siendo la fuente
    // para la próxima sesión.
  }
}

export function AccessibilityPrefsProvider({ children }: { children: ReactNode }) {
  const {
    currentUser,
    loading,
    privateDataReadyFor,
    updateProfileData,
  } = useAuth();

  const [prefs, setPrefs] = useState<AccessibilityPreferences>(leerInvitado);
  const [syncStatus, setSyncStatus] = useState<AccessibilitySyncStatus>('local');

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // `undefined` = todavía no se ha decidido uid; `null` = invitado.
  const uidAplicadoRef = useRef<string | null | undefined>(undefined);
  const ultimaFirmaSincronizadaRef = useRef(FIRMA_DEFECTOS);
  const updateProfileRef = useRef(updateProfileData);
  updateProfileRef.current = updateProfileData;

  // Aplicar visualmente y configurar sonidos. `useLayoutEffect`
  // evita que al recargar se vea un frame con los valores viejos.
  useLayoutEffect(() => {
    aplicarPreferenciasAlDocumento(prefs);
    configurarSonidos(prefs);
  }, [prefs]);

  // Un único desbloqueo de audio, solo cuando el usuario activa los
  // sonidos. Así quien nunca los usa no crea un AudioContext.
  useEffect(() => {
    if (!prefs.soundEnabled) return;
    instalarDesbloqueoDeAudio();
  }, [prefs.soundEnabled]);

  // Guardar copia local para invitados y para el mismo usuario.
  useEffect(() => {
    const uid = uidAplicadoRef.current;
    if (uid) guardarUsuario(uid, prefs);
    else guardarInvitado(prefs);
  }, [prefs, currentUser?.uid, privateDataReadyFor]);

  // Cargar la configuración que corresponde a la sesión actual.
  useEffect(() => {
    if (loading) return;

    const uid = currentUser?.uid ?? null;

    if (!uid) {
      // Al cerrar sesión se conserva la configuración actual como
      // preferencias de invitado para no cambiar la interfaz de
      // golpe. Si ya era invitado, se lee la copia guardada.
      if (uidAplicadoRef.current !== null) {
        guardarInvitado(prefsRef.current);
        uidAplicadoRef.current = null;
        const invitado = leerInvitado();
        ultimaFirmaSincronizadaRef.current = firmaPreferencias(invitado);
        setPrefs(invitado);
      }
      setSyncStatus('local');
      return;
    }

    if (privateDataReadyFor !== uid) {
      setSyncStatus('loading');
      return;
    }

    const remoto = currentUser?.accessibility
      ? normalizarPreferenciasAccesibilidad(currentUser.accessibility)
      : null;
    const firmaRemota = remoto ? firmaPreferencias(remoto) : null;

    if (uidAplicadoRef.current !== uid) {
      uidAplicadoRef.current = uid;

      const decision = elegirPreferenciasIniciales(
        remoto,
        leerUsuario(uid),
        leerInvitado(),
      );

      if (decision.origen === 'remoto') {
        ultimaFirmaSincronizadaRef.current = firmaPreferencias(decision.prefs);
        guardarUsuario(uid, decision.prefs);
        setPrefs(decision.prefs);
        setSyncStatus('saved');
        return;
      }

      if (decision.subir) {
        // Hay preferencias locales que el perfil todavía no tiene:
        // se aplican y el guardado con debounce las sube.
        ultimaFirmaSincronizadaRef.current = '';
        setPrefs(decision.prefs);
        setSyncStatus('saving');
        return;
      }

      ultimaFirmaSincronizadaRef.current = FIRMA_DEFECTOS;
      setPrefs(decision.prefs);
      setSyncStatus('saved');
      return;
    }

    // Cambios llegados de otro dispositivo mientras la app está
    // abierta. No se pisa una escritura local pendiente.
    if (
      remoto &&
      firmaRemota !== ultimaFirmaSincronizadaRef.current &&
      firmaRemota !== firmaPreferencias(prefsRef.current)
    ) {
      ultimaFirmaSincronizadaRef.current = firmaRemota!;
      guardarUsuario(uid, remoto);
      setPrefs(remoto);
      setSyncStatus('saved');
    }
  }, [
    currentUser?.uid,
    currentUser?.accessibility,
    privateDataReadyFor,
    loading,
  ]);

  // Guardado agrupado en Firestore. No se escribe mientras se
  // renderiza: el temporizador solo se dispara después del cambio.
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid || privateDataReadyFor !== uid || uidAplicadoRef.current !== uid) {
      return;
    }

    const firma = firmaPreferencias(prefs);
    if (firma === ultimaFirmaSincronizadaRef.current) return;

    setSyncStatus('saving');
    const temporizador = window.setTimeout(() => {
      void updateProfileRef
        .current({ accessibility: prefs })
        .then(() => {
          ultimaFirmaSincronizadaRef.current = firma;
          setSyncStatus('saved');
        })
        .catch((error: unknown) => {
          console.error('[Accesibilidad] No se pudieron guardar las preferencias:', error);
          setSyncStatus('error');
        });
    }, 700);

    return () => window.clearTimeout(temporizador);
  }, [prefs, currentUser?.uid, privateDataReadyFor]);

  const setPref = useCallback(
    <K extends keyof AccessibilityPreferences>(
      key: K,
      value: AccessibilityPreferences[K],
    ) => {
      setPrefs((actuales) => ({ ...actuales, [key]: value }));
    },
    [],
  );

  const updatePrefs = useCallback((patch: Partial<AccessibilityPreferences>) => {
    setPrefs((actuales) => ({ ...actuales, ...patch, version: 2 }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs({ ...DEFAULT_ACCESSIBILITY_PREFERENCES });
  }, []);

  const valor = useMemo<AccessibilityPrefsContextValue>(
    () => ({
      prefs,
      setPref,
      updatePrefs,
      resetPrefs,
      syncStatus,
      usingCloud: Boolean(
        currentUser?.uid && privateDataReadyFor === currentUser.uid,
      ),
    }),
    [prefs, setPref, updatePrefs, resetPrefs, syncStatus, currentUser?.uid, privateDataReadyFor],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAccessibilityPrefs(): AccessibilityPrefsContextValue {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error(
      'useAccessibilityPrefs debe usarse dentro de AccessibilityPrefsProvider',
    );
  }
  return contexto;
}
