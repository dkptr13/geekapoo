import { useState } from 'react';
import type { FC } from 'react';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';

import { uploadCommunityImage, esGif } from '../../services/imageUpload';
import { cargarImagen } from '../../services/imageCanvas';
import { dimsValidas, type ImageDims } from '../../utils/imagenes';
import { CropEditor } from '../common/CropEditor';

// ======================================================
// ADJUNTAR UNA IMAGEN A UN HILO O COMENTARIO
// ======================================================
// A diferencia del selector del panel de admin, aquí no
// guarda nada en Firestore: solo sube el archivo a Storage y
// entrega la URL. Quien lo usa la guarda en su estado y la
// escribe al publicar.
//
// Antes de subir, la imagen pasa por el editor de recorte:
// mover y ampliar, viendo lo que va a quedar. La caja usa la
// proporción de la propia foto, así que recortar aquí no
// obliga a ningún formato: solo encuadra.
//
// Los GIF se suben tal cual, SIN pasar por el editor: el
// recorte redibuja en un canvas y el resultado es una imagen
// fija, así que editar un GIF lo dejaría sin animación en
// silencio.
//
// Además de la URL se entregan las DIMENSIONES del archivo
// que se va a servir (tras recortar, si se recorta): quien
// publica las guarda junto a la imagen para reservar su sitio
// antes de descargarla (ver `StableImage`). El archivo no se
// toca: sigue siendo el original con toda su calidad.
//
// Una sola imagen por publicación, no un álbum: es lo que
// encaja con un foro y evita que alguien llene su comentario
// con veinte imágenes.
// ======================================================

const MAX_BYTES = 10 * 1024 * 1024;

interface AttachImageProps {
  uid: string | undefined;
  value: string;
  onChange: (url: string) => void;
  /** Recibe las dimensiones medidas, o null al quitar la imagen. */
  onDims?: (dims: ImageDims | null) => void;
  /** Solo para el hilo: la imagen se muestra grande. */
  size?: 'sm' | 'md';
}

export const AttachImage: FC<AttachImageProps> = ({
  uid,
  value,
  onChange,
  onDims,
  size = 'sm',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  // La foto elegida, esperando a que se recorte. Mientras hay una,
  // se enseña el editor en vez del botón de elegir.
  const [pendiente, setPendiente] = useState<{ file: File; ratio: number } | null>(null);

  const subir = async (file: File): Promise<boolean> => {
    setUploading(true);
    try {
      const url = await uploadCommunityImage(file, uid ?? '');
      onChange(url);
      return true;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'No se pudo subir la imagen.',
      );
      return false;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Mide un archivo ya elegido y avisa con sus dimensiones.
   *
   * Se mide lo que SE VA A SERVIR: el original en un GIF, el
   * recorte en una foto. Si no se puede abrir o las medidas no
   * cuadran, se avisa con null y la imagen se sirve igual (sin
   * reserva de sitio, como antes).
   */
  const medirYAvisar = async (file: File): Promise<void> => {
    try {
      const img = await cargarImagen(file);
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      onDims?.(dimsValidas(width, height) ? { width, height } : null);
    } catch {
      onDims?.(null);
    }
  };

  const handleFile = async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Eso no es una imagen. Usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo son 10 MB.`,
      );
      return;
    }

    // El GIF no se puede recortar sin matarlo: se sube directo.
    if (esGif(file)) {
      await medirYAvisar(file);
      await subir(file);
      return;
    }

    // La proporción de la caja es la de la propia foto. Así el
    // editor deja mover y ampliar sin imponer ningún formato: lo
    // que se ve en la vista previa es lo que se publica.
    try {
      const img = await cargarImagen(file);
      const ratio = img.naturalWidth / img.naturalHeight;

      if (!Number.isFinite(ratio) || ratio <= 0) {
        setError('Esa imagen no se puede abrir.');
        return;
      }

      setPendiente({ file, ratio });
    } catch {
      setError('Esa imagen no se puede abrir.');
    }
  };

  // Lo que sale del editor ya va recortado: se sube tal cual. Solo
  // se cierra si la subida va bien; si falla, el editor se queda
  // abierto y el aviso sale debajo del botón, para reintentar sin
  // volver a elegir el archivo.
  const guardarRecorte = async (recortada: File) => {
    // Se mide el RECORTE (lo que se va a servir), no el original.
    await medirYAvisar(recortada);
    const ok = await subir(recortada);
    if (ok) setPendiente(null);
    else throw new Error('No se pudo subir la imagen recortada.');
  };

  if (pendiente) {
    return (
      <CropEditor
        file={pendiente.file}
        aspectRatio={pendiente.ratio}
        maximo={1600}
        titulo="Ajustar imagen"
        onCancelar={() => setPendiente(null)}
        onGuardar={guardarRecorte}
      />
    );
  }

  if (value) {
    return (
      <div className="relative inline-block">
        {/* OJO: esto va entre llaves, y no es opcional.

            Un comentario de JS suelto dentro de JSX no es un
            comentario: el navegador lo pinta como texto. Eso es
            exactamente lo que pasaba aquí, y lo que se veía al
            adjuntar una imagen: el párrafo entero escrito arriba,
            mostrado encima de la foto.

            `object-contain` y NO `object-cover` en el modo grande: sin
            un contenedor con proporción, la caja de la imagen es la
            propia imagen y `cover` no hace nada. Con `contain` y sin
            ancho fijo, lo que se ve es la imagen ENTERA y con su
            proporción, limitada por `max-h` para que no se coma el
            hilo entero. */}
        <img
          src={value}
          alt="Imagen adjunta"
          className={`rounded-xl border border-zinc-800 ${
            size === 'md' ? 'block h-auto max-h-72 max-w-full object-contain' : 'h-16 w-24 object-cover'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            onChange('');
            onDims?.(null);
          }}
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
