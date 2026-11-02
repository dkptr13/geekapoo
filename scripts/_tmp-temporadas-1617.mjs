import { readFileSync, writeFileSync } from "node:fs";

const ruta = "scripts/datos/op-personajes.mjs";
let texto = readFileSync(ruta, "utf8");

const cambios = [
  ["['Tony Tony Chopper', '3,4,5,6,7,8,9,10,11,12,13,14,15'", "3,4,5,6,7,8,9,10,11,12,13,14,15,16,17"],
  ["['Nico Robin', '2,4,5,6,7,8,9,10,11,12,13,14,15'", "2,4,5,6,7,8,9,10,11,12,13,14,15,16,17"],
  ["['Brook', '10,11,14,15'", "10,11,14,15,16,17"],
  ["['Franky', '8,9,14,15'", "8,9,14,15,16,17"],
  ["['Trafalgar Law', '11,14'", "11,14,16,17"],
  ["['Smoker', '1,2,3,4,15'", "1,2,3,4,15,16"],
  ["['Tashigi', '1,4,15'", "1,4,15,16"],
  ["['Donquixote Doflamingo', '6,14'", "6,14,16,17"],
  ["['Aokiji', '7,14'", "7,14,16"],
  ["['Akainu', '9,14'", "9,14,17"],
  ["['Sengoku', '6,14'", "6,14,17"],
  ["['Tsuru', '6,14'", "6,14,17"],
  ["['Sabo', '14'", "14,17"],
  ["['Koala', '15'", "15,17"],
  ["['Buggy', '1,6,13,14'", "1,6,13,14,17"],
  ["['X Drake', '11,14'", "11,14,17"],
  ["['Eustass Kid', '11,14'", "11,14,17"],
  ["['Killer', '11,14'", "11,14,17"],
  ["['Scratchmen Apoo', '11,14'", "11,14,17"],
  ["['Basil Hawkins', '11,14'", "11,14,17"],
  ["['Capone Bege', '11,14'", "11,14,17"],
];

for (const [busca, temporadas] of cambios) {
  const n = texto.split(busca).length - 1;
  if (n !== 1) throw new Error(`esperaba 1 aparicion de ${busca}, hay ${n}`);
  texto = texto.replace(busca, busca.replace(/'[\d,]+'$/, `'${temporadas}'`));
}

writeFileSync(ruta, texto);
console.log("ok", cambios.length);
