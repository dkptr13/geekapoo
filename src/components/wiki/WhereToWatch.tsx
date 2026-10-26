import React, { useMemo } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  HelpCircle,
  Info,
  Loader2,
  MapPin,
  Tv,
  XCircle,
} from 'lucide-react';

import { useRegionPreferida } from '../../context/RegionPreferenceContext';
import { useStreamingCatalog } from '../../context/StreamingCatalogContext';
import { useStreamingAvailability } from '../../hooks/useStreamingAvailability';
import { banderaDeRegion, nombreDeRegion } from '../../data/streaming';
import {
  ETIQUETAS_ACCESO,
  ETIQUETAS_ESTADO,
  construirTarjetas,
  esUrlHttp,
  formatearFechaVerificacion,
  hayDisponibilidadConfirmada,
  type StreamingCard,
} from '../../services/streamingAvailabilityLogic';
import type { Anime, StreamingAvailabilityStatus } from '../../types';

interface WhereToWatchProps {
  anime: Anime;
}

const ESTADO_ESTILO: Record<
  StreamingAvailabilityStatus,
  { icon: typeof CheckCircle2; className: string }
> = {
  available: {
    icon: CheckCircle2,
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  },
  unavailable: {
    icon: XCircle,
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  },
  unverified: {
    icon: HelpCircle,
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  },
};

function iniciales(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PlatformLogo: React.FC<{ card: StreamingCard }> = ({ card }) => {
  if (card.logoUrl && esUrlHttp(card.logoUrl)) {
    return (
      <img
        src={card.logoUrl}
        alt=""
        className="h-10 w-10 flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 object-contain p-1"
        loading="lazy"
      />
    );
  }

  return (
    <span
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
      style={{ backgroundColor: card.badgeColor }}
      aria-hidden="true"
    >
      {iniciales(card.name)}
    </span>
  );
};

const AvailabilityCard: React.FC<{ card: StreamingCard }> = ({ card }) => {
  const estado = ESTADO_ESTILO[card.status];
  const Icono = estado.icon;
  const acceso = card.status === 'available' ? ETIQUETAS_ACCESO[card.accessType] : '';
  const fecha = formatearFechaVerificacion(card.verifiedAt);
  const enlace = card.status === 'available' && card.url && esUrlHttp(card.url) ? card.url : '';

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-violet-500/50">
      <div className="flex items-start gap-3">
        <PlatformLogo card={card} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white">{card.name}</h3>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${estado.className}`}
          >
            <Icono size={11} />
            {ETIQUETAS_ESTADO[card.status]}
          </span>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1.5 text-[11px] leading-relaxed text-zinc-400">
        {acceso ? (
          <p>
            <span className="text-zinc-500">Acceso:</span>{' '}
            <span className="font-semibold text-zinc-300">{acceso}</span>
          </p>
        ) : null}

        {fecha ? (
          <p className="flex items-center gap-1.5 text-zinc-500">
            <CalendarCheck2 size={11} className="flex-shrink-0" />
            Verificado: {fecha}
          </p>
        ) : null}

        {card.status === 'unverified' ? (
          <p className="text-amber-300/80">
            {card.legacy
              ? 'Dato antiguo sin verificación regional; pendiente de confirmar.'
              : 'No hay información suficiente para confirmar la disponibilidad en esta región.'}
          </p>
        ) : card.status === 'unavailable' ? (
          <p className="text-rose-300/80">Confirmado que no está disponible en esta región.</p>
        ) : !enlace ? (
          <p className="text-zinc-500">Enlace regional todavía no registrado.</p>
        ) : null}
      </div>

      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 transition-colors hover:text-violet-200"
        >
          Ver ficha regional
          <ExternalLink size={12} />
        </a>
      ) : null}
    </article>
  );
};

export const WhereToWatch: React.FC<WhereToWatchProps> = ({ anime }) => {
  const { region, setRegion, guardando, error: regionError } = useRegionPreferida();
  const { regions, platforms } = useStreamingCatalog();
  const { datos, cargando, error } = useStreamingAvailability(anime.id, region);

  // Al cambiar de región, el estado anterior puede seguir un render
  // antes de que el efecto limpie la consulta. No se mezclan filas de
  // dos países: solo se pintan las de la región activa.
  const registrosRegion = useMemo(
    () => datos.filter((row) => row.region === region),
    [datos, region],
  );

  const tarjetas = useMemo(
    () =>
      construirTarjetas({
        registros: registrosRegion,
        legado: anime.streaming ?? [],
        region,
        platforms,
      }),
    [registrosRegion, anime.streaming, region, platforms],
  );

  const nombreRegion = nombreDeRegion(region, regions);
  const disponibles = tarjetas.filter((card) => card.status === 'available').length;
  const hayConfirmada = hayDisponibilidadConfirmada(tarjetas);

  const regionesVisibles = useMemo(() => {
    const options = regions.map((item) => ({ code: item.code, name: item.name }));

    if (region && !options.some((option) => option.code === region)) {
      options.push({ code: region, name: nombreDeRegion(region, regions) });
    }

    return options;
  }, [regions, region]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-white">
            <Tv size={16} className="text-violet-400" />
            <span>Servicios de Streaming / Dónde Verla</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Disponibilidad legal por región, con el estado de cada plataforma.
          </p>
        </div>

        <label className="inline-flex max-w-full items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 focus-within:border-violet-500/60">
          <Globe2 size={14} className="flex-shrink-0 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Región
          </span>
          <select
            value={region}
            onChange={(event) => {
              void setRegion(event.target.value);
            }}
            disabled={guardando}
            aria-label="Región para la disponibilidad de streaming"
            className="max-w-[190px] cursor-pointer bg-transparent text-xs font-bold text-white outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {regionesVisibles.map((item) => (
              <option key={item.code} value={item.code} className="bg-zinc-950 text-white">
                {banderaDeRegion(item.code)} {item.name}
              </option>
            ))}
          </select>
          {guardando ? <Loader2 size={12} className="animate-spin text-violet-400" /> : null}
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={12} className="text-violet-400" />
          Región activa:{' '}
          <strong className="font-semibold text-zinc-300">
            {banderaDeRegion(region)} {nombreRegion}
          </strong>
        </span>
        {hayConfirmada ? (
          <span className="text-emerald-400/80">
            {disponibles} {disponibles === 1 ? 'plataforma confirmada' : 'plataformas confirmadas'}
          </span>
        ) : null}
      </div>

      {regionError ? (
        <p className="mt-2 text-[10px] leading-relaxed text-amber-300/80">{regionError}</p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        {cargando ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando disponibilidad">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
              />
            ))}
          </div>
        ) : tarjetas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center">
            <Info size={22} className="mx-auto text-zinc-600" />
            <p className="mt-2 text-sm font-semibold text-zinc-300">
              Todavía no hay información verificada para {nombreRegion}.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Se irá añadiendo desde la administración cuando se confirme cada plataforma.
            </p>
          </div>
        ) : (
          <>
            {!hayConfirmada ? (
              <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                Todavía no hay ninguna plataforma con disponibilidad confirmada para{' '}
                {nombreRegion}. Cada tarjeta indica si está descartada o pendiente de verificar.
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tarjetas.map((card) => (
                <AvailabilityCard key={card.key} card={card} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
