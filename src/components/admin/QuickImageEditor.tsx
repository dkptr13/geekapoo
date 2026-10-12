import { useEffect, useState } from 'react';
import type { DragEvent, FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, HardDrive, Image as ImageIcon, Link2, Loader2, Trash2, Upload, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { setField, type CatalogSection } from '../../services/catalogAdmin';
import { uploadImage, deleteReplacedImage, type UploadProvider } from '../../services/imageUpload';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';

export interface QuickImageEditorProps {
  section: CatalogSection;
  itemId: string;
  field: string;
  label: string;
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  badgeClassName?: string;
  empty?: ReactNode;
  /**
   * Estilos de la propia <img>, para el encuadre del recorte.
   * El contenedor no se toca, así que el botón de cámara sigue
   * cayendo en el mismo sitio.
   */
  imgStyle?: React.CSSProperties;
}

export const QuickImageEditor: FC<QuickImageEditorProps> = ({
  section,
  itemId,
  field,
  label,
  src,
  alt,
  className,
  containerClassName = '',
  badgeClassName = 'top-2 right-2',
  empty,
  imgStyle,
}) => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);

  // Quién ve el botón de cámara. Los moderadores gestionan el
  // mismo catálogo que los admins, y las reglas de Storage les
  // dejan escribir en "content/", así que a ellos también se les
  // muestra: si no, verían imágenes que luego no pueden tocar.
  const canManage =
    currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const image: ReactNode = src ? (
    <img src={src} alt={alt} className={className} style={imgStyle} />
  ) : (
    (empty ?? null)
  );

  // El editor de imágenes del catálogo es contenido, no un
  // privilegio de admin: los moderadores gestionan el mismo
  // catálogo y las reglas de Storage les dejan escribir en
  // "content/".
  if (!canManage) return <>{image}</>;

  return (
    <>
      <div className={`group/qi relative ${containerClassName}`}>
        {image}

        <button
          type="button"
          aria-label={`Cambiar ${label.toLowerCase()}`}
          title={`Cambiar ${label.toLowerCase()}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className={`absolute z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-zinc-950/80 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-violet-600 focus-visible:opacity-100 group-hover/qi:opacity-100 ${badgeClassName}`}
        >
          <Camera size={13} />
        </button>
      </div>

      {open && (
        <ImageChangeDialog
          label={label}
          currentUrl={src}
          section={section}
          itemId={itemId}
          field={field}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

interface ImageChangeDialogProps {
  label: string;
  currentUrl: string;
  section: CatalogSection;
  itemId: string;
  field: string;
  onClose: () => void;
}

const ImageChangeDialog: FC<ImageChangeDialogProps> = ({
  label,
  currentUrl,
  section,
  itemId,
  field,
  onClose,
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [provider, setProvider] = useState<UploadProvider>('storage');
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const save = async (value: string) => {
    setBusy('saving');
    setError('');
    setSaved(false);

    // La anterior se borra solo cuando la nueva está guardada.
    const anterior = currentUrl;

    try {
      await setField(section, itemId, field, value);
      deleteReplacedImage(anterior, value);
      setSaved(true);
      window.setTimeout(onClose, 700);
    } catch (e: unknown) {
      setError(messageOf(e, 'No se pudo guardar el cambio.'));
      setBusy('idle');
    }
  };

  const pickFile = async (file: File) => {
    setBusy('uploading');
    setError('');
    setSaved(false);
    try {
      const { url: uploaded } = await uploadImage(file, {
        provider,
        collectionName: section,
        itemId,
        field,
      });
      setUrl(uploaded);
      await save(uploaded);
    } catch (e: unknown) {
      setError(messageOf(e, 'No se pudo subir la imagen.'));
      setBusy('idle');
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void pickFile(file);
  };

  const idle = busy === 'idle';
  const dirty = url.trim() !== currentUrl;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">{label}</h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Elige el archivo de tu PC y se cambia al momento en toda la web.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-32 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          {url ? (
            <img
              src={url}
              alt={label}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER;
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600">
              Sin imagen
            </div>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (idle) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-600'
          } ${idle ? '' : 'pointer-events-none opacity-50'}`}
        >
          <label className="flex cursor-pointer flex-col items-center gap-2">
            {busy === 'uploading' ? (
              <Loader2 size={22} className="animate-spin text-violet-400" />
            ) : (
              <Upload size={22} className="text-zinc-500" />
            )}

            <span className="text-xs font-semibold text-zinc-200">
              {busy === 'uploading'
                ? 'Subiendo...'
                : 'Elegir imagen de tu PC'}
            </span>

            <span className="text-[10px] text-zinc-600">
              o arrástrala aquí · JPG, PNG, WebP, GIF o AVIF · máx. 10 MB
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!idle}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void pickFile(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <HardDrive size={12} />
            Se guarda en
          </span>

          <button
            type="button"
            onClick={() => setProvider('storage')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              provider === 'storage'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Firebase Storage
          </button>

          <button
            type="button"
            onClick={() => setProvider('imgbb')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              provider === 'imgbb'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            ImgBB
          </button>

          <button
            type="button"
            disabled={!idle}
            onClick={() => {
              setUrl('');
              void save('');
            }}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40"
          >
            <Trash2 size={12} />
            Quitar imagen
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'file' ? 'url' : 'file'))}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {mode === 'file' ? <Link2 size={12} /> : <ImageIcon size={12} />}
            {mode === 'file' ? 'Usar una URL en vez de un archivo' : 'Volver a subir un archivo'}
          </button>

          {mode === 'url' && (
            <div className="mt-2.5 space-y-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />

              <button
                type="button"
                disabled={!idle || !dirty}
                onClick={() => void save(url.trim())}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === 'saving' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                {busy === 'saving' ? 'Guardando...' : 'Guardar URL'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-start gap-1.5 text-[11px] text-red-400">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </p>
        )}

        {saved && (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <Check size={12} />
            Guardado
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
};

function messageOf(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    if (e.message.includes('permission-denied')) {
      return 'No tienes permiso. Comprueba que tu cuenta es admin y que las reglas están desplegadas.';
    }
    return e.message;
  }
  return fallback;
}