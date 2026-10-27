import { coleccion } from './firestore-rest.mjs';

const rows = await coleccion('streamingAvailability');
console.log('TOTAL_FILAS:' + rows.length);
for (const r of rows) {
  const id = r.id ? r.id.stringValue : '';
  const animeId = r.animeId ? r.animeId.stringValue : '';
  const platformId = r.platformId ? r.platformId.stringValue : '';
  const region = r.region ? r.region.stringValue : '';
  const status = r.status ? r.status.stringValue : '';
  const accessType = r.accessType ? r.accessType.stringValue : '';
  const url = r.url ? r.url.stringValue : '';
  const verifiedAt = r.verifiedAt ? r.verifiedAt.stringValue : '';
  console.log(JSON.stringify({ id, animeId, platformId, region, status, accessType, url, verifiedAt }));
}
