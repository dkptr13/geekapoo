import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Check,
  Heart,
  MessageCircle,
  Calendar,
  ArrowUpRight,
  Reply,
  Star,
  Play,
  Users,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useFollows } from '../../context/FollowsContext';
import { useProgression } from '../../context/ProgressionContext';
import { formatearNumero } from '../../utils/follows';
import { calcularStats } from '../../utils/profile';
import { useProfileComments } from '../../hooks/useProfileComments';
import { nivelDesdeXp } from '../../utils/progression';
import { VITRINAS, VITRINAS_POR_DEFECTO } from '../../data/profileCustomization';
import type { TipoVitrina } from '../../data/profileCustomization';
import { CATALOGO_MEDALLAS } from '../../utils/progression';
import { readPrivacy } from '../../services/accountSettings';
import { encuadre } from '../../utils/safeData';

import { ProfileHeader } from './ProfileHeader';
import { ProfileStats } from './ProfileStats';
import { ProfileMedals } from './ProfileMedals';
import { ProfileActivity } from './ProfileActivity';
import { ProfileContent } from './ProfileContent';
import { ProfileFeatured } from './ProfileFeatured';
import { CustomizeProfileModal } from './CustomizeProfileModal';
import { PerfilFondo } from './ProfileDecor';
import {
  VitrinaColeccion,
  VitrinaPersonajes,
  VitrinaPrincipal,
  VitrinaTexto,
} from './ProfileShowcases';
import { FollowersModal } from '../follows/FollowersModal';
import { QuickImageEditor } from '../admin/QuickImageEditor';

import type { PerfilDatos } from '../../types/profile';
import type { Comment, User as Usuario } from '../../types';

/**
 * El avatar por defecto cuando el usuario no tiene ninguno, o
 * cuando el que tiene está roto.
 *
 * Vive aquí y no en la cabecera ni en el editor porque lo usan
 * las dos, y duplicar la lista de URLs en tres sitios es la forma
 * más rápida de que un día el editor ofrezca un avatar que la
 * cabecera ya no sabe mostrar.
 */
export const AVATAR_POR_DEFECTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

interface ProfileViewProps {
  /** Lleva al feed abriendo un hilo y, opcionalmente, un comentario. */
  onGoToThread?: (threadId: string, commentId?: string) => void;
  /**
   * Abre la ficha de una serie en la wiki.
   *
   * Recibe el slug y no el id porque es lo que espera el resto de
   * la app: la barra lateral y el feed de inicio ya lo usan así.
   */
  onGoToAnime?: (slug: string) => void;
  /**
   * A quién se está mirando.
   *
   * Si no viene, es el usuario de la sesión y el perfil sale
   * completo. Si viene otro uid se enseña SOLO lo público de esa
   * persona: sin formulario de edición, sin sus ajustes, sin su ID
   * de chat ni su uid, y sin la lista de lo que le gusta.
   *
   * Va en la URL ("?tab=perfil&usuario=...") para que el botón
   * "atrás" del navegador funcione y recargar no pierda la vista.
   */
  userId?: string;
  /**
   * Qué hacer al montar el perfil propio: 'editar' abre el
   * editor. Lo escribe el menú de cuenta y se consume una sola
   * vez (ver `onAccionConsumida`). En perfiles ajenos se ignora.
   */
  accionInicial?: string;
  /** Borra `accion` de la URL tras consumirla, para no repetirla. */
  onAccionConsumida?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = (props) => {
  const { currentUser, usersList } = useAuth();

  // ======================================================
  // A QUIÉN SE ESTÁ MIRANDO
  // ======================================================
  //
  // Antes este componente solo enseñaba el perfil de quien tenía
  // la sesión abierta, y todo lo que viene a continuación daba por
  // hecho que `currentUser` era "el usuario". Con lo de poder ver
  // el perfil de otra persona, eso ya no es cierto, así que se
  // resuelve aquí una vez y a partir de aquí se usa `perfil`.
  //
  // `usersList` ya está en memoria (la carga `AuthContext` para el
  // buscador y para el panel de administración), así que buscar a
  // alguien no cuesta ninguna lectura.
  const esPropio = !props.userId || props.userId === currentUser?.uid;

  const perfil: Usuario | undefined = esPropio
    ? currentUser ?? undefined
    : usersList.find((u) => u.uid === props.userId);

  // Solo se usa para el titulo que se pinta junto al nombre. El
  // resto del progreso lo lleva `ProgressionPanel`.
  if (!perfil) {
    // O no hay sesión, o el uid de la URL no corresponde a
    // nadie. Se distinguen los dos casos porque el primero pide
    // iniciar sesión y el segundo avisa de que el perfil no está.
    return currentUser ? (
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.06] bg-white/[0.03] p-10 text-center">
        <p className="text-base font-bold text-white">Este perfil ya no existe</p>
        <p className="mt-2 text-sm text-zinc-400">
          La cuenta puede haberse borrado, o el enlace estar mal escrito.
        </p>
      </div>
    ) : null;
  }

  /**
   * Si el dueño del perfil ha puesto que sea privado, de su
   * interior no se enseña nada.
   *
   * Se lee SU ajuste, no el nuestro: si no, el usuario que lo
   * puso en "privado" seguiría viéndose igual, porque el ajuste
   * es suyo y se respeta desde el otro lado.
   */
  const privado =
    !esPropio &&
    (perfil.privateProfile === true ||
      readPrivacy(perfil).profileVisibility === 'private');

  // Perfil marcado como privado por su dueño. Se enseña lo justo
  // para reconocer a quién es (avatar y nombre) y nada más: ni su
  // bio, ni su anime favorito, ni sus hilos, ni sus medallas.
  //
  // El ajuste es suyo y se respeta desde aquí: si ha dicho que no,
  // el sitio no enseña sus cosas "porque sí".
  //
  // Solo se llega a este caso si el perfil NO es el propio, así que
  // aquí no hay ningún botón de ajustes: esos serían los del
  // dueño, y el dueño nunca ve esta pantalla.
  if (privado) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <img
            src={perfil.avatarUrl || AVATAR_POR_DEFECTO}
            alt={perfil.username}
            className="h-20 w-20 flex-shrink-0 rounded-3xl object-cover ring-4 ring-white/10"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-white">
              {perfil.displayName || perfil.username}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              @{perfil.username} tiene el perfil en privado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Un poco más ancha en pantallas grandes, pero sin estirar
  // tanto que el texto quede incómodo de leer.
  return (
    <Perfil
      perfil={perfil}
      esPropio={esPropio}
      onGoToThread={props.onGoToThread}
      onGoToAnime={props.onGoToAnime}
      accionInicial={esPropio ? props.accionInicial : undefined}
      onAccionConsumida={props.onAccionConsumida}
    />
  );
};

/**
 * El perfil de verdad, con todas sus secciones.
 *
 * Va en un componente aparte, y no como más código dentro de
 * `ProfileView`, por una razón que no es de estilo: los hooks.
 *
 * `ProfileView` tiene que poder devolver tres pantallas que NO son
 * el perfil —"no hay sesión", "este perfil ya no existe" y "el perfil
 * es privado"— y lo hace con `return` antes de nada. Y los hooks
 * no se pueden llamar después de un `return` temprano: la regla no
 * es una manía de eslint, es que el orden de los hooks tiene que
 * ser el mismo en todos los renders, y si un render sale antes de
 * llamarlos y el siguiente no, React avisa de que se haCalled
 * "Rendered fewer hooks than expected" y se rompe el árbol entero.
 *
 * La pantalla "el perfil es privado" es la que más lo provoca, y
 * es el caso más común de todos: se llega a ella con un `return`
 * normal, pero si el usuario recarga y su cuenta es la propia, el
 * perfil entero sigue por delante.
 *
 * Separarlas también deja cada pantalla con sus hooks justos: la
 * privada no abre listeners de nada, que es lo que debe pasar con
 * una pantalla que solo enseña un avatar y un nombre.
 */
const Perfil: React.FC<{
  perfil: Usuario;
  esPropio: boolean;
  onGoToThread?: (threadId: string, commentId?: string) => void;
  onGoToAnime?: (slug: string) => void;
  accionInicial?: string;
  onAccionConsumida?: () => void;
}> = ({ onGoToThread, onGoToAnime, perfil, esPropio, accionInicial, onAccionConsumida }) => {
  // Seguimientos. El contexto centraliza los contadores y el estado
  // del botón, para que el perfil no tenga dos o tres listeners
  // propios: el modal y las filas de la lista también lo necesitan.
  const { social, socialUid, modalAbierto, modalUid, modalLista, abrirModal, cerrarModal } =
    useFollows();

  const { catalogo, equipar, config, loading: cargandoProgreso } = useProgression();

  const { threads, animes, episodes, characters, ensureCatalogData } = useCommunity();
  const { comments, likedComments } = useProfileComments(perfil.uid);

  // El catálogo pesado solo hace falta para poner título a comentarios
  // de episodios o personajes. Un perfil sin esa actividad no lo carga.
  useEffect(() => {
    const necesitaCatalogo = [...comments, ...likedComments].some(
      (c) => c.targetType === 'episode' || c.targetType === 'character',
    );
    if (necesitaCatalogo) ensureCatalogData();
  }, [comments, likedComments, ensureCatalogData]);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [showMyLikes, setShowMyLikes] = useState(false);
  const [editorAbierto, setEditorAbierto] = useState(false);

  // ── Acción pendiente del menú de cuenta ──────────────
  //
  // 'editar' abre el editor. Solo en el perfil propio: en el
  // ajeno no hay editor que abrir. Se consume una sola vez (se
  // borra de la URL): sin eso, volver al perfil reabriría el
  // editor.
  useEffect(() => {
    if (!accionInicial || !esPropio) return;
    if (accionInicial === 'editar') {
      setEditorAbierto(true);
    }
    onAccionConsumida?.();
    // Solo al montar / al llegar la acción. `onAccionConsumida`
    // se excluye a propósito: incluirla relanzaría el efecto en
    // cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accionInicial, esPropio]);

  // Si el usuario ha pedido que su actividad no se vea, no se le
  // cuentan los hilos ni los comentarios ni se le listan. La
  // cuenta sigue ahí (los posts existen), pero su perfil no los
  // enseña.
  const showActivity =
    perfil.activityHidden !== true && readPrivacy(perfil).showActivity;

  // ── Contadores de seguidores ──────────────────────
  //
  // Del listener del contexto, y solo si `socialUid` es esta misma
  // persona. La comparación no es un detalle: los contadores son
  // los de UNA persona, y si el perfil se abre mientras el
  // contexto sigue escuchando a otra, sin ella saldría el número
  // del otro. Mientras no hay listener se enseña "—": es preferible
  // a enseñar 0, que es un dato que se queda si alguien lee el
  // perfil a toda prisa y se lo cree.
  const contadores = socialUid === perfil.uid ? social : null;

  // Si no hay contadores todavía, se enseña "—" en vez de 0. Un 0
  // que en realidad es "todavía no lo sé" es peor: alguien que
  // lee el perfil a toda prisa se lo cree y no vuelve a mirar.
  const seguidores = contadores?.followersCount;
  const seguidos = contadores?.followingCount;

  // ======================================================
  // LOS DATOS PARA EL PERFIL
  // ======================================================
  //
  // `PerfilDatos` se arma UNA vez y se reparte. Las secciones
  // (estadísticas, actividad, publicaciones) leen de aquí en
  // lugar de recibir cada una su propio trozo: si las tres tuvieran
  // su propia versión, el día que se añadiera un campo nuevo
  // habría que acordarse de añadirlo en tres sitios, y el que se
  // olvidara enseñaría un 0 sin que nadie se entere.
  const datos: PerfilDatos = useMemo(
    () => ({
      uid: perfil.uid,
      threads,
      comments,
      medals: perfil.medals ?? {},
      // El catálogo de la persona que se está mirando. En el perfil
      // propio `catalogo` ya viene resuelto con su estado; en el de
      // otra persona, `catalogo` es el del usuario de la sesión
      // (el `ProgressionProvider` sigue al que tiene sesión, no al
      // que se mira), así que las medallas se leen del documento
      // directamente y se cruzan con el catálogo completo.
      catalogo: esPropio
        ? catalogo.map((c) => c.medal)
        : CATALOGO_MEDALLAS.filter((m) => perfil.medals?.[m.id]),
      xp: perfil.xp ?? 0,
      likesReceived: perfil.stats?.likesReceived ?? 0,
      createdAt: perfil.createdAt,
      followersCount: seguidores ?? 0,
      followingCount: seguidos ?? 0,
      // La última subida de nivel sale del documento del usuario,
      // no del `ProgressionContext`: el de dentro sigue al de la
      // sesión, así que en el perfil de otra persona sería la
      // fecha de subida de quien mira. Y el directorio de
      // `usersList` ya trae el campo, sin coste de lectura.
      lastLevelUpAt: perfil.lastLevelUpAt ?? null,
      lastLevelUpLevel: perfil.lastLevelUpLevel ?? null,
    }),
    [perfil, threads, comments, catalogo, esPropio, seguidores, seguidos],
  );

  const stats = useMemo(() => calcularStats(datos), [datos]);

  // ── Hilos propios y destacados ───────────────────
  //
  // Los hilos ya están en memoria. Los propios van de más nuevos
  // a más viejos (es lo que el editor enseña para elegir), y los
  // destacados en el orden que eligió el dueño. Si un id fijado
  // ya no existe o no es suyo, se salta: pintar "hilo eliminado"
  // en la vitrina sería ruido.
  const hilosPropios = useMemo(
    () =>
      threads
        .filter((t) => t.authorId === perfil.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [threads, perfil.uid],
  );

  const hilosDestacados = useMemo(() => {
    const ids = perfil.featuredPostIds ?? [];
    if (ids.length === 0) return [];
    const porId = new Map(hilosPropios.map((t) => [t.id, t]));
    return ids.map((id) => porId.get(id)).filter((t) => t !== undefined);
  }, [hilosPropios, perfil.featuredPostIds]);

  // ── Orden de vitrinas ────────────────────────────
  //
  // Lo que el dueño guardó, en su orden. Ausente o vacío es el
  // diseño de siempre (logros + destacadas), para no cambiarle
  // el perfil a nadie por actualizar. Los ids que ya no existen
  // se saltan en silencio.
  const ordenVitrinas = useMemo<TipoVitrina[]>(() => {
    const guardadas = perfil.showcases;
    if (!guardadas || guardadas.length === 0) return [...VITRINAS_POR_DEFECTO];
    return guardadas.filter((v): v is TipoVitrina => VITRINAS.some((t) => t.id === v));
  }, [perfil.showcases]);

  // Nivel del perfil que se mira (la curva es la misma para
  // todos, así que vale la de la sesión). Solo decide el fondo.
  const nivelPerfil = nivelDesdeXp(perfil.xp ?? 0, config).level;

  // ======================================================
  // LO QUE LE GUSTA
  // ======================================================
  // El "me gusta" vive en la propia pieza, en "likedBy" con la
  // lista de uids: en la serie, en el hilo y en el comentario. Así
  // que no hay nada que traer de otro sitio, se filtra lo que ya
  // está cargado y no hace falta ninguna consulta ni reglas nuevas.
  //
  // Se ordena en los tres casos porque la colección llega en el
  // orden que le da Firestore y la lista cambiaría sola al
  // recargar, con las tarjetas saltando de sitio.
  const myLikedAnimes = useMemo(
    () =>
      animes
        .filter((a) => a.likedBy?.includes(perfil.uid))
        .sort((a, b) => a.title.localeCompare(b.title, 'es')),
    [animes, perfil.uid],
  );

  const myLikedThreads = useMemo(
    () =>
      threads
        .filter((t) => t.likedBy?.includes(perfil.uid))
        .sort((a, b) => a.title.localeCompare(b.title, 'es')),
    [threads, perfil.uid],
  );

  const myLikedComments = useMemo(
    () =>
      [...likedComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [likedComments],
  );

  // El contador de la casilla suma las tres cosas: es lo que ha
  // marcado el usuario en total, que es lo que pregunta la cuenta.
  const userLikedCount =
    myLikedAnimes.length + myLikedThreads.length + myLikedComments.length;

  // Abrir la ficha de una serie. Se pasa el slug, que es lo que
  // espera la wiki; si algún anime antiguo lo tuviera vacío, el
  // id también sirve porque la ficha busca por los dos.
  const goToAnime = (animeId: string, slug: string) => onGoToAnime?.(slug || animeId);

  // Título legible de dónde se escribió cada comentario. Los
  // comentarios son polimórficos: pueden estar en un hilo, en un
  // anime, en un episodio o en un personaje.
  const targetTitleOf = (c: Comment): string => {
    if (c.targetType === 'thread') {
      return threads.find((t) => t.id === c.targetId)?.title ?? 'Hilo eliminado';
    }
    if (c.targetType === 'anime') {
      return animes.find((a) => a.id === c.targetId)?.title ?? 'Anime eliminado';
    }
    if (c.targetType === 'episode') {
      const found = Object.values(episodes)
        .flat()
        .find((e) => e.id === c.targetId);
      const anime = found
        ? animes.find((a) => a.id === found.animeId)?.title
        : undefined;
      return found
        ? `${anime ?? ''} · Ep.${found.number} ${found.title}`.trim()
        : 'Episodio eliminado';
    }
    const found = Object.values(characters)
      .flat()
      .find((ch) => ch.id === c.targetId);
    return found?.name ?? 'Personaje eliminado';
  };

  // Solo se puede saltar a un comentario que esté en un hilo:
  // es el único sitio donde HomeFeed sabe abrir la conversación.
  const canJumpTo = (c: Comment) => c.targetType === 'thread';

  const handleCopyId = () => {
    navigator.clipboard.writeText(perfil.chatId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Aparte del de chat porque los dos se copian en momentos
  // distintos y compartir el mismo texto "copiado" haría que un
  // aviso apareciera donde no toca.
  const handleCopyUid = () => {
    navigator.clipboard.writeText(perfil.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="relative mx-auto max-w-3xl 2xl:max-w-4xl">
      {/* ── Fondo de página ────────────────────────────
          El fondo guardado por el dueño, detrás de todo. Sin
          fondo es transparente y no cambia nada. */}
      <PerfilFondo perfil={perfil} level={nivelPerfil} />

      <div className="relative space-y-6">
      {/* ══════════════════════════════════════════════════
          LA CABECERA

          Es lo primero que se ve y lo que identifica a la
          persona: avatar, nombre, título, nivel, barra de XP y
          reputación social. Todo junto, en este orden, porque es
          el orden en que se lee.

          No lleva borde ni fondo propio porque el contenedor de
          arriba ya es la tarjeta; el contenido va directamente
          sobre el fondo de la página, que es más limpio que
          anidar un marco dentro de otro marco. */}
      <ProfileHeader
        perfil={perfil}
        esPropio={esPropio}
        seguidores={seguidores}
        seguidos={seguidos}
        // El número se pasa por si el modal lo necesita para su
        // propio encabezado. Hoy no lo usa, pero el modal ya sabe
        // contarlo por su cuenta y así no se le da un número que
        // podría no ser el suyo.
        onVerLista={(lista) => abrirModal(perfil.uid, lista)}
        onEditar={esPropio ? () => setEditorAbierto(true) : undefined}
        avatarPorDefecto={AVATAR_POR_DEFECTO}
        config={config}
      />

      {/* ID DE CHAT, UID Y AJUSTES.

          Va justo debajo de la cabecera y no dentro de ella, porque
          son los identificadores de la cuenta y no la identidad:
          si estuvieran dentro, se leerían como parte de la
          tarjeta y en el perfil de otra persona parecería que su
          identificador va con su nombre.

          Solo del dueño. El ID de chat y el uid son las dos llaves
          con las que se le localiza a una persona, así que
          enseñarlos en el perfil de otro sería el camino corto para
          escribirle por privado sin haberlo pedido. */}
      {esPropio && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs">
            <span className="text-zinc-500">ID PARA CHATS:</span>
            <code className="font-mono font-bold text-violet-300">{perfil.chatId}</code>
            <button
              onClick={handleCopyId}
              className="ml-1 p-1 text-zinc-400 transition-colors hover:text-white"
              title="Copiar ID"
              aria-label="Copiar ID para chats"
            >
              {copiedId ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          {copiedId && (
            <span className="text-xs font-semibold text-emerald-400">¡ID copiado al portapapeles!</span>
          )}

          {/* UID DE FIREBASE.

           Va junto al ID de chat porque es el otro identificador
           de la cuenta, y hace falta: el panel de administración
           pide el uid para dar XP o una medalla, y antes solo se
           podía sacar de la consola de Firebase.

           "break-all" porque son 20 caracteres y en un móvil no
           caben en una línea sin partirse por la mitad. Se puede
           copiar entero, que es lo que se copia cuando se lo pide
           el panel. */}
          <div className="flex max-w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs">
            <span className="shrink-0 text-zinc-500">UID:</span>
            <code
              className="min-w-0 break-all font-mono text-[10px] text-zinc-400"
              title={perfil.uid}
            >
              {perfil.uid}
            </code>
            <button
              onClick={handleCopyUid}
              className="ml-1 flex-shrink-0 p-1 text-zinc-400 transition-colors hover:text-white"
              title="Copiar UID"
              aria-label="Copiar UID"
            >
              {copiedUid ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          {copiedUid && (
            <span className="text-xs font-semibold text-emerald-400">¡UID copiado al portapapeles!</span>
          )}
        </div>
      )}

      {/* ── ESTADÍSTICAS ─────────────────────────────
          Los contadores de seguidores y seguidos NO dependen de
          `showActivity`: son reputación pública, se ven en cada
          hilo y hasta los cuenta el catálogo de medallas. Lo que
          ese ajuste oculta es lo que el usuario PUBLICA (hilos y
          comentarios), que es justo lo que el resto de la sección
          cuenta. Por eso la sección entera va dentro del
          `showActivity`: ocultar una cosa no debería enseñar las
          otras.

          Y los dos contadores van aparte, sobre la rejilla: si la
          actividad está oculta se siguen viendo, que es lo que
          tiene sentido. */}
      {showActivity ? (
        <ProfileStats
          stats={stats}
          nombre={perfil.displayName || perfil.username}
          onVerLista={(lista) => abrirModal(perfil.uid, lista)}
          cargandoSeguidores={seguidores === undefined}
          cargandoSeguidos={seguidos === undefined}
        />
      ) : (
        <SeguidoresSolo
          nombre={perfil.displayName || perfil.username}
          seguidores={seguidores}
          seguidos={seguidos}
          onVerLista={(lista) => abrirModal(perfil.uid, lista)}
        />
      )}

      {/* ── MEDALLAS ────────────────────────────────
          El `catalogo` con estado solo es del usuario de la
          sesión, así que en el perfil de otra persona se
          construyen las suyas cruzando el catálogo completo con
          lo que hay en su documento. Para ese caso el bloque de
          arriba ya no pinta nivel (lo pinta la cabecera con su
          barra), y aquí solo salen las medallas. */}
      {/* ── VITRINAS ─────────────────────────────────
          Los bloques configurables, en el orden del dueño.
          Ausentes = logros + destacadas (diseño de siempre).

          `logros` y `destacadas` reutilizan las secciones que ya
          existían. `coleccion` es opt-in: poner la vitrina ES el
          permiso para enseñar las series que te gustan. */}
      {ordenVitrinas.map((tipo) => {
        if (tipo === 'logros' && !cargandoProgreso) {
          return (
            <ProfileMedals
              key="logros"
              catalogo={catalogoDePerfil(perfil, esPropio, catalogo)}
              propio={esPropio}
              equipado={perfil.equippedTitle ?? null}
              onEquipar={esPropio ? (id) => void equipar(id) : undefined}
              avisoDesactivada={!config.activo}
              idsVisibles={perfil.visibleBadgeIds ?? null}
            />
          );
        }
        if (tipo === 'destacadas' && showActivity) {
          return <ProfileFeatured key="destacadas" hilos={hilosDestacados} onIrA={onGoToThread} />;
        }
        if (tipo === 'personajes') {
          return <VitrinaPersonajes key="personajes" perfil={perfil} />;
        }
        if (tipo === 'principal') {
          return <VitrinaPrincipal key="principal" perfil={perfil} />;
        }
        if (tipo === 'coleccion') {
          return (
            <VitrinaColeccion
              key="coleccion"
              perfil={perfil}
              animes={animes}
              onGoToAnime={onGoToAnime ? (slug) => goToAnime(slug, slug) : undefined}
            />
          );
        }
        if (tipo === 'texto') {
          return <VitrinaTexto key="texto" perfil={perfil} />;
        }
        return null;
      })}

      {/* ── ACTIVIDAD RECIENTE ──────────────────────
          La línea de tiempo. Se deriva de los hilos, los
          comentarios, las medallas y la última subida de nivel
          que ya están en Firestore: no hay ninguna colección
          nueva ni ninguna escritura (ver `lineaDeTiempo` en
          `utils/profile.ts`).

          Solo si el usuario deja ver su actividad. */}
      {showActivity && (
        <ProfileActivity datos={datos} onIrA={onGoToThread} />
      )}

      {/* ── PUBLICACIONES Y COMENTARIOS ─────────────
          Las dos listas del usuario, en pestañas, con "ver más"
          para no pintar cientos de filas de golpe. */}
      {showActivity && <ProfileContent datos={datos} onIrA={onGoToThread} />}

      {/* ══════════════════════════════════════════════════
          LO QUE LE GUSTA

          Solo del dueño: es su lista de gustos y no aporta nada
          al perfil de otra persona. Tampoco depende de
          `showActivity`, y esa diferencia es deliberada: "lo que
          publico" y "lo que me ha gustado" son cosas distintas,
          y el ajuste de privacidad cubre la primera.

          Sigue siendo un desplegable y no una pestaña porque no es
          contenido: es un extra, y el perfil ya tiene cinco
          bloques arriba que son el perfil en sí. */}
      {esPropio && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowMyLikes((v) => !v)}
            className="flex w-full items-center gap-2 text-left text-base font-bold text-white"
          >
            <Heart size={16} className="text-pink-400" />
            Lo que te gusta
            <span className="font-mono text-xs font-normal text-zinc-500">
              {userLikedCount}
            </span>
            <ArrowUpRight
              size={14}
              className={`ml-auto text-zinc-500 transition-transform ${
                showMyLikes ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showMyLikes &&
            (userLikedCount === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-xs text-zinc-500">
                Todavía no le has dado Me gusta a nada. Pulsa el corazón en una serie, en un
                hilo o en un comentario y aparecerá aquí.
              </p>
            ) : (
              <>
                {/* SERIES. Rejilla de portadas, como el catálogo. */}
                {myLikedAnimes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Series ({myLikedAnimes.length})
                    </h3>
                    {/* Dos columnas en el móvil, no cuatro: a 320px el perfil
                        deja unos 256px de ancho útil y las cuatro
                        dejaban cada portada en 85px, demasiado
                        pequeño para leer ni el título. */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {myLikedAnimes.map((anime) => (
                        <div key={anime.id} className="group relative text-left">
                          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                            <QuickImageEditor
                              section="animes"
                              itemId={anime.id}
                              field="coverUrl"
                              label={`Portada de ${anime.title}`}
                              src={anime.coverUrl}
                              alt={anime.title}
                              containerClassName="h-full w-full"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              badgeClassName="top-1.5 right-1.5"
                              imgStyle={encuadre(anime.coverFocus)}
                            />

                            {/* El velo solo aparece al pasar por encima: la
                                portada se ve limpia en reposo. */}
                            <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="flex w-full items-center gap-1.5 p-2.5 text-[11px] font-bold text-white">
                                <Play size={12} className="fill-white" />
                                Ver ficha
                              </span>
                            </div>

                            {/* Botón de apertura, encima de la portada y SIN
                                envolver la tarjeta entera.
                                QuickImageEditor pinta su propio botón de
                                cámara para admins y moderadores, y un
                                botón dentro de otro botón es HTML
                                inválido: el interior deja de pulsarse.
                                Como aquí son hermanos, los dos funcionan,
                                y la cámara queda accesible porque va en
                                z-10 y este en z-5. */}
                            <button
                              type="button"
                              onClick={() => goToAnime(anime.id, anime.slug)}
                              aria-label={`Abrir la ficha de ${anime.title}`}
                              title={`Abrir la ficha de ${anime.title}`}
                              className="absolute inset-0 z-[5] cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-violet-400"
                            />
                          </div>

                          <h5 className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-zinc-200 group-hover:text-pink-300">
                            {anime.title}
                          </h5>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                            {anime.rating > 0 && (
                              <span className="flex items-center gap-0.5 font-semibold text-amber-400">
                                <Star size={9} className="fill-amber-400" />
                                {anime.rating}
                              </span>
                            )}
                            {anime.year > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Calendar size={9} />
                                {anime.year}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-0.5 font-semibold text-pink-400">
                              <Heart size={9} className="fill-pink-500 text-pink-500" />
                              {anime.likesCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HILOS. Filas, no portada: lo que se mira aquí es el
                    título y el texto, no la imagen. */}
                {myLikedThreads.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Hilos ({myLikedThreads.length})
                    </h3>
                    <ul className="space-y-3">
                      {myLikedThreads.map((thread) => (
                        <li key={thread.id}>
                          <button
                            type="button"
                            onClick={() => onGoToThread?.(thread.id)}
                            disabled={!onGoToThread}
                            title="Abrir este hilo en el feed"
                            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.05] disabled:cursor-default disabled:hover:border-white/[0.06]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold text-white">{thread.title}</span>
                              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
                                {thread.categoryName}
                              </span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                              {thread.body}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                              <span>{thread.authorName}</span>
                              <span className="flex items-center gap-1 font-mono font-semibold text-pink-400">
                                <Heart size={11} className="fill-pink-500 text-pink-500" />
                                {thread.likesCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle size={11} />
                                {thread.commentsCount}
                              </span>
                              {onGoToThread && (
                                <span className="ml-auto flex items-center gap-1 font-semibold text-violet-400">
                                  Ver hilo
                                  <ArrowUpRight size={12} />
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* COMENTARIOS. Se enseña de dónde es cada uno, que es
                    justo lo que falta al leer el texto suelto. */}
                {myLikedComments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Comentarios ({myLikedComments.length})
                    </h3>
                    <ul className="space-y-3">
                      {myLikedComments.map((c) => {
                        // Solo se puede saltar a un comentario que esté
                        // en un hilo: el feed no es quien pinta el resto.
                        const jumpable = canJumpTo(c);

                        const body = (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                <Reply size={11} />
                                <span className="truncate">{targetTitleOf(c)}</span>
                              </span>
                              <span className="flex-shrink-0 text-[10px] text-zinc-500">
                                {new Date(c.createdAt).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-300">
                              {c.body}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                              <span>{c.authorName}</span>
                              <span className="flex items-center gap-1 font-mono text-pink-400">
                                <Heart size={11} className="fill-pink-500 text-pink-500" />
                                {c.likesCount}
                              </span>
                              {jumpable && onGoToThread && (
                                <span className="ml-auto flex items-center gap-1 font-semibold text-violet-400">
                                  Ir al comentario
                                  <ArrowUpRight size={12} />
                                </span>
                              )}
                            </div>
                          </>
                        );

                        return (
                          <li key={c.id}>
                            {jumpable && onGoToThread ? (
                              <button
                                type="button"
                                onClick={() => onGoToThread(c.targetId, c.id)}
                                title="Abrir el hilo y resaltar este comentario"
                                className="chat-boton w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.05]"
                              >
                                {body}
                              </button>
                            ) : (
                              // Los comentarios fuera de un hilo (en un
                              // anime, un episodio o un personaje) se
                              // muestran, pero no son navegables: el
                              // feed no es quien los pinta.
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 opacity-80">
                                {body}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            ))}
        </section>
      )}

      {/* ── MODAL DE SEGUIDORES ────────────────────────────
          Vive aquí y no dentro de la cabecera porque se abre desde
          los números de debajo del nombre, y porque tiene que poder
          abrirse desde el botón de una fila del propio modal (para
          saltar de "mis seguidores" a "los seguidores de este").

          El estado está en `FollowsContext`, no en este
          componente: así el modal puede abrirse desde cualquier
          sitio (un hilo, un comentario) sin que el perfil tenga
          que estar montado. */}
      {modalAbierto && modalUid === perfil.uid && (
        <FollowersModal
          userId={perfil.uid}
          lista={modalLista}
          nombreLista={modalLista === 'followers' ? 'Seguidores' : 'Seguidos'}
          titulo={perfil.displayName || perfil.username}
          onCerrar={cerrarModal}
        />
      )}

      {/* ── PERSONALIZAR PERFIL ────────────────────
          El editor por pestañas, con vista previa. Solo se monta
          en el perfil propio y solo mientras está abierto, igual
          que hacía el modal viejo. */}
      {editorAbierto && (
        <CustomizeProfileModal
          onCerrar={() => setEditorAbierto(false)}
          avatarPorDefecto={AVATAR_POR_DEFECTO}
          hilosPropios={hilosPropios}
        />
      )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// SOLO SEGUIDORES, CON LA ACTIVIDAD OCULTA
// ──────────────────────────────────────────────────────────
//
// Es lo que sale en su lugar cuando el usuario ha pedido que no se
// vean sus hilos ni sus comentarios.
//
// Se preguntará por qué sale siquiera una sección de esto, y la
// respuesta es que el ajuste es sobre PUBLICAR, no sobre existir:
// con todo oculto, el perfil de una persona quedaría siendo solo
// un avatar y un nombre, sin ninguna señal de que lleva meses en la
// comunidad. Los dos contadores son reputación, y la reputación es
// pública por definición: se ve en cada hilo, en cada comentario,
// y hasta en las medallas de comunidad.
//
// Lo que NO sale, y es lo importante, es nada de lo que publicó: ni
// su número de hilos, ni el de comentarios, ni sus listas, ni su
// línea de tiempo. Si salieran, el ajuste no habría servido de
// nada.
const SeguidoresSolo: React.FC<{
  nombre: string;
  seguidores?: number;
  seguidos?: number;
  onVerLista: (lista: 'followers' | 'following') => void;
}> = ({ nombre, seguidores, seguidos, onVerLista }) => (
  <section className="space-y-3">
    <h2 className="flex items-center gap-2 text-base font-bold text-white">
      <Users size={16} className="text-violet-400" />
      Comunidad
    </h2>

    <div className="grid grid-cols-2 gap-3">
      <BotonSeguidores
        label="Seguidores"
        numero={seguidores}
        onClick={() => onVerLista('followers')}
        nombre={nombre}
      />
      <BotonSeguidores
        label="Seguidos"
        numero={seguidos}
        onClick={() => onVerLista('following')}
        nombre={nombre}
      />
    </div>

    <p className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-[11px] text-zinc-500">
      {nombre} tiene su actividad oculta.
    </p>
  </section>
);

/** Una caja de contador con su botón. Ver `SeguidoresSolo`. */
const BotonSeguidores: React.FC<{
  label: string;
  numero?: number;
  onClick: () => void;
  nombre: string;
}> = ({ label, numero, onClick, nombre }) => (
  <button
    type="button"
    onClick={onClick}
    title={numero === undefined ? `Cargando ${label}...` : `Ver ${label.toLowerCase()} de ${nombre}`}
    className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition-colors hover:border-violet-400/40 hover:bg-white/[0.05]"
  >
    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="mt-0.5 font-mono text-base font-bold text-white">
      {numero === undefined ? '—' : formatearNumero(numero)}
    </p>
  </button>
);

// ──────────────────────────────────────────────────────────
// EL CATÁLOGO DE MEDALLAS DE QUIEN SE ESTÁ MIRANDO
// ──────────────────────────────────────────────────────────
//
// El `catalogo` que da `useProgression()` es el del usuario de la
// SESIÓN, con su estado (conseguida o no, barra de progreso,
// cuánto falta). Eso vale cuando el perfil es el propio.
//
// Cuando se está mirando a otra persona, ese catálogo no sirve:
// sus medallas conseguirían el estado de quien está con sesión. Se
// construye el suyo cruzando el catálogo completo con su
// documento, que es exactamente lo que los datos permiten: qué
// medallas tiene es un hecho (`perfil.medals`), y cómo va cada
// una hacia su requisito es información que solo tiene sentido
// para uno mismo.
//
// Que se pinte sin barra de progreso es lo correcto y no una
// carencia: las barras de "te faltan 3" son un plan de juego, y el
// plan de juego de un desconocido no es lo que se viene a mirar.
function catalogoDePerfil(
  perfil: Usuario,
  esPropio: boolean,
  catalogoSesion: ReturnType<typeof useProgression>['catalogo'],
) {
  if (esPropio) return catalogoSesion;

  const suyas = perfil.medals ?? {};

  return CATALOGO_MEDALLAS.filter((m) => suyas[m.id]).map((m) => ({
    medal: m,
    desbloqueada: true,
    fecha: suyas[m.id] ?? null,
    progreso: 1,
    falta: 'Completada',
  }));
}