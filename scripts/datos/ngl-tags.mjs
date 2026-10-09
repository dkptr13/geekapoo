// ETIQUETAS - No Game No Life
//
// Formato: 'nombre del personaje': ['etiqueta', ...]
//
// Maximo 40 caracteres por etiqueta (`MAX_TAG`).
//
// ── LA REGLA DE LA SERIE ──────────────────────────────────────────
//
// En este mundo no hay bandos buenos y malos. Hay gente que juega con
// las reglas escritas y gente que las reescribe, y los dos bandos los
// escriben con las mismas letras.
//
// Por eso Sora y Shiro llevan las mismas etiquetas. No es que se
// parezcan: es que la diferencia entre ellos es de orden y la que hay
// entre el resto de los personajes no se ve.
//
// Tet y Azriel llevan la de antagonista no por ser malvados, sino por
// ser los que escribir el tablero. Los dos estan en el bando que la
// serie siempre gana y los dos pierden.
//
// ── LA FAMILIA DOLA ───────────────────────────────────────────────
//
// Los cuatro Dola que salen aqui (los dos de la serie, los dos de la
// pelicula y Stephanie) tienen el mismo trabajo en las dos historias:
// cargar con una guerra que no eligieron. Lo unico que cambia es la
// epoca.

export const TAGS = {
  // ── Los dos ────────────────────────────────────────────────────
  Sora: ['Destacados', 'Protagonista', 'El que habla', 'No sabe jugar'],
  Shiro: ['Destacados', 'Protagonista', 'La que juega', 'Paga el final'],
  Jibril: ['Destacados', 'El dios del cielo', 'Ochocientos años', 'Debe una guerra'],
  'Stephanie Dola': ['Destacados', 'La princesa', 'Se ofrece'],
  Tet: ['Antagonista', 'El único dios', 'Escribe las reglas'],

  // ── La familia de la película ─────────────────────────────────
  'Riku Dola': ['El hermano mayor', 'Carga con todo'],
  'Couronna Dola': ['La hermana mayor', 'Se sacrifica'],
  'Schwi Dola': ['El pequeño', 'Atrapado entre dos guerras'],

  // ── El bando contrario ─────────────────────────────────────────
  Azriel: ['Antagonista', 'Ochocientos años', 'Falla en su estimación'],
  'Think Nirvalen': ['Antagonista', 'El dios antiguo', 'También fue Fiel'],
  Einzig: ['Las cuentas', 'Sabe que se ha perdido'],
  'Nonna Zell': ['El otro bando', 'Dice lo que todos piensan'],
  'Ivan Zell': ['El más joven', 'Quiere ganar'],
  Arrei: ['Una fila'],
  Artosh: ['El dios de la guerra', 'Nombre distinto en cada fuente'],

  // ── Los que están con ellos ────────────────────────────────────
  'Chlammy Zell': ['La primera esclava', 'Amiga de Shiro'],
  'Fiel Nilvalen': ['Explica el juego', 'Cinqüentos años de edad'],
  'Mahakoht Dola': ['El último rey', 'Solo en retrosiepsis'.replace('retrosiepsis', 'retrospectiva')],
  'Izuna Hatsuse': ['De los que se hicieron cargo'],
  'Ino Hatsuse': ['El hermano mayor', 'No pudo con el cuerpo'],
};