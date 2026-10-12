import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Loader2,
  Compass,
  Lock,
  Globe,
  Clock3,
  Check,
  Crown,
  ShieldCheck,
} from 'lucide-react';

import { CLUB_CATEGORIES } from '../../types';
import type { ClubCategory, ClubListing } from '../../types';
import { useClubs } from '../../context/ClubsContext';
import { useAuth } from '../../context/AuthContext';
import { ClubCreateModal } from './ClubCreateModal';
import { fechaRelativa } from '../../services/clubs';

// ======================================================
// DESCUBRIR CLUBES
// ======================================================
// La galería de comunidades. Se alimenta de Firebase: los
// clubes, sus miembros y sus contadores son reales, no hay
// nada simulado.
//
// El buscador filtra por nombre, descripción y categoría.
// El selector de categoría es un filtro real de Firestore,
// así que sin datos no aparece nada (a propósito: un
// filtro vacío es más honesto que un invento).
// ======================================================

type Orden = 'popularidad' | 'novedad';

export const ClubDiscovery: React.FC = () => {
  const { descubrir, refrescarDescubrir, misClubes } = useClubs();
  const { currentUser, openAuth } = useAuth();

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<ClubCategory | 'todas'>('todas');
  const [orden, setOrden] = useState<Orden>('popularidad');
  const [cargando, setCargando] = useState(true);
  const [crearAbierto, setCrearAbierto] = useState(false);

  // La búsqueda se dispara sola, con una pequeña espera
  // para no consultar en cada tecla.
  useEffect(() => {
    let vivo = true;
    setCargando(true);

    const t = setTimeout(() => {
      void refrescarDescubrir(busqueda, categoria).finally(() => {
        if (vivo) setCargando(false);
      });
    }, 250);

    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [busqueda, categoria, refrescarDescubrir]);

  // Tras cerrar el modal de crear, la galería se refresca con
  // los filtros actuales: si no, el club recién creado no sale
  // hasta cambiar de pestaña y volver. Se salta el primer
  // render (el efecto de arriba ya carga al montar) y la
  // apertura del modal (solo interesa el cierre).
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    if (crearAbierto) return;

    let vivo = true;
    setCargando(true);
    void refrescarDescubrir(busqueda, categoria).finally(() => {
      if (vivo) setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [crearAbierto, busqueda, categoria, refrescarDescubrir]);

  // La galería llega ordenada por número de miembros desde
  // Firestore (ya es el orden por popularidad). "Novedad"
  // reordena en el cliente por fecha de creación.
  const clubes = useMemo(() => {
    if (orden === 'novedad') {
      return [...descubrir].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    }
    return descubrir;
  }, [descubrir, orden]);

  const iconoDeCategoria = (cat: ClubCategory) =>
    CLUB_CATEGORIES.find((c) => c.id === cat)?.icon ?? '✨';

  const nombreDeCategoria = (cat: ClubCategory) =>
    CLUB_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Cabecera con buscador y acciones ─────────── */}
      <div className="flex-shrink-0 space-y-3 border-b border-zinc-800 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-400">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Descubrir clubes</h3>
              <p className="text-[11px] text-zinc-500">
                {clubes.length} {clubes.length === 1 ? 'comunidad' : 'comunidades'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                openAuth('login');
                return;
              }
              setCrearAbierto(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-500"
          >
            <Plus size={14} />
            <span>Crear club</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, descripción o categoría..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Filtros: categorías y orden */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoria('todas')}
            className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
              categoria === 'todas'
                ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Todas
          </button>

          {CLUB_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoria(c.id)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                categoria === c.id
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <span aria-hidden="true">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Orden */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-zinc-500">Ordenar:</span>
          <button
            type="button"
            onClick={() => setOrden('popularidad')}
            className={`rounded-lg px-2 py-1 font-bold transition-colors ${
              orden === 'popularidad'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Popularidad
          </button>
          <button
            type="button"
            onClick={() => setOrden('novedad')}
            className={`rounded-lg px-2 py-1 font-bold transition-colors ${
              orden === 'novedad'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Novedades
          </button>
        </div>
      </div>

      {/* ── Galería ──────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {cargando ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-violet-500" />
          </div>
        ) : clubes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-3xl">
              {categoria === 'todas' ? '🧭' : iconoDeCategoria(categoria as ClubCategory)}
            </div>
            <h4 className="mt-3 text-sm font-bold text-white">
              {busqueda || categoria !== 'todas'
                ? 'Ningún club coincide con tu búsqueda'
                : 'Todavía no hay clubes'}
            </h4>
            <p className="mt-1 text-[11px] text-zinc-500">
              {busqueda || categoria !== 'todas'
                ? 'Prueba con otras palabras o quita los filtros.'
                : currentUser
                  ? 'Sé el primero en crear una comunidad y reúne a la gente con tus mismas aficiones.'
                  : 'Inicia sesión para crear el primer club.'}
            </p>
            {!busqueda && categoria === 'todas' && (
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    openAuth('login');
                    return;
                  }
                  setCrearAbierto(true);
                }}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500"
              >
                <Plus size={14} />
                <span>Crear el primer club</span>
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {clubes.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                yaEresMiembro={misClubes.some((c) => c.id === club.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {crearAbierto && <ClubCreateModal onClose={() => setCrearAbierto(false)} />}
    </div>
  );
};

// ────────────────────────────────────────────────────────
// TARJETA DE CLUB
// ────────────────────────────────────────────────────────

const ClubCard: React.FC<{ club: ClubListing; yaEresMiembro: boolean }> = ({
  club,
  yaEresMiembro,
}) => {
  const { unirse } = useClubs();
  const { currentUser, openAuth } = useAuth();

  const [unido, setUnido] = useState(yaEresMiembro);
  const [solicitado, setSolicitado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceder = () => {
    if (!currentUser) {
      openAuth('login');
      return;
    }
    if (unido || procesando) return;

    setProcesando(true);
    setError(null);

    // La ficha de la galería es un `ClubListing`, que no lleva
    // el mapa de miembros. Para unirse hay que pasarle un
    // `Club`, así que se completa con lo que ya se sabe.
    void unirse({
      ...club,
      members: {},
      rules: '',
      chatId: '',
      createdAt: club.createdAt,
      updatedAt: club.createdAt,
    })
      .then((r) => {
        if (r.ok) {
          if (club.accessType === 'public') setUnido(true);
          else setSolicitado(true);
        } else {
          setError(r.error ?? 'No se pudo completar la operación.');
        }
      })
      .finally(() => setProcesando(false));
  };

  const etiquetaAcceso =
    club.accessType === 'public' ? 'Público' : club.accessType === 'private' ? 'Privado' : 'Por solicitud';

  const IconoAcceso =
    club.accessType === 'public' ? Globe : club.accessType === 'private' ? Lock : Clock3;

  return (
    <li className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-violet-500/40">
      {/* Portada */}
      <div className="relative h-24 bg-zinc-950">
        {club.coverUrl ? (
          <img
            src={club.coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-pink-600/20 text-3xl">
            {CLUB_CATEGORIES.find((c) => c.id === club.category)?.icon ?? '✨'}
          </div>
        )}

        {/* Icono superpuesto */}
        <div className="absolute -bottom-5 left-3.5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 border-zinc-900 bg-zinc-950 text-lg">
            {club.iconUrl ? (
              <img src={club.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{CLUB_CATEGORIES.find((c) => c.id === club.category)?.icon ?? '✨'}</span>
            )}
          </div>
        </div>

        {/* Tipo de acceso */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-950/85 px-2 py-0.5 text-[9px] font-bold text-zinc-300 backdrop-blur-sm">
          <IconoAcceso size={10} />
          <span>{etiquetaAcceso}</span>
        </div>
      </div>

      <div className="p-3.5 pt-7">
        <h4 className="truncate text-sm font-bold text-white">{club.name}</h4>

        <div className="mt-1 flex items-center gap-2.5 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Users size={11} />
            <span>
              {club.memberCount} {club.memberCount === 1 ? 'miembro' : 'miembros'}
            </span>
          </span>
          <span aria-hidden="true">·</span>
          <span>Creado {fechaRelativa(club.createdAt)}</span>
        </div>

        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
          {club.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
            {CLUB_CATEGORIES.find((c) => c.id === club.category)?.label ?? club.category}
          </span>

          {/* Botón que cambia según la situación del usuario */}
          {unido ? (
            <span className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300">
              <Check size={11} />
              <span>Ya eres miembro</span>
            </span>
          ) : solicitado ? (
            <span className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-300">
              <Clock3 size={11} />
              <span>Pendiente de aprobación</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={acceder}
              disabled={procesando}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {procesando ? (
                <Loader2 size={11} className="animate-spin" />
              ) : club.accessType === 'request' ? (
                <Clock3 size={11} />
              ) : (
                <Plus size={11} />
              )}
              <span>
                {club.accessType === 'request' ? 'Solicitar acceso' : 'Unirme'}
              </span>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
            {error}
          </p>
        )}

        {club.accessType === 'private' && !unido && (
          <p className="mt-2 flex items-center gap-1 text-[9px] text-zinc-600">
            <ShieldCheck size={10} />
            <span>Contenido restringido a miembros aprobados.</span>
          </p>
        )}
      </div>
    </li>
  );
};
