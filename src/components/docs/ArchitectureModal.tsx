import React, { useState } from 'react';
import { X, Code2, Database, Shield, Server, FolderTree, Copy, Check } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'rules' | 'api' | 'tree'>('overview');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const firestoreSchemaText = `// ==========================================
// ESQUEMA REAL DE FIRESTORE - GEEKAPOO.COM
// ==========================================
// Este documento refleja lo que hay realmente en la base de
// datos. Todas las fechas se guardan como "Timestamp" de
// Firestore y se convierten a texto ISO al leerlas en el
// cliente, porque new Date(unTimestamp) devuelve Invalid Date.

// 1. USERS: users/{uid}  (documento PÚBLICO)
{
  "uid": "firebase_uid",
  "username": "Otaku2005",
  "displayName": "Otaku2005",
  "chatId": "GK-8842-OTAK",
  "avatarUrl": "https://...",
  "bio": "Amante del anime y debates sin filtro",
  "role": "user" | "moderator" | "admin",
  "createdAt": Timestamp,
  "lastSeen": "En línea",   // texto ya formateado, NO es una fecha

  // Señales públicas de privacidad. Los ajustes completos están
  // en userPrivate: aquí solo lo mínimo para pintar el perfil.
  "privateProfile": false,
  "activityHidden": false
}
// Lo privado vive APARTE, porque las reglas son por documento:
//   userPrivate/{uid} → { email, privacy, chatApariencia,
//                         regionPreferida, updatedAt }
// Solo lo lee su dueño; un admin puede leerlo para el panel.
//
// Y una subcolección con la lista de bloqueados:
//   users/{uid}/blocked/{blockedUid} → { blockedAt }
// Solo la lee su dueño. Antes cualquier persona con sesión podía
// recorrerla y deducir a quién tiene bloqueado cada uno.

// 2. ANIMES: animes/{animeId}
{
  "title": "Kaguya-sama: Love is War",
  "slug": "kaguya-sama-love-is-war",
  "synopsis": "En la prestigiosa Academia Shuchiin...",
  "coverUrl": "https://...",
  "bannerUrl": "https://...",
  "coverFocus": { "x": 0.5, "y": 0.5 },
  "bannerFocus": { "x": 0.5, "y": 0.5 },

  // ── Lo que es de la serie entera ──
  "category": "Romance & Comedia",  // coincide con CATEGORIES.name
  "categories": ["Romance & Comedia"],
  "genres": ["Romance", "Comedia"],
  // Formato ANTIGUO. Se conserva por compatibilidad, pero no
  // confirma disponibilidad en ningún país: la wiki lo enseña como
  // «Sin verificar» hasta que haya una fila regional.
  "streaming": [{ "name": "Crunchyroll", "url": "https://..." }],

  // ── La BASE de la ficha, heredada por las temporadas ──
  // El año, el estado, el estudio, la puntuación, los capítulos y
  // las imágenes son de cada temporada. Aquí están solo como
  // valor por defecto: los usan las tarjetas del catálogo, el
  // buscador y la barra lateral, que enseñan la serie y no una
  // temporada concreta.
  //
  // Al guardar la ficha de la temporada 1, sus valores se copian
  // aquí (ver saveSeasonFields), con dos excepciones: el nombre de
  // la temporada, que es su subtítulo, y el estado, que se
  // traduce ("En emisión" → "emitiendo").
  "year": 2019,
  "status": "finished",
  "studio": "A-1 Pictures",
  "rating": 8.5,
  "episodesCount": 12,

  "likesCount": 0,
  "likedBy": [],          // likesCount SIEMPRE es likedBy.length
  "commentsCount": 0     // este lo mantiene la Cloud Function
}

// 2b. DISPONIBILIDAD REGIONAL: streamingAvailability/{id}
// El id es determinista: {animeId}__{platformId}__{region}.
// Vive fuera del anime para que la wiki pida SOLO la obra y la
// región seleccionadas, y para que una fila se pueda editar o
// borrar sin tocar la ficha. Las series y las películas usan el
// mismo campo "animeId".
{
  "animeId": "kaguya-sama-love-is-war",
  "platformId": "crunchyroll",   // id de streamingPlatforms
  "region": "ES",                // código ISO en mayúsculas
  "status": "available" | "unavailable" | "unverified",
  "accessType": "subscription" | "rental" | "purchase" |
                "free_ads" | "unknown",
  "url": "https://...",          // solo se muestra si está disponible
  "verifiedAt": "2026-03-12",    // YYYY-MM-DD, opcional
  "updatedAt": Timestamp
}

// anime.streaming (fichas antiguas) se conserva sin migrar. Si una
// plataforma antigua no tiene fila regional, se pinta «Sin verificar»
// y sin enlace; nunca se da por disponible en todos los países.

// CATÁLOGO: streamingPlatforms/{platformId}
// Se reutiliza entre todas las obras; la disponibilidad guarda el
// id, no una copia. El panel puede añadir plataformas nuevas.
{ "name": "Crunchyroll", "badgeColor": "#f47521",
  "logoUrl": "https://...", "order": 20, "createdAt": Timestamp }

// CATÁLOGO: streamingRegions/{code}
// Los diez países iniciales viven también en el código; los nuevos
// se añaden desde el panel sin rediseñar las fichas.
{ "name": "España", "order": 10, "createdAt": Timestamp }

// Lectura pública, escritura solo para admin/moderador. Consulta
// de la wiki: where("animeId","==",id) + where("region","==",región).
// Requiere desplegar las reglas y el índice compuesto animeId+region.

// 3. SEASONS: seasons/{seasonId}
// Colección PLANA, no subcolección de animes: la wiki consulta
// todas las temporadas de golpe y así pinta el selector sin una
// lectura por cada serie.
//
// El id lo compone el panel con el anime y el número
// ("kaguya-sama-love-is-war-s2"), no Firestore, para poder abrir
// la temporada por URL sin buscarla antes.
//
// LA FICHA ES DE CADA TEMPORADA: la 2 puede tener otro estudio,
// otro año, otra puntuación y otras imágenes que la 1. Todo lo de
// aquí es opcional y, cuando falta, la wiki lo hereda del anime
// (utils/seasonData.ts → fichaDe). Por eso un catálogo antiguo, con
// todo en el anime y sin temporadas, se ve exactamente igual sin
// tocar un documento.
{
  "animeId": "kaguya-sama-love-is-war",
  "number": 2,
  "title": "Segunda Parte",   // subtítulo, no el nombre de la serie
  "synopsis": "...",
  "year": 2022,
  "status": "En emisión",     // "En emisión" | "Finalizado" | "Próximamente"
  "studio": "A-1 Pictures",   // ficha técnica
  "rating": 8.8,
  "episodesCount": 0,         // lo recalcula el editor

  // Imágenes PROPIAS. "posterUrl" es la portada vertical (la del
  // recuadro junto al título) y "bannerUrl" el horizontal del
  // hero. Los dos son opcionales: sin banner propio, la wiki
  // enseña el de la serie.
  "posterUrl": "https://...",
  "bannerUrl": "https://...",
  "posterFocus": { "x": 0.5, "y": 0.5 },  // recorta la portada
  "bannerFocus": { "x": 0.5, "y": 0.5 },  // recorta el banner

  "createdAt": Timestamp
}

// 4. EPISODES: episodes/{episodeId}
// Colección PLANA, no subcolección. Se relaciona con el anime
// mediante el campo "animeId", y con la temporada mediante
// "seasonId" (opcional: lo que no lo tiene es la temporada 1).
{
  "animeId": "kaguya-sama-love-is-war",
  "number": 1,
  "title": "Quiero que te declares",
  "description": "Miyuki y Kaguya desatan su duelo mental...",
  "thumbnailUrl": "https://...",
  "airDate": "2019-01-12",
  "likesCount": 0,
  "likedBy": []
}

// 5. CHARACTERS: characters/{characterId}
// También colección plana, ligada con "animeId". Las temporadas
// van en "seasonIds", un ARRAY: un personaje puede salir en varias
// (Kaguya, en las tres). VACÍO = COMPARTIDO, sale en todas. El
// "seasonId" a secas es el campo viejo y solo se lee por
// compatibilidad con lo que ya había.
{
  "animeId": "kaguya-sama-love-is-war",
  "seasonIds": ["kaguya-sama-love-is-war-s1", "kaguya-sama-love-is-war-s2"],
  "name": "Kaguya Shinomiya",
  "slug": "kaguya-shinomiya",
  "imageUrl": "https://...",
  "description": "Vicepresidenta del consejo estudiantil...",
  "role": "main" | "supporting" | "antagonist",
  "likesCount": 0,
  "likedBy": []
}

// 6. CATEGORIES: categories/{categoryId}
// "animeCount" lo recalcula la migración; "threadsCount" lo
// ajusta solo el usuario al publicar o borrar un hilo.
{
  "id": "romance",
  "name": "Romance & Comedia",
  "slug": "romance",
  "description": "Enredos amorosos y risas aseguradas.",
  "animeCount": 1,
  "threadsCount": 0,
  "color": "from-pink-500/20 ..."
}

// 7. THREADS: threads/{threadId}
// El id NO se guarda dentro del documento: es el que genera
// Firestore. Guardarlo era un bug, porque las consultas mapeaban
// d.data() sin d.id y los "me gusta" no encontraban el hilo.
{
  "authorId": "uid",
  "authorName": "Otaku2005",   // denormalizado para no hacer join
  "authorAvatar": "https://...",
  "title": "¿Cuál es vuestro anime favorito?",
  "body": "...",
  "categoryId": "romance",
  "categoryName": "Romance & Comedia",
  "tags": ["debate", "kaguya"],
  // Los tres contadores los escribe SOLO la Cloud Function. El
  // cliente da o quita su "me gusta" en la subcolección de abajo.
  "likesCount": 0,
  "likedBy": [],
  "commentsCount": 0,
  "pinned": false,
  "createdAt": Timestamp,

  // ── Encuesta OPCIONAL ──
  // Solo existe si el autor la añadió al publicar. Sin
  // contadores a propósito: el resumen lo calcula el servidor a
  // partir de los votos. Ver más abajo.
  "poll": {
    "question": "¿Quién gana este combate?",
    // Mapa id → texto (no una lista) porque es lo que las
    // reglas saben comprobar: "optionId in poll.options".
    "options": { "o1": "Goku", "o2": "Saitama", "o3": "Naruto" },
    "expiresAt": Timestamp | null,   // null = sin fecha de cierre
    "isClosed": false,
    "allowChangeVote": false
  },

  // Caché de reacciones. La escribe la Cloud Function
  // (onReactionChanged) con el Admin SDK; el cliente solo la
  // lee y las reglas le impiden tocarla.
  "reactionCounts": { "fire": 12, "laugh": 3 },
  "reactionsTotal": 15
}

// VOTOS DE LA ENCUESTA: threads/{threadId}/pollVotes/{uid}
// El id ES el uid. Ahí está la garantía de "un solo voto": no
// hay forma de tener dos documentos con el mismo id.
// El voto es PRIVADO: solo lo lee quien votó y nadie puede
// listar la subcolección, ni siquiera el equipo.
{ "userId": "uid", "optionId": "o1", "createdAt": Timestamp }

// RESUMEN DE LA ENCUESTA: pollStats/{threadId}
// Fuente de resultados de la tarjeta. La calcula el servidor
// contando los votos de arriba; el cliente solo la lee y no
// puede escribirla (allow write: false).
// En chats: chats/{chatId}/messages/{messageId}/pollStats/summary
{ "threadId": "...", "options": { "o1": 42 }, "totalVotes": 57,
  "actualizadoAt": Timestamp }

// ME GUSTA DE HILO: threads/{threadId}/likes/{uid}
// Un documento por persona y el uid como id: no hay forma de
// duplicarlo ni de escribir el de otra persona. Al crearlo o
// borrarlo, la Cloud Function recalcula "likedBy" y "likesCount"
// del hilo. Mismo patrón en comments/{commentId}/likes/{uid}.
{ "userId": "uid", "createdAt": Timestamp }

// 8. COMMENTS: comments/{commentId}
// Polimórficos: el mismo comentario puede apuntar a un hilo,
// un anime, un episodio o un personaje.
{
  "authorId": "uid",
  "authorName": "Otaku2005",
  "authorAvatar": "https://...",
  "targetType": "thread" | "anime" | "episode" | "character",
  "targetId": "kaguya-ep-1",
  "parentId": null,
  "body": "El ending de Chika es historia pura.",
  // Contadores del servidor, igual que en el hilo.
  "likesCount": 0,
  "likedBy": [],
  "createdAt": Timestamp,

  // ── GIF adjunto (como mucho uno, y en vez de la imagen) ──
  // NO se sube a Storage: el archivo se sigue sirviendo desde
  // el CDN del proveedor y aquí solo se guarda lo justo para
  // dibujarlo. Las reglas comprueban que las URLs sean de
  // verdad de media.giphy.com o media.tenor.com.
  "gif": {
    "provider": "giphy" | "tenor",
    "id": "abc123",
    "url": "https://media3.giphy.com/media/abc123/giphy.gif",
    "previewUrl": "https://media3.giphy.com/media/abc123/100w.gif",
    "width": 480, "height": 270
  },

  "reactionCounts": { "fire": 3 },   // caché del servidor
  "reactionsTotal": 3
}

// 8b. REACTIONS: reactions/{reac_<tipo>_<id>_<uid>}
// Una reacción por persona y por contenido, GARANTIZADO por el
// id: cambiar de 🔥 a 😂 edita el mismo documento y no puede
// haber dos a la vez. Los contadores que ve el usuario se
// cuentan a partir de estos documentos, que son la verdad;
// "reactionCounts" del hilo o del comentario es la caché.
//
// Hilos y comentarios se leen sin sesión. Las reacciones a un
// mensaje de chat NO: solo las lee un miembro del chat, y por eso
// llevan "chatId" obligatorio.
{
  "targetType": "thread" | "comment" | "chat_message",
  "targetId": "abc123",
  "chatId": "chat1",          // SOLO si targetType == "chat_message"
  "userId": "uid",
  "type": "fire" | "shocked" | "laugh" | "cry" | "trophy",
  "userName": "Otaku2005",   // para listar quién reaccionar con qué
  "createdAt": Timestamp
}

// 8c. BÚSQUEDA DE GIFs (solo en el cliente)
// El buscador llama a la API de GIPHY o de Tenor y guarda el
// resultado en el estado del formulario. Con la Cloud Function
// "buscarGifs" de por medio (lo recomendado) la clave se queda
// en el servidor; con VITE_GIPHY_API_KEY va directa desde el
// navegador. El archivo nunca pasa por Firebase.

// 9. TRIVIA_EXTRAS: trivia_extras/{triviaId}
// OJO: aquí el contador se llama "likes", no "likesCount".
{
  "title": "El baile rotoscópico de Chika Fujiwara",
  "characterOrAnime": "Kaguya-sama: Love is War",
  "fact": "El ending fue animado a mano, fotograma a fotograma.",
  "imageUrl": "https://...",
  "category": "Animación",
  "likes": 0,
  "likedBy": []
}

// 10. MASCOT_DIALOGUES: mascot_dialogues/{dialogueId}
{ "id": "mascot-1", "text": "¡Bienvenido a geekapoo!" }

// 11. SUPPORT_TICKETS: support_tickets/{ticketId}
{
  "trackingId": "GK-TK-12345",  // el que ve el usuario
  "userId": "uid",
  "userName": "Otaku2005",
  "contactEmail": "correo@email.com",
  "category": "bug" | "suggestion" | "account" | "report",
  "subject": "No puedo publicar un hilo",
  "message": "...",
  "status": "open",
  "createdAt": Timestamp
}

// ==========================================
// CHATS - PENDIENTE DE MIGRAR A FIREBASE
// ==========================================
// Los chats siguen guardados en localStorage del navegador
// (ChatContext.tsx). No se sincronizan entre dispositivos y no
// cumplen estas reglas hasta que se porten a Firestore.
// El esquema previsto es:

// CHATS: chats/{chatId}
{ "type": "direct" | "group", "name": "Consejo Shuchiin",
  "ownerId": "uid", "memberIds": ["uid1", "uid2"],
  "createdAt": Timestamp, "lastMessageAt": Timestamp }

// CHATS/{chatId}/members/{uid}
{ "joinedAt": Timestamp }

// CHATS/{chatId}/messages/{messageId}
{ "senderId": "uid", "body": "¡Hola a todos!",
  "createdAt": Timestamp, "type": "text" }

// En los chats también se puede mandar un GIF, y el cuerpo puede
// quedar vacío si lo lleva (un mensaje no puede estar vacío, pero
// puede no tener texto). La URL se comprueba igual que en los
// comentarios: tiene que ser del CDN de GIPHY o de Tenor.
{ "senderId": "uid", "body": "", "type": "gif",
  "gif": { "provider": "giphy", "id": "abc123",
           "url": "https://media3.giphy.com/media/abc123/giphy.gif",
           "previewUrl": "https://media3.giphy.com/media/abc123/100w.gif" } }

// Y los mensajes también se pueden reaccionar, con la MISMA
// colección plana "reactions/" de los hilos y los comentarios.
// Lo que los distingue es el campo "chatId": sin él, las reglas
// no podrían comprobar que quien reacciona es miembro de ese
// chat, y cualquiera podría reaccionar a un mensaje ajeno.
//
// (Las reacciones empezaron siendo cinco; ahora la clave es la de
// un emoji del catálogo de src/data/emojis.ts, y las reglas
// comprueban el formato ^[a-z0-9_]{1,24}$ en vez de una lista
// cerrada, porque con doscientos emojis esa lista sería ilegible.)
// reactions/{reac_chat_message_<messageId>_<uid>}
{ "targetType": "chat_message", "targetId": "messageId",
  "chatId": "chatId", "userId": "uid", "type": "fire" }

// CANALES DE UN CLUB: clubs/{clubId}/channels/{channelId}
// El id ES el slug interno (inmutable: renombrar cambia el
// nombre, nunca el id). Cada canal tiene su propio documento
// de chats/ con el historial en messages/, así que reutiliza
// tiempo real, recibos, sin leer, encuestas y moderación.
// La pertenencia de cada chat se sincroniza con la del club:
// all = todos los miembros, mods = solo el equipo.
{ "id": "teorias", "clubId": "club-de-frieren", "chatId": "abc123",
  "name": "teorias", "description": "Teorías y debates",
  "type": "text", "visibility": "all" | "mods", "spoiler": false,
  "order": 1, "createdBy": "uid",
  "createdAt": Timestamp, "updatedAt": Timestamp }
// El general nace con el club; en clubes antiguos lo migra
// el primer miembro que lo abre, reutilizando su chat
// histórico (no se pierde ningún mensaje). No se borra nunca.

// FAVORITOS: lo que el usuario usa siempre, para no buscarlo
// cada vez. Van colgados del documento del usuario y son
// PRIVADOS: solo su dueño puede leerlos o escribirlos.
//
// Un documento por favorito, y no un array en "users/{uid}": en un
// array hay que leer el documento entero y reescribirlo para
// cambiar una entrada, así que dos pulsaciones seguidas (quitar 🔥
// y poner 😂) se pisan y se pierde una. Con un documento por
// favorito, cada pulsación va a su sitio.
//
// El id del documento ES la clave del emoji, así que no hay ni
// que filtrar duplicados ni comprobar nada.
// users/{uid}/favoriteEmojis/{claveDelEmoji}
{ "emojiKey": "fire", "createdAt": Timestamp }

// De los GIFs se guarda la ficha COMPLETA (no solo el id) para
// poder volver a insertarlo sin llamar a la API otra vez: si solo
// se guardara el id, "favoritos" sería un buscador que además
// cobra por abrir. Las reglas comprueban las URLs con el mismo
// "gifValido" que comentarios y mensajes, porque este campo es
// exactamente el tipo de hueco que hay que vigilar.
// users/{uid}/favoriteGifs/{idDelGif}
{ "gifId": "abc123", "gif": { "provider": "giphy", "id": "abc123",
    "url": "https://media3.giphy.com/media/abc123/giphy.gif",
    "previewUrl": "https://media3.giphy.com/media/abc123/100w.gif" },
  "createdAt": Timestamp }

// CHATS/{chatId} DEBE tener este índice compuesto:
//   memberIds (CONTAINS) + lastMessageAt (DESC)`;

  const securityRulesText = `// ==========================================
// REGLAS REALES DE SEGURIDAD (firestore.rules)
// ==========================================
// Este es un RESUMEN. La versión completa y que está
// desplegada está en el archivo firestore.rules del proyecto.
//
// Punto clave: "role" es un campo normal del documento, no un
// Custom Claim. La regla de /users impide que alguien se lo
// asigne a sí mismo, y solo un admin existente puede crear
// otros admins.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isSelf(uid)   { return isSignedIn() && request.auth.uid == uid; }

    function hasProfile() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    function myRole() {
      return hasProfile()
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        : null;
    }
    function isAdmin() { return myRole() == 'admin'; }
    function isModerator() { return myRole() == 'admin' || myRole() == 'moderator'; }

    // El baneo vive en accountRestrictions/{uid}, que solo escriben
    // las Cloud Functions con el Admin SDK. El campo antiguo
    // users/{uid}.isBanned se acepta como respaldo de lectura
    // mientras dura la migración, pero el cliente ya no lo escribe.
    function isBanned() {
      // Si existe el registro duradero, manda él, esté activo o
      // levantado. La bandera pública solo cubre cuentas sin migrar.
      return isSignedIn()
          && exists(/databases/$(database)/documents/accountRestrictions/$(request.auth.uid))
        ? (get(/databases/$(database)/documents/accountRestrictions/$(request.auth.uid)).data.activo == true
           && get(/databases/$(database)/documents/accountRestrictions/$(request.auth.uid)).data.tipo == 'ban')
        : (hasProfile()
           && 'isBanned' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data
           && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isBanned == true);
    }
    function isActive() { return isSignedIn() && hasProfile() && !isBanned(); }

    // El registro de sanciones solo lo escribe el servidor.
    match /accountRestrictions/{uid} {
      allow read: if isSignedIn()
                  && (request.auth.uid == uid || isAdmin() || isModerator());
      allow write: if false;
    }

    // Perfil público: sin correo, sin preferencias privadas y sin
    // estado de sanción. Esas claves se rechazan aunque sea el dueño.
    match /users/{uid} {
      allow read: if isSignedIn();
      allow create: if !request.resource.data.keys().hasAny(
                          ['email','isBanned','profileVisibility',
                           'allowChatRequests','showActivity',
                           'chatApariencia','regionPreferida'])
                    && (isAdmin()
                        || (isSelf(uid) && request.resource.data.role == 'user'));
      allow update: if !request.resource.data.diff(resource.data)
                          .affectedKeys().hasAny(
                            ['email','isBanned','profileVisibility',
                             'allowChatRequests','showActivity',
                             'chatApariencia','regionPreferida'])
                    && (isAdmin()
                        || (isSelf(uid)
                            && !request.resource.data.diff(resource.data)
                                 .affectedKeys().hasAny(['role','chatId','uid'])));
      allow delete: if isAdmin() || isSelf(uid);

      // Lista de bloqueados: privada de su dueño, también para el
      // equipo. No es información pública.
      match /blocked/{blockedUid} {
        allow read, create, delete: if isSelf(uid);
        allow update: if false;
      }
    }

    // Datos privados: dueño lee/escribe, admin lee y lista,
    // moderador y demás usuarios no.
    match /userPrivate/{uid} {
      allow get: if isSelf(uid) || isAdmin();
      allow list: if isAdmin();
      allow create, update: if isSelf(uid);
      allow delete: if isSelf(uid) || isAdmin();
    }

    // Votos anónimos: solo se lee el propio; nada de listar.
    // El resumen lo escribe únicamente la Cloud Function.
    match /threads/{threadId}/pollVotes/{uid} {
      allow get: if isSelf(uid);
      allow list: if false;
      allow create, update: if isSelf(uid);
      allow delete: if isModerator();
    }
    match /pollStats/{threadId} {
      allow read: if true;
      allow write: if false;
    }

    // Catálogo: lectura pública, escritura solo admin
    match /animes/{id}           { allow read: if true; allow write: if isAdmin(); }
    match /episodes/{id}         { allow read: if true; allow write: if isAdmin(); }
    match /characters/{id}       { allow read: if true; allow write: if isAdmin(); }
    match /trivia_extras/{id}    { allow read: if true; allow write: if isAdmin(); }
    match /mascot_dialogues/{id}{ allow read: if true; allow write: if isAdmin(); }

    // Disponibilidad regional: lectura pública; la disponibilidad
    // solo la escribe el equipo. La forma de la fila se valida.
    match /streamingAvailability/{id} {
      allow read: if true;
      allow create, update: if (isAdmin() || isModerator())
                              && request.resource.data.animeId is string
                              && request.resource.data.platformId is string
                              && request.resource.data.region is string
                              && request.resource.data.status in
                                 ['available','unavailable','unverified'];
      allow delete: if isAdmin() || isModerator();
    }
    match /streamingPlatforms/{id} { allow read: if true; allow write: if isModerator(); }
    match /streamingRegions/{id}   { allow read: if true; allow write: if isModerator(); }

    // El contador de hilos lo ajusta el usuario al publicar,
    // pero SOLO ese campo: el resto es del admin.
    match /categories/{id} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin()
                    || (isActive()
                        && request.resource.data.diff(resource.data)
                             .affectedKeys().hasOnly(['threadsCount']));
    }

    match /threads/{threadId} {
      allow read: if true;
      allow create: if isActive()
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.title is string
                    && request.resource.data.title.size() > 0
                    && request.resource.data.title.size() <= 200
                    && request.resource.data.body.size() <= 10000
                    && (!('poll' in request.resource.data)
                        || pollValido(request.resource.data.poll));
      // El autor edita su hilo. Los contadores de "me gusta" y de
      // comentarios NO los toca nadie desde el cliente: los
      // mantiene la Cloud Function.
      allow update: if isAdmin()
                    || (isSignedIn()
                        && resource.data.authorId == request.auth.uid
                        && request.resource.data.diff(resource.data)
                             .affectedKeys().hasOnly(['title','body','tags','pinned']))
                    || (isSignedIn()
                        && hayPoll(threadId)
                        && resource.data.authorId == request.auth.uid
                        && request.resource.data.diff(resource.data)
                             .affectedKeys().hasOnly(['poll.isClosed','poll'])
                        && pollSoloCambiaIsClosed(threadId));
      allow delete: if isAdmin()
                    || (isSignedIn() && resource.data.authorId == request.auth.uid);

      // Un "me gusta" por persona, con el uid como id. Sin update:
      // se pone creando y se quita borrando. El agregado del padre
      // lo escribe el servidor desde esta subcolección.
      match /likes/{uid} {
        allow read: if true;
        allow create: if isActive()
                      && request.auth.uid == uid
                      && request.resource.data.userId == uid;
        allow update: if false;
        allow delete: if isActive() && request.auth.uid == uid;
      }
    }

    match /comments/{commentId} {
      allow read: if true;
      // Texto, imagen o GIF: siempre algo, pero nunca nada.
      allow create: if isActive()
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.body.size() <= 5000
                    && (request.resource.data.body.size() > 0
                        || 'gif' in request.resource.data
                        || 'imageUrl' in request.resource.data)
                    && (!('gif' in request.resource.data)
                        || gifValido(request.resource.data.gif));
      allow update: if isAdmin()
                    || (isSignedIn()
                        && resource.data.authorId == request.auth.uid
                        && request.resource.data.diff(resource.data)
                             .affectedKeys().hasOnly(['body']));
      allow delete: if isAdmin()
                    || (isSignedIn() && resource.data.authorId == request.auth.uid);

      match /likes/{uid} {
        allow read: if true;
        allow create: if isActive()
                      && request.auth.uid == uid
                      && request.resource.data.userId == uid;
        allow update: if false;
        allow delete: if isActive() && request.auth.uid == uid;
      }
    }

    // ── ENCUESTAS ─────────────────────────────────────
    // Los votos son un documento por persona y el voto es
    // privado: solo se lee el propio y no se puede listar.
    // Los resultados salen de pollStats.
    match /threads/{threadId}/pollVotes/{uid} {
      allow get: if isSelf(uid);
      allow list: if false;
      allow create: if isActive()
                    && request.auth.uid == uid
                    && pollAbierto(threadId)          // abierta y sin caducar
                    && request.resource.data.optionId in pollDelHilo(threadId).options;
      // Cambiar de opinión, solo si el autor lo permitió.
      allow update: if isActive()
                    && request.auth.uid == uid
                    && pollAbierto(threadId)
                    && pollCambiaVotos(threadId)
                    && request.resource.data.optionId in pollDelHilo(threadId).options
                    && request.resource.data.diff(resource.data)
                         .affectedKeys().hasOnly(['optionId','updatedAt']);
      allow delete: if isModerador();   // moderación
    }

    // ── REACCIONES ───────────────────────────────────
    // El id del documento tiene que ser exactamente el que
    // compone el servicio, y por eso no puede haber dos
    // reacciones de la misma persona sobre lo mismo.
    //
    // Hilos/comentarios: lectura pública. Mensajes: solo un
    // miembro del chat, con chatId y mensaje existente.
      match /reactions/{reactionId} {
        allow get, list: if reaccionPublica(resource.data)
                           || reaccionDeChatAutorizada(resource.data);
        allow create: if isActive()
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.type.matches('^[a-z0-9_]{1,24}$')
                    && reaccionTieneChatIdCoherente(request.resource.data)
                    && reactionId ==
                       'reac_' + request.resource.data.targetType + '_'
                       + request.resource.data.targetId + '_' + request.auth.uid
                    && objetivoExiste(request.resource.data.targetType,
                                      request.resource.data.targetId);
        allow update: if isActive()      // solo cambia el tipo
                    && resource.data.userId == request.auth.uid
                    && request.resource.data.diff(resource.data)
                         .affectedKeys().hasOnly(['type','userName','createdAt'])
                    && (reaccionPublica(resource.data)
                        || reaccionDeChatAutorizada(resource.data));
        allow delete: if isActive()
                    && resource.data.userId == request.auth.uid
                    && (reaccionPublica(resource.data)
                        || reaccionDeChatAutorizada(resource.data));
      }

    // Resumen de resultados: lectura pública, imposible de
    // escribir desde el cliente. Solo la Cloud Function.
    match /pollStats/{threadId} { allow read: if true; allow write: if false; }

    // ── REPORTES DE CONTENIDO ──────────────────────────
    //
    // Lo que escribe un usuario al denunciar un comentario o un
    // hilo, y lo que el equipo resuelve en el panel.
    //
    // NO reutiliza los tickets de soporte: un ticket es "no me
    // funciona el buscador" y va suelto; un reporte apunta a un
    // contenido concreto y se resuelve con un borrado o sin
    // hacer nada. En la misma cola, los tickets acabarían
    // llevando un id de comentario y la cola de soporte se
    // llenaría de quejas que nadie puede ordenar.
    //
    // El id es tipo + contenido + uid (unido con guion bajo),
    // igual que en las reacciones y los votos de la trivia: al ser
    // determinista, nadie puede llenar la cola denunciando lo
    // mismo mil veces. Y como tiene que coincidir con el
    // documento, tampoco se puede denunciar en nombre de otro.
    match /reports/{reportId} {
      // Solo el equipo lee la cola: si la leyera cualquiera se
      // sabría qué ha denunciado cada usuario.
      allow read: if isAdmin() || isModerator();
      allow create: if isActive()
                    && request.resource.data.reportadoPor == request.auth.uid
                    && request.resource.data.estado == 'pendiente'
                    && request.resource.data.keys().hasOnly([...])
                    && request.resource.data.targetType in ['thread','comment']
                    && request.resource.data.motivo in [...]
                    && reportId == request.resource.data.targetType + '_'
                       + request.resource.data.targetId + '_'
                       + request.auth.uid
                    // y el contenido tiene que existir
                    && objetivoExiste(request.resource.data.targetType,
                                      request.resource.data.targetId);
      // Cerrar es del equipo, y solo puede tocar el estado y lo
      // que hizo con el contenido. El hasOnly es lo que impide
      // que alguien se auto-asigne el estado "resuelto".
      allow update: if (isAdmin() || isModerator())
                    && request.resource.data.diff(resource.data)
                         .affectedKeys().hasOnly(
                             ['estado','resueltoPor','resueltoAt','accion']);
      allow delete: if isAdmin() || isModerator()
                    || (isActive()
                        && resource.data.reportadoPor == request.auth.uid
                        && resource.data.estado == 'pendiente');
    }

    // Nadie puede leer los tickets salvo moderadores
    match /support_tickets/{id} {
      allow create: if isActive();
      allow read, update, delete: if myRole() == 'admin' || myRole() == 'moderator';
    }

    match /meta/{id} { allow read, write: if isAdmin(); }

    // Cualquier ruta no declarada queda bloqueada
    match /{document=**} { allow read, write: if false; }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30">
              <Code2 size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Arquitectura & Base de Datos</span>
                <span className="rounded-md bg-violet-600/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                  geekapoo.com
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Especificación técnica full-stack para producción
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4 sm:px-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Server size={14} />
            <span>Visión General & Stack</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 whitespace-nowrap transition-all ${
              activeTab === 'schema'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Database size={14} />
            <span>Esquema Firestore NoSQL</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 whitespace-nowrap transition-all ${
              activeTab === 'rules'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
            <span>Security Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 whitespace-nowrap transition-all ${
              activeTab === 'api'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 size={14} />
            <span>Tabla de Endpoints API</span>
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 whitespace-nowrap transition-all ${
              activeTab === 'tree'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <FolderTree size={14} />
            <span>Estructura de Carpetas</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-zinc-300 space-y-4">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-violet-400">
                  Stack Tecnológico Seleccionado
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-850">
                    <strong className="text-white block mb-0.5">Frontend & Framework:</strong>
                    <span className="text-zinc-400">Next.js 16 + React 19 + TypeScript + Tailwind CSS</span>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-850">
                    <strong className="text-white block mb-0.5">Autenticación Segura:</strong>
                    <span className="text-zinc-400">Firebase Auth (Email/Pass + GitHub OAuth)</span>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-850">
                    <strong className="text-white block mb-0.5">Base de Datos NoSQL:</strong>
                    <span className="text-zinc-400">Cloud Firestore (Listeners en tiempo real para chats)</span>
                  </div>
                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-850">
                    <strong className="text-white block mb-0.5">Almacenamiento de Medios:</strong>
                    <span className="text-zinc-400">Firebase Storage (Avatares y fanarts)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Decisión de Arquitectura: ¿Por qué Next.js + Firebase y no Express + MongoDB?
                </h4>
                <p className="leading-relaxed text-zinc-300">
                  Al emplear Next.js con Route Handlers y Firebase (Authentication + Firestore + Storage), eliminamos la sobrecarga de mantener servidores Express separados y bases de datos dispersas. Firestore provee subcolecciones ideales para chats escalables y listeners nativos en tiempo real con latencia de milisegundos.
                </p>
              </div>
            </div>
          )}

          {/* FIRESTORE SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Colecciones y subcolecciones NoSQL para Firestore:</span>
                <button
                  onClick={() => handleCopy(firestoreSchemaText, 'schema')}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-white"
                >
                  {copiedSection === 'schema' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'schema' ? 'Copiado' : 'Copiar esquema'}</span>
                </button>
              </div>
              <pre className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto">
                {firestoreSchemaText}
              </pre>
            </div>
          )}

          {/* SECURITY RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Reglas de seguridad (firestore.rules) con control de acceso RBAC:</span>
                <button
                  onClick={() => handleCopy(securityRulesText, 'rules')}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-white"
                >
                  {copiedSection === 'rules' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'rules' ? 'Copiado' : 'Copiar reglas'}</span>
                </button>
              </div>
              <pre className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto">
                {securityRulesText}
              </pre>
            </div>
          )}

          {/* API ENDPOINTS */}
          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Método</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Autenticación</th>
                      <th className="p-3">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    <tr>
                      <td className="p-3 font-mono text-emerald-400 font-bold">POST</td>
                      <td className="p-3 font-mono text-zinc-200">/api/auth/session</td>
                      <td className="p-3 text-zinc-400">Firebase Token</td>
                      <td className="p-3 text-zinc-300">Crea cookie de sesión HttpOnly segura</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-sky-400 font-bold">GET</td>
                      <td className="p-3 font-mono text-zinc-200">/api/users/by-chat-id</td>
                      <td className="p-3 text-amber-400">Requerida</td>
                      <td className="p-3 text-zinc-300">Buscar contacto por ID único</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400 font-bold">POST</td>
                      <td className="p-3 font-mono text-zinc-200">/api/threads</td>
                      <td className="p-3 text-amber-400">Requerida</td>
                      <td className="p-3 text-zinc-300">Publicar nuevo hilo con tags y categoría</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400 font-bold">POST</td>
                      <td className="p-3 font-mono text-zinc-200">/api/comments</td>
                      <td className="p-3 text-amber-400">Requerida</td>
                      <td className="p-3 text-zinc-300">Comentario condicional a hilos, episodios o personajes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400 font-bold">POST</td>
                      <td className="p-3 font-mono text-zinc-200">/api/chats</td>
                      <td className="p-3 text-amber-400">Requerida</td>
                      <td className="p-3 text-zinc-300">Crear chat 1 a 1 o sala grupal con miembros</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-sky-400 font-bold">GET</td>
                      <td className="p-3 font-mono text-zinc-200">/api/search</td>
                      <td className="p-3 text-zinc-500">Pública</td>
                      <td className="p-3 text-zinc-300">Búsqueda global con filtro por categorías y tags</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROJECT TREE */}
          {activeTab === 'tree' && (
            <pre className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto">
{`geekapoo/
├── public/
│   ├── images/
│   └── mascot/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── navegar/
│   │   │   └── [slug]/page.tsx
│   │   ├── buscar/page.tsx
│   │   ├── chats/page.tsx
│   │   ├── soporte/page.tsx
│   │   ├── extras/page.tsx
│   │   ├── perfil/page.tsx
│   │   └── api/
│   │       ├── auth/session/route.ts
│   │       ├── users/by-chat-id/route.ts
│   │       ├── comments/route.ts
│   │       └── chats/route.ts
│   │
│   ├── components/
│   │   ├── layout/ (Navbar, Sidebar)
│   │   ├── mascot/ (OtakuMascot)
│   │   ├── wiki/ (AnimeWiki)
│   │   ├── chat/ (ChatView)
│   │   └── auth/ (AuthModal)
│   │
│   └── lib/firebase/ (client.ts, admin.ts)
│
├── firestore.rules
├── proxy.ts
└── package.json`}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500"
          >
            Entendido, volver a la app
          </button>
        </div>
      </div>
    </div>
  );
};
