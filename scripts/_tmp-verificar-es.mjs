// ======================================================
// VERIFICACION DIRECTA EN LAS PLATAFORMAS (ESPAÑA)
// ======================================================
//
//   node scripts/_tmp-verificar-es.mjs
//
// El servidor esta en España, asi que se puede comprobar de verdad:
//   · Crunchyroll: catalogo ES por su API publica (token anonimo).
//   · Netflix: campo `isAvailable` de la ficha /es/title/{id}.
//
// Corrige las filas de España del volcado de auditoria y guarda.

import { readFile, writeFile } from 'node:fs/promises';

const ARCHIVO = 'scripts/_tmp-jw-auditoria.json';
const datos = JSON.parse(await readFile(ARCHIVO, 'utf8'));
const obras = datos.obras;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0 Safari/537.36';

const normaliza = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compacto = (texto) => normaliza(texto).replace(/\s+/g, '');
const fichas = (texto) => new Set(normaliza(texto).split(' ').filter(Boolean));

function numeros(t) {
  return (normaliza(t).match(/\b(i|ii|iii|iv|v|vi{0,3}|ix|x|\d+)\b/g) ?? []).sort().join(' ');
}

function similitud(a, b) {
  if (!a || !b) return 0;
  const ca = compacto(a);
  const cb = compacto(b);
  if (!ca || !cb) return 0;
  if (ca === cb) return 100;
  if (numeros(a) !== numeros(b)) return 0;

  if (ca.length >= 4 && cb.length >= 4) {
    const corto = ca.length <= cb.length ? ca : cb;
    const largo = ca.length <= cb.length ? cb : ca;
    if (largo.includes(corto) && corto.length / largo.length >= 0.7) return 60;
  }

  const ta = fichas(a);
  const tb = fichas(b);
  const inter = [...ta].filter((x) => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size;
  const jac = union ? inter / union : 0;
  if (jac >= 0.8) return 80;
  if (jac >= 0.6) return 60;
  return 0;
}

// ── CRUNCHYROLL ───────────────────────────────────────────

const CLIENT_ID = 'noaihdevm_6iyg0a8l0q';
const BASIC = Buffer.from(`${CLIENT_ID}:`).toString('base64');

const tokenRes = await fetch('https://beta-api.crunchyroll.com/auth/v1/token', {
  method: 'POST',
  headers: { Authorization: `Basic ${BASIC}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
  body: 'grant_type=client_id',
});
const { access_token } = await tokenRes.json();
if (!access_token) throw new Error('Crunchyroll no dio token');

const cabCr = { Authorization: `Bearer ${access_token}`, 'User-Agent': UA };

const buscarCr = async (texto) => {
  const u = `https://beta-api.crunchyroll.com/content/v2/discover/search?q=${encodeURIComponent(texto)}&n=10&type=series&locale=es-ES`;
  const r = await fetch(u, { headers: cabCr });
  if (!r.ok) {
    if (r.status === 429) {
      await new Promise((ok) => setTimeout(ok, 5000));
      return buscarCr(texto);
    }
    return [];
  }
  const d = await r.json();
  return (d?.data ?? []).flatMap((g) => g.items ?? []);
};

const crunchryrollES = async (obra) => {
  const variantes = [
    ...new Set(
      [
        obra.titulo,
        obra.japones,
        ...(obra.alternativos ?? []).slice(0, 4),
        obra.elegido?.title,
        obra.elegido?.es,
      ].filter(Boolean),
    ),
  ].slice(0, 7);

  const vistos = new Map();
  for (const texto of [...new Set(variantes)]) {
    const items = await buscarCr(texto);
    for (const it of items) {
      const p = Math.max(
        ...variantes.map((v) => similitud(v, it.title)),
        similitud(obra.titulo, it.slug_title?.replace(/-/g, ' ')),
      );
      if (p >= 60) {
        const previo = vistos.get(it.id);
        if (!previo || p > previo.puntos) vistos.set(it.id, { item: it, puntos: p });
      }
    }
    await new Promise((ok) => setTimeout(ok, 250));
  }

  const mejores = [...vistos.values()].sort(
    (a, b) => b.puntos - a.puntos || a.item.title.length - b.item.title.length,
  );
  return mejores[0]?.item ?? null;
};

// ── NETFLIX ───────────────────────────────────────────────

const netflixIdDe = (obra) => {
  for (const region of Object.values(obra.regiones ?? {})) {
    const url = region?.netflix?.url;
    const m = /\/title\/(\d+)/.exec(url ?? '');
    if (m) return m[1];
  }
  return null;
};

const netflixES = async (id) => {
  const r = await fetch(`https://www.netflix.com/es/title/${id}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
  });
  if (!r.ok) return null;
  const t = await r.text();
  const m = t.match(/"metaData":\{[^}]*"isAvailable":(true|false)/);
  return m ? m[1] === 'true' : null;
};

// ── APLICAR ───────────────────────────────────────────────

const ponerFila = (obra, platformId, region, campos) => {
  const i = obra.filas.findIndex((f) => f.platformId === platformId && f.region === region);
  const fila = { platformId, region, ...campos };
  if (i >= 0) obra.filas[i] = fila;
  else obra.filas.push(fila);
  if (!obra.plataformas.includes(platformId)) obra.plataformas.push(platformId);
};

let crSi = 0;
let crNo = 0;
let nfSi = 0;
let nfNo = 0;
let hechas = 0;

const guardar = () => writeFile(ARCHIVO, JSON.stringify({ ...datos, verificadoES: '2026-10-27' }, null, 1), 'utf8');

for (const obra of obras) {
  if (obra.esVerificado) continue;
  hechas++;
  // Crunchyroll España
  try {
    const item = await crunchryrollES(obra);
    if (item) {
      ponerFila(obra, 'crunchyroll', 'ES', {
        status: 'available',
        accessType: 'subscription',
        url: `https://www.crunchyroll.com/es/series/${item.id}/${item.slug_title || 'serie'}`,
      });
      obra.crunchyrollES = item.id;
      crSi++;
      console.log(`  CR SI  ${obra.id.padEnd(44)} ${item.title}`);
    } else if (obra.plataformas?.includes('crunchyroll')) {
      ponerFila(obra, 'crunchyroll', 'ES', { status: 'unavailable', accessType: 'unknown' });
      obra.crunchyrollES = null;
      crNo++;
      console.log(`  CR NO  ${obra.id}`);
    }
  } catch (e) {
    console.log(`  CR ERR ${obra.id}: ${e.message}`);
  }

  // Netflix España
  const nfId = netflixIdDe(obra);
  if (nfId) {
    try {
      const disponible = await netflixES(nfId);
      if (disponible === true) {
        ponerFila(obra, 'netflix', 'ES', {
          status: 'available',
          accessType: 'subscription',
          url: `https://www.netflix.com/es/title/${nfId}`,
        });
        nfSi++;
        console.log(`  NF SI  ${obra.id}`);
      } else if (disponible === false && obra.plataformas?.includes('netflix')) {
        ponerFila(obra, 'netflix', 'ES', { status: 'unavailable', accessType: 'unknown' });
        nfNo++;
        console.log(`  NF NO  ${obra.id}`);
      }
    } catch (e) {
      console.log(`  NF ERR ${obra.id}: ${e.message}`);
    }
  }

  obra.esVerificado = true;
  if (hechas % 10 === 0) {
    await guardar();
    console.log(`  ... ${hechas} obras verificadas (guardado)`);
  }
}

await guardar();

console.log(`\nCrunchyroll ES: ${crSi} disponibles / ${crNo} no disponibles`);
console.log(`Netflix ES: ${nfSi} disponibles / ${nfNo} no disponibles`);
console.log(`Guardado ${ARCHIVO}`);
