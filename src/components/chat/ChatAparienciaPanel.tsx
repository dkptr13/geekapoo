import React, { useRef } from 'react';
import { Check, ImagePlus, Loader2, Palette, RotateCcw, X } from 'lucide-react';
import {
  APARIENCIA_POR_DEFECTO,
  COLORES_BURBUJA,
  COLORES_TEXTO,
  FONDOS_CHAT,
  TEMAS_CHAT,
  resolverApariencia,
  type AparienciaChat,
} from '../../data/chatApariencia';

// ======================================================
// PANEL DE PERSONALIZACIÓN DEL CHAT
// ======================================================
// Solo pinta y edita un borrador: no guarda nada. Guardar,
// cancelar y subir fondos los hace quien lo monta (ChatView),
// que es quien tiene al usuario y a Firestore.
//
// La vista previa de arriba enseña el borrador tal cual se
// vería en la conversación, y como el chat real también pinta
// el borrador mientras el panel está abierto, lo que se toca
// aquí se ve allí sin recargar.
// ======================================================

interface ChatAparienciaPanelProps {
  borrador: AparienciaChat;
  onChange: (v: AparienciaChat) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onRestablecer: () => void;
  guardando: boolean;
  subiendoFondo: boolean;
  error: string | null;
  onSubirFondo: (fichero: File) => void;
  onQuitarFondo: () => void;
}

const Seccion: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <section className="space-y-2.5">
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{titulo}</h3>
    {children}
  </section>
);

const Opciones: React.FC<{
  opciones: { id: string; nombre: string }[];
  valor: string;
  onElegir: (id: string) => void;
}> = ({ opciones, valor, onElegir }) => (
  <div className="flex flex-wrap gap-1.5">
    {opciones.map((o) => {
      const activa = valor === o.id;
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => onElegir(o.id)}
          aria-pressed={activa}
          className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            activa
              ? 'border-violet-500 bg-violet-950/40 text-violet-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
          }`}
        >
          {o.nombre}
        </button>
      );
    })}
  </div>
);

const FilaColor: React.FC<{
  etiqueta: string;
  colores: { id: string; nombre: string; hex: string }[];
  valor: string | null | undefined;
  onElegir: (hex: string | null) => void;
}> = ({ etiqueta, colores, valor, onElegir }) => {
  const actual = typeof valor === 'string' ? valor.toLowerCase() : null;
  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] text-zinc-500">{etiqueta}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onElegir(null)}
          title="Color del tema"
          aria-label={`${etiqueta}: color del tema`}
          aria-pressed={!valor}
          className={`flex h-7 min-w-7 items-center justify-center rounded-lg border px-1.5 text-[10px] font-bold transition-colors ${
            !valor
              ? 'border-violet-500 bg-violet-950/40 text-violet-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white'
          }`}
        >
          Auto
        </button>
        {colores.map((c) => {
          const activo = actual === c.hex;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onElegir(activo ? null : c.hex)}
              title={c.nombre}
              aria-label={`${etiqueta}: ${c.nombre}`}
              aria-pressed={activo}
              style={{ backgroundColor: c.hex }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-transform ${
                activo
                  ? 'border-white ring-2 ring-violet-500'
                  : 'border-zinc-700 hover:scale-110'
              }`}
            >
              {activo && <Check size={13} className="text-white drop-shadow" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ChatAparienciaPanel: React.FC<ChatAparienciaPanelProps> = ({
  borrador,
  onChange,
  onGuardar,
  onCancelar,
  onRestablecer,
  guardando,
  subiendoFondo,
  error,
  onSubirFondo,
  onQuitarFondo,
}) => {
  const pon = (parche: Partial<AparienciaChat>) => onChange({ ...borrador, ...parche });
  // Elegir un color propio convierte el tema en personalizado:
  // si no, el color elegido no se vería al guardar.
  const ponColor = (parche: Partial<AparienciaChat>) =>
    onChange({ ...borrador, ...parche, tema: 'personalizado' });

  // Lo que se ve en la vista previa, con el borrador tal cual.
  const vista = resolverApariencia(borrador);

  const fondo = borrador.fondo ?? null;
  const fondoHayImagen = Boolean(fondo?.url);
  const inputFondoRef = useRef<HTMLInputElement>(null);

  const ocupado = guardando || subiendoFondo;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={ocupado ? undefined : onCancelar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Personalizar el chat"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        {/* ── Cabecera ─────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette size={15} className="text-violet-400" />
            Personalizar el chat
          </h2>
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Vista previa ─────────────────────────── */}
        <div className="shrink-0 border-b border-zinc-800 px-5 py-3">
          <div className="overflow-hidden rounded-2xl border border-zinc-800" style={vista.fondoLista}>
            <div className="flex flex-col gap-2 p-3" style={vista.gapLista}>
              <div className="flex justify-start">
                <div
                  className={`w-fit max-w-[80%] px-3 py-1.5 text-xs leading-relaxed shadow ${vista.relleno}`}
                  style={{ ...vista.burbujaRecibida, ...vista.radio, ...vista.letra }}
                >
                  <p>¡Buenas! ¿Viste el último capítulo?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div
                  className={`w-fit max-w-[80%] px-3 py-1.5 text-xs leading-relaxed shadow ${vista.relleno}`}
                  style={{ ...vista.burbujaPropia, ...vista.radio, ...vista.letra }}
                >
                  <p>¡Sí! Ese giro final me dejó loco.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Opciones ─────────────────────────────── */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <Seccion titulo="Apariencia general">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMAS_CHAT.map((t) => {
                const activo = borrador.tema === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pon({ tema: t.id })}
                    aria-pressed={activo}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${
                      activo
                        ? 'border-violet-500 bg-violet-950/30'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="block h-8 rounded-lg border border-black/30"
                      style={{ background: t.propia }}
                      aria-hidden="true"
                    />
                    <span className="mt-1.5 block text-[11px] font-bold text-zinc-200">
                      {t.nombre}
                    </span>
                    <span className="block text-[10px] text-zinc-500">{t.descripcion}</span>
                  </button>
                );
              })}
            </div>
          </Seccion>

          <Seccion titulo="Fondo de conversación">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {FONDOS_CHAT.map((f) => {
                const activo = (fondo?.preset ?? 'ninguno') === f.id && !fondo?.url;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      pon({ fondo: f.id === 'ninguno' ? null : { ...(fondo ?? {}), preset: f.id, url: undefined } })
                    }
                    aria-pressed={activo}
                    title={f.nombre}
                    className={`h-12 rounded-xl border transition-all ${
                      activo ? 'border-violet-500 ring-2 ring-violet-500/40' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                    style={f.css ? { background: f.css } : undefined}
                  >
                    <span className="sr-only">{f.nombre}</span>
                    {!f.css && <span className="text-[10px] text-zinc-500">Ninguno</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputFondoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) onSubirFondo(f);
                }}
              />
              <button
                type="button"
                onClick={() => inputFondoRef.current?.click()}
                disabled={ocupado}
                className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-500/60 hover:text-white disabled:opacity-50"
              >
                {subiendoFondo ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ImagePlus size={13} className="text-violet-400" />
                )}
                {subiendoFondo ? 'Subiendo…' : fondoHayImagen ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {fondoHayImagen && (
                <button
                  type="button"
                  onClick={onQuitarFondo}
                  disabled={ocupado}
                  className="min-h-[36px] rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                >
                  Quitar imagen
                </button>
              )}
            </div>
            {fondoHayImagen && (
              <p className="truncate text-[10px] text-zinc-500">Imagen propia subida.</p>
            )}

            {fondo && (
              <div className="grid grid-cols-2 gap-2">
                {fondoHayImagen && (
                  <>
                    <label className="space-y-1">
                      <span className="block text-[10px] text-zinc-500">Tamaño</span>
                      <select
                        value={fondo.ajuste === 'contain' ? 'contain' : 'cover'}
                        onChange={(e) =>
                          pon({ fondo: { ...fondo, ajuste: e.target.value as 'cover' | 'contain' } })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                      >
                        <option value="cover">Cubrir</option>
                        <option value="contain">Ajustar</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] text-zinc-500">Posición</span>
                      <select
                        value={fondo.position ?? 'center'}
                        onChange={(e) =>
                          pon({ fondo: { ...fondo, position: e.target.value as 'center' | 'top' | 'bottom' } })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                      >
                        <option value="center">Centro</option>
                        <option value="top">Arriba</option>
                        <option value="bottom">Abajo</option>
                      </select>
                    </label>
                  </>
                )}
                <label className="col-span-2 space-y-1">
                  <span className="flex justify-between text-[10px] text-zinc-500">
                    <span>Intensidad del velo (legibilidad)</span>
                    <span className="font-mono">{fondo.dim ?? 0}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={5}
                    value={fondo.dim ?? 0}
                    onChange={(e) => pon({ fondo: { ...fondo, dim: Number(e.target.value) } })}
                    className="w-full accent-violet-500"
                  />
                </label>
              </div>
            )}
          </Seccion>

          <Seccion titulo="Estilo de los mensajes">
            <FilaColor
              etiqueta="Color de mis mensajes"
              colores={COLORES_BURBUJA}
              valor={borrador.colorPropio}
              onElegir={(hex) => ponColor({ colorPropio: hex })}
            />
            <FilaColor
              etiqueta="Color de los recibidos"
              colores={COLORES_BURBUJA}
              valor={borrador.colorRecibido}
              onElegir={(hex) => ponColor({ colorRecibido: hex })}
            />
            <FilaColor
              etiqueta="Texto de mis mensajes"
              colores={COLORES_TEXTO}
              valor={borrador.textoPropio}
              onElegir={(hex) => ponColor({ textoPropio: hex })}
            />
            <FilaColor
              etiqueta="Texto de los recibidos"
              colores={COLORES_TEXTO}
              valor={borrador.textoRecibido}
              onElegir={(hex) => ponColor({ textoRecibido: hex })}
            />
            <div className="space-y-1.5">
              <span className="block text-[11px] text-zinc-500">Bordes</span>
              <Opciones
                opciones={[
                  { id: 'redonda', nombre: 'Redondeados' },
                  { id: 'suave', nombre: 'Suaves' },
                  { id: 'cuadrada', nombre: 'Cuadrados' },
                ]}
                valor={borrador.forma ?? 'redonda'}
                onElegir={(id) => pon({ forma: id as 'redonda' | 'suave' | 'cuadrada' })}
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] text-zinc-500">Densidad</span>
              <Opciones
                opciones={[
                  { id: 'moderno', nombre: 'Moderno' },
                  { id: 'compacto', nombre: 'Compacto' },
                ]}
                valor={borrador.estilo ?? 'moderno'}
                onElegir={(id) => pon({ estilo: id as 'moderno' | 'compacto' })}
              />
            </div>
          </Seccion>

          <Seccion titulo="Texto y accesibilidad">
            <div className="space-y-1.5">
              <span className="block text-[11px] text-zinc-500">Tamaño de letra</span>
              <Opciones
                opciones={[
                  { id: 'pequena', nombre: 'Pequeña' },
                  { id: 'normal', nombre: 'Normal' },
                  { id: 'grande', nombre: 'Grande' },
                ]}
                valor={borrador.letra ?? 'normal'}
                onElegir={(id) => pon({ letra: id as 'pequena' | 'normal' | 'grande' })}
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] text-zinc-500">Espaciado</span>
              <Opciones
                opciones={[
                  { id: 'compacto', nombre: 'Compacto' },
                  { id: 'normal', nombre: 'Normal' },
                  { id: 'amplio', nombre: 'Amplio' },
                ]}
                valor={borrador.espaciado ?? 'normal'}
                onElegir={(id) => pon({ espaciado: id as 'compacto' | 'normal' | 'amplio' })}
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] text-zinc-500">Anchura de burbuja</span>
              <Opciones
                opciones={[
                  { id: 'estrecho', nombre: 'Estrecha' },
                  { id: 'normal', nombre: 'Normal' },
                  { id: 'ancho', nombre: 'Ancha' },
                ]}
                valor={borrador.ancho ?? 'normal'}
                onElegir={(id) => pon({ ancho: id as 'estrecho' | 'normal' | 'ancho' })}
              />
            </div>
            <button
              type="button"
              onClick={() => pon({ reducirMovimiento: !borrador.reducirMovimiento })}
              aria-pressed={!!borrador.reducirMovimiento}
              className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-left"
            >
              <span>
                <span className="block text-[11px] font-bold text-zinc-200">
                  Reducir animaciones
                </span>
                <span className="block text-[10px] text-zinc-500">
                  Quita transiciones y scroll suave del chat.
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  borrador.reducirMovimiento ? 'bg-violet-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    borrador.reducirMovimiento ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          </Seccion>

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* ── Pie ──────────────────────────────── */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={onRestablecer}
            disabled={ocupado}
            className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Restablecer valores
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelar}
              disabled={ocupado}
              className="min-h-[36px] rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onGuardar}
              disabled={ocupado}
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {guardando && <Loader2 size={13} className="animate-spin" />}
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
