// PERSONAJES - Guardianes de la Noche: Tren Infinito
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. Los roles siguen
// AniList (112151): los cinco protagonistas y Enmu son MAIN; Akaza y
// la familia de Rengoku van como SUPPORTING. Se dejan fuera los
// BACKGROUND y los personajes sin voz.
//
// Nombres, kanji y seiyuus vienen de AniList. Las descripciones son
// propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Tanjirou Kamado', TODAS, 'main', '竈門炭治郎', 'Natsuki Hanae',
   'El protagonista. Sube al tren con la misión de proteger a su hermana y a los pasajeros, y descubre que el enemigo no ataca el cuerpo sino lo que uno más quiere.'],

  ['Nezuko Kamado', TODAS, 'main', '竈門禰豆子', 'Akari Kitou',
   'La hermana de Tanjirou, convertida en demonio pero todavía capaz de reconocer a los suyos. Como no duerme, es la única que sigue en pie cuando Enmu atrapa a los demás y la que protege a los pasajeros mientras sueñan.'],

  ['Inosuke Hashibira', TODAS, 'main', '嘴平伊之助', 'Yoshitsugu Matsuoka',
   'El cazador con máscara de jabalí. Su máscara lo protege de los ataques de Enmu y su instinto lo lleva hasta la columna del demonio cuando el tren se convierte en trampa.'],

  ['Zenitsu Agatsuma', TODAS, 'main', '我妻善逸', 'Hiro Shimono',
   'El espadachín que solo pelea cuando duerme. Enmu lo encierra en un sueño con Nezuko, pero cuando despierta ayuda a Rengoku a proteger a los pasajeros mientras Tanjirou e Inosuke van a por el demonio.'],

  ['Kyoujurou Rengoku', TODAS, 'main', '煉獄杏寿郎', 'Satoshi Hino',
   'El Pilar de la Llama. Toma el mando del grupo con una seguridad que no admite discusión y deja claro que un pilar no abandona a los pasajeros, ni siquiera cuando el enemigo es más fuerte.'],

  ['Enmu', TODAS, 'main', '魘夢', 'Daisuke Hirakawa',
   'El demonio del tren. Disfruta metiendo a la gente en un sueño feliz para devorarla mientras duerme, y trata la pelea como un juego de humillaciones.'],

  ['Akaza', TODAS, 'supporting', '猗窩座', 'Akira Ishida',
   'El demonio de rango superior que aparece al final. No busca pasajeros: busca medirse con Rengoku y demostrarle que un humano no puede ganar por mucho que se esfuerce.'],

  ['Shinjurou Rengoku', TODAS, 'supporting', '煉獄槇寿郎', 'Rikiya Koyama',
   'El padre de Kyoujurou, retirado y amargado. Aparece en los recuerdos del pilar y explica por qué el chico se exige tanto a sí mismo.'],

  ['Senjurou Rengoku', TODAS, 'supporting', '煉獄千寿郎', 'Junya Enoki',
   'El hermano pequeño de Kyoujurou. La carta que le escribe el pilar es uno de los cierres emocionales de la película.'],
];
