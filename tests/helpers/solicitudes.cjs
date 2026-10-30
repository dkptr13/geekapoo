/**
 * ESCRIBIR SOLICITUDES DE CHAT COMO LO HACE LA APLICACIÓN
 *
 * Desde el cierre del residual G1, `chatRequests` y el libro mayor
 * del cupo (`rateLimits/{uid}`) se escriben en la MISMA transacción:
 * la regla mira `getAfter()` y exige que el contador suba
 * exactamente uno.
 *
 * Las pruebas que solo quieren comprobar la solicitud (nombre, id,
 * privacidad, etc.) tienen que usar este helper; si escribieran solo
 * el documento de `chatRequests`, fallarían por el cupo y no por lo
 * que la prueba quiere demostrar. Las pruebas que sí quieren
 * comprobar que el cupo es obligatorio usan `setDoc` a propósito.
 */
const {
  deleteField,
  doc,
  runTransaction,
  serverTimestamp,
} = require('firebase/firestore');

const LIMITE_SOLICITUDES = 20;
const VENTANA_SOLICITUDES_MS = 24 * 60 * 60 * 1000;

function msDeTimestamp(valor) {
  if (typeof valor === 'string') return Date.parse(valor);
  if (valor && typeof valor.toMillis === 'function') return valor.toMillis();
  return 0;
}

/**
 * Crea la solicitud o la reabre, consumiendo un hueco del cupo.
 *
 * `datos` se ignora al reabrir: la regla de reapertura solo deja
 * tocar `status` y limpiar la respuesta anterior.
 */
async function guardarSolicitud(
  clientDb,
  uid,
  ref,
  datos,
  { reabrir = false } = {},
) {
  const cupoRef = doc(clientDb, 'rateLimits', uid);

  await runTransaction(clientDb, async (tx) => {
    // Todas las lecturas antes de la primera escritura.
    const cupoSnap = await tx.get(cupoRef);

    if (reabrir) {
      tx.update(ref, {
        status: 'pending',
        respondedAt: deleteField(),
        respondedBy: deleteField(),
      });
    } else {
      tx.set(ref, datos);
    }

    const ahora = Date.now();
    const inicio = cupoSnap.exists()
      ? msDeTimestamp(cupoSnap.data().windowStart)
      : 0;
    const caducado
      = !cupoSnap.exists()
        || inicio <= 0
        || ahora - inicio >= VENTANA_SOLICITUDES_MS;
    const consumidas = caducado
      ? 0
      : Number(cupoSnap.data().count ?? 0);

    if (consumidas >= LIMITE_SOLICITUDES) {
      throw new Error('Límite de solicitudes alcanzado.');
    }

    if (caducado) {
      tx.set(cupoRef, {
        count: 1,
        windowStart: serverTimestamp(),
        ultimaSolicitud: serverTimestamp(),
        ultimaSolicitudId: ref.id,
      });
    } else {
      tx.update(cupoRef, {
        count: consumidas + 1,
        ultimaSolicitud: serverTimestamp(),
        ultimaSolicitudId: ref.id,
      });
    }
  });
}

function reabrirSolicitud(clientDb, uid, ref) {
  return guardarSolicitud(clientDb, uid, ref, null, { reabrir: true });
}

module.exports = {
  guardarSolicitud,
  reabrirSolicitud,
  LIMITE_SOLICITUDES,
};
