import { coleccion, str, num } from './firestore-rest.mjs';
const a = await coleccion('animes');
console.log('animes:', a.length);
for (const d of a) {
  const t = str(d, 'title');
  if (/fate|apocrypha|illya|kaleid|grand order|el-melloi|emiya/i.test(t)) console.log(d.id, '|', t, '|', num(d, 'year'));
}
