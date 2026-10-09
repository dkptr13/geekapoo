import { useState } from 'react';
import type { FC } from 'react';
import { Upload, Loader2, ImageOff, Link2 } from 'lucide-react';

import { uploadImage, deleteReplacedImage, type UploadProvider } from '../../services/imageUpload';
import type { CatalogSection } from '../../services/catalogAdmin';

// ======================================================
// SELECTOR DE IMAGEN PARA LOS FORMULARIOS
// ======================================================
// El ImageUploader que se usa al EDITAR un elemento ya
// guardado necesita un id de documento: sube el archivo y
// escribe la URL en Firestore en el mismo paso.
//
// En un formulario de CREACIÓN ese documento todavía no
// existe, así que aquí solo se sube el archivo y se entrega
// la URL. El formulario la guarda en su estado y la escribe
// al crear el elemento. Por eso aquí se sube en el momento,
// sin esperar a ningún guardado.
// ======================================================

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';

interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  provider: UploadProvider;
  /** Carpeta donde se guarda en Storage, por ejemplo 'animes'. */
  collectionName: string;
  /** Se usa para nombrar el archivo antes de tener un id real. */
  placeholderId: string;
  field: string;
  hint?: string;
}

export const ImagePicker: FC<ImagePickerProps> = ({
  label,
  value,
  onChange,
  provider,
  collectionName,
  placeholderId,
  field,
  hint,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [useUrl, setUseUrl] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const anterior = value;
      const { url } = await uploadImage(file, {
        provider,
        collectionName,
        itemId: placeholderId,
        field,
      });
      onChange(url);
      // Si ya había un archivo subido antes en este formulario,
      // ese sí se queda sin usar. Se borra, salvo que el
      // proveedor sea ImgBB: de esas no se ocupa este servicio.
      //
      // Solo al subir un archivo, nunca al escribir la URL a mano:
      // teclear borra y reescribe el campo en cada pulsación y
      // acabaría borrando imágenes que sí se están usando.
      deleteReplacedImage(anterior, url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-300">{label}</span>

        <button
          type="button"
          onClick={() => setUseUrl((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {useUrl ? <Upload size={11} /> : <Link2 size={11} />}
          {useUrl ? 'Subir archivo' : 'Usar una URL'}
        </button>
      </div>

      <div className="flex gap-3">
        <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER;
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <ImageOff size={16} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {useUrl ? (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          ) : (
            <label
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-3 text-[11px] font-semibold transition-colors ${
                uploading
                  ? 'cursor-wait border-violet-500 text-violet-300'
                  : 'text-zinc-400 hover:border-violet-500 hover:text-violet-300'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Elegir imagen de tu PC
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  // Se vacía el input para poder volver a elegir el
                  // MISMO archivo otra vez: si no, el evento change
                  // no se dispara porque el valor no ha cambiado y
                  // parece que el botón no funciona.
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {hint && <p className="mt-1.5 text-[10px] text-zinc-600">{hint}</p>}
          {error && <p className="mt-1.5 text-[10px] text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
};
