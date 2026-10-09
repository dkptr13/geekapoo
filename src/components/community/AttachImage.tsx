import { useState } from 'react';
import type { FC } from 'react';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';

import { uploadCommunityImage } from '../../services/imageUpload';

// ======================================================
// ADJUNTAR UNA IMAGEN A UN HILO O COMENTARIO
// ======================================================
// A diferencia del selector del panel de admin, aquí no
// guarda nada en Firestore: solo sube el archivo a Storage y
// entrega la URL. Quien lo usa la guarda en su estado y la
// escribe al publicar.
//
// Una sola imagen por publicación, no un álbum: es lo que
// encaja con un foro y evita que alguien llene su comentario
// con veinte imágenes.
// ======================================================

const MAX_BYTES = 5 * 1024 * 1024;

interface AttachImageProps {
  uid: string | undefined;
  value: string;
  onChange: (url: string) => void;
  /** Solo para el hilo: la imagen se muestra grande. */
  size?: 'sm' | 'md';
}

export const AttachImage: FC<AttachImageProps> = ({
  uid,
  value,
  onChange,
  size = 'sm',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Eso no es una imagen. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo son 5 MB.`,
      );
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCommunityImage(file, uid ?? '');
      onChange(url);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'No se pudo subir la imagen.',
      );
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative inline-block">
        /* `object-contain` y NO `object-cover` en el modo grande: sin un
           contenedor con proporción, la caja de la imagen es la propia
           imagen y `cover` no hace nada. Con `contain` y sin ancho
           fijo, lo que se ve es la imagen ENTERA y con su proporción,
           limitada por `max-h` para que no se coma el hilo entero. */
        <img
          src={value}
          alt="Imagen adjunta"
          className={`rounded-xl border border-zinc-800 ${
            size === 'md' ? 'block h-auto max-h-72 max-w-full object-contain' : 'h-16 w-24 object-cover'
          }`}
        />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 shadow-lg transition-colors hover:border-red-500/60 hover:text-red-400"
          aria-label="Quitar imagen"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          uploading
            ? 'cursor-wait border-violet-500/60 text-violet-300'
            : 'border-zinc-700 text-zinc-500 hover:border-violet-500/60 hover:text-violet-300'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Subiendo imagen...
          </>
        ) : (
          <>
            <ImagePlus size={12} />
            Añadir imagen
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
            // Se vacía para poder volver a elegir el mismo archivo.
            e.target.value = '';
          }}
        />
      </label>

      {error && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle size={10} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
