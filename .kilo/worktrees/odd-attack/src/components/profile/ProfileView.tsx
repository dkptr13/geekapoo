import React, { useRef, useState } from 'react';
import {
  User,
  Copy,
  Check,
  Sparkles,
  Camera,
  Save,
  MessageCircle,
  Heart,
  Calendar,
  Layers,
  Flame,
  ArrowUpRight,
  Reply,
  Settings,
  Star,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { AccountSettings } from './AccountSettings';
import { readPrivacy } from '../../services/accountSettings';
import { QuickImageEditor } from '../admin/QuickImageEditor';
import { puntoEncuadre } from '../../utils/safeData';
import { ProgressionPanel } from './ProgressionPanel';
import { useProgression } from '../../context/ProgressionContext';
// El icono "User" de lucide ocupa ese nombre en el archivo, así que
// el tipo entra con otro. Se llama Usuario para que las dos cosas
// se distingan de un vistazo al leer.
import type { User as Usuario } from '../../types';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
];

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
}

/** A qué parte de la portada se ancla el recorte. Ver `Character.imageFocus`. */
const encuadre = (focus: unknown): React.CSSProperties => {
  const p = puntoEncuadre(focus);
  return { objectPosition: `${p.x * 100}% ${p.y * 100}%` };
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  onGoToThread,
  onGoToAnime,
  userId,
}) => {
  const { currentUser, usersList, updateProfileData } = useAuth();

  // ======================================================
  // A QUIÉN SE ESTÁ MIRANDO
  // ======================================================
  //
  // Antes este componente solo enseñaba el perfil de quien tenía
  // la sesión abierta, y todo el que viene a continuación daba por
  // hecho que `currentUser` era "el usuario". Con lo de poder ver
  // el perfil de otra persona, eso ya no es cierto, así que se
  // resuelve aquí una vez y a partir de aquí se usa `perfil`.
  //
  // `usersList` ya está en memoria (la carga `AuthContext` para el
  // buscador y para el panel de administración), así que buscar a
  // alguien no cuesta ninguna lectura.
  const esPropio = !userId || userId === currentUser?.uid;

  const perfil: Usuario | undefined = esPropio
    ? currentUser ?? undefined
    : usersList.find((u) => u.uid === userId);

  // Solo se usa para el titulo que se pinta junto al nombre. El
  // resto del progreso lo lleva `ProgressionPanel`.
  const { titulo } = useProgression();
  const { threads, comments, animes, episodes, characters } = useCommunity();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [favoriteAnime, setFavoriteAnime] = useState(currentUser?.favoriteAnime || 'Kaguya-sama: Love is War');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatarUrl || PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showMyThreads, setShowMyThreads] = useState(false);
  const [showMyComments, setShowMyComments] = useState(false);
  const [showMyLikes, setShowMyLikes] = useState(false);

  // Referencia al apartado de configuración, para el botón del
  // encabezado que baja hasta él.
  const settingsRef = useRef<HTMLDivElement | null>(null);

  if (!perfil) {
    // O no hay sesión, o el uid de la URL no corresponde a
    // nadie. Se distinguen los dos casos porque el primero pide
    // iniciar sesión y el segundo avisa de que el perfil no está.
    return currentUser ? (
      <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/90 p-10 text-center">
        <p className="text-base font-bold text-white">Este perfil ya no existe</p>
        <p className="mt-2 text-sm text-zinc-400">
          La cuenta puede haberse borrado, o el enlace estar mal escrito.
        </p>
      </div>
    ) : null;
  }

  // El avatar que se pinta. Para el perfil propio sale del estado
  // local, que es donde se edita antes de guardar; para el de
  // otra persona, del documento.
  const avatar = esPropio
    ? selectedAvatar
    : (perfil.avatarUrl || PRESET_AVATARS[0]);

  // El anime favorito pasa por lo mismo que el avatar: en el perfil
  // propio sale del estado editable, y en el de otra persona, de su
  // documento.
  const animeFavorito = esPropio
    ? favoriteAnime
    : (perfil.favoriteAnime || 'Sin elegir');

  /**
   * Si el dueño del perfil ha puesto que sea privado, de su
   * interior no se enseña nada.
   *
   * Se lee SU ajuste, no el nuestro: si no, el usuario que lo
   * puso en "privado" seguiría viéndose igual, porque el ajuste
   * es suyo y se respeta desde el otro lado.
   */
  const privado = !esPropio && readPrivacy(perfil).profileVisibility === 'private';

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAvatar = customAvatarUrl.trim() || selectedAvatar;
    updateProfileData({
      displayName: displayName.trim(),
      bio: bio.trim(),
      favoriteAnime: favoriteAnime.trim(),
      avatarUrl: finalAvatar,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // User stats
  const myThreads = threads.filter((t) => t.authorId === perfil.uid);
  const userThreadsCount = myThreads.length;
  const myComments = comments.filter((c) => c.authorId === perfil.uid);
  const userCommentsCount = myComments.length;

  // ======================================================
  // TODO LO QUE LE GUSTA
  // ======================================================
  // El "me gusta" vive en la propia pieza, en "likedBy" con la
  // lista de uids: en la serie, en el hilo y en el comentario. Así
  // que no hay nada que traer de otro sitio, se filtra lo que ya
  // está cargado y no hace falta ninguna consulta ni reglas nuevas.
  //
  // Se ordena en los tres casos porque la colección llega en el
  // orden que le da Firestore y la lista cambiaría sola al
  // recargar, con las tarjetas saltando de sitio.
  const myLikedAnimes = animes
    .filter((a) => a.likedBy?.includes(perfil.uid))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));

  const myLikedThreads = threads
    .filter((t) => t.likedBy?.includes(perfil.uid))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));

  const myLikedComments = comments
    .filter((c) => c.likedBy?.includes(perfil.uid))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // El contador de la casilla suma las tres cosas: es lo que ha
  // marcado el usuario en total, que es lo que pregunta la cuenta.
  const userLikedCount =
    myLikedAnimes.length + myLikedThreads.length + myLikedComments.length;

  // Abrir la ficha de una serie. Se pasa el slug, que es lo que
  // espera la wiki; si algún anime antiguo lo tuviera vacío, el
  // id también sirve porque la ficha busca por los dos.
  const goToAnime = (animeId: string, slug: string) => onGoToAnime?.(slug || animeId);

  // Si el usuario ha pedido que su actividad no se vea, no se le
  // cuentan los hilos ni los comentarios ni se le listan. La
  // cuenta sigue ahí (los posts existen), pero su perfil no los
  // enseña.
  const showActivity = readPrivacy(perfil).showActivity;

  // Título legible de dónde se escribió cada comentario. Los
  // comentarios son polimórficos: pueden estar en un hilo, en
  // un anime, en un episodio o en un personaje.
  const targetTitleOf = (c: (typeof myComments)[number]): string => {
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
  const canJumpTo = (c: (typeof myComments)[number]) => c.targetType === 'thread';

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
      <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <img
            src={avatar}
            alt={perfil.username}
            className="h-20 w-20 flex-shrink-0 rounded-3xl object-cover ring-4 ring-zinc-800"
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
    <div className="max-w-3xl mx-auto 2xl:max-w-4xl space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={avatar}
              alt={perfil.username}
              className="h-24 w-24 rounded-3xl object-cover ring-4 ring-violet-500/30 shadow-2xl"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-zinc-900 bg-emerald-500"></span>
            </span>
          </div>

            <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white">
                {perfil.displayName || perfil.username}
              </h2>
              <span className="rounded-md bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-xs font-bold text-violet-300">
                @{perfil.username}
              </span>

              {/* Título equipado. Sale del progreso del usuario, y
                  solo si su medalla sigue desbloqueada: si un admin
                  se la retiró, el título desaparece con ella. */}
              {titulo && (
                <span
                  title={titulo.descripcion}
                  className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300"
                >
                  <Sparkles size={11} className="flex-shrink-0" />
                  {titulo.titulo ?? titulo.nombre}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg">
              {perfil.bio || 'Sin descripción todavía.'}
            </p>

            {/* ID DE CHAT, UID Y AJUSTES.

                Todo este bloque es solo del dueño. El ID de chat y
                el uid son las dos llaves con las que se le localiza
                a una persona, así que enseñarlos en el perfil de
                otro sería el camino corto para escribirle por
                privado sin haberlo pedido. */}
            {esPropio && (
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs">
                  <span className="text-zinc-500">ID PARA CHATS:</span>
                  <code className="font-mono text-violet-400 font-bold">{perfil.chatId}</code>
                  <button
                    onClick={handleCopyId}
                    className="ml-1 p-1 text-zinc-400 hover:text-white transition-colors"
                    title="Copiar ID"
                  >
                    {copiedId ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {copiedId && (
                  <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
                    ¡ID copiado al portapapeles!
                  </span>
                )}

                {/* UID DE FIREBASE.

                 Va junto al ID de chat porque es el otro
                  identificador de la cuenta, y hace falta: el
                  panel de administración pide el uid para dar XP o
                  una medalla, y antes solo se podía sacar de la
                  consola de Firebase.

                  "break-all" porque son 20 caracteres y en un móvil
                  no caben en una línea sin partirse por la mitad.
                  Se puede copiar entero, que es lo que se copia
                  cuando se lo pide el panel. */}
                <div className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs max-w-full">
                  <span className="shrink-0 text-zinc-500">UID:</span>
                  <code
                    className="min-w-0 break-all font-mono text-[10px] text-zinc-400"
                    title={perfil.uid}
                  >
                    {perfil.uid}
                  </code>
                  <button
                    onClick={handleCopyUid}
                    className="ml-1 flex-shrink-0 p-1 text-zinc-400 hover:text-white transition-colors"
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
                  <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
                    ¡UID copiado al portapapeles!
                  </span>
                )}

                {/* Acceso a privacidad, correo, contraseña y borrado */}
                <button
                  type="button"
                  onClick={() =>
                    settingsRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white"
                >
                  <Settings size={13} className="text-violet-400" />
                  Configuración de la cuenta
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Stats Ribbon
            Dos columnas en móvil y cuatro en pantallas anchas: con
            "me gusta" son cuatro casillas y a tres quedaban
            apelotonadas en la mitad del ancho. */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-6 sm:grid-cols-4">
          {showActivity ? (
            <>
              <button
                type="button"
                onClick={() => setShowMyThreads((v) => !v)}
                title={showMyThreads ? 'Ocultar mis hilos' : 'Ver mis hilos'}
                className={`rounded-2xl bg-zinc-950/60 border p-3 text-center transition-colors ${
                  showMyThreads
                    ? 'border-violet-500/60'
                    : 'border-zinc-850 hover:border-violet-500/40'
                }`}
              >
                <span className="text-[11px] text-zinc-500 uppercase font-bold block">Hilos</span>
                <strong className="text-lg font-mono text-white">{userThreadsCount}</strong>
              </button>
              <button
                type="button"
                onClick={() => setShowMyComments((v) => !v)}
                title={showMyComments ? 'Ocultar mis comentarios' : 'Ver mis comentarios'}
                className={`rounded-2xl bg-zinc-950/60 border p-3 text-center transition-colors ${
                  showMyComments
                    ? 'border-violet-500/60'
                    : 'border-zinc-850 hover:border-violet-500/40'
                }`}
              >
                <span className="text-[11px] text-zinc-500 uppercase font-bold block">Comentarios</span>
                <strong className="text-lg font-mono text-white">{userCommentsCount}</strong>
              </button>
            </>
          ) : (
            // Con la actividad oculta los dos contadores se sustituyen
            // por un único aviso que ocupa las dos columnas que
            // deixam libres.
            <div className="col-span-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-3 text-center">
              <span className="text-[11px] text-zinc-500 uppercase font-bold block">Actividad oculta</span>
              <span className="mt-0.5 block text-[11px] text-zinc-600">
                Los has pedido ocultar en privacidad
              </span>
            </div>
          )}

          {/* El "me gusta" NO depende de showActivity a diferencia de
              los otros dos. Lo que se oculta con esa opción es lo
              que el usuario PUBLICA (hilos y comentarios), y esto
              es al revés: un "me gusta" ya es público, se ve en
              cada serie y hasta lo cuenta el catálogo.

              Pero solo en el perfil propio: la lista de lo que le
              gusta a otra persona es de lo más personal que hay,
              y no es lo que se viene a mirar en su perfil. */}
          {esPropio && (
            <button
              type="button"
              onClick={() => setShowMyLikes((v) => !v)}
              title={showMyLikes ? 'Ocultar lo que me gusta' : 'Ver lo que me gusta'}
              className={`rounded-2xl bg-zinc-950/60 border p-3 text-center transition-colors ${
                showMyLikes
                  ? 'border-pink-500/60'
                  : 'border-zinc-850 hover:border-pink-500/40'
              }`}
            >
              <span className="text-[11px] text-zinc-500 uppercase font-bold block">Me gusta</span>
              <strong className="text-lg font-mono text-pink-300">{userLikedCount}</strong>
            </button>
          )}

          <div className="rounded-2xl bg-zinc-950/60 border border-zinc-850 p-3 text-center">
            <span className="text-[11px] text-zinc-500 uppercase font-bold block">Anime Favorito</span>
            <strong className="text-xs font-semibold text-violet-300 truncate block">
              {animeFavorito.split(':')[0]}
            </strong>
          </div>
        </div>
      </div>

      {/* HILOS PUBLICADOS POR ESTA CUENTA */}
      {showActivity && showMyThreads && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-violet-400" />
            <span>Hilos publicados ({myThreads.length})</span>
          </h3>

          {myThreads.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-xs text-zinc-500">
              Todavía no has publicado ningún hilo. Ve al feed de inicio y publica el primero.
            </p>
          ) : (
            <ul className="space-y-3">
              {myThreads.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => onGoToThread?.(thread.id)}
                    disabled={!onGoToThread}
                    title="Abrir este hilo en el feed"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-950/80 disabled:cursor-default disabled:hover:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white">{thread.title}</h4>
                      <span className="rounded-full bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
                        {thread.categoryName}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {thread.body}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                      <span>
                        {new Date(thread.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-pink-400 font-semibold font-mono">
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
          )}
        </section>
      )}

      {/* COMENTARIOS PUBLICADOS */}
      {showActivity && showMyComments && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageCircle size={18} className="text-violet-400" />
            <span>Comentarios publicados ({myComments.length})</span>
          </h3>

          {myComments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-xs text-zinc-500">
              Todavía no has escrito ningún comentario.
            </p>
          ) : (
            <ul className="space-y-3">
              {myComments.map((c) => {
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
                      <span className="flex items-center gap-1 font-mono">
                        <Heart size={11} />
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
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-950/80"
                      >
                        {body}
                      </button>
                    ) : (
                      // Los comentarios fuera de un hilo (en un
                      // anime, un episodio o un personaje) se
                      // muestran, pero no son navegables: el
                      // feed no es quien los pinta.
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 opacity-80">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* TODO LO QUE LE GUSTA.

              Solo del dueño: es su lista de gustos y no aporta
              nada al perfil de otra persona. */}
      {esPropio && showMyLikes && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Heart size={18} className="text-pink-400" />
            <span>Lo que te gusta ({userLikedCount})</span>
          </h3>

          {userLikedCount === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-8 text-center text-xs text-zinc-500">
              Todavía no le has dado Me gusta a nada. Pulsa el corazón en una serie, en un hilo o en
              un comentario y aparecerá aquí.
            </p>
          ) : (
            <>
              {/* SERIES. Rejilla de portadas, como el catálogo. */}
              {myLikedAnimes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Series ({myLikedAnimes.length})
                  </h4>
                  {/* Dos columnas en el móvil, no cuatro: a 320px el perfil
                      deja unos 256px de ancho útil y las cuatro
                      dejaban cada portada en 85px, demasiado
                      pequeño para leer ni el título. */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {myLikedAnimes.map((anime) => (
                      <div key={anime.id} className="group relative text-left">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Hilos ({myLikedThreads.length})
                  </h4>
                  <ul className="space-y-3">
                    {myLikedThreads.map((thread) => (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => onGoToThread?.(thread.id)}
                          disabled={!onGoToThread}
                          title="Abrir este hilo en el feed"
                          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-950/80 disabled:cursor-default disabled:hover:border-zinc-800"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">{thread.title}</span>
                            <span className="rounded-full bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
                              {thread.categoryName}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                            {thread.body}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                            <span>{thread.authorName}</span>
                            <span className="flex items-center gap-1 text-pink-400 font-semibold font-mono">
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
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Comentarios ({myLikedComments.length})
                  </h4>
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
                              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-950/80"
                            >
                              {body}
                            </button>
                          ) : (
                            // Los comentarios fuera de un hilo (en un
                            // anime, un episodio o un personaje) se
                            // muestran, pero no son navegables: el
                            // feed no es quien los pinta.
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 opacity-80">
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
          )}
        </section>
      )}

      {/* NIVEL Y LOGROS

          Va antes del formulario de edición para que el nivel se
          vea en cuanto se entra al perfil, sin tener que llegar
          abajo del todo. El catálogo completo está en la pestaña
          "Logros".

          En el perfil de otra persona `ProgressionPanel` ya se
          encarga de enseñar solo la parte pública. */}
      <ProgressionPanel userId={perfil.uid} />

      {/* Profile Edit Form.

          Solo del dueño: es un formulario que llama a
          `updateProfileData`, que escribe en el documento del
          usuario de la sesión. */}
      {esPropio && (
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-6 shadow-xl"
        >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User size={18} className="text-violet-400" />
            <span>Editar Información del Perfil</span>
          </h3>
          {savedFeedback && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> ¡Cambios guardados con éxito!
            </span>
          )}
        </div>

        {/* Preset Avatars Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Seleccionar Avatar Anime / Geek
          </label>
          <div className="flex flex-wrap gap-3">
            {PRESET_AVATARS.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedAvatar(url);
                  setCustomAvatarUrl('');
                }}
                className={`relative h-14 w-14 rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedAvatar === url && !customAvatarUrl
                    ? 'border-violet-500 scale-105 shadow-md shadow-violet-500/30'
                    : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Avatar ${i}`} className="h-full w-full object-cover" />
                {selectedAvatar === url && !customAvatarUrl && (
                  <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <span className="text-[11px] text-zinc-500 block mb-1">
              O introduce una URL personalizada para tu avatar:
            </span>
            <input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => {
                setCustomAvatarUrl(e.target.value);
                if (e.target.value) setSelectedAvatar(e.target.value);
              }}
              placeholder="https://..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre de Usuario o Apodo
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Anime o Serie Favorita
            </label>
            <input
              type="text"
              value={favoriteAnime}
              onChange={(e) => setFavoriteAnime(e.target.value)}
              placeholder="Kaguya-sama: Love is War, Cyberpunk..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Biografía Geek (Sobre ti)
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Escribe sobre tus gustos, mangas que sigues o juegos..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
          >
            <Save size={15} />
            <span>Guardar Cambios</span>
          </button>
        </div>
        </form>
      )}

      {/* CONFIGURACIÓN DE LA CUENTA
          Va al final del perfil y no dentro del formulario de
          arriba porque no guarda el perfil: son los ajustes de la
          cuenta (privacidad, correo, contraseña y el borrado).
          El ref es para el botón del encabezado.

          Solo del dueño, que es de quien son estos ajustes. */}
      {esPropio && (
        <div ref={settingsRef} className="scroll-mt-20">
          <AccountSettings />
        </div>
      )}
    </div>
  );
};
