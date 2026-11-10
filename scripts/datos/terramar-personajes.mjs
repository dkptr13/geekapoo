// PERSONAJES - Cuentos de Terramar
//
// Formato: [nombre, temporada, rol, nombre japonés, voz, resumen]
//
// Película única: todos van con la temporada vacía. El reparto sigue
// los roles de AniList (1829): Ged, Arren, Therru y Tenar son MAIN;
// Cob, Hare, el rey, la reina, la vendedora de telas y el vendedor de
// hazia van como SUPPORTING.
//
// AniList llama Kumo y Usagi a Cob y Hare. Se usan los nombres
// internacionales que da la Wikipedia inglesa y se conservan los
// kanji de AniList. Las descripciones son propias, en castellano.

const TODAS = '';

export const PERSONAJES = [
  ['Ged', TODAS, 'main', 'ゲド', 'Bunta Sugawara',
   'El archimago de Terramar, también conocido como Gavilán. Recorre el mundo tratando de averiguar por qué la magia se debilita y los dragones aparecen en aguas humanas. Se convierte en mentor de Arren y se enfrenta a su viejo enemigo Cob.'],

  ['Arren', TODAS, 'main', 'アレン', 'Junichi Okada',
   'El príncipe de Enlad. Huye de su reino después de matar a su padre, perseguido por una sombra que representa su miedo a la muerte. Encuentra en Ged un maestro y en Therru una amiga, pero su lado oscuro no deja de crecer.'],

  ['Therru', TODAS, 'main', 'テルー', 'Aoi Teshima',
   'Una joven marcada por las quemaduras y por el abandono de sus padres. Vive con Tenar en una casa apartada y desconfía de los desconocidos. Su vínculo con Arren y su verdadera naturaleza serán decisivos en el desenlace.'],

  ['Tenar', TODAS, 'main', 'テナー', 'Jun Fubuki',
   'Una antigua sacerdotisa de las Tumbas de Atuan que vive retirada con Therru. Conoce el verdadero nombre de Ged y lo ayuda a recuperarse. Su calma y su experiencia contrastan con la urgencia de Arren.'],

  ['Cob', TODAS, 'supporting', 'クモ', 'Yuko Tanaka',
   'Un mago que ha cruzado los límites de la vida y la muerte para alcanzar la inmortalidad. Antiguo rival de Ged, busca vengarse de él y desequilibrar Terramar. Su aspecto andrógino y su poder lo convierten en la amenaza principal.'],

  ['Hare', TODAS, 'supporting', 'ウサギ', 'Teruyuki Kagawa',
   'El jefe de los cazadores de esclavos al servicio de Cob. Es cobarde y cruel, y se aprovecha del poder de su amo para atemorizar a los aldeanos. Su encuentro con Arren y Therru desencadena parte del conflicto.'],

  ['Rey de Enlad', TODAS, 'supporting', '国王', 'Kaoru Kobayashi',
   'El rey de Enlad y padre de Arren. Preocupado por los extraños fenómenos que afectan a su reino, intenta preparar a su hijo para que lo suceda. Muere a manos de Arren en el primer acto.'],

  ['Reina de Enlad', TODAS, 'supporting', '王妃', 'Yui Natsukawa',
   'La madre de Arren. Es estricta con su hijo y cree que ya tiene edad para asumir sus responsabilidades. Su dolor tras la muerte del rey marca el destino de Arren.'],

  ['Vendedora de telas', TODAS, 'supporting', '女主人', 'Mitsuko Baisho',
   'Una antigua hechicera que ahora regenta una tienda de telas en Hort Town. Ha perdido la fe en la magia y sobrevive vendiendo imitaciones. Aconseja a Arren sobre el peligro de sus impulsos.'],

  ['Vendedor de hazia', TODAS, 'supporting', 'ハジア売り', 'Takashi Naito',
   'Un traficante de hazia, una droga que separa el espíritu del cuerpo y acaba matando a quien la consume. Intenta convencer a Arren de que pruebe la sustancia hasta que Ged lo detiene.'],
];
