import type { AccessibilityPreferences } from '../data/accessibilityPreferences';

// ======================================================
// SONIDOS OPCIONALES
// ======================================================
//
// Geekapoo no tenía sonidos. En la Fase 2 se añaden tres
// señales muy cortas y opcionales, sintetizadas con Web Audio:
// no hay archivos, dependencias ni descargas.
//
// Todos los sonidos están DESACTIVADOS por defecto. Un sonido
// nunca sustituye a un aviso visual: las notificaciones, los
// mensajes, los errores y las confirmaciones siguen teniendo su
// representación en pantalla.

type SoundKind = 'interface' | 'notification' | 'message';

interface SoundConfig {
  enabled: boolean;
  interface: boolean;
  notifications: boolean;
  messages: boolean;
  volume: number;
}

let config: SoundConfig = {
  enabled: false,
  interface: true,
  notifications: true,
  messages: true,
  volume: 0.5,
};

let contexto: AudioContext | null = null;
let ultimoSonido = 0;

/** Actualiza la configuración sin guardar nada ni crear el AudioContext. */
export function configurarSonidos(prefs: AccessibilityPreferences): void {
  config = {
    enabled: prefs.soundEnabled,
    interface: prefs.soundInterface,
    notifications: prefs.soundNotifications,
    messages: prefs.soundMessages,
    volume: prefs.soundVolume,
  };
}

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!contexto) {
      const AudioCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return null;
      contexto = new AudioCtor();
    }

    // Los navegadores bloquean el audio hasta que hay un gesto.
    // Se intenta reanudar; si falla, el sonido se omite sin ruido.
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

function tono(
  ctx: AudioContext,
  frecuencia: number,
  inicio: number,
  duracion: number,
  volumen: number,
): void {
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(frecuencia, inicio);
  ganancia.gain.setValueAtTime(0.0001, inicio);
  ganancia.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, volumen),
    inicio + 0.012,
  );
  ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracion + 0.02);
}

/**
 * Reproduce una señal corta si el usuario la ha activado.
 * Debe llamarse desde eventos o desde cambios que el usuario
 * pueda relacionar con una acción; nunca en bucle.
 */
export function reproducirSonido(tipo: SoundKind): void {
  if (!config.enabled || config.volume <= 0) return;
  if (tipo === 'interface' && !config.interface) return;
  if (tipo === 'notification' && !config.notifications) return;
  if (tipo === 'message' && !config.messages) return;

  const ahora = Date.now();
  // Evita ráfagas si llegan varias notificaciones a la vez.
  if (ahora - ultimoSonido < 700) return;
  const ctx = obtenerContexto();
  if (!ctx) return;

  ultimoSonido = ahora;
  const volumen = 0.035 * Math.min(1, Math.max(0, config.volume));
  const t = ctx.currentTime + 0.01;

  try {
    if (tipo === 'interface') {
      tono(ctx, 440, t, 0.045, volumen * 0.6);
      return;
    }

    if (tipo === 'notification') {
      tono(ctx, 659.25, t, 0.08, volumen);
      tono(ctx, 880, t + 0.09, 0.1, volumen * 0.9);
      return;
    }

    tono(ctx, 523.25, t, 0.06, volumen * 0.8);
    tono(ctx, 659.25, t + 0.07, 0.08, volumen * 0.8);
  } catch {
    // Un fallo de audio nunca debe romper una acción de la interfaz.
  }
}

/**
 * Un solo listener de gesto para desbloquear el AudioContext.
 * Se puede llamar varias veces: solo instala el gesto la primera.
 */
let desbloqueoInstalado = false;
export function instalarDesbloqueoDeAudio(): void {
  if (desbloqueoInstalado || typeof document === 'undefined') return;
  desbloqueoInstalado = true;

  const desbloquear = () => {
    if (config.enabled) void obtenerContexto();
    document.removeEventListener('pointerdown', desbloquear);
    document.removeEventListener('keydown', desbloquear);
    // Si el usuario vuelve a activar los sonidos más adelante, el
    // proveedor puede instalar el gesto otra vez.
    desbloqueoInstalado = false;
  };

  document.addEventListener('pointerdown', desbloquear, { passive: true });
  document.addEventListener('keydown', desbloquear);
}
