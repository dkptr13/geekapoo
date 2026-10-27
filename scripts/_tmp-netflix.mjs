const r = await fetch('https://www.netflix.com/es/title/80052714', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9',
  },
});
const t = await r.text();

for (const clave of ['"isPlayable"', '"isAvailable"', '"availability"', '"playable"', '"isPlayableOnAdsPlan"', '"isTitle"']) {
  let i = -1;
  let n = 0;
  while ((i = t.indexOf(clave, i + 1)) >= 0 && n < 4) {
    console.log(clave, i, '->', t.slice(Math.max(0, i - 120), i + 160).replace(/\s+/g, ' '));
    n++;
  }
}

// Nombre de la serie y episodios
const iTitulo = t.indexOf('"title":"Akame');
console.log('\ntitle idx', iTitulo, iTitulo >= 0 ? t.slice(iTitulo - 200, iTitulo + 200) : '');
