import React from 'react';
import { Sparkles, Camera, Shield, ShieldCheck, Calendar, Heart } from 'lucide-react';

import { textoTitulo } from '../gamification/AuthorBadge';
import { formatearNumero } from '../../utils/follows';
import { textoDias } from '../../utils/profile';
import { nivelDesdeXp, rangoDeNivel } from '../../utils/progression';
import { FollowButton } from '../follows/FollowButton';
import type { User } from '../../types';
import type { GamificationConfig } from '../../types/gamification';

// ======================================================
// LA TARJETA DE IDENTIDAD
// ======================================================
//
// La cabecera del perfil. Es la pieza que decide si el perfil es
// "la identidad del usuario" o "una página con su nombre": todo lo
// que hace que alguien se reconozca (nivel, XP, título, reputación
// social) está aquí, junto, y en este orden.
//
// ── Por qué NO se pinta el nivel aquí Y en ProgressionPanel ──
//
// Antes el nivel solo estaba en `ProgressionPanel`, más abajo, y
// había que llegar hasta el final del perfil para ver cuánto XP
// tenía alguien. Ahora está en la cabecera, que es donde se mira
// primero, y `ProgressionPanel` conserva su versión CON los
// botones de equipar título.
//
// Es duplicación de presentación, no de datos: sale del mismo
// `useProgression()` y del mismo `users/{uid}`. Lo que no se ha
// hecho es una segunda fuente de verdad, que es lo que sí rompe.

/** Etiquetas de rol. Sin entrada para 'user': no ser nada es lo normal. */
const ROL: Record<string, { texto: string; clase: string; icono: typeof Shield } | null> = {
  admin: {
    texto: 'Admin',
    clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    icono: ShieldCheck,
  },
  moderator: {
    texto: 'Mod',
    clase: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    icono: Shield,
  },
};

export const ProfileHeader: React.FC<{
  perfil: User;
  /** Si es el perfil propio. */
  esPropio: boolean;
  /** Contadores del usuario. Ya vienen normalizados a 0. */
  /**
   * Abre el modal de seguidores o de seguidos.
   *
   * Ojo al segundo parámetro: cuando el número aún no se sabe
   * (no hay listener) se le pasa `undefined` al componente. Es la
   * diferencia entre "no lo sé todavía" y "no tiene ninguno": con
   * un 0 alguien que mira el perfil a toda prisa se lo cree y no
   * vuelve a mirar, y en el peor caso creería que una persona con
   * mil seguidores no tiene ninguno.
   */
  onVerLista: (
    lista: 'followers' | 'following',
    /** El número actual, o `undefined` si aún no se sabe. */
    numero?: number,
  ) => void;
  /** Abre el editor del perfil. Solo en el propio. */
  onEditar?: () => void;
  /** Avatar por defecto cuando el usuario no tiene. */
  avatarPorDefecto: string;
  /**
   * Seguidores y seguidos.
   *
   * `undefined` cuando todavía no hay listener, y NO 0: ver la
   * nota de `onVerLista`.
   */
  seguidores?: number;
  seguidos?: number;
  /**
   * La curva de niveles vigente.
   *
   * Llega POR PROP y no se lee aquí de `useProgression()` a
   * propósito: el perfil de OTRA persona se puede montar donde el
   * `ProgressionProvider` sigue escuchando al usuario de la
   * sesión, así que dentro del provider el progreso es el de quien
   * está con sesión, no el de quien se está mirando. Quien lo
   * monta le pasa la curva, que es lo único que hace falta para
   * calcular el nivel de cualquier persona.
   */
  config: GamificationConfig;
}> = ({
  perfil,
  esPropio,
  seguidores,
  seguidos,
  onVerLista,
  onEditar,
  avatarPorDefecto,
  config,
}) => {

  // El nivel se RECALCULA en el cliente en vez de leerse del
  // documento, y es lo mismo que hace `ProgressionContext`: la
  // curva tiene dos copias (cliente y funciones) y si el admin
  // cambia la curva sin pasar por las funciones, el número
  // guardado sería el viejo. Ver `nivelDesdeXp`.
  const xp = perfil.xp ?? 0;
  const { level, xpEnNivel, xpParaSiguienteNivel } = nivelDesdeXp(xp, config);

  const enTope = config.nivelesMaximos > 0 && level >= config.nivelesMaximos;
  const progreso =
    enTope || xpParaSiguienteNivel === 0
      ? 1
      : Math.min(1, xpEnNivel / xpParaSiguienteNivel);

  const titulo = textoTitulo(perfil);
  const rol = perfil.role ? (ROL[perfil.role] ?? null) : null;

  // El nombre visible si existe, y el username debajo. Al revés
  // sería menos útil: el nombre es lo que reconoce la gente, y el
  // username es lo que se usa para mencionar.
  const nombre = perfil.displayName || perfil.username;
  const dias = Math.max(
    0,
    Math.floor((Date.now() - new Date(perfil.createdAt || '').getTime()) / 86_400_000),
  );

  return (
    // El `overflow-hidden` es lo que hace que el avatar "salga" de
    // la tarjeta por arriba. Sin él, la imagen se sale de los
    // bordes redondeados y el efecto se rompe.
    <header className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-xl">
      {/* ── Fondo decorativo ─────────────────────────────
          Un degradado morado muy suave. Es lo que da la
          sensación de "tarjeta" sin necesidad de bordes de
          colores: el fondo oscuro del proyecto ya es la base, y
          esto solo añade profundidad. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(139,92,246,0.18),transparent_60%)]"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
        {/* ── Avatar ────────────────────────────────────── */}
        <div className="relative shrink-0 self-center sm:self-start">
          <img
            src={perfil.avatarUrl || avatarPorDefecto}
            alt={`Avatar de ${nombre}`}
            // `onError` es el fallback de verdad: si la URL está
            // rota, o el archivo se borró de Storage, el navegador
            // pinta su icono de imagen rota encima de la tarjeta y
            // se rompe el efecto. Aquí se cambia por el avatar por
            // defecto, que es justo lo que debe verse.
            onError={(e) => {
              e.currentTarget.src = avatarPorDefecto;
            }}
            className="h-28 w-28 rounded-3xl object-cover ring-4 ring-violet-500/30 shadow-2xl sm:h-32 sm:w-32"
          />

          {/* El nivel sobre el avatar. Es el dato que más se mira
              de un vistazo, y ponerlo ahí evita que haya que
              leerlo. */}
          <span
            title={`Nivel ${level}`}
            className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-zinc-900 bg-violet-600 font-mono text-xs font-black text-white shadow-lg"
          >
            {level}
          </span>

          {esPropio && onEditar && (
            <button
              type="button"
              onClick={onEditar}
              aria-label="Editar perfil"
              title="Editar perfil"
              className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white"
            >
              <Camera size={14} />
            </button>
          )}
        </div>

        {/* ── Identidad ─────────────────────────────────── */}
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-black text-white sm:text-3xl">{nombre}</h1>

            {perfil.displayName && perfil.username && (
              <span className="rounded-md border border-violet-500/30 bg-violet-600/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                @{perfil.username}
              </span>
            )}

            {rol && (
              <span
                className={`flex items-center gap-0.5 rounded border px-1 py-px text-[10px] font-bold uppercase ${rol.clase}`}
              >
                <rol.icono size={10} />
                {rol.texto}
              </span>
            )}

            {/* El título equipado. Sale de `textoTitulo`, que ya
                comprueba que la medalla siga desbloqueada. */}
            {titulo && (
              <span
                className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300"
              >
                <Sparkles size={11} />
                {titulo}
              </span>
            )}
          </div>

          <p className="mx-auto max-w-lg text-xs text-zinc-400 sm:mx-0 sm:text-sm">
            {perfil.bio || <span className="italic text-zinc-600">Sin descripción todavía.</span>}
          </p>

          {/* ── Anime o serie favorita ──────────────────────
             Va con la bio y no en las estadísticas porque es
              una cosa que se LEE (una frase, "le gusta X"), no
              una cifra que se compare. Antes vivía en la cinta
              de números de abajo de la cabecera, y ahí quedaba
              apretada y truncada a media palabra.

              Solo si la hay puesto: `favoriteAnime` es opcional y
              la cuenta recién creada no lo tiene, así que el
              chip simplemente no sale. */}
          {perfil.favoriteAnime && (
            <p className="mx-auto flex max-w-lg items-center gap-1.5 text-[11px] text-zinc-500 sm:mx-0">
              <Heart size={11} className="flex-shrink-0 fill-pink-500 text-pink-500" />
              <span className="truncate">
                <span className="text-zinc-600">Le gusta</span>{' '}
                <span className="font-semibold text-zinc-300">{perfil.favoriteAnime}</span>
              </span>
            </p>
          )}

          {/* ── Nivel y barra de XP ────────────────────────
              El "7.240 / 10.000" sale de la misma curva que usa
              el resto de la web (`nivelDesdeXp`), no de un
              cálculo paralelo. El 10.000 es el XP que cuesta el
              nivel SIGUIENTE desde el principio, que es lo que
              hace comparables los dos números de la barra. */}
          <div className="mx-auto max-w-md sm:mx-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-black text-white">
                Nivel {level}
                <span className="ml-1.5 text-[11px] font-semibold text-violet-300">
                  {rangoDeNivel(level)}
                </span>
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                {enTope ? (
                  <span className="text-amber-300">Nivel máximo</span>
                ) : (
                  <>
                    {formatearNumero(xpEnNivel)} / {formatearNumero(xpParaSiguienteNivel)} XP
                  </>
                )}
              </span>
            </div>

            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.round(progreso * 100)}%` }}
              />
            </div>

            <p className="mt-1 text-[10px] text-zinc-500">
              {enTope ? (
                'Has alcanzado el nivel máximo. Ya no hay más por subir.'
              ) : (
                <>
                  Faltan{' '}
                  <strong className="font-mono text-zinc-400">
                    {formatearNumero(Math.max(0, xpParaSiguienteNivel - xpEnNivel))}
                  </strong>{' '}
                  XP para el nivel {level + 1} · {formatearNumero(xp)} XP en total
                </>
              )}
            </p>
          </div>

          {/* ── Reputación social ───────────────────────────
              Los dos números son botones y no texto suelto: son
              la única forma de llegar a las listas. Un perfil con 0
              seguidores y el mismo aspecto que uno con 300 no dice
              nada de la comunidad.

              Cada botón recibe su propio número para poder poner
              "—" en el `title` cuando todavía no se sabe, que es
              un detalle pequeño pero evita el tooltip mentiroso de
              "ver los 0 seguidores de X" mientras se está
              cargando. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-1 sm:justify-start">
            <button
              type="button"
              onClick={() => onVerLista('followers', seguidores)}
              title={
                seguidores === undefined
                  ? 'Cargando seguidores...'
                  : `Ver quién sigue a ${nombre}`
              }
              className="group flex items-baseline gap-1.5 text-xs transition-colors hover:text-violet-300"
            >
              <strong className="font-mono text-sm font-bold text-white group-hover:text-violet-300">
                {seguidores === undefined ? '—' : formatearNumero(seguidores)}
              </strong>
              <span className="text-zinc-400 group-hover:text-violet-300">
                seguidores
              </span>
            </button>

            <span className="text-zinc-700" aria-hidden="true">
              ·
            </span>

            <button
              type="button"
              onClick={() => onVerLista('following', seguidos)}
              title={
                seguidos === undefined
                  ? 'Cargando seguidos...'
                  : `Ver a quién sigue ${nombre}`
              }
              className="group flex items-baseline gap-1.5 text-xs transition-colors hover:text-violet-300"
            >
              <strong className="font-mono text-sm font-bold text-white group-hover:text-violet-300">
                {seguidos === undefined ? '—' : formatearNumero(seguidos)}
              </strong>
              <span className="text-zinc-400 group-hover:text-violet-300">seguidos</span>
            </button>

            {perfil.createdAt && dias > 0 && (
              <>
                <span className="text-zinc-700" aria-hidden="true">
                  ·
                </span>
                <span
                  className="flex items-center gap-1 text-[11px] text-zinc-500"
                  title={`Se registró el ${new Date(perfil.createdAt).toLocaleDateString('es-ES')}`}
                >
                  <Calendar size={10} />
                  {textoDias(dias)} en la comunidad
                </span>
              </>
            )}

            {/* El botón de seguir, solo si es otro perfil.
                `FollowButton` se devuelve a `null` si es el
                propio, así que la decisión está en un sitio. */}
            {!esPropio && (
              <span className="pt-1">
                <FollowButton userId={perfil.uid} usuario={perfil} />
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};