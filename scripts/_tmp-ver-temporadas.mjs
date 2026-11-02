import { PERSONAJES } from "./datos/op-personajes.mjs";
const nombres = ["Tony Tony Chopper","Nico Robin","Brook","Franky","Trafalgar Law","Smoker","Tashigi","Donquixote Doflamingo","Aokiji","Akainu","Sengoku","Tsuru","Sabo","Koala","Buggy","X Drake","Eustass Kid","Killer","Scratchmen Apoo","Basil Hawkins","Capone Bege","Jewelry Bonney","Urouge"];
for (const n of nombres) {
  const p = PERSONAJES.find((x) => x[0] === n);
  console.log(`${n}\t${p ? p[1] : "NO EXISTE"}`);
}
console.log("total", PERSONAJES.length);
