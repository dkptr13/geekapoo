import { coleccion, str, num, arrayDe } from './firestore-rest.mjs';
const a = await coleccion('animes');
for (const d of a) {
  const t = str(d, 'title');
  if (/kimi no na wa|suzume|mononoke|chihiro|your name|koe no katachi|a silent voice/i.test(t)) {
    console.log(d.id, '|', t);
    console.log(JSON.stringify(d.f, null, 1).slice(0, 1600));
  }
}
