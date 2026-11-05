import { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react';

import { uploadCommunityImage } from '../../services/imageUpload';
import { cargarImagen } from '../../services/imageCanvas';
import { dimsValidas } from '../../utils/imagenes';
import { FANART_MAX_IMAGES } from '../../data/fanarts';
import type { FanartImage } from '../../types';

// ======================================================
// IMÁGENES DE UN FANART
// ======================================================
//
// A diferencia del adjunto de un hilo normal, aquí se permiten
// varias imágenes y NO se recortan: el trabajo artístico se publica
// con su proporción original. Solo se valida el tipo y el tamaño y
// se miden para reservar su sitio en la tarjeta.
//
// La subida usa la misma carpeta autorizada de la comunidad
// (`community/{uid}`), así que las reglas de Storage siguen
// aplicando: nadie sube a la carpeta de otra persona y un baneado
// no puede escribir.

const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

interface FanartImagePickerProps {
  uid: string | undefined;
  images: FanartImage[];
  onChange: (images: FanartImage[]) => void;
}

export const FanartImagePicker: FC<FanartImagePickerProps> = ({
  uid,
  images,
  onChange,
}) => {
  const [subiendo, setSubiendo] = useState(0);
  const [error, setError] = useState('');

  const agregar = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (!uid) {
      setError('Necesitas iniciar sesión para subir imágenes.');
      return;
    }

    const hueco = FANART_MAX_IMAGES - images.length;
    if (hueco <= 0) {
      setError(`Puedes subir como máximo ${FANART_MAX_IMAGES} imágenes.`);
      return;
    }

    setError('');
    const siguientes = [...images];
    const aSubir = files.slice(0, hueco);

    for (let i = 0; i < aSubir.length; i += 1) {
      const file = aSubir[i];
      setSubiendo(i + 1);

      if (!TIPOS.includes(file.type)) {
        setError(
          `Formato no permitido (${file.type || 'desconocido'}). Usa JPG, PNG, WebP, GIF o AVIF.`,
        );
        break;
      }
      if (file.size > MAX_BYTES) {
        setError(
          `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo son 10 MB.`,
        );
        break;
      }

      try {
        let width: number | undefined;
        let height: number | undefined;
        try {
          const img = await cargarImagen(file);
          if (dimsValidas(img.naturalWidth, img.naturalHeight)) {
            width = img.naturalWidth;
            height = img.naturalHeight;
          }
        } catch {
          // Se sube igual; solo se pierde la reserva de espacio.
        }

        const url = await uploadCommunityImage(file, uid);
        siguientes.push({
          url,
          ...(width && height ? { width, height } : {}),
        });
        onChange([...siguientes]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
        break;
      }
    }

    if (files.length > hueco) {
      setError(`Solo se añadieron ${hueco}; el máximo es ${FANART_MAX_IMAGES}.`);
    }

    setSubiendo(0);
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((imagen, indice) => (
            <div
              key={`${imagen.url}-${indice}`}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
            >
              <img
                src={imagen.url}
                alt={`Imagen ${indice + 1} del fanart`}
                loading="lazy"
                decoding="async"
                className="aspect-square h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== indice))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/90 text-zinc-300 shadow-lg transition-colors hover:border-red-500/60 hover:text-red-400"
                aria-label={`Quitar imagen ${indice + 1}`}
              >
                <X size={12} />
              </button>
              {indice === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-violet-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Portada
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <label
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          subiendo > 0
            ? 'cursor-wait border-violet-500/60 text-violet-300'
            : images.length >= FANART_MAX_IMAGES
              ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
              : 'border-zinc-700 text-zinc-500 hover:border-violet-500/60 hover:text-violet-300'
        }`}
      >
        {subiendo > 0 ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Subiendo imagen {subiendo}...
          </>
        ) : (
          <>
            <ImagePlus size={12} />
            {images.length === 0
              ? 'Añadir imágenes'
              : `Añadir más (${images.length}/${FANART_MAX_IMAGES})`}
          </>
        )}
        <input
          type="file"
          accept={TIPOS.join(',')}
          multiple
          className="hidden"
          disabled={subiendo > 0 || images.length >= FANART_MAX_IMAGES}
          onChange={(e) => void agregar(e)}
        />
      </label>

      <p className="text-[10px] leading-relaxed text-zinc-600">
        La primera imagen será la portada. Se publican con su proporción original,
        sin recortar. Máximo {FANART_MAX_IMAGES} imágenes de 10 MB cada una.
      </p>

      {error && (
        <p className="flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle size={10} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
