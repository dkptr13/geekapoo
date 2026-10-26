import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Globe2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import { useStreamingCatalog } from '../../context/StreamingCatalogContext';
import { useStreamingAvailability } from '../../hooks/useStreamingAvailability';
import {
  REGION_POR_DEFECTO,
  banderaDeRegion,
  nombreDeRegion,
  nombreDesdePlatformId,
} from '../../data/streaming';
import {
  crearPlataforma,
  crearRegion,
  eliminarDisponibilidad,
  guardarDisponibilidad,
} from '../../services/streamingAvailability';
import {
  ETIQUETAS_ACCESO,
  ETIQUETAS_ESTADO,
  OPCIONES_ACCESO,
  OPCIONES_ESTADO,
  esUrlHttp,
  formatearFechaVerificacion,
} from '../../services/streamingAvailabilityLogic';
import type {
  StreamingAccessType,
  StreamingAvailability,
  StreamingAvailabilityStatus,
} from '../../types';

import { CollapsibleSection } from './CollapsibleSection';
import { SelectField, TextField } from './fields';

// ======================================================
// DISPONIBILIDAD REGIONAL EN EL EDITOR DE UN ANIME
// ======================================================
// Sustituye en la práctica a la lista antigua `streaming`, pero no
// la borra: las plataformas viejas siguen saliendo en la wiki como
// «Sin verificar» hasta que se registre su fila por país.
//
// Cada fila es una combinación obra + plataforma + región. El id
// determinista de Firestore impide duplicados.
// ======================================================

interface StreamingAvailabilityEditorProps {
  animeId: string;
}

const inputBase =
  'w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white ' +
  'placeholder-zinc-600 focus:border-violet-500 focus:outline-none';

const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60';

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white disabled:opacity-60';

const btnDanger =
  'inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/20';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function nombreDePlataforma(
  row: StreamingAvailability,
  platformById: Map<string, { name: string }>,
): string {
  return (
    platformById.get(row.platformId)?.name ||
    nombreDesdePlatformId(row.platformId) ||
    row.platformId
  );
}

export const StreamingAvailabilityEditor: React.FC<StreamingAvailabilityEditorProps> = ({
  animeId,
}) => {
  const {
    platforms,
    regions,
    platformById,
    loading: catalogLoading,
    error: catalogError,
  } = useStreamingCatalog();
  const { datos, cargando, error: loadError } = useStreamingAvailability(animeId);

  const [platformId, setPlatformId] = useState('');
  const [region, setRegion] = useState(REGION_POR_DEFECTO);
  const [status, setStatus] = useState<StreamingAvailabilityStatus>('unverified');
  const [accessType, setAccessType] = useState<StreamingAccessType>('unknown');
  const [url, setUrl] = useState('');
  const [verifiedAt, setVerifiedAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [okMessage, setOkMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState('#e11d48');
  const [newPlatformLogo, setNewPlatformLogo] = useState('');
  const [platformFormError, setPlatformFormError] = useState('');

  const [showRegionForm, setShowRegionForm] = useState(false);
  const [newRegionCode, setNewRegionCode] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [regionFormError, setRegionFormError] = useState('');

  useEffect(() => {
    if (!platformId && platforms.length > 0) {
      setPlatformId(platforms[0].id);
    }
  }, [platformId, platforms]);

  const editingRow = datos.find((row) => row.id === editingId);

  const platformOptions = useMemo(() => {
    const options = platforms.map((platform) => ({
      value: platform.id,
      label: platform.name,
    }));

    if (platformId && !options.some((option) => option.value === platformId)) {
      options.push({
        value: platformId,
        label: nombreDesdePlatformId(platformId) || platformId,
      });
    }

    return [{ value: '', label: 'Selecciona una plataforma' }, ...options];
  }, [platforms, platformId]);

  const regionOptions = useMemo(() => {
    const options = regions.map((item) => ({
      value: item.code,
      label: `${banderaDeRegion(item.code)} ${item.name}`,
    }));

    if (region && !options.some((option) => option.value === region)) {
      options.push({
        value: region,
        label: `${banderaDeRegion(region)} ${nombreDeRegion(region, regions)}`,
      });
    }

    return options;
  }, [regions, region]);

  const filas = useMemo(
    () =>
      [...datos].sort(
        (a, b) =>
          a.region.localeCompare(b.region) ||
          nombreDePlataforma(a, platformById).localeCompare(
            nombreDePlataforma(b, platformById),
            'es',
          ),
      ),
    [datos, platformById],
  );

  const limpiarFormulario = () => {
    setEditingId(null);
    setPlatformId(platforms[0]?.id ?? '');
    setStatus('unverified');
    setAccessType('unknown');
    setUrl('');
    setVerifiedAt('');
    setFormError('');
    setConfirmDeleteId(null);
  };

  const editar = (row: StreamingAvailability) => {
    setEditingId(row.id);
    setPlatformId(row.platformId);
    setRegion(row.region);
    setStatus(row.status);
    setAccessType(row.accessType ?? 'unknown');
    setUrl(row.url ?? '');
    setVerifiedAt(row.verifiedAt ? row.verifiedAt.slice(0, 10) : '');
    setFormError('');
    setOkMessage('');
    setConfirmDeleteId(null);
    setShowPlatformForm(false);
    setShowRegionForm(false);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setFormError('');
    setOkMessage('');

    if (!platformId || !region) {
      setFormError('Elige una plataforma y una región.');
      return;
    }

    const yaExiste = datos.some(
      (row) => row.platformId === platformId && row.region === region && row.id !== editingId,
    );
    if (yaExiste) {
      setFormError('Ya hay una fila para esa plataforma y región. Edítala en la lista.');
      return;
    }

    setBusy(true);
    try {
      await guardarDisponibilidad({
        animeId,
        platformId,
        region,
        status,
        accessType,
        url: status === 'available' ? url : '',
        verifiedAt: status === 'unverified' ? '' : verifiedAt,
      });

      setOkMessage(editingId ? 'Disponibilidad actualizada.' : 'Disponibilidad añadida.');
      setEditingId(null);
      setStatus('unverified');
      setAccessType('unknown');
      setUrl('');
      setVerifiedAt('');
      setFormError('');
      setConfirmDeleteId(null);
    } catch (error) {
      setFormError(errorMessage(error, 'No se pudo guardar la disponibilidad.'));
    } finally {
      setBusy(false);
    }
  };

  const borrar = async (id: string) => {
    if (busy) return;

    setBusy(true);
    setFormError('');
    setOkMessage('');
    try {
      await eliminarDisponibilidad(id);
      setOkMessage('Disponibilidad eliminada.');
      setConfirmDeleteId(null);
      if (editingId === id) limpiarFormulario();
    } catch (error) {
      setFormError(errorMessage(error, 'No se pudo eliminar la disponibilidad.'));
    } finally {
      setBusy(false);
    }
  };

  const agregarPlataforma = async (event: React.FormEvent) => {
    event.preventDefault();
    setPlatformFormError('');

    if (!newPlatformName.trim()) {
      setPlatformFormError('Escribe el nombre de la plataforma.');
      return;
    }

    setBusy(true);
    try {
      const id = await crearPlataforma({
        name: newPlatformName,
        badgeColor: newPlatformColor,
        logoUrl: newPlatformLogo,
      });
      setPlatformId(id);
      setNewPlatformName('');
      setNewPlatformLogo('');
      setShowPlatformForm(false);
      setOkMessage('Plataforma añadida al catálogo.');
    } catch (error) {
      setPlatformFormError(errorMessage(error, 'No se pudo crear la plataforma.'));
    } finally {
      setBusy(false);
    }
  };

  const agregarRegion = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegionFormError('');

    if (!newRegionCode.trim() || !newRegionName.trim()) {
      setRegionFormError('Escribe el código y el nombre de la región.');
      return;
    }

    setBusy(true);
    try {
      const code = await crearRegion({
        code: newRegionCode,
        name: newRegionName,
      });
      setRegion(code);
      setNewRegionCode('');
      setNewRegionName('');
      setShowRegionForm(false);
      setOkMessage('Región añadida al catálogo.');
    } catch (error) {
      setRegionFormError(errorMessage(error, 'No se pudo crear la región.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CollapsibleSection
      title={`Disponibilidad regional (${datos.length})`}
      icon={<Globe2 size={12} />}
    >
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Cada fila relaciona esta obra con una plataforma y un país. Solo las filas con estado
        «Disponible» muestran enlace en la wiki. Las plataformas antiguas de arriba se enseñan
        como «Sin verificar» hasta que registres aquí su disponibilidad regional.
      </p>

      {catalogError ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
          {catalogError}
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-300">
          {loadError}
        </p>
      ) : null}

      <form onSubmit={guardar} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {editingId ? 'Editar fila' : 'Añadir disponibilidad'}
          </h5>
          {editingRow ? (
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
              {nombreDePlataforma(editingRow, platformById)}
            </span>
          ) : null}
        </div>

        <p className="text-[10px] leading-relaxed text-zinc-500">
          Marca «Disponible» solo si lo has comprobado en esa región. Si no, deja la fila
          como «Sin verificar».
        </p>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Plataforma"
            value={platformId}
            onChange={setPlatformId}
            options={platformOptions}
            disabled={Boolean(editingId)}
            hint={editingId ? 'No se cambia al editar; borra y crea otra fila.' : undefined}
          />
          <SelectField
            label="Región"
            value={region}
            onChange={setRegion}
            options={regionOptions}
            disabled={Boolean(editingId)}
            hint={editingId ? 'No se cambia al editar.' : undefined}
          />
          <SelectField
            label="Estado"
            value={status}
            onChange={(value) => setStatus(value as StreamingAvailabilityStatus)}
            options={OPCIONES_ESTADO}
          />
          <SelectField
            label="Modalidad de acceso"
            value={accessType}
            onChange={(value) => setAccessType(value as StreamingAccessType)}
            options={OPCIONES_ACCESO}
            hint={status !== 'available' ? 'Solo se aplica a «Disponible».' : undefined}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <TextField
            label="Enlace regional verificado"
            value={url}
            onChange={setUrl}
            placeholder="https://..."
            hint={status !== 'available' ? 'Solo se guarda si el estado es «Disponible».' : undefined}
          />
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-zinc-300">
              Fecha de última verificación
            </span>
            <input
              type="date"
              value={verifiedAt}
              onChange={(event) => setVerifiedAt(event.target.value)}
              className={inputBase}
            />
            <span className="mt-1 block text-[10px] text-zinc-600">
              {status === 'unverified'
                ? 'No se guarda con el estado «Sin verificar».'
                : 'Opcional.'}
            </span>
          </label>
        </div>

        {formError ? (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] text-red-300">
            {formError}
          </p>
        ) : null}
        {okMessage ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-300">
            <CheckCircle2 size={12} />
            {okMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : editingId ? <Save size={12} /> : <Plus size={12} />}
            {editingId ? 'Guardar cambios' : 'Añadir fila'}
          </button>
          {editingId ? (
            <button type="button" onClick={limpiarFormulario} disabled={busy} className={btnGhost}>
              <X size={12} />
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setShowPlatformForm((value) => !value);
            setShowRegionForm(false);
            setPlatformFormError('');
          }}
          disabled={Boolean(editingId)}
          title={editingId ? 'Termina la edición para añadir al catálogo.' : undefined}
          className={btnGhost}
        >
          <Plus size={12} />
          Nueva plataforma
        </button>
        <button
          type="button"
          onClick={() => {
            setShowRegionForm((value) => !value);
            setShowPlatformForm(false);
            setRegionFormError('');
          }}
          disabled={Boolean(editingId)}
          title={editingId ? 'Termina la edición para añadir al catálogo.' : undefined}
          className={btnGhost}
        >
          <Plus size={12} />
          Nuevo país/región
        </button>
      </div>

      {showPlatformForm ? (
        <form
          onSubmit={agregarPlataforma}
          className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
        >
          <p className="text-[10px] text-zinc-400">
            Se guarda en <code>streamingPlatforms</code> y queda disponible para todas las obras.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <TextField
              label="Nombre"
              value={newPlatformName}
              onChange={setNewPlatformName}
              placeholder="Ej. plataforma nueva"
            />
            <TextField
              label="Color (#RRGGBB)"
              value={newPlatformColor}
              onChange={setNewPlatformColor}
              placeholder="#e11d48"
            />
            <TextField
              label="Logotipo (URL, opcional)"
              value={newPlatformLogo}
              onChange={setNewPlatformLogo}
              placeholder="https://..."
            />
          </div>
          {platformFormError ? (
            <p className="text-[10px] text-red-300">{platformFormError}</p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              <Save size={12} />
              Crear plataforma
            </button>
            <button
              type="button"
              onClick={() => setShowPlatformForm(false)}
              className={btnGhost}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {showRegionForm ? (
        <form
          onSubmit={agregarRegion}
          className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
        >
          <p className="text-[10px] text-zinc-400">
            Se guarda en <code>streamingRegions</code>. El código son 2-10 letras mayúsculas
            (por ejemplo, PT para Portugal).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField
              label="Código"
              value={newRegionCode}
              onChange={setNewRegionCode}
              placeholder="PT"
            />
            <TextField
              label="Nombre"
              value={newRegionName}
              onChange={setNewRegionName}
              placeholder="Portugal"
            />
          </div>
          {regionFormError ? (
            <p className="text-[10px] text-red-300">{regionFormError}</p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              <Save size={12} />
              Crear región
            </button>
            <button type="button" onClick={() => setShowRegionForm(false)} className={btnGhost}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {cargando || catalogLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-3 text-[11px] text-zinc-500">
          <Loader2 size={13} className="animate-spin" />
          Cargando disponibilidad...
        </div>
      ) : filas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-4 text-center text-[11px] text-zinc-500">
          Esta obra todavía no tiene disponibilidad regional registrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {filas.map((row) => {
            const plataforma = nombreDePlataforma(row, platformById);
            const regionNombre = nombreDeRegion(row.region, regions);
            const fecha = formatearFechaVerificacion(row.verifiedAt);
            const acceso = row.status === 'available' ? ETIQUETAS_ACCESO[row.accessType ?? 'unknown'] : '';
            const enlace =
              row.status === 'available' && row.url && esUrlHttp(row.url) ? row.url : '';

            return (
              <li
                key={row.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{plataforma}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {banderaDeRegion(row.region)} {regionNombre} ·{' '}
                      <span
                        className={
                          row.status === 'available'
                            ? 'text-emerald-400'
                            : row.status === 'unavailable'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }
                      >
                        {ETIQUETAS_ESTADO[row.status]}
                      </span>
                      {acceso ? ` · ${acceso}` : ''}
                      {fecha ? ` · Verificado ${fecha}` : ''}
                    </p>
                    {enlace ? (
                      <a
                        href={enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-[10px] text-violet-300 hover:text-violet-200"
                      >
                        {enlace}
                      </a>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => editar(row)} className={btnGhost}>
                      <Edit3 size={11} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDeleteId === row.id) {
                          void borrar(row.id);
                        } else {
                          setConfirmDeleteId(row.id);
                        }
                      }}
                      disabled={busy}
                      className={btnDanger}
                    >
                      <Trash2 size={11} />
                      {confirmDeleteId === row.id ? '¿Eliminar?' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CollapsibleSection>
  );
};
