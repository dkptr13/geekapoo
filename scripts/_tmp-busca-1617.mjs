import { readFileSync } from "node:fs";
const chars = JSON.parse(readFileSync(process.env.TEMP + "/op-anilist-chars.json", "utf8"));
const buscar = [
  "Caesar", "Monet", "Vergo", "Brownbeard", "Kin'emon", "Kinem", "Momonosuke", "Baby 5", "Buffalo",
  "Yeti", "Rock", "Scotch", "Mocha", "Breed", "Dugong", "Rebecca", "Kyros", "Riku", "Viola",
  "Diamante", "Trebol", "Pica", "Sugar", "Lao G", "Gladius", "Senor Pink", "Machvise", "Dellinger",
  "Bartolomeo", "Bellamy", "Cavendish", "Sabo", "Koala", "Hack", "Burgess", "Fujitora", "Issho",
  "Bastille", "Maynard", "Chinjao", "Sai", "Boo", "Ideo", "Hajrudin", "Orlumbus", "Suleiman",
  "Elizabello", "Dagama", "Gatz", "Tank", "Mansherry", "Leo", "Gancho", "Wicca", "Kabu",
  "Scarlett", "Corazon", "Rosinante", "Homing", "Lami", "Kaido", "Jack", "Sheepshead", "Ginrummy",
  "Kanjuro", "Raizo", "Ucy", "Kelly Funk", "Bobby Funk", "Jean Ango", "Spartan", "Acilia", "Logan",
];
const vistos = new Set();
for (const b of buscar) {
  const hits = chars.filter((c) => (c.full ?? "").toLowerCase().includes(b.toLowerCase()) || (c.native ?? "").includes(b));
  for (const h of hits) {
    const k = h.full + "|" + h.native;
    if (vistos.has(k)) continue;
    vistos.add(k);
    console.log(`${b} -> ${h.full} | ${h.native} | ${h.voz} | ${h.rol}`);
  }
}
