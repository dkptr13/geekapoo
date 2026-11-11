// Mira si hay avisos de chat creados y cuando.
// Solo lee.
//    node scripts/ver-avisos-chat.mjs --full
import { coleccion } from './firestore-rest.mjs';

if (!process.argv.includes('--full')) {
  console.error('  uso: ver-avisos-chat.mjs --full');
  console.error('  Recorre todos los usuarios y sus notificaciones: requiere --full.');
  process.exit(1);
}

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
  const chats = avisos.filter((a) => (a.f ?? {}).type?.stringValue === 'chat_message');
  console.log(`── ${uid}: ${avisos.length} avisos, ${chats.length} de chat`);
  for (const c of chats.slice(0, 5)) {
    const f = c.f ?? {};
    console.log(
      `   id=${c.name ?? c.id} chat=${f.chatId?.stringValue ?? '?'} ` +
        `actor=${f.actorName?.stringValue ?? '?'} ` +
        `leido=${f.read?.booleanValue ?? '?'} ` +
        `creado=${f.createdAt?.timestampValue ?? '?'}`,
    );
  }
}
