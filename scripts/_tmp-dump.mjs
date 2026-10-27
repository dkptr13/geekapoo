import { coleccion, str } from './firestore-rest.mjs';

const all = await coleccion('animes');
console.log('TOTAL_ANIMES:' + all.length);
for (const a of all) {
  const s = a.f.streaming;
  const platforms = [];
  const regionsByPlatform = {};
  if (s && s.arrayValue && s.arrayValue.values) {
    for (const v of s.arrayValue.values) {
      const fields = v.mapValue.fields;
      const name = fields.name ? fields.name.stringValue : null;
      if (!name) continue;
      platforms.push(name);
      if (fields.regions && fields.regions.arrayValue && fields.regions.arrayValue.values) {
        const regions = fields.regions.arrayValue.values.map((r) => r.stringValue).filter(Boolean);
        if (regions.length) regionsByPlatform[name] = regions;
      }
    }
  }
  const doc = { id: str(a.f, 'id'), title: str(a.f, 'title') };
  if (platforms.length) doc.platforms = platforms;
  if (Object.keys(regionsByPlatform).length) doc.regions = regionsByPlatform;
  if (Object.keys(doc).length) console.log(JSON.stringify(doc));
}
