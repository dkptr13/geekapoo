/**
 * El slug de un anime es su URL en la wiki.
 *
 * Es el unico campo del documento que NO se puede corregir
 * despues sin romper enlaces: cambiarlo deja publications y
 * enlaces compartidos apuntando a una ficha que ya no existe.
 *
 * Este archivo existe porque hay dos copias del `slugify` en el
 * proyecto: la del panel (`services/catalogAdmin.ts`) y la del
 * script de carga (`scripts/crear-anime.mjs`). La del script se
 * copio a mano porque el archivo del panel arrastra el SDK de
 * cliente y este test corre en Node sin Firebase.
 *
 * Una copia a mano es una copia que se queda vieja. Si alguien
 * toca el slugify del panel, esta comprobacion falla y avisa, en
 * vez de que el proximo anime cargado por REST acabe con un slug
 * distinto del que habria puesto el panel.
 *
 *   npx tsx tests/logica.slug.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Carga un `slugify` de un archivo de texto.
 *
 * Se leen las tres funciones de los dos archivos, se limpian los
 * tipos de TypeScript y se evalúan. EsCutRAR el codigo en vez de
 * importarlo es lo que permite leer un `.mjs` (que usa flecha y
 * `const`) con el mismo camino que un `.ts`.
 *
 * @param archivo Ruta relativa a la raiz del proyecto.
 * @param como    'ts' o 'flecha', segun como este escrito.
 */
function slugifyDe(archivo: string, como: 'ts' | 'flecha'): (t: string) => string {
  const fuente = readFileSync(archivo, 'utf8');

  if (como === 'ts') {
    const bruto = fuente.match(/export function slugify[\s\S]*?\n}/);

    assert.ok(bruto, `no se encontro slugify en ${archivo}`);

    // Se quitan las anotaciones de tipo. Es lo unico que impide
    // que el codigo sea JavaScript valido, y todas las funciones
    // de estos archivos solo anotan parametros y valores de
    // retorno como `string`.
    const js = bruto[0]
      .replace('export function', 'function')
      .replace(/: string/g, '')
      .replace(/\s*:\s*string\b/g, '');

    return new Function(`${js}\nreturn slugify;`)() as (t: string) => string;
  }

  const bruto = fuente.match(/const slugify = \(text\) =>[\s\S]*?slice\(0, 60\);/);

  assert.ok(bruto, `no se encontro el slugify del script en ${archivo}`);

  // La flecha se convierte en una declaracion normal, porque
  // `new Function` no admite un `return` suelto: todo lo que se
  // ejecuta ahi es el CUERPO de una funcion, asi que la funcion
  // que se quiere leer tiene que existir dentro.
  //
  // El parentesis que se abre tras `return` NO es cosmetico. Sin
  // el, `return` queda solo al final de su linea y en el salto
  // siguiente JavaScript inserta un punto y coma automaticamente:
  // la funcion acaba siendo `return;` seguida de texto muerto, y
  // devuelve `undefined` SIEMPRE. Es el fallo mas silencioso que
  // tiene este archivo, porque no lanza nada y lo unico que pasa
  // es que la comparacion de slugs nunca cuadra.
  //
  // El cierre se anade en el `slice` sin anclarlo al final del
  // archivo: el `slugify` del script esta al principio y detras
  // hay mas codigo, asi que un `$` (que solo casa con el fin del
  // texto) no encontraria nada y la funcion se quedaria sin cerrar.
  const js = bruto[0]
    .replace('const slugify = (text) =>', 'function slugify(text) { return (')
    .replace(/slice\(0, 60\);/, 'slice(0, 60)); }');

  return new Function(`${js}\nreturn slugify;`)() as (t: string) => string;
}

const delPanel = slugifyDe('src/services/catalogAdmin.ts', 'ts');
const delScript = slugifyDe('scripts/crear-anime.mjs', 'flecha');

// ──────────────────────────────────────────────────────────
// LOS MISMOS TITULOS QUE ENCONTRARON LOS DOS
// ──────────────────────────────────────────────────────────

const titulos = [
  // El que se cargo por REST. Si estos dos no coinciden, el
  // documento tiene un slug que el panel nunca habria puesto.
  'Mushoku Tensei: Reencarnación desde cero',

  // Casos que ya estan en produccion. Sirven para comprobar que
  // los dos copies siguen dando el slug que la wiki ya tiene
  // enlazado: si `slugify` cambio en algun momento y se rompió
  // la compatibilidad, estos son los que se notarian.
  'Kaguya-sama: Love is War',
  'Jujutsu Kaisen',
  'Frieren: Beyond Journey’s End',

  // Los bordes, que es donde un slugify se rompe:
  //   · acentos -> sin tilde ("cafe", no "caf-n")
  //   · enye -> "s", porque U+2019 no es [a-z0-9]
  //   · dos puntos y guiones -> un solo "-", no tres
  //   · mayusculas y espacios -> "-", nunca "_"
  //   · nada de tildes al final ni guiones colgantes
  'Café con aroma de Successful PSL',
  'B-accs sin acentos',
  '  espacios  alrededor  ',
];

for (const titulo of titulos) {
  const a = delPanel(titulo);
  const b = delScript(titulo);

  assert.equal(
    b,
    a,
    `el slugify del script y el del panel no coinciden con "${titulo}": ` +
      `panel dio "${a}" y el script dio "${b}". Si se ha cambiado el del panel, ` +
      `copia el nuevo al script o el anime siguiente tendra una URL distinta.`,
  );
}

// ──────────────────────────────────────────────────────────
// LAS PROPIEDADES, POR SI ALGUIEN CAMBIA EL ALGORITMO ENTERO
// ──────────────────────────────────────────────────────────

// Ni acentos ni simbolos: son lo que rompe un enlace.
assert.equal(delPanel('Reencarnación'), 'reencarnacion', 'las tildes se quitan');
assert.equal(delPanel('Jobless’ Reincarnation'), 'jobless-reincarnation', 'la enye es un guion');
assert.equal(delPanel('Uno: Dos'), 'uno-dos', 'dos puntos no son tres guiones');
assert.equal(delPanel('guion-bajo_no'), 'guion-bajo-no', 'el guion bajo es un guion');
assert.equal(delPanel('  con espacios  '), 'con-espacios', 'no deja guiones colgantes');

// El tope de 60. Esta en el codigo porque un slug sin tope puede
// pasar de los 1500 caracteres (el limite del nombre de documento
// de Firestore) con un titulo largo, y Firestore lo rechazaria
// con un error que no dice nada de longitud.
const largo = 'Palabra '.repeat(30);
assert.ok(delPanel(largo).length <= 60, 'el slug se corta a 60');

// Y un titulo que no deja nada (solo simbolos) cae al texto del
// panel, no a una cadena vacia: un documento con id "" no existe.
assert.equal(delPanel('!!!'), '', 'un titulo de solo simbolos queda vacio (el panel le pone "elemento")');

console.log('logica.slug: OK');