import { useId, useState } from 'react';
import type { FC, ReactNode } from 'react';
import {
  Accessibility,
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Contrast,
  Eye,
  Hand,
  Link2,
  Loader2,
  MousePointer2,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Type,
  Volume2,
} from 'lucide-react';

import {
  CONTRAST_OPTIONS,
  MOTION_OPTIONS,
  QUICK_PROFILES,
  SPACING_PRESETS,
  TEXT_SIZE_PRESETS,
  quickProfilePatch,
  type ContrastMode,
  type MotionMode,
  type QuickProfileId,
  type SpacingPreset,
} from '../../data/accessibilityPreferences';
import { useAccessibilityPrefs } from '../../context/AccessibilityPrefsContext';
import { useAnnouncer } from '../common/LiveAnnouncer';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { reproducirSonido } from '../../services/sound';

// ======================================================
// CENTRO DE ACCESIBILIDAD
// ======================================================
//
// Un único panel dentro de Configuración de cuenta. Cada
// preferencia se aplica al instante mediante el proveedor y se
// guarda con debounce en `userPrivate/{uid}.accessibility`.
//
// La interfaz no pregunta por discapacidades ni asocia perfiles a
// ellas: los perfiles son atajos de presentación que el usuario
// puede modificar después.

const ICONOS_PERFIL: Record<QuickProfileId, typeof BookOpen> = {
  lectura: BookOpen,
  visibilidad: Eye,
  movimiento: Activity,
  controles: MousePointer2,
  simplificada: Sparkles,
};

const Section: FC<{
  id: string;
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  children: ReactNode;
}> = ({ id, icono, titulo, descripcion, children }) => (
  <section
    aria-labelledby={`a11y-title-${id}`}
    className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 sm:p-6"
  >
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
        {icono}
      </span>
      <div className="min-w-0">
        <h3 id={`a11y-title-${id}`} className="text-sm font-black text-white">
          {titulo}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          {descripcion}
        </p>
      </div>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

const Toggle: FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, hint, disabled }) => {
  const labelId = useId();
  const hintId = useId();

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
    >
      <div className="min-w-0">
        <p id={labelId} className="text-xs font-semibold text-zinc-200">
          {label}
        </p>
        <p id={hintId} className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          {hint}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-violet-600' : 'bg-white/[0.08]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
};

const RangeControl: FC<{
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  disabled?: boolean;
}> = ({ id, label, value, min, max, step, onChange, format, disabled }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-[11px] font-semibold text-zinc-300">
        {label}
      </label>
      <span className="font-mono text-[11px] font-bold text-violet-300" aria-hidden="true">
        {format(value)}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-valuetext={format(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

const RadioOption: FC<{
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}> = ({ name, value, checked, onChange, label, description }) => (
  <label
    className={`a11y-radio flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
      checked
        ? 'border-violet-400/50 bg-violet-500/10'
        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
    }`}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
        checked
          ? 'border-violet-300 bg-violet-500 text-white'
          : 'border-zinc-600'
      }`}
    >
      {checked && <Check size={10} strokeWidth={3} />}
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-bold text-white">{label}</span>
      <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-400">
        {description}
      </span>
    </span>
  </label>
);

const Preview: FC<{ scale: number; lineHeight: number; letterSpacing: number; wordSpacing: number; paragraphSpacing: number }> = ({
  scale,
  lineHeight,
  letterSpacing,
  wordSpacing,
  paragraphSpacing,
}) => (
  <div
    role="group"
    aria-label="Vista previa del tamaño y el espaciado del texto"
    className="overflow-hidden rounded-2xl border border-violet-400/20 bg-[#0a0a11] p-4"
  >
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-300">
      Vista previa
    </p>
    <div style={{ fontSize: `${16 * scale}px` }}>
      <p
        style={{
          fontSize: '1.35em',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: `${letterSpacing}em`,
          wordSpacing: `${wordSpacing}em`,
          color: '#ffffff',
          margin: 0,
        }}
      >
        Un título de publicación
      </p>
      <p
        style={{
          fontSize: '0.95em',
          lineHeight,
          letterSpacing: `${letterSpacing}em`,
          wordSpacing: `${wordSpacing}em`,
          color: '#d4d4d8',
          margin: `${paragraphSpacing}em 0 0`,
        }}
      >
        Así se leerán los comentarios, las descripciones y los mensajes largos
        de Geekapoo cuando ajustes el tamaño y el espaciado.
      </p>
      <p
        style={{
          fontSize: '0.82em',
          lineHeight,
          letterSpacing: `${letterSpacing}em`,
          wordSpacing: `${wordSpacing}em`,
          color: '#a1a1aa',
          margin: `${paragraphSpacing}em 0 0`,
        }}
      >
        Fecha y datos secundarios de ejemplo.
      </p>
    </div>
  </div>
);

const SyncBadge: FC<{
  usingCloud: boolean;
  status: 'local' | 'loading' | 'saving' | 'saved' | 'error';
}> = ({ usingCloud, status }) => {
  if (!usingCloud) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-relaxed text-zinc-400">
        <CloudOff size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-zinc-500" />
        <span>
          Se guarda en este navegador. Inicia sesión para llevarlo a tu cuenta y
          sincronizarlo entre dispositivos.
        </span>
      </div>
    );
  }

  const config = {
    loading: {
      icon: <Loader2 size={15} className="animate-spin" aria-hidden="true" />,
      texto: 'Cargando tus preferencias de accesibilidad…',
      clase: 'text-zinc-300',
    },
    saving: {
      icon: <Loader2 size={15} className="animate-spin" aria-hidden="true" />,
      texto: 'Guardando tus preferencias en tu cuenta…',
      clase: 'text-violet-200',
    },
    saved: {
      icon: <Cloud size={15} aria-hidden="true" />,
      texto: 'Preferencias sincronizadas con tu cuenta.',
      clase: 'text-emerald-300',
    },
    error: {
      icon: <AlertTriangle size={15} aria-hidden="true" />,
      texto:
        'No se pudieron guardar en tu cuenta. Se mantienen en este navegador; inténtalo de nuevo más tarde.',
      clase: 'text-amber-200',
    },
    local: {
      icon: <Cloud size={15} aria-hidden="true" />,
      texto: 'Preferencias guardadas en este navegador.',
      clase: 'text-zinc-300',
    },
  }[status];

  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-[11px] leading-relaxed ${
        status === 'error'
          ? 'border-amber-400/25 bg-amber-500/10'
          : 'border-white/[0.06] bg-white/[0.02]'
      } ${config.clase}`}
    >
      <span className="mt-0.5 flex-shrink-0">{config.icon}</span>
      <span>{config.texto}</span>
    </div>
  );
};

export const AccessibilityCenter: FC = () => {
  const {
    prefs,
    setPref,
    updatePrefs,
    resetPrefs,
    syncStatus,
    usingCloud,
  } = useAccessibilityPrefs();
  const announce = useAnnouncer();
  const [confirmarReset, setConfirmarReset] = useState(false);

  const resetDialogRef = useDialogA11y<HTMLDivElement>({
    open: confirmarReset,
    onClose: () => setConfirmarReset(false),
  });

  const aplicarPerfil = (id: QuickProfileId, label: string) => {
    updatePrefs(quickProfilePatch(id));
    announce(`Perfil «${label}» aplicado. Puedes ajustar cada opción por separado.`);
  };

  const aplicarEspaciado = (preset: Exclude<SpacingPreset, 'custom'>) => {
    const valores = SPACING_PRESETS[preset];
    updatePrefs({
      spacingPreset: preset,
      lineHeight: valores.lineHeight,
      letterSpacing: valores.letterSpacing,
      wordSpacing: valores.wordSpacing,
      paragraphSpacing: valores.paragraphSpacing,
    });
    announce(`Espaciado de lectura: ${valores.label.toLowerCase()}.`);
  };

  const cambiarEspaciadoManual = (
    campo: 'lineHeight' | 'letterSpacing' | 'wordSpacing' | 'paragraphSpacing',
    valor: number,
  ) => {
    updatePrefs({ [campo]: valor, spacingPreset: 'custom' });
  };

  const porcentajeTexto = Math.round(prefs.textScale * 100);
  const lineHeightPreview =
    prefs.spacingPreset === 'normal' ? 1.5 : prefs.lineHeight;
  const letterPreview =
    prefs.spacingPreset === 'normal' ? 0 : prefs.letterSpacing;
  const wordPreview = prefs.spacingPreset === 'normal' ? 0 : prefs.wordSpacing;
  const paragraphPreview =
    prefs.spacingPreset === 'normal' ? 0 : prefs.paragraphSpacing;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-3xl border border-violet-500/25 bg-violet-500/[0.08] p-5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-violet-300">
          <Accessibility size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-white">
            Centro de accesibilidad
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
            Adapta el texto, el contraste, el movimiento, los controles y los
            sonidos de toda la plataforma. Los cambios se aplican al momento y
            no modifican tus datos de perfil, tus mensajes ni tu cuenta.
          </p>
          <div className="mt-3">
            <SyncBadge usingCloud={usingCloud} status={syncStatus} />
          </div>
        </div>
      </div>

      {/* ── Perfiles rápidos ───────────────────────── */}
      <section
        aria-labelledby="a11y-title-perfiles"
        className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} aria-hidden="true" className="text-violet-300" />
          <h3 id="a11y-title-perfiles" className="text-sm font-black text-white">
            Perfiles rápidos
          </h3>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          Puntos de partida. Después puedes cambiar cualquier opción por separado.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_PROFILES.map((perfil) => {
            const Icono = ICONOS_PERFIL[perfil.id];
            const patch = quickProfilePatch(perfil.id);
            const activo = Object.entries(patch).every(
              ([clave, valor]) =>
                prefs[clave as keyof typeof prefs] === valor,
            );

            return (
              <button
                key={perfil.id}
                type="button"
                aria-pressed={activo}
                onClick={() => aplicarPerfil(perfil.id, perfil.label)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  activo
                    ? 'border-violet-400/50 bg-violet-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-violet-400/30 hover:bg-white/[0.04]'
                }`}
              >
                <Icono
                  size={17}
                  aria-hidden="true"
                  className={activo ? 'text-violet-300' : 'text-zinc-500'}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-white">
                    {perfil.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-400">
                    {perfil.description}
                  </span>
                </span>
                {activo && (
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="ml-auto mt-0.5 flex-shrink-0 text-violet-300"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 1. Visualización y texto ──────────────── */}
      <Section
        id="texto"
        icono={<Type size={18} aria-hidden="true" />}
        titulo="Visualización y texto"
        descripcion="Ajusta el tamaño de las letras y el espacio entre líneas, palabras y párrafos. Afecta a publicaciones, comentarios, chats, fichas y formularios."
      >
        <fieldset>
          <legend className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Tamaño del texto
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {TEXT_SIZE_PRESETS.map((preset) => {
              const activo = Math.abs(prefs.textScale - preset.scale) < 0.001;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => {
                    setPref('textScale', preset.scale);
                    announce(`Tamaño de texto: ${preset.label.toLowerCase()}.`);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                    activo
                      ? 'border-violet-400/50 bg-violet-500/15 text-violet-100'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-violet-400/30 hover:text-white'
                  }`}
                >
                  <span style={{ fontSize: `${0.78 * preset.scale}rem` }}>
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <RangeControl
          id="a11y-text-scale"
          label="Ajuste gradual del texto"
          value={porcentajeTexto}
          min={90}
          max={200}
          step={5}
          onChange={(valor) => {
            setPref('textScale', valor / 100);
          }}
          format={(valor) => `${valor} %`}
        />
        <p className="-mt-2 text-[10px] leading-relaxed text-zinc-500">
          El 100 % es el tamaño normal. Puedes combinarlo con el zoom del navegador.
        </p>

        <Preview
          scale={prefs.textScale}
          lineHeight={lineHeightPreview}
          letterSpacing={letterPreview}
          wordSpacing={wordPreview}
          paragraphSpacing={paragraphPreview}
        />

        <fieldset>
          <legend className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Espaciado de lectura
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(SPACING_PRESETS) as Array<Exclude<SpacingPreset, 'custom'>>).map(
              (preset) => {
                const activo = prefs.spacingPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => aplicarEspaciado(preset)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      activo
                        ? 'border-violet-400/50 bg-violet-500/15 text-violet-100'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-violet-400/30 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-bold">
                      {SPACING_PRESETS[preset].label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-zinc-400">
                      {SPACING_PRESETS[preset].description}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </fieldset>

        <details className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-xs font-bold text-zinc-200">
            Ajuste manual del espaciado
          </summary>
          <div className="mt-4 space-y-4">
            <RangeControl
              id="a11y-line-height"
              label="Altura de línea"
              value={prefs.lineHeight}
              min={1.1}
              max={2.4}
              step={0.05}
              onChange={(valor) => cambiarEspaciadoManual('lineHeight', valor)}
              format={(valor) => `${valor.toFixed(2)}×`}
            />
            <RangeControl
              id="a11y-letter-spacing"
              label="Separación entre letras"
              value={prefs.letterSpacing}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(valor) => cambiarEspaciadoManual('letterSpacing', valor)}
              format={(valor) => `${valor.toFixed(2)} em`}
            />
            <RangeControl
              id="a11y-word-spacing"
              label="Separación entre palabras"
              value={prefs.wordSpacing}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(valor) => cambiarEspaciadoManual('wordSpacing', valor)}
              format={(valor) => `${valor.toFixed(2)} em`}
            />
            <RangeControl
              id="a11y-paragraph-spacing"
              label="Separación entre párrafos"
              value={prefs.paragraphSpacing}
              min={0}
              max={3}
              step={0.25}
              onChange={(valor) => cambiarEspaciadoManual('paragraphSpacing', valor)}
              format={(valor) => `${valor.toFixed(2)} em`}
            />
            <button
              type="button"
              onClick={() => aplicarEspaciado('normal')}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white"
            >
              Volver al espaciado normal
            </button>
          </div>
        </details>
      </Section>

      {/* ── 2. Contraste y colores ─────────────────── */}
      <Section
        id="contraste"
        icono={<Contrast size={18} aria-hidden="true" />}
        titulo="Contraste y colores"
        descripcion="Mejora la separación entre fondos, textos y controles. Las imágenes, los avatares y las ilustraciones conservan sus colores originales."
      >
        <fieldset>
          <legend className="sr-only">Modo de contraste</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {CONTRAST_OPTIONS.map((opcion) => (
              <RadioOption
                key={opcion.id}
                name="a11y-contrast"
                value={opcion.id}
                checked={prefs.contrast === opcion.id}
                onChange={() => {
                  setPref('contrast', opcion.id as ContrastMode);
                  announce(`Contraste: ${opcion.label.toLowerCase()}.`);
                }}
                label={opcion.label}
                description={opcion.description}
              />
            ))}
          </div>
        </fieldset>

        <div className="space-y-2.5">
          <Toggle
            checked={prefs.underlineLinks}
            onChange={(next) => {
              setPref('underlineLinks', next);
              announce(next ? 'Enlaces subrayados.' : 'Subrayado de enlaces desactivado.');
            }}
            label="Subrayar enlaces"
            hint="Distingue los enlaces sin depender solo del color."
          />
          <Toggle
            checked={prefs.strongBorders}
            onChange={(next) => {
              setPref('strongBorders', next);
              announce(next ? 'Bordes reforzados.' : 'Bordes normales.');
            }}
            label="Bordes más visibles"
            hint="Refuerza el contorno de tarjetas, campos y controles."
          />
          <Toggle
            checked={prefs.highlightSelection}
            onChange={(next) => {
              setPref('highlightSelection', next);
              announce(next ? 'Estados seleccionados destacados.' : 'Estados seleccionados normales.');
            }}
            label="Destacar elementos seleccionados"
            hint="Añade un contorno interior a pestañas, filtros y opciones activas."
          />
          <Toggle
            checked={prefs.reduceTransparency}
            onChange={(next) => {
              setPref('reduceTransparency', next);
              announce(next ? 'Transparencias reducidas.' : 'Transparencias normales.');
            }}
            label="Reducir transparencias"
            hint="Hace más opacos los fondos desenfocados para mejorar la lectura."
          />
        </div>
      </Section>

      {/* ── 3. Movimiento y animaciones ────────────── */}
      <Section
        id="movimiento"
        icono={<Activity size={18} aria-hidden="true" />}
        titulo="Movimiento y animaciones"
        descripcion="Controla las transiciones y los efectos visuales de toda la web. La preferencia del sistema operativo se respeta siempre."
      >
        <fieldset>
          <legend className="sr-only">Modo de movimiento</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MOTION_OPTIONS.map((opcion) => (
              <RadioOption
                key={opcion.id}
                name="a11y-motion"
                value={opcion.id}
                checked={prefs.motion === opcion.id}
                onChange={() => {
                  setPref('motion', opcion.id as MotionMode);
                  announce(`Movimiento: ${opcion.label.toLowerCase()}.`);
                }}
                label={opcion.label}
                description={opcion.description}
              />
            ))}
          </div>
        </fieldset>
        <p className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-3 py-2 text-[10px] leading-relaxed text-emerald-200/90">
          No se usan destellos ni parpadeos. Los indicadores de carga esenciales
          siguen funcionando aunque desactives las animaciones decorativas.
        </p>
      </Section>

      {/* ── 4. Sonidos y notificaciones ────────────── */}
      <Section
        id="sonidos"
        icono={<Volume2 size={18} aria-hidden="true" />}
        titulo="Sonidos y notificaciones"
        descripcion="Los sonidos son opcionales y están desactivados por defecto. Las notificaciones, los mensajes y los errores siempre se muestran también en pantalla."
      >
        <Toggle
          checked={prefs.soundEnabled}
          onChange={(next) => {
            setPref('soundEnabled', next);
            announce(next ? 'Sonidos opcionales activados.' : 'Todos los sonidos silenciados.');
          }}
          label="Sonidos opcionales"
          hint="Desactiva esta opción para silenciar todos los sonidos de Geekapoo."
        />
        <div className="space-y-2.5">
          <Toggle
            checked={prefs.soundInterface}
            onChange={(next) => setPref('soundInterface', next)}
            disabled={!prefs.soundEnabled}
            label="Sonidos de interfaz"
            hint="Un clic discreto al usar botones y controles."
          />
          <Toggle
            checked={prefs.soundNotifications}
            onChange={(next) => setPref('soundNotifications', next)}
            disabled={!prefs.soundEnabled}
            label="Sonidos de notificaciones"
            hint="Aviso sonoro cuando llega una notificación nueva."
          />
          <Toggle
            checked={prefs.soundMessages}
            onChange={(next) => setPref('soundMessages', next)}
            disabled={!prefs.soundEnabled}
            label="Sonidos de mensajes nuevos"
            hint="Aviso sonoro cuando llega un mensaje a una conversación que no está abierta."
          />
        </div>
        <RangeControl
          id="a11y-sound-volume"
          label="Volumen de los sonidos"
          value={Math.round(prefs.soundVolume * 100)}
          min={0}
          max={100}
          step={5}
          disabled={!prefs.soundEnabled}
          onChange={(valor) => setPref('soundVolume', valor / 100)}
          format={(valor) => `${valor} %`}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['interface', 'Probar interfaz', prefs.soundInterface],
              ['notification', 'Probar notificación', prefs.soundNotifications],
              ['message', 'Probar mensaje', prefs.soundMessages],
            ] as const
          ).map(([tipo, etiqueta, activo]) => (
            <button
              key={tipo}
              type="button"
              data-no-sound="true"
              disabled={!prefs.soundEnabled || !activo}
              onClick={() => reproducirSonido(tipo)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-zinc-300 transition-colors hover:border-violet-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Si desactivas todos los sonidos, los avisos visuales, los contadores y
          los estados de las conversaciones siguen funcionando igual.
        </p>
      </Section>

      {/* ── 5. Controles y navegación ──────────────── */}
      <Section
        id="controles"
        icono={<MousePointer2 size={18} aria-hidden="true" />}
        titulo="Controles y navegación"
        descripcion="Amplía botones, pestañas, campos y áreas táctiles. Pensado para quien necesita más precisión al pulsar o usa un dispositivo táctil."
      >
        <Toggle
          checked={prefs.largeControls}
          onChange={(next) => {
            setPref('largeControls', next);
            announce(next ? 'Controles grandes activados.' : 'Controles normales.');
          }}
          label="Controles grandes"
          hint="Los botones y campos alcanzan aproximadamente 44 × 44 px cuando la distribución lo permite."
        />
        <p className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[10px] leading-relaxed text-zinc-500">
          <Hand size={13} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          Los controles pueden crecer y pasar a una línea nueva en móvil; no se
          elimina ninguna función para hacerlos caber.
        </p>
      </Section>

      {/* ── 6. Preferencias adicionales ────────────── */}
      <Section
        id="adicionales"
        icono={<Sparkles size={18} aria-hidden="true" />}
        titulo="Preferencias adicionales"
        descripcion="Reduce adornos y distracciones sin ocultar publicaciones, comentarios, navegación ni información necesaria."
      >
        <Toggle
          checked={prefs.simplified}
          onChange={(next) => {
            setPref('simplified', next);
            announce(next ? 'Interfaz simplificada activada.' : 'Interfaz normal.');
          }}
          label="Interfaz simplificada"
          hint="Reduce animaciones, halos, marcos decorativos y fondos con desenfoque."
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">Restablecer preferencias</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Vuelve a los valores por defecto. No borra tu perfil, mensajes ni cuenta.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-[11px] font-bold text-rose-200 transition-colors hover:bg-rose-500/20"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Restablecer preferencias
          </button>
        </div>
      </Section>

      {/* ── Confirmación de restablecimiento ──────── */}
      {confirmarReset && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmarReset(false);
          }}
        >
          <div
            ref={resetDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="a11y-reset-title"
            aria-describedby="a11y-reset-desc"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0c0c14] p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
                <AlertTriangle size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 id="a11y-reset-title" className="text-sm font-black text-white">
                  ¿Restablecer todas las preferencias?
                </h3>
                <p id="a11y-reset-desc" className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  El texto, el contraste, el movimiento, los sonidos y los
                  controles volverán a sus valores normales. Tu perfil, tus
                  mensajes y el resto de tu cuenta no se tocan.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmarReset(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[11px] font-bold text-zinc-300 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPrefs();
                  setConfirmarReset(false);
                  announce('Preferencias de accesibilidad restablecidas.');
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-rose-500"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
