import { useState } from 'react';
import type { FC } from 'react';
import { Database, Loader2, AlertTriangle, CheckCircle2, Rocket, XCircle, Trash2, Search, ShieldAlert } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';

import { functions } from '../../lib/firebase';
import { runFullMigration, type SeedReport, type StepReport } from '../../services/seed';
import {
  buscarImagenesHuerfanas,
  limpiarImagenesHuerfanas,
  pesoLegible,
  type InformeLimpieza,
} from '../../services/orphanImages';
import { useAuth } from '../../context/AuthContext';

// ======================================================
// PANEL DE MIGRACIÓN DE DATOS
// ======================================================
// Sustituye a la siembra automática que hacía
// CommunityContext al arrancar la app.
// Solo un administrador puede ejecutarlo, y solo hace
// falta una vez: después la app lee todo de Firestore.
// ======================================================

function StepRow({ step }: { step: StepReport }) {
  const wrote = step.created > 0;
  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      {wrote ? (
        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
      ) : (
        <XCircle size={14} className="mt-0.5 flex-shrink-0 text-zinc-600" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-200">{step.step}</p>
        <p className="text-[11px] leading-relaxed text-zinc-500">{step.details}</p>
      </div>
    </li>
  );
}

function Huerfanos({ informe }: { informe: InformeLimpieza }) {
  const [verTodos, setVerTodos] = useState(false);
  const mostrado = verTodos ? informe.huerfanos : informe.huerfanos.slice(0, 6);

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
        {informe.huerfanos.length > 0 ? (
          <AlertTriangle size={13} />
        ) : (
          <CheckCircle2 size={13} />
        )}
        {informe.huerfanos.length > 0
          ? `${informe.huerfanos.length} imagen(es) sin usar (${pesoLegible(informe.liberado)})`
          : 'No hay imágenes huérfanas'}
      </p>

      {informe.huerfanos.length > 0 && (
        <>
          <ul className="space-y-1">
            {mostrado.map((h) => (
              <li
                key={h.path}
                className="break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[10px] text-zinc-500"
              >
                {h.path}
                <span className="ml-1.5 text-zinc-600">{pesoLegible(h.size)}</span>
              </li>
            ))}
          </ul>

          {informe.huerfanos.length > 6 && (
            <button
              type="button"
              onClick={() => setVerTodos((v) => !v)}
              className="text-[10px] font-semibold text-zinc-400 hover:text-white"
            >
              {verTodos
                ? 'Ver menos'
                : `Ver las ${informe.huerfanos.length} (${mostrado.length} mostradas)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export const MigrationPanel: FC = () => {
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<SeedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [informeHuerfanos, setInformeHuerfanos] = useState<InformeLimpieza | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [errorHuerfanos, setErrorHuerfanos] = useState<string | null>(null);

  // Migración de los baneos que existían antes de
  // `accountRestrictions`. Es una callable porque el registro
  // duradero solo lo escribe el servidor.
  const [sincronizandoBaneos, setSincronizandoBaneos] = useState(false);
  const [baneos, setBaneos] = useState<{
    revisados: number;
    creados: number;
    existentes: number;
  } | null>(null);
  const [errorBaneos, setErrorBaneos] = useState<string | null>(null);

  const handleSincronizarBaneos = async () => {
    if (sincronizandoBaneos) return;
    setSincronizandoBaneos(true);
    setBaneos(null);
    setErrorBaneos(null);
    try {
      const llamar = httpsCallable<
        Record<string, never>,
        { revisados: number; creados: number; existentes: number }
      >(functions, 'sincronizarBaneos');
      const { data } = await llamar({});
      setBaneos(data);
    } catch (e: unknown) {
      setErrorBaneos(
        e instanceof Error ? e.message : 'No se pudieron sincronizar los baneos.',
      );
    } finally {
      setSincronizandoBaneos(false);
    }
  };

  const handleBuscar = async () => {
    if (buscando || limpiando) return;
    setBuscando(true);
    setErrorHuerfanos(null);
    try {
      setInformeHuerfanos(await buscarImagenesHuerfanas());
    } catch (e: unknown) {
      setErrorHuerfanos(
        e instanceof Error ? e.message : 'No se pudo revisar el catálogo.',
      );
    } finally {
      setBuscando(false);
    }
  };

  const handleLimpiar = async () => {
    if (limpiando) return;
    setLimpiando(true);
    setErrorHuerfanos(null);
    try {
      setInformeHuerfanos(await limpiarImagenesHuerfanas());
    } catch (e: unknown) {
      setErrorHuerfanos(
        e instanceof Error ? e.message : 'No se pudo borrar.',
      );
    } finally {
      setLimpiando(false);
    }
  };

  const handleMigrate = async () => {
    if (running) return;

    if (!currentUser) {
      setError('Inicia sesión antes de ejecutar la migración.');
      return;
    }

    setRunning(true);
    setReport(null);
    setError(null);

    try {
      // El contenido nuevo del foro se firma con esta cuenta,
      // para que no vuelva a aparecer ningún autor inventado.
      const result = await runFullMigration({
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.username,
        avatar: currentUser.avatarUrl,
      });
      setReport(result);
    } catch (e: unknown) {
      console.error('Error en la migración:', e);
      setError(
        e instanceof Error
          ? e.message
          : 'Error desconocido. Revisa la consola del navegador para más detalle.'
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
          <Rocket size={17} className="text-violet-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">Migración de datos a Firestore</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Escribe el catálogo que aún no existe en Firestore (categorías, trivia y diálogos de
            la mascota), convierte las fechas antiguas de texto ISO a <code className="text-zinc-300">Timestamp</code>,
            repara los campos de "me gusta" y recalcula los contadores de categoría.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
        <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-amber-300/90">
          <strong>Ejecútalo una sola vez.</strong> Es idempotente, así que repetirlo no duplica
          nada, pero si lo lanzas muchas veces gastarás lecturas de Firestore. Requiere que las
          reglas de seguridad ya estén desplegadas.
        </p>
      </div>

      <button
        type="button"
        onClick={handleMigrate}
        disabled={running}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Database size={14} />
        )}
        {running ? 'Migrando...' : 'Ejecutar migración ahora'}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-red-300">La migración falló</p>
            <p className="mt-0.5 break-words text-[11px] text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={13} />
            Migración completada ({report.steps.length} pasos)
          </p>
          <ul className="space-y-1.5">
            {report.steps.map((s) => (
              <StepRow key={s.step} step={s} />
            ))}
          </ul>
        </div>
      )}

      {/* ==================================================
          BANEOS ANTERIORES AL REGISTRO DURADERO
          ==================================================
          Antes, un baneo solo vivía en `users/{uid}.isBanned`.
          Ese documento se puede borrar, así que hay que volcar
          los baneos antiguos a `accountRestrictions`. La callable
          es idempotente: no toca los que ya estén registrados. */}
      <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-600/20">
            <ShieldAlert size={17} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">Baneos anteriores</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Copia al registro duradero los baneos que solo existen en el documento del
              usuario. Hace falta una vez después de desplegar las funciones nuevas: sin
              esto, un baneado antiguo podría borrar su perfil y volver a entrar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSincronizarBaneos}
          disabled={sincronizandoBaneos}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/80 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sincronizandoBaneos ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ShieldAlert size={14} />
          )}
          {sincronizandoBaneos ? 'Sincronizando...' : 'Sincronizar baneos'}
        </button>

        {baneos && (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 size={13} />
            Revisados {baneos.revisados} · creados {baneos.creados} · ya existían{' '}
            {baneos.existentes}
          </p>
        )}

        {errorBaneos && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
            <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
            <p className="min-w-0 break-words text-[11px] text-red-300/80">{errorBaneos}</p>
          </div>
        )}
      </div>

      {/* ==================================================
          IMÁGENES HUÉRFANAS
          ==================================================
          Cada cambio de portada deja el archivo viejo en
          Storage. Esta pasada los encuentra y los borra. */}
      <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600/20">
            <Trash2 size={17} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">Imágenes huérfanas</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Cada vez que cambias una portada o un banner, el archivo anterior se queda
              guardado en Firebase Storage para siempre. Esta pasada compara lo que hay
              subido con lo que realmente usan los documentos y borra lo que sobra.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-300/90">
            <strong>Mira la lista antes de borrar.</strong> Solo toca la carpeta{' '}
            <code className="text-amber-200">content/</code> (el catálogo). No afecta a los
            avatares ni a las imágenes de hilos y comentarios. Si algo no referenced a
            ningún documento, la web lo seguirá mostrando.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBuscar}
            disabled={buscando || limpiando}
            className="flex items-center gap-2 rounded-lg bg-amber-600/80 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buscando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            {buscando ? 'Buscando...' : 'Ver qué se puede borrar'}
          </button>

          <button
            type="button"
            onClick={handleLimpiar}
            disabled={
              buscando ||
              limpiando ||
              !informeHuerfanos ||
              informeHuerfanos.huerfanos.length === 0
            }
            className="flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {limpiando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {limpiando
              ? 'Borrando...'
              : `Borrar ${informeHuerfanos?.huerfanos.length ?? 0} imagen(es)`}
          </button>
        </div>

        {errorHuerfanos && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
            <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
            <p className="min-w-0 break-words text-[11px] text-red-300/80">{errorHuerfanos}</p>
          </div>
        )}

        {informeHuerfanos && <Huerfanos informe={informeHuerfanos} />}
      </div>
    </div>
  );
};
