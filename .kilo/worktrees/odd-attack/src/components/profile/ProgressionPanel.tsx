import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  MessageCircle,
  Heart,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useProgression } from '../../context/ProgressionContext';
import { mensajeDeError } from '../../services/gamification';
import { CATALOGO_MEDALLAS, nivelDesdeXp, rangoDeNivel } from '../../utils/progression';
import { LevelBar, MedalCard, StatBox } from '../gamification/MedalCard';

// ======================================================
// NIVEL Y LOGROS DEL PERFIL
// ======================================================
//
// Muestra el nivel, el XP, las estadisticas, las medallas y el
// titulo equipado.
//
// Es un componente aparte, y no un trozo de `ProfileView`, para
// que el perfil no tenga que saber nada de gamificacion: solo le
// pasa el id del usuario.
//
// Sobre el titulo: solo quien mira su propio perfil puede
// cambiarlo. `ProfileView` nunca muestra el progreso de otro
// usuario (los perfiles son privados), asi que en la practica
// `esElPropio` siempre es verdad, pero se comprueba igualmente:
// si mañana se abre esa puerta, el boton no puede quedar
// colgando.
/**
 * El listener de progreso sigue al usuario de la sesion. Si el
 * perfil llegara a mostrar el de otro, su progreso no estaria
 * cargado y no habria nada que pintar.
 */
export const ProgressionPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const { currentUser, usersList } = useAuth();
  const {
    progreso,
    nivel,
    rango,
    progresoNivel,
    faltaParaSiguiente,
    enNivelMaximo,
    catalogo,
    equipar,
    loading,
    config,
  } = useProgression();

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esElPropio = currentUser?.uid === userId;

  // ── Vista pública de otra persona ───────────────────
  //
  // `useProgression` sigue al usuario de la sesión, así que aquí no
  // sirve: para ver el progreso de otro hay que leerlo de su
  // documento, que `usersList` ya tiene en memoria.
  //
  // Se enseñan el nivel y las medallas YA CONSEGUIDAS, pero no las
  // que le faltan. Las barras de progreso hacia un requisito
  // necesitan las estadísticas (hilos, comentarios, "me gusta"), y
  // esas están en un campo aparte que la Cloud Function mantiene en
  // el documento del usuario. Podrían traerse, pero entonces el
  // contador estaría en dos sitios a la vez: aquí y en el panel, que
  // es justo lo que hace que dos cifras no cuadren. Mejor no
  // enseñarlas.
  if (!esElPropio) {
    const otro = usersList.find((u) => u.uid === userId);
    if (!otro) return null;

    const xp = otro.xp ?? 0;
    const nivelOtro = nivelDesdeXp(xp, config);
    const enMaximoOtro =
      config.nivelesMaximos > 0 && nivelOtro.level >= config.nivelesMaximos;
    const barraOtro =
      enMaximoOtro || nivelOtro.xpParaSiguienteNivel === 0
        ? 1
        : Math.min(1, nivelOtro.xpEnNivel / nivelOtro.xpParaSiguienteNivel);

    const medalsOtro = otro.medals ?? {};
    const suyas = CATALOGO_MEDALLAS.filter((m) => medalsOtro[m.id]).map((m) => ({
      medal: m,
      desbloqueada: true,
      fecha: medalsOtro[m.id] ?? null,
      progreso: 1,
      falta: 'Completada',
    }));

    return (
      <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl sm:p-8">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Award size={18} className="text-violet-400" />
          Nivel y logros
        </h3>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <LevelBar
            nivel={nivelOtro.level}
            rango={rangoDeNivel(nivelOtro.level)}
            xp={xp}
            progreso={barraOtro}
            falta={Math.max(0, nivelOtro.xpParaSiguienteNivel - nivelOtro.xpEnNivel)}
            enNivelMaximo={enMaximoOtro}
          />
        </div>

        {suyas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-6 text-center text-xs text-zinc-500">
            Todavía no ha desbloqueado ninguna medalla.
          </p>
        ) : (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Medallas ({suyas.length}/{CATALOGO_MEDALLAS.length})
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {suyas.map((estado) => (
                <MedalCard key={estado.medal.id} estado={estado} />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  const stats = progreso?.stats;

  const cambiarTitulo = async (medalId: string | null) => {
    setGuardando(true);
    setError(null);
    try {
      await equipar(medalId);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-10">
        <Loader2 size={18} className="animate-spin text-violet-400" />
        <span className="text-sm text-zinc-400">Cargando tu progreso...</span>
      </section>
    );
  }

  const conseguidas = catalogo.filter((c) => c.desbloqueada);
  const pendientes = catalogo
    .filter((c) => !c.desbloqueada)
    .sort((a, b) => b.progreso - a.progreso);

  const tituloActual = progreso?.equippedTitle;
  const medallaDelTitulo = tituloActual
    ? catalogo.find((c) => c.medal.id === tituloActual)
    : null;

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl sm:p-8">
      {/* ── Cabecera ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Award size={18} className="text-violet-400" />
        <h3 className="text-base font-bold text-white">Nivel y logros</h3>
      </div>

      {/* Aviso de que la gamificacion no esta puesta en marcha.

          Se ve mientras `gamification/config` siga con
          `activo: false`, que es lo que pasa si las Cloud
          Functions no estan desplegadas. Es preferible a
          enseñar un nivel 1 con cero XP sin explicar por que: si
          alguien publica un hilo y no le sube nada, lo primero que
          va a pensar es que esta roto.
      */}
      {!config.activo && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-300">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            El sistema de experiencia todavia no esta activo. Nadie esta ganando XP
            hasta que se desplieguen las funciones del servidor y se active desde el
            panel de administracion.
          </span>
        </p>
      )}

      {/* ── Barra de nivel ───────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <LevelBar
          nivel={nivel}
          rango={rango}
          xp={progreso?.xp ?? 0}
          progreso={progresoNivel}
          falta={faltaParaSiguiente}
          enNivelMaximo={enNivelMaximo}
        />
      </div>

      {/* ── Titulo equipado ──────────────────────────── */}
      {esElPropio && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <Sparkles size={15} className="flex-shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Tu titulo
            </p>
            <p className="truncate text-sm font-bold text-white">
              {medallaDelTitulo
                ? (medallaDelTitulo.medal.titulo ?? medallaDelTitulo.medal.nombre)
                : 'Sin titulo equipado'}
            </p>
          </div>
          {medallaDelTitulo && (
            <button
              type="button"
              onClick={() => cambiarTitulo(null)}
              disabled={guardando}
              className="flex-shrink-0 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Quitar'}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
          {error}
        </p>
      )}

      {/* ── Estadisticas ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="Hilos"
          value={stats?.threadsCreated ?? 0}
          icono={<MessageCircle size={12} className="text-violet-400" />}
        />
        <StatBox
          label="Comentarios"
          value={stats?.commentsCreated ?? 0}
          icono={<MessageCircle size={12} className="text-sky-400" />}
        />
        <StatBox
          label="Me gusta"
          value={stats?.likesReceived ?? 0}
          icono={<Heart size={12} className="fill-pink-500 text-pink-500" />}
        />
        <StatBox
          label="Debates"
          value={stats?.commentsInThreads ?? 0}
          icono={<Flame size={12} className="text-orange-400" />}
        />
      </div>

      {/* ── Medallas conseguidas ─────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Medallas ({conseguidas.length}/{catalogo.length})
        </h4>

        {conseguidas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-xs text-zinc-500">
            Todavia no has desbloqueado ninguna medalla. Publica un hilo o un comentario
            para empezar.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {conseguidas.map((estado) => (
              <MedalCard
                key={estado.medal.id}
                estado={estado}
                equipping={estado.medal.id === tituloActual}
                onEquipar={esElPropio ? cambiarTitulo : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Proximos logros ────────────────────────────
          Se muestran las cuatro mas cercanas, no todas: el
          catalogo completo esta en la pagina de logros. */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Proximos logros
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {pendientes.slice(0, 4).map((estado) => (
              <MedalCard key={estado.medal.id} estado={estado} compacto />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
