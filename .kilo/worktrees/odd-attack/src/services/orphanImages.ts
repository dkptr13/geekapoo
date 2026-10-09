import { collection, getDocs } from 'firebase/firestore';

import { db } from '../lib/firebase';
import {
  deleteStoredPath,
  listStoredImages,
  storedImageSize,
  storagePathFromUrl,
} from './imageUpload';

// ======================================================
// LIMPIEZA DE IMÁGENES HUÉRFANAS
// ======================================================
// Cada vez que se cambia una portada, la anterior se queda
// huérfana en Storage: el nombre lleva fecha, así que no se
// pisan entre sí y nadie vuelve a mirar esos archivos. Esta
// pasada encuentra los que ya no referencie ningún documento y
// los borra.
//
// Cómo se decide qué está referenciado: en vez de mirar campos
// conocidos ("coverUrl", "imageUrl"...), que es una lista
// frágil que se queda corta en cuanto alguien añade un campo
// nuevo, se recorre TODO valor de tipo texto de los documentos
// y se guarda el que parezca una URL de nuestro Storage. Así un
// campo nuevo no puede hacer que se borre una imagen en uso.
//
// Solo se mira dentro de "content/". Las carpetas de avatars y
// community tienen su propio ciclo de vida.
// ======================================================

/**
 * Colecciones que se revisan: el catálogo y lo del panel, que es
 * todo lo que puede guardar una imagen subida por el admin a
 * "content/".
 */
// "seasons" está aquí porque desde que cada temporada tiene su
// propia portada y su propio banner, sus imágenes también viven en
// "content/". Si esta colección no se revisara, la limpieza las
// daría por huérfanas y borraría imágenes que sí se están viendo.
const REVISAR = [
  'animes',
  'seasons',
  'episodes',
  'characters',
  'trivia_extras',
  'weeklyWorks',
  'siteSettings',
  'categories',
  'mascotDialogues',
  'threads',
  'comments',
  'users',
] as const;

/**
 * Recorre un valor de Firestore y avisa de cada texto que
 * parezca una URL de Storage.
 *
 * Se baja a los objetos y a los arrays porque un campo puede
 * venir anidado (por ejemplo, la lista de "servicios" de un
 * anime) y no queremos que se nos escape ninguno.
 */
function recogerTextos(valor: unknown, salida: (txt: string) => void): void {
  if (typeof valor === 'string') {
    salida(valor);
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((v) => recogerTextos(v, salida));
    return;
  }
  if (valor && typeof valor === 'object') {
    Object.values(valor as Record<string, unknown>).forEach((v) =>
      recogerTextos(v, salida),
    );
  }
}

/**
 * Todas las rutas de "content/" que siguen referenciadas por
 * algún documento.
 */
export async function rutasReferenciadas(): Promise<Set<string>> {
  const encontradas = new Set<string>();

  for (const nombre of REVISAR) {
    const snap = await getDocs(collection(db, nombre));

    snap.forEach((doc) => {
      const datos = doc.data() as Record<string, unknown>;
      recogerTextos(datos, (txt) => {
        const path = storagePathFromUrl(txt);
        if (path && path.startsWith('content/')) encontradas.add(path);
      });
    });
  }

  return encontradas;
}

export interface ImagenHuerfana {
  path: string;
  size: number;
}

export interface InformeLimpieza {
  /** Archivos que había en "content/". */
  total: number;
  /** Cuántos documentos se han revisado. */
  documentos: number;
  /** Los que ya no referencia ningún documento. */
  huerfanos: ImagenHuerfana[];
  /** Cuántos se han borrado de verdad. */
  borrados: number;
  /** Cuántos ha rechazado Storage. */
  fallidos: number;
  /** Espacio que ocupaban, en bytes. */
  liberado: number;
}

/** Calcula el informe SIN borrar nada. */
export async function buscarImagenesHuerfanas(): Promise<InformeLimpieza> {
  const archivos = await listStoredImages('content/');
  const referenciadas = await rutasReferenciadas();

  const sinUsar = archivos.filter((p) => !referenciadas.has(p));

  // El peso solo se consulta de los que sobran, que suelen ser
  // muchos menos que los que hay en total.
  const huerfanos: ImagenHuerfana[] = await Promise.all(
    sinUsar.map(async (path) => ({ path, size: await storedImageSize(path) })),
  );

  return {
    total: archivos.length,
    documentos: referenciadas.size,
    huerfanos,
    borrados: 0,
    fallidos: 0,
    liberado: huerfanos.reduce((suma, f) => suma + f.size, 0),
  };
}

/** Busca y borra. Es lo que llama el botón del panel. */
export async function limpiarImagenesHuerfanas(): Promise<InformeLimpieza> {
  const informe = await buscarImagenesHuerfanas();

  let borrados = 0;
  let fallidos = 0;

  for (const h of informe.huerfanos) {
    const ok = await deleteStoredPath(h.path);
    if (ok) borrados++;
    else fallidos++;
  }

  return { ...informe, borrados, fallidos };
}

/** "1,2 MB" a partir de bytes. */
export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
