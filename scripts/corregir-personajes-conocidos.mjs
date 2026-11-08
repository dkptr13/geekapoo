import { coleccion, escribir, borrar, str, arrayDe } from 'file:///C:/web%20anime/scripts/firestore-rest.mjs';

const DEF = 'https://s4.anilist.co/file/anilistcdn/character/large/default.jpg';

const cambios = [];

// ── Rei Ayanami: el japones era el de Asuka ──────────────────────
await escribir(
  'characters',
  'neon-genesis-evangelion-rei-ayanami',
  { japaneseName: { stringValue: '綾波レイ' } },
  ['japaneseName'],
);
cambios.push('Rei Ayanami -> japaneseName 綾波レイ');

// ── Chiyo (Naruto): el nombre japones es solo チヨ ───────────────
await escribir(
  'characters',
  'naruto-shippuden-chiyo',
  { japaneseName: { stringValue: 'チヨ' } },
  ['japaneseName'],
);
cambios.push('Chiyo -> japaneseName チヨ');

// ── Yuu Haibara: la ficha decia Yuki ─────────────────────────────
await escribir(
  'characters',
  'jujutsu-kaisen-yuki-haibara',
  {
    name: { stringValue: 'Yuu Haibara' },
    slug: { stringValue: 'yuu-haibara' },
    aliases: arrayDe(['Yu Haibara']),
  },
  ['name', 'slug', 'aliases'],
);
cambios.push('Yuki Haibara -> Yuu Haibara');

// ── Melt Narushima: la ficha decia Matsuri ───────────────────────
await escribir(
  'characters',
  'oshi-no-ko-matsuri-narushima',
  {
    name: { stringValue: 'Melt Narushima' },
    slug: { stringValue: 'melt-narushima' },
  },
  ['name', 'slug'],
);
cambios.push('Matsuri Narushima -> Melt Narushima');

// ── Lucy duplicada: se queda la ficha enlazada desde una tierlist ─
await escribir(
  'characters',
  'buh9l6TURhgFnfMpbXUC',
  {
    tags: arrayDe(['Destacados', 'Protagonista', 'Netrunner', 'Arasaka']),
    aliases: arrayDe(['Lucy']),
  },
  ['tags', 'aliases'],
);
await borrar('characters', 'cyberpunk-edgerunners-2-lucy');
cambios.push('Lucy duplicada: se conserva buh9l6TURhgFnfMpbXUC y se borra cyberpunk-edgerunners-2-lucy');

// ── Imagenes que eran banners del anime, no del personaje ────────
const personajes = await coleccion('characters');
const conBanner = personajes.filter((c) => str(c.f, 'imageUrl').includes('/media/anime/'));
for (const c of conBanner) {
  await escribir(
    'characters',
    c.id,
    { imageUrl: { stringValue: DEF } },
    ['imageUrl'],
  );
  cambios.push(`${str(c.f, 'animeId')} | ${str(c.f, 'name')} -> imagen por defecto`);
}

console.log('Cambios aplicados:');
for (const c of cambios) console.log('  ' + c);
