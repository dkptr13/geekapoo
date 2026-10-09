// Ejecuta el comprobador del recorte de sharp.
//
//   npm run test:recorte
//
// Va aparte de `test:logica` porque necesita `sharp`, que es una
// dependencia nativa: si no está instalada, esta comprobación no puede
// correr, y no tiene sentido que tumbe la suite entera por eso.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));

const r = spawnSync(
  process.execPath,
  [join(aqui, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/probar-recorte-sharp.mjs'],
  { stdio: 'inherit', cwd: join(aqui, '..') },
);

process.exit(r.status ?? 1);