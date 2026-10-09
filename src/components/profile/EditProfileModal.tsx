import React, { useEffect, useState } from 'react';
import { X, Save, ImagePlus, Loader2, AlertCircle, Sparkles } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useProgression } from '../../context/ProgressionContext';
import { uploadCommunityImage, deleteReplacedImage } from '../../services/imageUpload';
import { validarEditable } from '../../utils/profile';
import { ESTILO_RAREZA } from '../gamification/MedalCard';
import { CropEditor } from '../common/CropEditor';
import type { ImageCropSettings } from '../../services/imageCrop';
import type { PerfilEditable } from '../../types/profile';

/**
 * Los avatares de siempre.
 *
 * Se quedan aquí, y no en el perfil, porque los usa el editor y
 * no el perfil: si mañana se cambian o se añaden, se cambia un
 * sitio y no dos.
 */
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
];

// ======================================================
// EDITAR PERFIL
// ======================================================
//
// Un modal, y no una sección dentro del perfil. La razón es que la
// edición son cuatro campos y el perfil ya tiene la cabecera, las
// estadísticas, la actividad y las dos listas: añadir un formulario
// más al final lo dejaría enterrado, y quien viene a cambiar su
// bio tendría que bajar hasta el final de una página larga.
//
// Los mismos campos de antes, ni uno más. Lo que se puede tocar
// está en `PerfilEditable`, y lo que no (rol, XP, medallas,
// contadores) no aparece ni deshabilitado: no se enseña lo que no
// se puede hacer.
//
// ── El avatar tiene tres caminos, como antes ─────────────
//
//   1. Los seis avatares de siempre, de un clic.
//   2. Subir una imagen a Firebase Storage, que ya es el sistema
//      del proyecto (`uploadCommunityImage`).
//   3. Pegar la URL de una imagen que ya esté subida a otro sitio.
//
// Los tres existían antes y los tres se quedan: quitar el primero
// porque se=subir una foto es mejor sería quitar una función
// entera por gusto, y quitar el tercero dejaría sin salida a
// quien ya tiene su avatar en otro sitio. Lo que sí se cierra es
// el agujero del segundo punto: la URL pegada se valida que sea
// http(s) (ver `validarEditable`), porque un `javascript:` en un
// `src` se ejecuta en algunos navegadores.

export const EditProfileModal: React.FC<{
  onCerrar: () => void;
  /** Avatar por defecto, para el `src` vacío. */
  avatarPorDefecto: string;
}> = ({ onCerrar, avatarPorDefecto }) => {
  const { currentUser, updateProfileData } = useAuth();
  const { desbloqueadas, equipar } = useProgression();

  const [datos, setDatos] = useState<PerfilEditable>({
    displayName: currentUser?.displayName || '',
    bio: currentUser?.bio || '',
    avatarUrl: currentUser?.avatarUrl || '',
    avatarCrop: currentUser?.avatarCrop ?? null,
    favoriteAnime: currentUser?.favoriteAnime || '',
    equippedTitle: currentUser?.equippedTitle ?? null,
  });

  /**
   * El fichero recién elegido, todavía SIN recortar.
   *
   * While is set, the crop editor is open. It stays in state (and not
   * just in a variable) because it is what triggers the modal to
   * render: as long as there is a file, it is shown.
   *
   * It is not the URL, it is the `File` as it came out. That is what
   * `cargarImagen` needs, and it avoids having to go back and forth
   * through Storage just to crop something that has not been saved
   * yet.
   */
  const [avatarSinRecortar, setAvatarSinRecortar] = useState<File | null>(null);

  const [errores, setErrores] = useState<Partial<Record<keyof PerfilEditable, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // ── Escape para cerrar ──────────────────────────────
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !guardando && !subiendo) onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar, guardando, subiendo]);

  if (!currentUser) return null;

  const cambiar = <K extends keyof PerfilEditable>(campo: K, valor: PerfilEditable[K]) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
    // El error de un campo desaparece en cuanto se toca, no al
    // guardar: si no, el mensaje se queda ahí mientras el usuario
    // está arreglando y parece que no se va a arreglar nunca.
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  const alElegirAvatar = (file: File | undefined) => {
    if (!file) return;

    // No se sube todavía: primero se recorta. La razón de que el
    // avatar salga con la cara cortada es que antes la foto iba
    // entera a Storage y el `object-cover` de cada sitio decidía por
    // su cuenta qué parte se veía, y cada sitio lo hacía de una
    // manera.
    setAvatarSinRecortar(file);
  };

  const alSubirAvatar = async (recortada: File, ajustes: ImageCropSettings) => {
    setSubiendo(true);
    setErrorGeneral(null);

    try {
      const url = await uploadCommunityImage(recortada, currentUser.uid);

      // El avatar es una imagen de la comunidad como cualquier
      // otra: mismo servicio, misma carpeta, mismas reglas de
      // Storage.
      //
      // La URL SOLO se guarda en el estado del formulario, no en
      // Firestore: el guardado pasa cuando el usuario pulse
      // "Guardar". Así, cancelar no deja el avatar cambiado a medio
      // hacer.
      //
      // El archivo viejo no se borra aquí sino al guardar, y en
      // `alGuardar`. Si se borrara ahora y el usuario cancelara, se
      // quedaría con la URL del avatar viejo apuntando a un archivo
      // que ya no está.
      cambiar('avatarUrl', url);
      cambiar('avatarCrop', ajustes);
      setAvatarSinRecortar(null);
    } catch (e) {
      console.error('[Perfil] No se pudo subir el avatar:', e);
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      // El editor se cierra igual: si se deja abierto con el error
      // detrás, la única forma de salir es volver a elegir la foto.
      setAvatarSinRecortar(null);
    } finally {
      setSubiendo(false);
    }
  };

  const alGuardar = async () => {
    const validacion = validarEditable(datos);
    if (!validacion.ok) {
      setErrores(validacion.errores);
      return;
    }

    setGuardando(true);
    setErrorGeneral(null);

    try {
      const anterior = currentUser.avatarUrl;
      const avatarNuevo = datos.avatarUrl.trim();

      await updateProfileData({
        displayName: datos.displayName.trim(),
        bio: datos.bio.trim(),
        avatarUrl: avatarNuevo,
        // El encuadre va junto a la URL. Sin él la foto se vería
        // recortada al centro, que es lo que pasaba antes; con él se
        // puede volver a abrir el editor donde estaba.
        //
        // Se mandan los dos juntos a propósito: si se guardara la URL
        // y fallara el ajuste, o al revés, la foto y su encuadre
        // quedarían descolocados.
        avatarCrop: datos.avatarCrop ?? null,
        favoriteAnime: datos.favoriteAnime.trim(),
      });

      // El título va por su propio camino (`equipar`), que es el
      // que comprueba la regla `tituloValido()`: que la medalla esté
      // desbloqueada de verdad, no solo en el cliente.
      if ((datos.equippedTitle ?? null) !== (currentUser.equippedTitle ?? null)) {
        await equipar(datos.equippedTitle ?? null);
      }

      // Ahora que el documento nuevo ya está, el archivo viejo se
      // puede ir. Antes de este punto, cancelar el modal habría
      // dejado el perfil sin avatar.
      if (anterior && anterior !== avatarNuevo) {
        deleteReplacedImage(anterior, avatarNuevo);
      }

      setGuardado(true);
      // Se cierra solo. Dejar el modal abierto con "¡guardado!"
      // obliga a un clic extra para volver a lo que se quería ver,
      // que es el perfil.
      window.setTimeout(onCerrar, 900);
    } catch (e) {
      console.error('[Perfil] No se pudo guardar:', e);
      setErrorGeneral(
        e instanceof Error ? e.message : 'No se pudo guardar el perfil.',
      );
    } finally {
      setGuardando(false);
    }
  };

  // El editor va al final, FUERA del `div` del modal. Si estuviera
  // dentro, el clic en el fondo para cerrar este seguiría llegando al
  // de los dos modales, y cerrar el editor cerraría también el
  // formulario de golpe.
  return (
    <>
      {avatarSinRecortar && (
        <CropEditor
          file={avatarSinRecortar}
          // Cuadrado y con vista previa circular, que es como se ve
          // el avatar en casi toda la web.
          aspectRatio={1}
          forma="circular"
          maximo={512}
          titulo="Recortar tu avatar"
          initial={datos.avatarCrop ?? undefined}
          onCancelar={() => setAvatarSinRecortar(null)}
          onGuardar={(fichero, ajustes) => alSubirAvatar(fichero, ajustes)}
        />
      )}

      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={guardando || subiendo ? undefined : onCerrar}
      >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
        onClick={(e) => e.stopPropagation()}
        // `max-h-[90dvh]` con scroll en el cuerpo: en un móvil con
        // el teclado abierto, un modal sin scroll deja el botón de
        // guardar debajo del teclado y no hay forma de pulsarlo.
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        {/* ── Cabecera ─────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Editar perfil</h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Cuerpo ───────────────────────────────────────── */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* AVATAR */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={datos.avatarUrl || avatarPorDefecto}
                alt="Tu avatar"
                onError={(e) => {
                  e.currentTarget.src = avatarPorDefecto;
                }}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-zinc-800"
              />
              {subiendo && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/70">
                  <Loader2 size={18} className="animate-spin text-violet-400" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                <ImagePlus size={14} />
                Subir una imagen
                {/*
                  El input está OCULTO y no con `hidden`: un
                  `display:none` en algunos navegadores impide
                  abrir el diálogo de archivos al pulsar la etiqueta.
                */}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const elegido = e.target.files?.[0];

                    alElegirAvatar(elegido);

                    // Se vacía para poder volver a elegir el MISMO
                    // archivo: sin esto, el evento `change` no se
                    // dispara la segunda vez y parece que el botón no
                    // hace nada.
                    e.target.value = '';
                  }}
                />
              </label>

              <p className="mt-1 text-[10px] text-zinc-500">
              </p>
            </div>
          </div>

          {/* AVATARES DE SIEMPRE
              Van después de la subida y no antes, porque el de
              verdad se sube arriba. Este es el atajo para quien
              solo quiere cambiar el color de la foto. */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              O elige uno de los de siempre
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_AVATARS.map((url) => {
                const elegido = datos.avatarUrl === url;

                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => cambiar('avatarUrl', url)}
                    aria-label={`Usar este avatar${elegido ? ' (seleccionado)' : ''}`}
                    aria-pressed={elegido}
                    className={`relative h-14 w-14 overflow-hidden rounded-2xl border-2 transition-all ${
                      elegido
                        ? 'scale-105 border-violet-500 shadow-md shadow-violet-500/30'
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {elegido && (
                      <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar por URL, como alternativa */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              O pega la URL de una imagen
            </label>
            <input
              type="url"
              value={datos.avatarUrl}
              onChange={(e) => cambiar('avatarUrl', e.target.value)}
              placeholder="https://..."
              className={`w-full rounded-xl border bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                errores.avatarUrl ? 'border-red-500/50' : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
            {errores.avatarUrl && (
              <p className="mt-1 text-[10px] text-red-400">{errores.avatarUrl}</p>
            )}
          </div>

          {/* NOMBRE */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Nombre visible
            </label>
            <input
              type="text"
              value={datos.displayName}
              onChange={(e) => cambiar('displayName', e.target.value)}
              className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                errores.displayName
                  ? 'border-red-500/50'
                  : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
            {errores.displayName ? (
              <p className="mt-1 text-[10px] text-red-400">{errores.displayName}</p>
            ) : (
              <p className="mt-1 text-[10px] text-zinc-500">
                Es lo que ven los demás. Tu @{currentUser.username} no se cambia.
              </p>
            )}
          </div>

          {/* BIO */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Biografía</span>
              <span
                className={`font-mono normal-case ${
                  datos.bio.length > 280 ? 'text-amber-400' : 'text-zinc-600'
                }`}
              >
                {datos.bio.length}/300
              </span>
            </label>
            <textarea
              rows={3}
              value={datos.bio}
              onChange={(e) => cambiar('bio', e.target.value)}
              placeholder=" Manga, anime y cyberpunk. "
              className={`w-full rounded-xl border bg-zinc-950 p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                errores.bio ? 'border-red-500/50' : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
            {errores.bio && <p className="mt-1 text-[10px] text-red-400">{errores.bio}</p>}
          </div>

          {/* ANIME FAVORITO */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Anime o serie favorita
            </label>
            <input
              type="text"
              value={datos.favoriteAnime}
              onChange={(e) => cambiar('favoriteAnime', e.target.value)}
              placeholder="Kaguya-sama: Love is War"
              className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                errores.favoriteAnime
                  ? 'border-red-500/50'
                  : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
            {errores.favoriteAnime && (
              <p className="mt-1 text-[10px] text-red-400">{errores.favoriteAnime}</p>
            )}
          </div>

          {/* ── TÍTULO ─────────────────────────────────────
              Solo si hay medallas con título. Sin ninguna, no se
              pinta el bloque: una sección vacía con "no tienes
              títulos" es ruido para el 90% de las cuentas. */}
          {desbloqueadas.some((m) => m.titulo) && (
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <Sparkles size={11} className="text-amber-400" />
                Tu título
              </label>

              <div className="space-y-2">
                {/* El botón de "sin título" va primero. Ponerlo
                    al final obligaría a desplazarse para
                    deshacerse de un título, que es lo que se hace
                    más a menudo. */}
                <button
                  type="button"
                  onClick={() => cambiar('equippedTitle', null)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                    datos.equippedTitle === null
                      ? 'border-violet-500/60 bg-violet-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">✕</span>
                  Sin título
                </button>

                {desbloqueadas
                  .filter((m) => m.titulo)
                  .map((m) => {
                    const estilo = ESTILO_RAREZA[m.rareza];
                    const elegido = datos.equippedTitle === m.id;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => cambiar('equippedTitle', m.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                          elegido
                            ? `${estilo.borde} ${estilo.fondo}`
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-lg">{m.icono}</span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-xs font-bold ${
                              elegido ? 'text-white' : 'text-zinc-300'
                            }`}
                          >
                            {m.titulo ?? m.nombre}
                          </span>
                          <span className="block truncate text-[10px] text-zinc-500">
                            {m.descripcion}
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {errorGeneral && (
            <p className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-400">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              {errorGeneral}
            </p>
          )}
        </div>

        {/* ── Pie ──────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3.5">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando || subiendo}
            className="rounded-xl border border-zinc-700 px-3.5 py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={alGuardar}
            disabled={guardando || subiendo}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {guardando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : guardado ? (
              <span className="text-emerald-400">✓</span>
            ) : (
              <Save size={14} />
            )}
            {guardado ? '¡Guardado!' : guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
