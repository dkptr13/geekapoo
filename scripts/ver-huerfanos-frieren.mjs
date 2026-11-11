// Compara los episodios huerfanos con los reales antes de borrarlos.
//
//    node scripts/ver-huerfanos-frieren.mjs
//
// Los huerfanos son documentos que un PATCH creo por error (en Firestore
// un PATCH con updateMask sobre un id que no existe NO falla: lo crea).
// Antes de borrarlos hay que confirmar que no guardan nada que el
// episodio real no tenga, que es lo unico que haria que compelling
// mantenerlos.

import { uno } from './firestore-rest.mjs';

// Los ids huerfanos que salio en `ver-huerfanos.mjs`.
const HUERFANOS = [
  'frieren_ep_1',
  'frieren_ep_2',
  'frieren-beyond-journeys-end-s1-e01',
  'frieren-beyond-journeys-end-s1-e02',
  'frieren-beyond-journeys-end-s1-e03',
];

// Con que episodio real se corresponde cada uno.
const REAL = {
  'frieren_ep_1': 'frieren-ep-1',
  'frieren_ep_2': 'frieren-ep-2',
  'frieren-beyond-journeys-end-s1-e01': 'frieren-ep-1',
  'frieren-beyond-journeys-end-s1-e02': 'frieren-ep-2',
  'frieren-beyond-journeys-end-s1-e03': 'aR0ZJjzznNulJOkYar8T',
};

const INTERESANTE = ['title', 'romajiTitle', 'airDate', 'rating', 'number', 'description'];

for (const id of HUERFANOS) {
  const h = await uno('episodes', id);

  if (!h) {
    console.log(`${id}: ya no existe`);
    continue;
  }

  const realId = REAL[id];
  const r = await uno('episodes', realId);

  console.log(`\n=== ${id}`);
  console.log(`    -> real: ${realId}`);

  for (const campo of INTERESANTE) {
    const hv = h.f[campo];
    const rv = r?.f?.[campo];

    if (!hv) continue;

    // El huerfano gana en algo que el real no tiene?
    const elRealNoTiene = !rv;
    const difieren =
      JSON.stringify(hv) !== JSON.stringify(rv);

    const marca = elRealNoTiene ? 'MEJOR' : difieren ? 'DIFIERE' : 'igual';

    console.log(`    ${marca.padEnd(7)} ${campo.padEnd(14)} huerfano=${JSON.stringify(hv).slice(0, 60)}`);
    if (difieren || elRealNoTiene) {
      console.log(`            ${''.padEnd(7)} ${''.padEnd(14)} real    =${JSON.stringify(rv ?? '(vacio)').slice(0, 60)}`);
    }
  }

  const extra = Object.keys(h.f).filter((k) => !INTERESANTE.includes(k));
  console.log(`    campos sueltos: ${extra.join(', ') || '(ninguno)'}`);
}