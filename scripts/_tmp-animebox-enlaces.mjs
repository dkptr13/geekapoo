import { readFileSync } from 'node:fs';

const t = readFileSync('scripts/_tmp-animebox2.html', 'utf8');
const enlaces = [...t.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log('--- enlaces de app/login ---');
console.log([...new Set(enlaces)].filter((x) => /app|ver|login|cuenta|suscr|player|watch|play/i.test(x)).join('\n'));
console.log('--- iframes/scripts ---');
const iframes = [...t.matchAll(/<iframe[^>]+src="([^"]+)"/g)].map((m) => m[1]);
console.log(iframes.join('\n'));
const scripts = [...t.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
console.log(scripts.filter((s) => !/wp-content|gstatic|google|cdnjs|jquery/i.test(s)).join('\n'));
console.log('--- textos accede ---');
const i = t.toLowerCase().indexOf('accede');
if (i >= 0) console.log(t.slice(Math.max(0, i - 500), i + 300).replace(/\s+/g, ' '));
