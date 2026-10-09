// Las notificaciones más nuevas de cada usuario, con tipo y destino.
// Solo lee.
import { coleccion } from './firestore-rest.mjs';

const usuarios = await coleccion('users');

for (const u of usuarios) {
  const uid = u.name ?? u.id ?? '(sin id)';
  let avisos = [];
  try {
    avisos = await coleccion(`users/${uid}/notifications`);
  } catch (e) {
    console.log(`${uid}: no se pudo leer (${e.message})`);
    continue;
  }

  avisos.sort((a, b) => {
    const ca = (a.f ?? {}).createdAt?.timestampValue ?? '';
    const cb = (b.f ?? {}).createdAt?.timestampValue ?? '';
    return cb.localeCompare(ca);
  });

  console.log(`── ${uid}: ${avisos.length} avisos`);
  for (const n of avisos.slice(0, 4)) {
    const f = n.f ?? {};
    const val = (k) => f[k]?.stringValue ?? f[k]?.booleanValue ?? '';
    console.log(
      `   ${f.createdAt?.timestampValue ?? '?'} | type=${val('type') || '(sin tipo)'} | ` +
        `chatId=${f.chatId?.stringValue ?? '-'} | thread=${f.threadId?.stringValue ?? '-'} | ` +
        `actor=${val('actorName')} | leido=${val('read')} | snippet=${(f.snippet?.stringValue ?? '').slice(0, 30)}`,
    );
  }
}
