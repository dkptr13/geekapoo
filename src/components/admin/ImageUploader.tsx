import { useState } from 'react';
import type { DragEvent, FC } from 'react';
import { Link2, Loader2, Check, X, Upload, Trash2 } from 'lucide-react';

import { uploadImage, deleteReplacedImage, type UploadProvider } from '../../services/imageUpload';
import { setField, type CatalogSection } from '../../services/catalogAdmin';
import { CropEditor } from '../common/CropEditor';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';

interface ImageUploaderProps {
  label: string;
  currentUrl: string;
  section: CatalogSection;
  itemId: string;
  field: string;
  provider: UploadProvider;
  /**
   * La proporción que tiene que tener ESTA imagen.
   *
   * No es un adorno: cada sitio donde se ve la imagen tiene una forma
   * distinta. Una portada es vertical (3:4), un banner es panorámico
   * (16:9), una miniatura casi cuadrada. Si la imagen se sube sin
   * recortar, cada uno de esos sitios recorta por su cuenta y siempre
   * por el centro, que es como una cara acaba cortada.
   *
   * Con el editor, la imagen se guarda YA con esa proporción y los
   * sitios dedisplay no tienen que recortar nada.
   *
   * Si no se pasa, se usa 1 (cuadrada), que es lo que se ha estado
   * haciendo siempre y no rompe lo que ya está subido.
   */
  aspectRatio?: number;
  /** Vista previa circular, para avatares y logos. */
  circular?: boolean;
  /** Lado mayor del resultado, en píxeles. */
  maximo?: number;
  /** Se avisa con la URL ya guardada, para refrescar la vista. */
  onSaved?: (url: string) => void;
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  label,
  currentUrl,
  section,
  itemId,
  field,
  provider,
  aspectRatio = 1,
  circular = false,
  maximo,
  onSaved,
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [dragging, setDragging] = useState(false);
  // La imagen recién elegida, a la espera de que el usuario la recorte.
  const [elegida, setElegida] = useState<File | null>(null);

  /**
   * Sube la imagen YA recortada.
   *
   * El recorte ocurre antes de subir, no después. Al revés sería más
   * fácil de escribir (subir, y luego recortar en el sitio), pero
   * dejaría la versión sin recortar en Storage para siempre y
   * obligaría a que cada sitio de la web volviera a recortar por su
   * cuenta: que es exactamente el problema que se está arreglando.
   */
  const subirRecortada = async (recortada: File) => {
    setUploading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const { url: newUrl } = await uploadImage(recortada, {
        provider,
        collectionName: section,
        itemId,
        field,
      });

      setUrl(newUrl);
      await persist(newUrl);
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(messageOf(e, 'Error desconocido'));
    } finally {
      setUploading(false);
      setElegida(null);
    }
  };

  // Si el documento cambia desde fuera (otro admin), el campo
  // refleja el valor guardado y no lo que quedó a medias aquí.
  const [lastExternalUrl, setLastExternalUrl] = useState(currentUrl);
  if (currentUrl !== lastExternalUrl) {
    setLastExternalUrl(currentUrl);
    setUrl(currentUrl);
  }

  const persist = async (urlToSave: string) => {
    setSaving(true);
    setStatus('idle');
    setErrorMsg('');

    // La anterior se borra DESPUÉS de guardar la nueva. Si se
    // borrara antes y el guardado fallara, el documento se
    // quedaría con la URL nueva y sin archivo detrás.
    const anterior = currentUrl;

    try {
      await setField(section, itemId, field, urlToSave);
      deleteReplacedImage(anterior, urlToSave);
      setStatus('ok');
      onSaved?.(urlToSave);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(messageOf(e, 'Error al guardar en Firestore'));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    // La imagen elegida, SIN recortar todavía. El editor aparece
    // encima y es él quien decide si se sube esta u otra.
    setElegida(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const isBusy = uploading || saving;
  const providerLabel = provider === 'storage' ? 'Firebase Storage' : 'ImgBB';

  return (
    <>
      {/* El editor va fuera del `div` del uploader, por el mismo
          motivo que en el perfil: si estuviera dentro, al cerrarlo se
          cerraría también el formulario del panel. */}
      {elegida && (
        <CropEditor
          file={elegida}
          aspectRatio={aspectRatio}
          forma={circular ? 'circular' : 'rectangular'}
          maximo={maximo ?? 1200}
          titulo={`Recortar: ${label}`}
          onCancelar={() => setElegida(null)}
          onGuardar={(fichero) => subirRecortada(fichero)}
        />
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </p>

        {currentUrl && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setUrl('');
              void persist('');
            }}
            className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 size={11} />
            Quitar imagen
          </button>
        )}
      </div>

      {/* La vista previa usa la proporción REAL de la imagen, no una
          franja fija de 112 px para todo. Con una franja fija, un
          póster vertical y un banner panorámico se veían igual aquí,
          y el admin recortaba a ciegas: lo que preparaba no se
          parecía a lo que salía después en la web. */}
      <div
        className={`w-full overflow-hidden border border-zinc-700 bg-zinc-800 ${
          circular ? 'rounded-full' : 'rounded-lg'
        }`}
        style={{ aspectRatio: String(aspectRatio) }}
      >
        <img
          src={url || PLACEHOLDER}
          alt={label}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragging
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-zinc-700 hover:border-zinc-600'
        } ${isBusy ? 'pointer-events-none opacity-50' : ''}`}
      >
        <label className="flex cursor-pointer flex-col items-center gap-1.5">
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-violet-400" />
          ) : (
            <Upload size={18} className="text-zinc-500" />
          )}

          <span className="text-[11px] font-semibold text-zinc-200">
            {uploading ? 'Subiendo...' : 'Elegir imagen de tu PC'}
          </span>

          <span className="text-[10px] text-zinc-600">
            o arrástrala aquí · máx. 10 MB
          </span>

          <span className="text-[10px] text-violet-400/80">
            Se guardará en {providerLabel}
          </span>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              // Se vacía para poder volver a elegir el MISMO
              // archivo dos veces seguidas: si no, el evento
              // change no se dispara y parece que no hace nada.
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setUseUrl((v) => !v)}
        className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
      >
        {useUrl ? <Upload size={11} /> : <Link2 size={11} />}
        {useUrl ? 'Subir un archivo en vez de una URL' : 'Usar una URL'}
      </button>

      {useUrl && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL de la imagen..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
          />

          <button
            type="button"
            onClick={() => persist(url)}
            disabled={isBusy || !url}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {saving ? 'Guardando...' : 'Guardar URL'}
          </button>
        </div>
      )}

      {status === 'ok' && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
          <Check size={12} />
          Imagen guardada en Firestore
        </p>
      )}

      {status === 'error' && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-red-400">
          <X size={12} className="mt-0.5 flex-shrink-0" />
          <span className="break-words">{errorMsg}</span>
        </p>
      )}
      </div>
    </>
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