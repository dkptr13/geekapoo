/**
 * El recorte de verdad: del fichero a la imagen recortada.
 *
 * ── POR QUÉ ESTÁ APARTE DE `imageCrop.ts` ──────────────────────────
 *
 * Porque aquí ya hay `document`, `canvas` y ficheros, y ese módulo es
 * puro a propósito: se carga desde Node para poder probarlo. Separar
 * los dos es lo que permite tener las pruebas sin navegador.
 *
 * ── LO QUE NO SE GUARDA NUNCA ─────────────────────────────────────
 *
 * El resultado del recorte es un PNG, un JPG o un WebP, y va a Storage
 * con su URL de siempre. La imagen recortada NO va dentro de Firestore
 * ni en base64: un documento de Firestore tiene un límite de 1 MB y una
 * foto recortada pesa bastante más, así que guardarla ahí deja la página
 * página entera a fallar. Lo que sí va a Firestore son cuatro números
 * pequeños (el encuadre), que ocupan menos que un texto.
 */
import {
  calcularEncuadre,
  ladoDeSalida,
  type ImageCropSettings,
} from './imageCrop';

/** Los formatos que se guardan, y el peso que se le pone a cada uno. */
const TIPOS = {
  webp: { mime: 'image/webp', calidad: 0.9 },
  jpeg: { mime: 'image/jpeg', calidad: 0.92 },
  png: { mime: 'image/png', calidad: 1 },
} as const;

export type FormatoSalida = keyof typeof TIPOS;

/**
 * Qué formato usar al guardar.
 *
 * ── POR QUÉ ESTO Y NO SIEMPRE WEBP ─────────────────────────────────
 *
 * WebP es el que mejor pesa, pero es lo único que no admite
 * transparencia. Una imagen con alfa (un PNG con el fondo quitado, que
 * es lo que sale del recortador de fondos) guardada como WebP pierde el
 * canal alfa y sale con un fondo negro.
 *
 * Así que la elección se hace mirando la imagen, no por el formato que
 * traía el fichero: si tiene transparencia, PNG; si no, WebP.
 *
 * La transparencia sale de que el propio PNG la tenga en alguno de sus
 * canales. Es una comprobación barata y suficiente, y evita tener que
 * preguntarle al usuario.
 */
export function formatoPara(imagen: HTMLImageElement | ImageBitmap): FormatoSalida {
  if (!tieneAlfa(imagen)) return 'webp';

  return 'png';
}

/** Si la imagen trae canal alfa en alguno de sus canales. */
export function tieneAlfa(imagen: HTMLImageElement | ImageBitmap): boolean {
  const canvas = document.createElement('canvas');

  // Con 1x1 es lo bastante para mirar un píxel, y no hay que crear
  // un canvas del tamaño de la foto.
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return false;

  try {
    ctx.drawImage(imagen, 0, 0, 1, 1);
  } catch {
    return false;
  }

  try {
    const datos = ctx.getImageData(0, 0, 1, 1).data;

    return datos[3] < 255;
  } catch {
    // Un canvas con la imagen de OTRO origen puede lanzar al leer. Es
    // el caso normal, no una excepción: las fotos de Storage se sirven
    // con cabeceras que lo permiten, pero un avatar de Google no.
    // Ante la duda se asume que hay alfa, que es lo que conserva la
    // calidad y solo cuesta unos bytes más.
    return true;
  }
}

/** Carga un fichero como imagen, de forma asíncrona y con errores claros. */
export function cargarImagen(fichero: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof fichero === 'string' ? fichero : URL.createObjectURL(fichero);

    const img = new Image();

    // Que NO se ponga el crossOrigin por defecto, para poder pintar
    // imágenes de fuera: si se pone, las de Storage que no lo admiten
    // dejan de cargar. El único sitio donde hace falta exportarlas a
    // canvas es `recortarImagen`, y ahí se avisa con claridad si el
    // navegador no lo permite.
    img.onload = () => {
      if (typeof fichero !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      if (typeof fichero !== 'string') URL.revokeObjectURL(url);
      reject(new Error('No se ha podido leer la imagen. Puede que esté dañada.'));
    };

    img.src = url;
  });
}

/**
 * El tamaño en píxeles de la caja de recorte para un formato dado.
 *
 * El lado se acota al de la imagen original: ampliar más allá solo
 * produce píxeles inventados. Un avatar son 512 px, que es lo que se
 * ve de verdad en cualquier sitio de la web y bastante de margen para
 * verlo en pantallas grandes.
 *
 * @param maximo lado mayor del resultado
 */
export function tamanoCorte(
  aspectRatio: number,
  anchoFuente: number,
  altoFuente: number,
  maximo: number,
): { ancho: number; alto: number } {
  const lado = ladoDeSalida(anchoFuente, altoFuente, maximo);

  // Con el lado como base se decide qué eje manda: si la proporción es
  // mayor que 1 manda el ancho, si no, el alto.
  const ancho = aspectRatio >= 1 ? lado : Math.round(lado * aspectRatio);
  const alto = aspectRatio >= 1 ? Math.round(lado / aspectRatio) : lado;

  return {
    ancho: Math.max(1, Math.round(ancho)),
    alto: Math.max(1, Math.round(alto)),
  };
}

/**
 * Pinta el encuadre en un canvas del tamaño dado.
 *
 * Es lo que usan tanto la vista previa del editor como el recorte
 * final, para que lo que se ve sea EXACTAMENTE lo que se guarda. Si
 * fueran dos caminos distintos, el ajuste guardado y lo que se vio
 * antes de confirmar no coincidirían, y eso es justo lo que hace que
 * un editor de recorte parezca mentiroso.
 *
 * @param ctx   contexto 2D del destino
 * @param imagen imagen de origen ya cargada
 * @param anchoCaja ancho en píxeles del destino
 * @param altoCaja alto en píxeles del destino
 * @param ajustes el encuadre elegido
 */
export function pintarEncuadre(
  ctx: CanvasRenderingContext2D,
  imagen: CanvasImageSource,
  anchoFuente: number,
  altoFuente: number,
  anchoCaja: number,
  altoCaja: number,
  ajustes: ImageCropSettings,
): void {
  const e = calcularEncuadre(
    anchoFuente,
    altoFuente,
    anchoCaja,
    altoCaja,
    ajustes,
  );

  ctx.clearRect(0, 0, anchoCaja, altoCaja);

  if (e.ancho <= 0 || e.alto <= 0) return;

  ctx.drawImage(imagen, e.x, e.y, e.ancho, e.alto);
}

/**
 * Recorta la imagen y devuelve el resultado como `File`, listo para
 * subirlo por donde se subía antes.
 *
 * ── LO QUE PUEDE FALLAR, Y CÓMO SE DICE ───────────────────────────
 *
 * Si la imagen viene de otro dominio y el navegador no manda cabeceras
 * que permitan leerla, el canvas se "ensucia" por seguridad y al
 * exportar saldría una imagen vacía, o directamente un error. No se
 * puede detectar sin intentarlo, así que se intenta y si falla se
 * explica con palabras en vez de devolver un `null` que nadie
 * distinguiría de un recorte vacío.
 */
export async function recortarImagen(
  imagen: HTMLImageElement,
  ajustes: ImageCropSettings,
  opciones: { maximo?: number; formato?: FormatoSalida; calidad?: number } = {},
): Promise<File> {
  const maximo = opciones.maximo ?? 1200;

  const { ancho, alto } = tamanoCorte(
    ajustes.aspectRatio,
    imagen.naturalWidth,
    imagen.naturalHeight,
    maximo,
  );

  const canvas = document.createElement('canvas');

  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Este navegador no ha podido preparar el recorte.');
  }

  pintarEncuadre(ctx, imagen, imagen.naturalWidth, imagen.naturalHeight, ancho, alto, ajustes);

  const tipo = opciones.formato ?? formatoPara(imagen);
  const calidad = opciones.calidad ?? TIPOS[tipo].calidad;

  const blob = await canvasToBlob(canvas, TIPOS[tipo].mime, calidad);

  // `canvas.toBlob` devuelve `null` cuando la imagen tiene un origen
  // que el navegador no permite exportar, que es un caso real con
  // fotos de otros dominios. Sin este chequeo, lo que se subiría sería
  // un fichero de 0 bytes y el error aparecería dos pantallas más
  // abajo, al fallar la subida.
  if (!blob || blob.size === 0) {
    throw new Error(
      'El navegador no ha permitido recortar esta imagen. ' +
        'Si la has descargado de otra web, prueba a subirla desde tu ordenador.',
    );
  }

  const nombre = nombreDeSalida(tipo);

  return new File([blob], nombre, { type: TIPOS[tipo].mime });
}

function nombreDeSalida(formato: FormatoSalida): string {
  return `recorte.${formato === 'jpeg' ? 'jpg' : formato}`;
}

/** `canvas.toBlob` con promesa, y con un error claro si no hay soporte. */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  tipo: string,
  calidad: number,
): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('Este navegador no admite recortar imágenes.'));

      return;
    }

    canvas.toBlob(
      (blob) => resolve(blob),
      tipo,
      calidad,
    );
  });
}

/**
 * Reduce un fichero a un tamaño máximo antes de subirlo.
 *
 * ── CUÁNDO APLICA Y CUÁNDO NO ─────────────────────────────────────
 *
 * Aplica a las fotos de perfil: una foto de 12 megapíxeles son 48 MB
 * descomprimidos y, aunque el JPEG pese 4 MB, subirla es lento para
 * quien la sube y caro para quien la sirve. Reducirla aquí deja el
 * recorte en un tamaño que se ve igual en cualquier sitio.
 *
 * No se usa para los recortes del editor: ahí el recorte ya sale del
 * tamaño que se pidió, y volver a reducirlo solo perdería calidad.
 */
export async function reducirImagen(
  fichero: File,
  maximo = 1600,
  calidad = 0.9,
): Promise<File> {
  // Un GIF no se toca: reducing le quita los fotogramas o la animación.
  // Un SVG tampoco tiene sentido reducirlo.
  if (fichero.type === 'image/gif' || fichero.type === 'image/svg+xml') return fichero;

  const ancho = await anchoDe(fichero);

  if (ancho <= maximo) return fichero;

  const imagen = await cargarImagen(fichero);
  const escala = maximo / imagen.naturalWidth;
  const destino = await reducir(fichero, imagen.naturalWidth, imagen.naturalHeight, escala, calidad);

  return destino ?? fichero;
}

function anchoDe(fichero: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(fichero);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    img.src = url;
  });
}

async function reducir(
  fichero: File,
  ancho: number,
  alto: number,
  escala: number,
  calidad: number,
): Promise<File | null> {
  const imagen = await cargarImagen(fichero);

  const canvas = document.createElement('canvas');

  canvas.width = Math.round(ancho * escala);
  canvas.height = Math.round(alto * escala);

  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  const tipo = fichero.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, tipo, calidad);

  if (!blob) return null;

  return new File([blob], fichero.name, { type: tipo });
}