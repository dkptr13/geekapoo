const regiones = ['es', 'mx', 'us', 'de', 'jp'];
for (const reg of regiones) {
  const r = await fetch(`https://www.netflix.com/${reg}/title/80052714`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });
  const t = await r.text();
  const m = t.match(/"metaData":\{[^}]*"isAvailable":(true|false)/);
  console.log(reg, r.status, 'isAvailable:', m?.[1] ?? '???', 'bytes', t.length);
  await new Promise((ok) => setTimeout(ok, 300));
}
