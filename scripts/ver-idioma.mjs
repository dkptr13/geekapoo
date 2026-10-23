// Busca texto que no sea castellano en los ficheros de datos.
//   node scripts/ver-idioma.mjs <fichero> [...]
//
// Cuando se escribe mucho texto de golpe, se cuelan palabras de
// otros idiomas (ingles, japones, chino, cirilico). Este script
// las delata antes de que acaben en el catalogo.
import { readFileSync } from 'node:fs';

const PATRONES = [
  { nombre: 'cirilico', re: /[Ѐ-ӿ]/g },
  { nombre: 'chino/japones', re: /[぀-ヿ㐀-鿿豈-﫿]/g },
  { nombre: 'coreano', re: /[가-힯ᄀ-ᇿ]/g },
  { nombre: 'griego', re: /[Ͱ-Ͽ]/g },
  { nombre: 'arabe/hebreo', re: /[֐-ۿ]/g },
  { nombre: 'devanagari', re: /[ऀ-ॿ]/g },
];

let malos = 0;

for (const fichero of process.argv.slice(2)) {
  const texto = readFileSync(fichero, 'utf8');
  const lineas = texto.split(/\r?\n/);
  lineas.forEach((linea, i) => {
    // El titulo japones va en japones: es lo que se busca.
    if (/japaneseTitle\s*:/.test(linea)) return;
    for (const p of PATRONES) {
      const m = linea.match(p.re);
      if (m) {
        console.log(`  ${fichero}:${i + 1}  ${p.nombre}: ${m.join('')}`);
        console.log(`      ${linea.slice(0, 120)}`);
        malos++;
      }
    }
    // DeletreasRarely: palabras inglesas sueltas que el validador
    // de datos prohibe.
    const ingles = [
      'the', 'and', 'with', 'from', 'that', 'this', 'they', 'them', 'their',
      'have', 'has', 'was', 'were', 'would', 'could', 'should', 'about',
      'after', 'before', 'between', 'when', 'what', 'where', 'while',
      'into', 'over', 'under', 'still', 'only', 'also', 'very', 'many',
      'much', 'like', 'just', 'then', 'than', 'some', 'other', 'such',
      'each', 'every', 'both', 'own', 'same', 'too', 'being', 'against',
      'through', 'during', 'without', 'within', 'power', 'waste',
      'remember', 'assassination', 'green', 'light', 'room', 'fire',
    ];
    const sinAcentos = linea
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    for (const palabra of ingles) {
      const re = new RegExp(`(^|[^a-z])${palabra}([^a-z]|$)`, 'g');
      if (re.test(sinAcentos)) {
        console.log(`  ${fichero}:${i + 1}  ingles: "${palabra}"`);
        console.log(`      ${linea.slice(0, 120)}`);
        malos++;
      }
    }
  });
}

console.log(malos === 0 ? '  sin texto raro' : `  ${malos} avisos`);
process.exit(malos === 0 ? 0 : 1);