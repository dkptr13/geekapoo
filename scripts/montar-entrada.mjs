// Monta el JSON de entrada de UNA temporada.
//   node scripts/montar-entrada.mjs <prefijo> <temporada> <id-imdb> <id-tvdb> <t-tvdb> <t-imdb>
//
// El fichero de sinopsis y el de titulos van por temporada:
//   scripts/entradas/<prefijo>-t<N>-sinopsis.txt
//   scripts/entradas/<prefijo>-t<N>-titulos.txt
//   scripts/entradas/<prefijo>-t<N>-cabecera.txt
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..');
const entradas = join(raiz, 'scripts', 'entradas');

const [, , prefijo, temporada, idImdb, idTvdb, tTvdb, tImdb] = process.argv;
if (!prefijo || !temporada || !idImdb) {
  console.error(
    '  uso: node scripts/montar-entrada.mjs <prefijo> <temporada> <id-imdb> <id-tvdb> <t-tvdb> <t-imdb>',
  );
  process.exit(1);
}

// La primera temporada se escribio antes de que los ficheros
// fueran por temporada: se renombran una vez.
const viejo = join(entradas, `${prefijo}-sinopsis.txt`);
const nuevo = join(entradas, `${prefijo}-t1-sinopsis.txt`);
if (existsSync(viejo) && !existsSync(nuevo)) {
  renameSync(viejo, nuevo);
  console.log(`  renombrado ${prefijo}-sinopsis.txt -> ${prefijo}-t1-sinopsis.txt`);
}
const viejoT = join(entradas, `${prefijo}-titulos.txt`);
const nuevoT = join(entradas, `${prefijo}-t1-titulos.txt`);
if (existsSync(viejoT) && !existsSync(nuevoT)) {
  renameSync(viejoT, nuevoT);
  console.log(`  renombrado ${prefijo}-titulos.txt -> ${prefijo}-t1-titulos.txt`);
}

const leer = (nombre) => {
  const ruta = join(entradas, nombre);
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
};

const sinopsis = leer(`${prefijo}-t${temporada}-sinopsis.txt`);
const cabecera = leer(`${prefijo}-t${temporada}-cabecera.txt`).join('\n');

const entrada = {
  temporada: Number(temporada),
  temporadaImdb: Number(tImdb ?? temporada),
  tvdb: idTvdb && idTvdb !== '-' ? Number(idTvdb) : undefined,
  tvdbTemporada: Number(tTvdb ?? temporada),
  cabecera: cabecera ? cabecera + '\n' : '',
  sinopsis,
};

const destino = join(entradas, `${prefijo}-t${temporada}.json`);
writeFileSync(destino, JSON.stringify(entrada, null, 2) + '\n', 'utf8');
console.log(`  ${prefijo}-t${temporada}.json: ${sinopsis.length} sinopsis`);