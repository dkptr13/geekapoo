import React, { useRef, useState } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  ImagePlus,
  Users,
  Globe,
  Lock,
  Clock3,
  Upload,
} from 'lucide-react';

import { CLUB_CATEGORIES } from '../../types';
import type { ClubCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useClubs } from '../../context/ClubsContext';
import { CLUB_LIMITS, slugify, validarSlug, slugDisponible } from '../../services/clubs';
import { uploadClubImage } from '../../services/clubImages';

// ======================================================
// MODAL PARA CREAR UN CLUB
// ======================================================
// El formulario recoge nombre, identificador, descripción,
// categoría, portada, icono, normas y tipo de acceso.
//
// Las imágenes NO se suben a Storage al elegirlas: se
// guardan en memoria con su vista previa y se suben SOLO
// cuando el club ya está creado. Es a propósito, y tiene una
// razón concreta: la regla de Storage comprueba que el
// usuario sea administrador del club cuya carpeta está
// usando, y mientras el club no existe esa comprobación no
// puede pasar. Subirlas antes obligaría a una carpeta
// temporal que luego habría que vaciar.
//
// El orden es, por tanto:
//
//   1. Se crea el club (sin imágenes).
//   2. Se suben la portada y el icono a `clubs/{slug}/...`.
//   3. Se actualiza el club con las dos URL.
//
// Si la subida falla, el club se queda sin imagen y el
// usuario puede ponerla luego desde la configuración del
// club: un fallo en una foto no invalida el club.
//
// La validación va en dos tiempos:
//
//   1. Al escribir: formato del slug, largos, etc. Es para
//      avisar pronto, no para proteger nada.
//   2. Antes de enviar: si el slug está ocupado. Esto sí es
//      definitivo, porque lo comprueba contra Firestore.
// ======================================================

interface Props {
  onClose: () => void;
}

/** Lo elegido en el selector de archivos, con su vista previa. */
interface ArchivoElegido {
  file: File;
  preview: string;
}

export const ClubCreateModal: React.FC<Props> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { crear, actualizar } = useClubs();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ClubCategory>('anime-manga');
  const [rules, setRules] = useState('');
  const [accessType, setAccessType] = useState<'public' | 'private' | 'request'>('public');

  const [portada, setPortada] = useState<ArchivoElegido | null>(null);
  const [icono, setIcono] = useState<ArchivoElegido | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Una vez creado el club, los reintentos ya no pueden volver a
  // crearlo (el identificador está ocupado). Si las imágenes fallan,
  // el modal se queda abierto con el aviso y este estado cambia el
  // botón de "Crear" por "Cerrar".
  const [creado, setCreado] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // El slug se propone solo desde el nombre MIENTRAS el
  // usuario no lo haya tocado a mano. Si lo ha corregido, ya
  // no se le pisa: escribirlo a mano es justo lo que quiere.
  const manejarNombre = (valor: string) => {
    setName(valor.slice(0, CLUB_LIMITS.name.max));
    if (!slugEditado) setSlug(slugify(valor));
  };

  const elegir = (
    e: React.ChangeEvent<HTMLInputElement>,
    setArchivo: (a: ArchivoElegido) => void,
  ) => {
    const file = e.target.files?.[0];
    // Se vacía el valor para que elegir el MISMO archivo dos
    // veces seguidas vuelva a disparar el onChange.
    e.target.value = '';
    if (!file) return;

    setError(null);
    setArchivo({ file, preview: URL.createObjectURL(file) });
  };

  const slugViable = !!slug && validarSlug(slug).ok;
  const slugUnico = useAsyncSlug(slugViable ? slug : '');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando || creado) return;

    setEnviando(true);
    setError(null);

    try {
      // Última comprobación de duplicado justo antes de
      // escribir: entre que el usuario abrió el modal y le da
      // a crear, otra persona puede haberse quedado con ese
      // mismo identificador.
      let ocupado: boolean;
      try {
        ocupado = !(await slugDisponible(slug));
      } catch (e: unknown) {
        const code = (e as { code?: string } | null)?.code ?? '';
        setError(
          code === 'permission-denied'
            ? 'No se pudo comprobar el identificador (sin permiso de lectura en "clubs"). Si las reglas aún no están desplegadas, despliega firestore.rules y reintenta.'
            : (e instanceof Error ? e.message : 'No se pudo comprobar el identificador.'),
        );
        setEnviando(false);
        return;
      }
      if (ocupado) {
        setError('Ese identificador ya está en uso. Elige otro.');
        setEnviando(false);
        return;
      }

      // 1. El club, sin imágenes todavía.
      const creado = await crear({
        name,
        slug,
        description,
        category,
        rules: rules || undefined,
        accessType,
      });

      if (!creado.ok) {
        setError(creado.error ?? 'No se pudo crear el club.');
        setEnviando(false);
        return;
      }

      // 2. Las imágenes, ahora que el club ya existe y las
      //    reglas de Storage permiten escribir en su carpeta.
      const urls: { coverUrl?: string; iconUrl?: string } = {};
      let falloImagen: string | null = null;

      if (portada) {
        try {
          urls.coverUrl = await uploadClubImage(portada.file, slug, 'portada');
        } catch (err) {
          falloImagen = err instanceof Error ? err.message : 'No se pudo subir la portada.';
        }
      }
      if (icono) {
        try {
          urls.iconUrl = await uploadClubImage(icono.file, slug, 'icono');
        } catch (err) {
          falloImagen = err instanceof Error ? err.message : 'No se pudo subir el icono.';
        }
      }

      // 3. Se guardan las URL en la ficha del club.
      if (Object.keys(urls).length > 0) {
        const guardado = await actualizar(slug, urls);
        if (!guardado.ok) {
          falloImagen =
            guardado.error ?? 'No se pudieron guardar las imágenes en el club.';
        }
      }

      // El club existe aunque las imágenes no hayan subido. En ese
      // caso NO se cierra el modal: si se cerrara, el aviso
      // desaparecería con él y el usuario creería que las imágenes
      // se guardaron. Desde la configuración del club puede
      // ponerlas después.
      setCreado(true);

      if (falloImagen) {
        setError(
          `El club se creó, pero ${falloImagen} Puedes poner las imágenes desde la configuración del club.`,
        );
        return;
      }

      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el club.');
    } finally {
      setEnviando(false);
    }
  };

  const largo = {
    name: `${name.length}/${CLUB_LIMITS.name.max}`,
    slug: `${slug.length}/${CLUB_LIMITS.slug.max}`,
    description: `${description.length}/${CLUB_LIMITS.description.max}`,
    rules: `${rules.length}/${CLUB_LIMITS.rules.max}`,
  };

  const deshabilitado =
    enviando ||
    name.trim().length < CLUB_LIMITS.name.min ||
    !slugViable ||
    slugUnico === 'ocupado' ||
    description.trim().length < CLUB_LIMITS.description.min;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-600/20 text-violet-400">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Crear un club</h2>
              <p className="text-[11px] text-zinc-500">
                Serás su propietario y primer administrador.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* ── Imágenes ─────────────────────────────── */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Portada */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                  Imagen de portada
                </label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-zinc-950 transition-colors hover:border-violet-500"
                >
                  {portada ? (
                    <img src={portada.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-[10px] text-zinc-500">
                      <ImagePlus size={18} />
                      <span>Banner horizontal</span>
                    </span>
                  )}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => elegir(e, setPortada)}
                />
              </div>

              {/* Icono */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                  Icono del club
                </label>
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-zinc-950 transition-colors hover:border-violet-500"
                >
                  {icono ? (
                    <img src={icono.preview} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-[10px] text-zinc-500">
                      <Upload size={18} />
                      <span>Cuadrado, tipo avatar</span>
                    </span>
                  )}
                </button>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => elegir(e, setIcono)}
                />
              </div>
            </div>

            {/* ── Nombre ───────────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="club-nombre" className="text-[11px] font-bold text-zinc-300">
                  Nombre del club
                </label>
                <span className="text-[10px] text-zinc-600">{largo.name}</span>
              </div>
              <input
                id="club-nombre"
                type="text"
                value={name}
                onChange={(e) => manejarNombre(e.target.value)}
                placeholder="Club de Frieren"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* ── Identificador (slug) ─────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="club-slug" className="text-[11px] font-bold text-zinc-300">
                  Identificador para su URL interna
                </label>
                <span className="text-[10px] text-zinc-600">{largo.slug}</span>
              </div>
              <div
                className={`flex items-center rounded-xl border bg-zinc-950 transition-colors ${
                  slugUnico === 'ocupado'
                    ? 'border-red-500/60'
                    : slugUnico === 'libre'
                      ? 'border-emerald-500/40'
                      : 'border-zinc-800 focus-within:border-violet-500'
                }`}
              >
                <span className="pl-3 font-mono text-[11px] text-zinc-600">geekapoo.es/chats/</span>
                <input
                  id="club-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugEditado(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="club-de-frieren"
                  spellCheck={false}
                  className="w-full flex-1 bg-transparent px-1 py-2 font-mono text-xs text-violet-300 placeholder-zinc-700 focus:outline-none"
                />
              </div>
              <p
                className={`mt-1 text-[10px] ${
                  slugUnico === 'ocupado'
                    ? 'text-red-400'
                    : slugUnico === 'libre'
                      ? 'text-emerald-400'
                      : 'text-zinc-600'
                }`}
              >
                {slugUnico === 'ocupado'
                  ? 'Ese identificador ya está en uso.'
                  : slugUnico === 'libre'
                    ? 'Identificador disponible.'
                    : 'Solo minúsculas, números y guiones.'}
              </p>
            </div>

            {/* ── Descripción ──────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="club-desc" className="text-[11px] font-bold text-zinc-300">
                  Descripción
                </label>
                <span className="text-[10px] text-zinc-600">{largo.description}</span>
              </div>
              <textarea
                id="club-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, CLUB_LIMITS.description.max))}
                placeholder="¿De qué trata este club? ¿A quién va dirigido?"
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* ── Categoría ────────────────────────────── */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">Categoría</label>
              <div className="flex flex-wrap gap-1.5">
                {CLUB_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                      category === c.id
                        ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span aria-hidden="true">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Normas ───────────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="club-normas" className="text-[11px] font-bold text-zinc-300">
                  Normas de convivencia <span className="font-normal text-zinc-600">(opcional)</span>
                </label>
                <span className="text-[10px] text-zinc-600">{largo.rules}</span>
              </div>
              <textarea
                id="club-normas"
                value={rules}
                onChange={(e) => setRules(e.target.value.slice(0, CLUB_LIMITS.rules.max))}
                placeholder="1. Respeta a los demás miembros.&#10;2. Nada de spoilers sin avisar."
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* ── Tipo de acceso ───────────────────────── */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-zinc-300">
                Tipo de acceso
              </label>
              <div className="space-y-1.5">
                <OpcionAcceso
                  activo={accessType === 'public'}
                  onClick={() => setAccessType('public')}
                  icono={<Globe size={15} />}
                  titulo="Público"
                  texto="Cualquiera puede unirse directamente desde la galería."
                />
                <OpcionAcceso
                  activo={accessType === 'private'}
                  onClick={() => setAccessType('private')}
                  icono={<Lock size={15} />}
                  titulo="Privado"
                  texto="Solo los miembros aprobados acceden al contenido. No aparece en Descubrir."
                />
                <OpcionAcceso
                  activo={accessType === 'request'}
                  onClick={() => setAccessType('request')}
                  icono={<Clock3 size={15} />}
                  titulo="Por solicitud"
                  texto="El usuario pide entrar y los moderadores aceptan o rechazan."
                />
              </div>
            </div>
          </div>

          {/* ── Pie con error y botón ─────────────────── */}
          <div className="flex-shrink-0 border-t border-zinc-800 p-4">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-[11px] text-red-300">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              {!creado && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
              )}
              {creado ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-500"
                >
                  Cerrar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={deshabilitado}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando && <Loader2 size={14} className="animate-spin" />}
                  <span>{enviando ? 'Creando...' : 'Crear club'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────
// OPCIÓN DE TIPO DE ACCESO
// ────────────────────────────────────────────────────────

const OpcionAcceso: React.FC<{
  activo: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  titulo: string;
  texto: string;
}> = ({ activo, onClick, icono, titulo, texto }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
      activo
        ? 'border-violet-500 bg-violet-600/10'
        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
    }`}
  >
    <span
      className={`mt-0.5 flex-shrink-0 ${activo ? 'text-violet-400' : 'text-zinc-500'}`}
    >
      {icono}
    </span>
    <span className="min-w-0">
      <span className={`block text-[11px] font-bold ${activo ? 'text-white' : 'text-zinc-300'}`}>
        {titulo}
      </span>
      <span className="block text-[10px] leading-relaxed text-zinc-500">{texto}</span>
    </span>
  </button>
);

// ────────────────────────────────────────────────────────
// COMPROBACIÓN DE SLUG CON ESPERA
// ────────────────────────────────────────────────────────
//
// Al escribir el identificador se consulta si está libre,
// pero con retardo: si se consultara en cada tecla, media
// docena de letras encadenadas dispararían seis lecturas.
// El resultado se descarta si el usuario ya ha escrito otra
// cosa mientras llegaba.
function useAsyncSlug(slug: string): 'vacio' | 'comprobando' | 'libre' | 'ocupado' {
  const [estado, setEstado] = React.useState<'vacio' | 'comprobando' | 'libre' | 'ocupado'>('vacio');

  React.useEffect(() => {
    if (!slug || !validarSlug(slug).ok) {
      setEstado('vacio');
      return;
    }

    setEstado('comprobando');
    let vivo = true;

    const t = setTimeout(() => {
      void slugDisponible(slug)
        .then((libre) => {
          if (vivo) setEstado(libre ? 'libre' : 'ocupado');
        })
        .catch(() => {
          // Sin permiso de lectura (reglas sin desplegar) no se
          // puede saber: se deja de comprobar en lugar de marcar
          // "ocupado" por error.
          if (vivo) setEstado('vacio');
        });
    }, 400);

    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [slug]);

  return estado;
}
