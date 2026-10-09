// Token de Firebase para los scripts de carga.
//
//   scripts/token-firebase.mjs
//
// Los scripts hablan con Firestore por REST, y para eso necesitan un
// token de acceso. Se toma del sitio donde `firebase login` deja el
// suyo, en vez de pedir un service account aparte: son las mismas
// credenciales que ya usa la CLI, sin ningun secreto nuevo.
//
// ── POR QUÉ HAY QUE RENOVAR ────────────────────────────────
//
// El token de la CLI dura una hora (`expires_in` viene a ser 3599
// segundos) y, cuando caduca, Firestore responde:
//
//   401 ACCESS_TOKEN_TYPE_UNSUPPORTED
//   Request had invalid authentication credentials
//
// Que es un error de lo mas Antipatico que hay: no dice "tu token
// ha caducado" ni "vuelve a entrar", dice que las credenciales no
// valen. Sin esto, el fallo aparece como si el script estuviera
// mal escrito.
//
// Y da igual cuando se ejecuta: cargar el catalogo es de esas tareas
// que se dejan para un rato y se vuelve a ellas media hora después.
//
// ── CÓMO SE RENUEVA ────────────────────────────────────────
//
// Con el `refresh_token` que guarda la propia CLI y el client id
// publico de Firebase, que no es un secreto: lo tiene dentro el
// paquete `firebase-tools` instalado en el proyecto. Se lee de ahí en
// vez de escribirlo a mano, para que si Firebase lo cambia no se
// quede viejo sin que nadie se entere.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AQUI = dirname(fileURLToPath(import.meta.url));

const RUTA = join(
  process.env.USERPROFILE || homedir(),
  '.config',
  'configstore',
  'firebase-tools.json',
);

/**
 * El cliente OAuth de la CLI de Firebase: `client_id` y
 * `client_secret`.
 *
 * ── POR QUÉ HACE FALTA EL SECRET ─────────────────────────
 *
 * Google exige cliente y secreto para renovar un `refresh_token`.
 * Y sí: el secreto está ahí, en el código de `firebase-tools`, a
 * pelo. No es un descuido nuestro, es que ese flujo OAuth es de
 * "aplicación instalada", donde el secreto no protege nada: viaja
 * dentro de un binario que se descarga entero desde npm y que
 * cualquiera puede leer. Ocultarlo no añadiría seguridad, solo
 * impediría renovar el token.
 *
 * ── POR QUÉ SE LEE DEL PAQUETE Y NO SE ESCRIBE AQUÍ ──────
 *
 * Porque se queda viejo. Si Firebase cambia el par y el valor
 * está copiado aquí, el fallo aparece como un `invalid_client` sin
 * explicación y el siguiente que lo suffers no sabría si el
 * problema es el token o el identificador. Leyéndolo del paquete
 * instalado, siempre es el que está en uso.
 *
 * La CLI es global (`npm i -g firebase-tools`), así que se buscan
 * las dos rutas habituales: la global de npm y la de un eventual
 * `npm link` dentro del proyecto.
 */
function credencialesDeLaCli() {
  const rutas = [
    join(process.env.APPDATA || '', 'npm', 'node_modules', 'firebase-tools', 'lib', 'api.js'),
    join(process.env.APPDATA || '', 'npm', 'node_modules', 'firebase-tools', 'lib', 'index.js'),
    join(AQUI, '..', 'node_modules', 'firebase-tools', 'lib', 'api.js'),
  ];

  for (const ruta of rutas) {
    let fuente;
    try {
      fuente = readFileSync(ruta, 'utf8');
    } catch {
      continue;
    }

    // El `client_id` es un identificador reconocible: un numero
    // largo, un guion y un dominio de Google.
    const id = fuente.match(/(\d{10,}-[a-z0-9]+\.apps\.googleusercontent\.com)/);

    // El secreto se declara como una funcion con un valor por
    // defecto. Se busca la llamada, no cualquier cadena de 32
    // caracteres, porque el fichero tiene otros secretos (GitHub,
    // por ejemplo) y coger el equivocado daria un error de
    // autenticacion sin explicar nada.
    const secreto = fuente.match(/FIREBASE_CLIENT_SECRET["']\s*,\s*["']([^"']+)["']/);

    if (id && secreto) return { clientId: id[1], clientSecret: secreto[1] };
  }

  throw new Error(
    'No se encuentra el par de credenciales de firebase-tools, y sin el el\n' +
      'refresh_token no se puede renovar.\n' +
      'Comprueba que la CLI esta instalada: "npx firebase --version".',
  );
}

/** Un token de acceso vigente para la API de Firestore. */
export async function tokenDeAcceso() {
  let guardado;
  try {
    guardado = JSON.parse(readFileSync(RUTA, 'utf8'));
  } catch {
    throw new Error(
      `No se encuentra el fichero de sesion de Firebase en ${RUTA}.\n` +
        'Entra con "npx firebase login" y vuelve a intentarlo.',
    );
  }

  const t = guardado?.tokens;
  if (!t?.access_token) {
    throw new Error(
      `No hay token de Firebase en ${RUTA}.\n` +
        'Entra con "npx firebase login" y vuelve a intentarlo.',
    );
  }

  // Con un margen de cinco minutos, para que un script largo no se
  // quede a medias con el token caducando entre documento y
  // documento.
  //
  // El `expires_at` de la CLI viene en MILISEGUNDOS. Es un detalle
  // que no se ve, pero si se comparase contra `Date.now()` en
  // segundos (que es lo que hace `Date.now()` por defecto tras
  // dividir) el token parecería siempre caducado y se renovaría en
  // cada script.
  const margen = 5 * 60 * 1000;
  if (Date.now() + margen < (t.expires_at ?? 0)) return t.access_token;

  if (!t.refresh_token) {
    throw new Error(
      'El token de Firebase ha caducado y no hay refresh_token guardado.\n' +
        'Entra con "npx firebase login" y vuelve a intentarlo.',
    );
  }

  const { clientId, clientSecret } = credencialesDeLaCli();

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: t.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!r.ok) {
    throw new Error(
      `No se pudo renovar el token de Firebase (${r.status}).\n` +
        `${await r.text()}\n` +
        'Lo mas probable es que la sesion de la CLI se haya cerrado: ' +
        'entra con "npx firebase login".',
    );
  }

  const nuevo = await r.json();

  // Se guarda para no renovar en cada script. Si el fichero esta
  // solo en lectura (no deberia), se sigue adelante sin guardar:
  // renovar otra vez dentro de una hora es barato.
  try {
    guardado.tokens.access_token = nuevo.access_token;
    guardado.tokens.expires_at = Date.now() + (nuevo.expires_in ?? 3600) * 1000;
    guardado.tokens.expires_in = nuevo.expires_in ?? 3600;
    guardado.tokens.scope = nuevo.scope;
    writeFileSyncSafe(RUTA, JSON.stringify(guardado, null, 2));
  } catch {
    // Da igual: el token nuevo sirve para esta ejecucion.
  }

  return nuevo.access_token;
}

function writeFileSyncSafe(ruta, contenido) {
  // Import perezoso: en un entorno de solo lectura no hace falta.
  const { writeFileSync } = require('node:fs');
  writeFileSync(ruta, contenido);
}
