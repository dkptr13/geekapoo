# Auditoría y reducción del consumo de Firebase

Fecha: 2026-11-02 (primera fase). Actualizado: 2026-11-04 (tercera fase).

Ámbito: cliente React, contextos, servicios, chats, notificaciones, Wiki, perfiles, panel, Cloud Functions, reglas e índices.

> Este documento separa siempre **llamadas al SDK**, **documentos devueltos** y **estimación de lecturas**.
> No se presentan como facturación real. La factura depende de métricas de Firebase/Google Cloud y de las reglas.

> **Nota de vigencia:** las secciones 1–11 describen la primera fase. La sección 12 documenta la segunda fase y sustituye lo que allí se decía sobre búsqueda con catálogo completo, bloques de 30 series, panel de administración y editor de streaming. La sección 13 documenta la tercera fase: animes y temporadas estáticos, personajes filtrados por temporada, contadores visibles sin abrir la pestaña y disponibilidad de streaming servida desde el índice.

## 1. Resumen ejecutivo

Se ha eliminado la mayor parte del consumo que se producía al entrar en la web:

- Inicio dejó de cargar el catálogo completo de series, episodios, personajes, temporadas y toda la colección de comentarios. Solo pide unas pocas series para la barra lateral.
- La Wiki carga el catálogo de series; al abrir una ficha pide únicamente los datos de esa serie.
- Los buscadores y pestañas globales usan el índice estático desde la segunda fase; la carga completa queda solo como respaldo si el índice no está disponible.
- Los comentarios se leen por objetivo y solo mientras están abiertos.
- El historial de chat se carga en tramos de 80 mensajes, manteniendo el listener en tiempo real.
- Se comparte una caché en memoria y otra persistente en IndexedDB (solo datos públicos) con TTL, deduplicación de peticiones simultáneas, separación por cuenta e invalidación.
- Se corrigieron dependencias de React que reabrían listeners al cambiar XP, medallas o cualquier dato del perfil.
- Se eliminó el listener duplicado del documento del usuario en gamificación y los `ProgressionProvider` anidados.
- Se optimizaron consultas del panel y una lectura duplicada de las Cloud Functions.
- **Segunda fase (2026-11-03):** la búsqueda usa un índice estático servido desde el propio sitio; los filtros de episodios/personajes se cachean y pagina en bloques de 10 series; el panel carga solo la pestaña activa; el editor de streaming no consulta hasta abrir su apartado; las páginas de 60 y sus contadores usan caché persistente. Ver sección 12.
- **Tercera fase (2026-11-04):** la Wiki y los perfiles pintan los animes desde `animes.json` (0 lecturas de la colección); al abrir una ficha se lee solo su documento. Las temporadas vienen de `temporadas.json`, la disponibilidad pública de `streaming.json`, los personajes se filtran por temporada en Firestore con `seasonKeys` y los contadores, igual que los de episodios, se ven sin abrir la pestaña. Ver sección 13.

## 2. Línea base y mediciones

Entorno: Vite en desarrollo, sesión de visitante (sin usuario autenticado), Firestore de producción.  
Instrumentación: `src/lib/firestoreDiagnostics.ts`, activa solo con `import.meta.env.DEV`.

### Inicio en frío

| Escenario | Documentos devueltos | Lecturas estimadas | Listeners permanentes |
|---|---:|---:|---:|
| Antes de diferir el catálogo (medición conservadora) | 11.400 | 11.400 | 13 |
| Después, primera visita | **43** | **43** | **1** |
| Después, recarga dentro del TTL | **7** | **7** | **1** |
| Variación en la primera visita | **−11.357 (−99,6 %)** | **−11.357** | **−12** |

La medición anterior se tomó después de convertir los listeners estáticos en lecturas, pero antes de diferir el catálogo. No incluía la colección completa de comentarios que el código anterior también escuchaba, por lo que el consumo original real era **igual o superior** a 11.400 documentos.

El único listener permanente de Comunidad en Inicio es el feed de hilos. La sesión autenticada añade los listeners propios de Auth y notificaciones; chats, clubes y canales abren los suyos al entrar en su sección.

### Wiki

| Escenario | Antes | Después |
|---|---:|---:|
| Abrir el catálogo de la Wiki | 11.197 documentos | **172 documentos** |
| Abrir una ficha concreta | 11.197 documentos | **63 documentos** |
| Volver a abrir una ficha ya visitada | Nueva lectura completa | **0 lecturas nuevas** (caché en memoria) |
| Recargar la ficha dentro del TTL | Nueva lectura completa | **7 documentos** (solo el feed de hilos) |
| Pestaña global de episodios | 6.659 documentos | **61 documentos** por página |
| Pestaña global de personajes | 4.117 documentos | **61 documentos** por página |
| Filtro por categoría en personajes | 11.204 documentos | **1.449 documentos** |
| Búsqueda de texto global | Colección completa | Colección completa, cacheada 1 hora |

El catálogo de la Wiki baja un **98,5 %** (11.197 → 172). La ficha medida fue `Kaguya-sama: Love is War`: 4 temporadas, 14 personajes, 40 episodios y 5 filas de disponibilidad; baja un **99,4 %** (11.197 → 63).

### Comentarios

| Escenario | Antes | Después |
|---|---:|---:|
| Cualquier visita | Listener de toda la colección `comments` | 0 lecturas |
| Abrir comentarios de un hilo | Todos los comentarios del proyecto | **1 documento** en el hilo medido |
| Cerrar los comentarios | Listener global seguía activo | **0 listeners activos** |
| Abrir otro hilo | Datos ya en memoria global | Listener limitado a ese hilo |
| Historial muy largo | Todo desde el principio | **200 documentos por pulsación** de “Cargar anteriores” |

### Límites de estas cifras

- No se dispone de credenciales de prueba para medir los flujos autenticados completos.
- No se consultaron las métricas de facturación de Firebase/Google Cloud.
- Los documentos devueltos por el SDK no equivalen necesariamente a lecturas facturables: las reglas, la caché del SDK y los listeners pueden modificarlas.
- Firestore Emulator sirve para comportamiento y seguridad, no para estimar facturación real.

## 3. Fuentes principales encontradas

1. **Comunidad global:** nueve `onSnapshot` permanentes, incluidos todos los comentarios, episodios, personajes y temporadas.
2. **Catálogo en Inicio:** 11.400 documentos descargados aunque el usuario no abriera la Wiki.
3. **Comentarios:** la colección completa se mantenía en memoria para mostrar los comentarios de un único hilo.
4. **Auth:** directorio completo de usuarios en un listener permanente; el login repetía lecturas del perfil público, privado y restricciones que el listener ya iba a solicitar.
5. **Gamificación:** dos listeners sobre `users/{uid}` para el mismo usuario y `ProgressionProvider` anidados en Logros y Trivia.
6. **Chats:** historial completo sin límite y varios efectos dependientes del objeto `currentUser`, que se reiniciaban con cada cambio de XP o medalla.
7. **Clubes:** había un listener de canales por cada club del usuario, aunque no se estuviera mirando ninguno.
8. **Seguidos:** listener permanente de hasta 500 documentos aunque las mutaciones ya se aplicaban de forma optimista.
9. **Panel:** `uniqueSlug` descargaba una colección completa para comprobar un id; los borrados en cascada descargaban episodios/personajes de todos los animes.
10. **Cloud Functions:** `onCommentCreated` leía dos veces el mismo destino para validar y resolver el anime; `leerConfig` se repetía varias veces por evento.
11. **Reglas:** 76 llamadas `get()`/`exists()`; se mantienen por seguridad. Firestore cachea el acceso al mismo documento durante una misma evaluación, así que no se han eliminado comprobaciones.

## 4. Cambios aplicados

### Caché y diagnóstico

- `src/lib/firestoreCache.ts`
  - TTL por tipo de dato.
  - Deduplicación de peticiones simultáneas.
  - Separación de ámbito público y `user:{uid}`.
  - Invalidación por clave o prefijo.
  - Protección contra respuestas antiguas que intenten repoblar la caché después de invalidar.
  - Limpieza de datos privados al cambiar o cerrar sesión.
- `src/lib/persistentCache.ts`
  - IndexedDB solo para datos públicos.
  - Nunca guarda perfiles, seguidores, chats, notificaciones ni preferencias privadas.
  - La invalidación de una clave también borra su copia persistente.
  - Si IndexedDB falla o está bloqueado, la app sigue usando la caché en memoria.
  - TTL orientativos: listado de animes, 5 min; fichas, 30 min; catálogo completo usado por búsqueda, 60 min; configuración, 60 min.
  - El navegador que hace un cambio invalida su propia caché al momento; otros navegadores ven el cambio al caducar su TTL o al limpiar la caché.
- `src/lib/firestoreDiagnostics.ts`
  - Solo en desarrollo.
  - Registra operación, colección, origen, documentos, tiempo, listeners creados/eliminados y aciertos/fallos de caché.
  - No registra mensajes, tokens, correos ni identificadores de documentos.
  - Consola: `window.__geekapooFirestore.snapshot()` y `reset()`.

### Comunidad y Wiki

- Inicio solo carga 6 series para la barra lateral, además de categorías, curiosidades y diálogos de la mascota.
- El feed carga 50 hilos recientes en tiempo real y pagina el resto con “Cargar publicaciones anteriores”.
- Los hilos fijados antiguos se consultan aparte para que no desaparezcan al paginar.
- El histórico completo de hilos se carga solo para perfil, búsqueda, pestaña de hilos, panel o filtros que lo necesitan.
- El listado completo de series se carga al entrar en la Wiki, el perfil o el panel.
- Temporadas, episodios y personajes de cada serie se cargan solo al abrir su ficha.
- `ensureAnimeData(animeId, kinds)` carga solo la serie abierta y, desde la segunda fase, solo los tipos que pide la pestaña.
- Las pestañas globales de episodios y personajes cargan 60 elementos por página y tienen “Cargar más”.
- Los contadores de esas pestañas se obtienen con agregaciones de Firestore, sin descargar las colecciones.
- Los filtros de episodios/personajes consultan solo las series que los cumplen. En la segunda fase los bloques son de 10 `animeId`, se cachean y se piden de uno en uno.
- La búsqueda de texto completo **ya no carga el catálogo completo** desde la segunda fase: usa el índice estático de la sección 12. El camino antiguo queda solo como respaldo si el índice no está disponible.
- La caché se invalida desde las escrituras del panel, incluidas las de una serie concreta.
- Los comentarios se cargan con `useCommentsForTarget` únicamente al desplegar el objetivo y se limpian al cerrar.
- El historial anterior del hilo/episodio/personaje se pagina con “Cargar comentarios anteriores”.
- El perfil consulta solo los comentarios del autor y los que le gustaron, con paginación y caché corta.
- El total de comentarios del perfil usa una consulta agregada del servidor; no se deduce del primer tramo cargado.

### Chats

- Historial inicial de 80 mensajes, no la conversación completa.
- Botón “Cargar mensajes anteriores” con conservación de la posición del scroll.
- Los listeners se mantienen en tiempo real.
- Fuera de la sección de chats no se escuchan mensajes, solicitudes, bloqueos ni mensajes ocultos; solo se mantiene la lista de conversaciones para el aviso de no leídos.
- Al entrar en Chats se abren los listeners necesarios y se cierran al salir.
- Se estabilizaron las dependencias por `uid`: un cambio de XP no reabre chats, solicitudes, bloqueos ni mensajes.

### Clubes y seguidos

- Los clubes, solicitudes y galería solo se cargan mientras la sección de Chats está abierta.
- Solo se escuchan los canales del club abierto; los mensajes de sus canales siguen en vivo a través de los chats.
- Los listeners de solicitudes no se reabren si los ids de clubes moderados no cambian.
- La galería de clubes no lanza consultas sin sesión que las reglas van a denegar.
- La lista de seguidos se carga una vez con caché y se actualiza de forma optimista al seguir/dejar de seguir.

### Auth y gamificación

- El directorio de usuarios ya no es un listener permanente: lectura cacheada por cuenta, 5 minutos.
- El login ya no repite las lecturas que hará `onAuthStateChanged`.
- La restricción de cuenta se reutiliza durante la sesión en vez de releerse en cada snapshot del perfil.
- Editar el perfil actualiza la entrada del directorio en memoria sin descargar todos los usuarios.
- Se eliminó el listener duplicado de `users/{uid}` en `ProgressionContext` para el usuario propio.
- Se eliminaron los `ProgressionProvider` anidados de Logros y Trivia.
- La configuración de gamificación se lee con caché corta y se invalida al guardar, en vez de mantener un listener por sesión y otro en el panel.

### Configuración y disponibilidad

- Ajustes del sitio y obras semanales usan caché larga con invalidación al guardar.
- Plataformas, regiones y disponibilidad regional usan caché y consultas puntuales, no listeners permanentes.
- Las noticias usan caché persistente de 15 minutos; el botón de sincronización manual invalida la entrada.
- Las páginas que siguen necesitando tiempo real (chats, clubes, notificaciones, hilos, comentarios abiertos, reacciones) lo conservan.

### Panel y Cloud Functions

- El panel de administración ya no mantiene un listener por colección: carga una vez con caché privada de 2 minutos y recarga solo la sección afectada tras cada escritura. Desde la segunda fase carga **solo la pestaña activa** y pide los contadores con agregaciones; los episodios/personajes de una serie se leen al desplegar su editor.
- `uniqueSlug` comprueba ids concretos, no descarga la colección.
- Los borrados en cascada filtran por `animeId` o `seasonId`.
- `onCommentCreated` reutiliza una sola lectura del destino para validar y resolver el anime.
- La configuración de gamificación se cachea 30 segundos por instancia y se invalida al guardarla.
- Se añadieron los índices de comentarios necesarios; mientras no estén desplegados, el cliente usa una consulta de respaldo para no romper la pantalla.

## 5. Tiempo real conservado

- Chats privados, grupales y de clubes.
- Mensajes del chat abierto.
- Canales del club abierto y solicitudes de los clubes moderados.
- Notificaciones.
- Hilos del feed.
- Comentarios del objetivo abierto.
- Reacciones visibles.
- Estado del usuario, restricciones, datos privados y gamificación propia.
- Favoritos cuando el selector está abierto.

## 6. Reglas e índices

- No se ha debilitado ninguna regla.
- No se han eliminado comprobaciones de rol, pertenencia, sanción o propiedad.
- `get()`/`exists()` siguen siendo la autoridad. Firestore cachea esas lecturas dentro de una misma evaluación; reducir llamadas duplicadas en reglas no debe hacerse a costa de seguridad.
- Índices nuevos en `firestore.indexes.json`:
  - comentarios por objetivo + fecha;
  - comentarios por autor + fecha;
  - comentarios por `likedBy` + fecha.

## 7. Pruebas realizadas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `npx tsc -p functions/tsconfig.json --noEmit`: correcto.
- `npm run test:logica`: 35 comprobaciones puras correctas, incluida la nueva prueba de caché.
- Pruebas manuales en navegador de desarrollo:
  - Inicio en frío: 43 documentos, 1 listener activo.
  - Inicio recargado dentro del TTL: 7 documentos (solo el feed de hilos), 16 aciertos de caché.
  - Wiki catálogo: 172 documentos (solo el listado de series).
  - Ficha Kaguya: 63 documentos.
  - Volver a la ficha: 0 lecturas, aciertos de caché.
  - Recargar la ficha dentro del TTL: 7 documentos, 22 aciertos de caché.
  - Abrir/cerrar comentarios: 1 documento y 0 listeners al cerrar.
  - Pestaña global de episodios: 61 documentos iniciales y 61 por “Cargar más”.
  - Pestaña global de personajes: 61 documentos iniciales.
  - Al aplicar un filtro de categoría en personajes: 1.449 documentos y el recuento filtrado sigue siendo exacto (antes se cargaban 11.204).
  - No se creó contenido de prueba con más de 200 comentarios en producción; la paginación nueva está compilada y cubierta por tipos, pero falta probarla con un hilo real de ese tamaño.
  - La escucha de canales solo para el club abierto está compilada, pero necesita una prueba autenticada real para confirmar el cambio de club y el estado de carga.
  - El panel de administración pasó a consultas puntuales; falta confirmar con una cuenta admin que editar, borrar, banear y cambiar tickets refresca cada sección.
- `npm run test:rules`: se ejecutó durante más de 15 minutos; todos los casos mostrados pasaron, pero el proceso superó el límite de tiempo antes del resumen final. No se observaron fallos. No se presenta como suite completa certificada.

## 8. Archivos principales modificados

- Nuevos:
  - `src/lib/firestoreCache.ts`
  - `src/lib/persistentCache.ts`
  - `src/lib/firestoreDiagnostics.ts`
  - `src/hooks/useCommentsForTarget.ts`
  - `src/hooks/useProfileComments.ts`
  - `src/hooks/useCatalogPage.ts`
  - `src/hooks/useAnimeCatalogData.ts`
  - `tests/logica.cache.ts`
- Contextos:
  - `src/context/AuthContext.tsx`
  - `src/context/CommunityContext.tsx`
  - `src/context/ChatContext.tsx`
  - `src/context/ClubsContext.tsx`
  - `src/context/FollowsContext.tsx`
  - `src/context/ProgressionContext.tsx`
  - `src/context/SiteContentContext.tsx`
  - `src/context/StreamingCatalogContext.tsx`
- Componentes y hooks:
  - `src/App.tsx`
  - `src/components/home/HomeFeed.tsx`
  - `src/components/home/NewsWidget.tsx`
  - `src/components/wiki/AnimeWiki.tsx`
  - `src/components/wiki/MainTabs.tsx`
  - `src/components/profile/ProfileView.tsx`
  - `src/components/profile/ProfileContent.tsx`
  - `src/components/chat/ChatView.tsx`
  - `src/components/search/GlobalSearch.tsx`
  - `src/components/admin/AdminPanel.tsx`
  - `src/components/admin/useAdminCatalog.ts`
  - `src/components/admin/GamificationSection.tsx`
  - `src/components/tierlists/TierListEditor.tsx`
  - `src/hooks/useStreamingAvailability.ts`
- Servicios:
  - `src/services/chats.ts`
  - `src/services/comments.ts`
  - `src/services/likes.ts`
  - `src/services/notifications.ts`
  - `src/services/news.ts`
  - `src/services/gamification.ts`
  - `src/services/catalogAdmin.ts`
  - `src/services/siteContent.ts`
  - `src/services/streamingAvailability.ts`
- Tipos y lógica de perfil:
  - `src/types/profile.ts`
  - `src/utils/profile.ts`
- Backend/configuración/pruebas:
  - `functions/src/index.ts`
  - `firestore.indexes.json`
  - `tests/logica.likes.ts`
  - `package.json`

## 9. Ahorro estimado y ahorro real

- **Estimación de lecturas evitadas en rutas medidas:** 11.357 documentos menos en Inicio, 11.025 menos al abrir el catálogo de la Wiki y hasta 11.134 menos al abrir una ficha.
- **Porcentaje estimado en esas rutas:** 99,6 % en Inicio, 98,5 % en el catálogo y 99,4 % en la ficha.
- **Pestañas globales:** episodios pasa de 6.659 documentos a 61 (−99,1 %) y personajes de 4.117 a 61 (−98,5 %) en navegación normal.
- **Filtros globales:** el filtro de categoría medido en personajes baja de 11.204 documentos a 1.449 (−87,1 %) manteniendo el resultado exacto.
- **Recargas dentro del TTL:** Inicio baja de 43 a 7 documentos y una ficha ya cacheada de 63 a 7; los 7 son el listener de hilos, no el catálogo.
- **Ahorro monetario real:** no medido. Falta contrastar con las métricas de Firebase/Google Cloud tras desplegar.
- Los documentos devueltos no son una factura: no se deben multiplicar por el precio sin validar las métricas reales.

## 10. Pendientes y siguientes pasos

1. **Búsqueda de texto completo global:** resuelta en la segunda fase con un índice estático; ver sección 12. Queda como pendiente la actualización instantánea del índice tras una edición del panel sin desplegar.
2. **Pruebas autenticadas:** chats, clubes, canales, panel de administración, filtros del feed y paginación con datos reales.
3. **Medición real:** ejecutar los mismos escenarios con una cuenta de prueba y comparar con las métricas de Firebase/Query Insights.

## 11. Despliegue

La primera tanda (índices, Functions y frontend) fue desplegada por el usuario.  
La segunda fase se publicó el 2026-11-03 en `main` con los commits `b188129` (navegación de notificaciones), `8833b10` (optimización de Firestore), `163413d` (likes de catálogo en la wiki), `4cec74e` (caché de likes y refresco de vistas) y `4a6d123` (panel con `seasonsCount`); la documentación se actualizó en commits posteriores. Vercel publicó el frontend y `/busqueda/indice.json?v=<sha-del-build>` respondió 200. No se desplegaron índices ni Functions nuevas; las reglas de Firestore actualizadas se publicaron aparte con `firebase deploy --only firestore:rules`.

El detalle de qué se publicó y qué queda pendiente está en la sección 12.9.

## 12. Segunda fase: episodios, personajes, streaming y búsqueda (2026-11-03)

### 12.1 Consultas de Query Insights y origen exacto

La atribución se ha hecho por forma de consulta, media de lecturas por ejecución y código. No se dispone de acceso a Firebase Console para leer la huella literal; no se presenta como una lectura directa de Query Insights.

| Consulta | Lecturas / ejecuciones | Media | Origen | Por qué se ejecuta |
|---|---:|---:|---|---|
| `/episodes SELECT animeId,...` | 145.734 / 497 | ~293 | `src/hooks/useAnimeCatalogData.ts` | Filtros de la Wiki: `where('animeId','in',...)` para las series que pasan el filtro. Antes, bloques de 30, sin caché y todos a la vez; también al cambiar solo el orden. |
| `/streamingAvailability WHERE...` | 128.944 / 439 | ~294 | `src/hooks/useStreamingAvailability.ts`, `WhereToWatch.tsx`, `StreamingAvailabilityEditor.tsx` y `scripts/generar-paginas-anime.mjs` | La wiki pide una obra + una región. El editor pide todas las regiones de una obra. El prerender pide todas las filas de España una vez por build. |
| `/characters PageSize 1000` | 106.494 / 365 | ~292 | `CommunityContext.cargarCatalogo` (`ensureCatalogData`) y `useAdminCatalog.leerSeccionAdmin` | Búsqueda/perfiles descargaban la colección completa; el panel descargaba todas las secciones al abrirse. |
| `/episodes PageSize 1000` | 100.936 / 340 | ~297 | Los mismos dos caminos | Igual: carga completa para buscar o abrir el panel. |
| `/characters WHERE role = ?` | 14.688 / 18 | 816 | `scripts/generar-paginas-anime.mjs`, `leerPersonajesPrincipales()` | Prerender de fichas: `consultar('characters','role','main')`. Son 18 builds, no 18 usuarios. |
| `/animes SELECT slug, title,...` | 4.058 / 21 | ~193 | `scripts/generar-sitemap.mjs` | Sitemap en `prebuild`, una vez por build. |
| `/animes SELECT id, slug, title,...` | 4.252 / 22 | ~193 | `scripts/generar-paginas-anime.mjs`, `leerAnimes()` | Prerender en `postbuild`, una vez por build. |
| `/animes PageSize 1000` | 4.114 / 22 | ~187 | `CommunityContext.leerColeccionCached('animes')` / `useAdminCatalog` | Lista completa de series para la Wiki o el panel. |

**Separación:** las consultas `role`, `slug/title` y parte de `streamingAvailability` son de build, no de usuarios. La tabla histórica mezcla ambos tipos; no se deben atribuir todas al código nuevo ni a errores de programación.

### 12.2 Cambios aplicados

- **Episodios y personajes**
  - `useAnimeCatalogData` usa `cachedRead` (30 min, IndexedDB), bloques de 10 series y carga progresiva con `loadMore`.
  - Las claves empiezan por `community:episodes` / `community:characters`, así que la invalidación del panel las borra.
  - La ficha pide temporadas al abrir y pagina episodios/personajes de 60 en 60 al entrar en su pestaña. Los episodios se filtran por temporada en Firestore y se ordenan por número; los personajes se paginan por anime y se filtran por temporada en local. Los totales de episodios se obtienen con `getCountFromServer`.
  - Medido con One Piece: la pestaña de Episodios pasó de leer 1.180 episodios de golpe a leer 61 de la temporada 1 (más 1 al pulsar «Cargar más»). Shingeki no Kyojin: 102 episodios de todas las temporadas → 33 de la temporada 1.
  - El editor de administración sigue pidiendo la serie completa al abrirse, porque necesita editar todos sus documentos.
  - Los filtros que solo cambian el orden ya no disparan la consulta por anime.
- **Panel de administración**
  - `useAdminCatalog(activeSection)` carga solo las colecciones de la pestaña activa.
  - Los contadores de las pestañas usan `getCountFromServer`, no descargas completas.
  - Los episodios/personajes/temporadas de una serie se piden al desplegar su editor, con la caché pública de `CommunityContext`.
  - La sección Animes carga solo animes y categorías. El filtro «Con temporadas» y su orden usan `seasonsCount`, un contador desnormalizado en el anime; ya no se descargan las 481 temporadas.
  - `createSeason` incrementa `seasonsCount`; `deleteSeasonCascade` lo decrementa; `createAnime` nace con 0. `scripts/actualizar-seasons-count.mjs` rellenó los 195 animes existentes (481 temporadas contadas) sin tocar otros campos.
- **Streaming**
  - `guardarDisponibilidad` invalida solo `streaming:availability:<animeId>:all` y `:<region>`.
  - `eliminarDisponibilidad` lee la fila (o recibe el contexto) e invalida las mismas claves exactas.
  - `useStreamingAvailability` acepta `enabled`; el editor no consulta hasta desplegar su apartado y solo recarga si coincide su clave exacta.
- **Búsqueda**
  - `scripts/generar-indice-busqueda.mjs` genera `public/busqueda/indice.json` en `prebuild` con animes, episodios y personajes (títulos, japonés, romaji, alias, sinopsis/géneros/estudio, descripciones, imágenes, notas y claves).
  - `src/services/searchIndex.ts` lo lee con `cachedRead` (1 h, IndexedDB) y valida la versión. Si falta o falla, `AnimeWiki` conserva la carga completa anterior como red de seguridad.
  - `ProfileView`, `TierListEditor` y `GlobalSearch` resuelven títulos/nombres y catálogos con el índice, no con las colecciones completas.
  - `generar-paginas-anime.mjs` reutiliza el índice para animes, episodios y personajes del prerender; deja de repetir esas lecturas por build.
- **Páginas y contadores**
  - `useCatalogPage` cachea la primera página y las siguientes por cursor (5 min, IndexedDB).
  - `useCollectionCount` cachea la agregación (5 min, IndexedDB).
  - `catalogAdmin` invalida `catalog:page:<coleccion>` y `catalog:count:<coleccion>` al editar.
  - Las páginas, los contadores y los filtros montados escuchan `geekapoo:cache-invalidated` y se vuelven a pedir en vez de esperar al TTL.
- **Likes de catálogo**
  - `patchCached` actualiza en sitio las copias de memoria e IndexedDB de animes, episodios, personajes y trivia al dar o quitar un like. No invalida la ficha entera ni vuelve a leer Firestore.
- **Build**
  - El índice de búsqueda está **comprimido y versionado** en `public/busqueda/indice.json.gz` (~1,52 MB tras añadir temporadas y streaming; ~1,28 MB en la segunda fase). `prebuild` lo descomprime y no lee Firestore.
  - El sitemap reutiliza los animes del índice: 0 lecturas de animes.
  - El prerender pide solo las filas de `streamingAvailability` de España con estado `available`: 207 en la última medición, frente a 786 filas de España que descargaba antes y filtraba en memoria.
  - **Coste por push medido: 0 lecturas del catálogo + 207 filas de streaming + 7 plataformas ≈ 214 lecturas.** Antes era ≈14.469.
  - Para refrescar el índice cuando cambie el catálogo: `npm run index:buscar`. Escribe el JSON y su `.gz`; después hay que commitear `public/busqueda/indice.json.gz`. Si el `.gz` supera los 7 días, el build avisa. Guía operativa completa: [`docs/indice-busqueda.md`](../indice-busqueda.md).
  - La URL del índice lleva el SHA de Vercel para no reutilizar una respuesta HTTP antigua.

### 12.3 Caché

| Clave | Ámbito | TTL | Persistente |
|---|---|---:|---|
| `community:animes` | público | 5 min | Sí |
| `community:seasons:<animeId>` | público | 30 min | Sí |
| `community:episodes:<animeId>` | público | 30 min | Sí |
| `community:characters:<animeId>` | público | 30 min | Sí |
| `community:episodes:filtrados:<ids>` | público | 30 min | Sí |
| `community:characters:filtrados:<ids>` | público | 30 min | Sí |
| `catalog:page:<coleccion>:...` | público | 5 min | Sí |
| `catalog:count:<coleccion>` | público | 5 min | Sí |
| `streaming:availability:<animeId>:<region\|all>` | público | 30 min | Sí |
| `search:index:v1` | público | 1 h | Sí |
| `admin:section:<seccion>` | privado por uid | 2 min | No |
| `admin:count:<seccion>` | privado por uid | 5 min | No |

No se ha creado un segundo sistema de caché: todo pasa por `firestoreCache.ts` y `persistentCache.ts`. Se mantiene la separación público/privado y la invalidación exacta de streaming.

### 12.4 Paginación

- Catálogo global de episodios/personajes: 60 por página; “Cargar más” y caché persistente. Verificado 60 → 120 tras recargar.
- Catálogo filtrado: bloques de 10 series; primer bloque y “Cargar más”. El filtro se aplica a cada bloque y todos los resultados siguen accesibles.
- Ficha: temporadas desde `temporadas.json` (sección 13); episodios/personajes al abrir su pestaña. Los episodios se filtran por temporada en Firestore; los personajes también, con `array-contains-any` sobre `seasonKeys` (incluye `'*'` para los compartidos). Los contadores se piden siempre al abrir la ficha, sin esperar a la pestaña.
- Comentarios: 200 por página (sin cambios).
- Feed: 50 hilos por página (sin cambios).
- Búsqueda: 30 tarjetas por sección con “Ver más” local; no hay paginación de Firestore porque el índice ya está en memoria.

### 12.5 Mediciones locales antes/después

Mediciones con `firestoreDiagnostics` (estimación del SDK, **no facturación**) en Vite de desarrollo, sesión de visitante, Firestore de producción.

| Escenario | Antes | Después | Evitadas |
|---|---:|---:|---:|
| Primera búsqueda de la Wiki, caché vacía | 13.975 (8.549 eps + 4.935 personajes + 481 temporadas + 10 hilos) | **10** (solo hilos) | **13.965 (99,93 %)** |
| Repetir búsqueda dentro del TTL | 0 | 0 | 0 |
| Abrir ficha, pestaña Información | 176 (7 temporadas + 61 personajes + 102 episodios + 6 streaming) | **13** (7 + 6) | **163 (92,6 %)** |
| Misma ficha, pestaña Episodios (Shingeki, T1) | 176 | **46** (33 episodios + 13 base) | 130 |
| Misma ficha, pestaña Personajes (Shingeki) | 176 | **74** (61 de la primera página + 13 base) | 102 |
| One Piece, pestaña Episodios (T1) | 1.180 episodios | **61** (60 + 1 para saber si hay más) | **1.119 (94,8 %)** |
| Filtro de categoría + Episodios, primer bloque | 685 (624 filtrados + 61 página) | **242** (181 + 61) | 443 |
| Volver al mismo filtro tras recarga | Se repetía la consulta del bloque | **0** | 181 por bloque |
| Página de personajes, 60 → 120 tras recarga | 61 + 61 | **0 + 61** | 61 por revisita |
| Panel de administración | 8.549 eps + 4.935 personajes + 481 temporadas + 195 animes + usuarios/hilos/tickets | Solo sección activa + agregaciones | **≥13.965 documentos** que ya no se descargan |
| Fallback si falta el índice | — | 13.975 y resultados correctos | Se conserva la red de seguridad |

El índice estático mide **5.976 KB** en crudo (≈5,8 MiB), **~1,25 MiB gzip** y **~0,91 MiB brotli**. En producción Vercel sirvió una transferencia de ~1,28 MB para `indice.json?v=8833b10…`.

### 12.6 Pruebas

- `npm run lint`: correcto.
- `npm run test:logica`: todas las suites correctas, incluida `tests/logica.cache.ts` con la prueba de `patchCached`.
- `npm run build`: correcto. Con el índice cacheado el log muestra `usa cache local` (0 lecturas de catálogo), `sitemap: reutiliza el indice` (0 lecturas) y `streaming ES: 207 filas disponibles`. Se generan las 195 páginas de anime.
- Backfill `seasonsCount`: simulación y escritura sobre 195 animes y 481 temporadas; verificado en `ataque-a-los-titanes` (7), `one-piece` (22) y `nana` (1).
- Navegador de desarrollo:
  - Búsqueda por «Ataque a los Titanes», «Shingeki no Kyojin» y «Shingeki no Kyoujin».
  - Búsqueda de «Eren», «Frieren» y «Kaguya».
  - Abrir ficha, cambiar temporada y entrar en Episodios/Personajes.
  - One Piece, temporada 1: 61 episodios y «Cargar más» trae 1 más; 61 personajes en la primera página y «Cargar más» trae 61 más.
  - Shingeki: 33 episodios en la T1, 12 en la T2; sin descargar las otras temporadas.
  - Filtro por categoría, «Cargar más» y recarga.
  - Paginación 60 → 120 en episodios y personajes del catálogo.
  - Índice `episodes: animeId + seasonId + number` desplegado y en estado `READY` antes de validar.
  - Fallback renombrando el índice.
- Producción (2026-11-03):
  - Bundle de `main`; la primera verificación fue `assets/index-CjAiLObR.js`, después `assets/index-s37spvH-.js` (likes y panel) y la paginación de ficha en `assets/index-DEIPVkRy.js`.
  - `/busqueda/indice.json?v=<sha-del-build>` → 200.
  - IndexedDB contiene `public:search:index:v1`.
  - Búsqueda correcta y sin errores de consola.
  - Ficha: `Episodios (…)` / `Personajes (…)` hasta abrir la pestaña; después `Episodios (33)` y `Personajes (36)`.
  - Catálogo: 60 → 120 con «Ver más» + «Cargar más».
- No probado end-to-end: panel autenticado, edición/borrado real de streaming y flujos completos con cuenta admin (sin credenciales).

### 12.7 Query Insights después del despliegue

No hay cifras «después» porque no se dispone de acceso a Query Insights. Para comparar correctamente:

1. Esperar un periodo equivalente al de la tabla original.
2. Filtrar por colección y huella.
3. Comparar ejecuciones y lecturas medias por ejecución, no solo el total.
4. Separar consultas de build de consultas de usuarios.

Qué debería cambiar:
- `/characters PageSize 1000` y `/episodes PageSize 1000`: caída casi a cero desde usuarios normales; solo queda el fallback si falta el índice.
- `/episodes SELECT animeId,...`: puede seguir existiendo, pero con bloques de 10 y caché; menos ejecuciones y menos lecturas por ejecución.
- `/streamingAvailability WHERE...`: baja al no consultar el editor hasta abrirlo, al invalidar solo la obra/región y al pedir en el build solo las 207 filas disponibles de España.
- `/characters WHERE role = ?`: desaparece de los builds si el índice está fresco.
- `/animes SELECT id, slug, title,...`: desaparece del prerender si usa el índice. `/animes SELECT slug, title,...`: el sitemap también reutiliza el índice, así que desaparece mientras tenga menos de 6 h.
- Aparecerán consultas de agregación (`getCountFromServer`) y páginas de 60/300, más baratas que las descargas completas.

### 12.8 Ahorro estimado

Con la tarifa estándar de referencia de Firestore Native de **0,06 USD por 100.000 lecturas** (confirmar la de la región/proyecto):

| Escenario | Lecturas evitadas | Ahorro estimado |
|---|---:|---:|
| Primera búsqueda por navegador | 13.965 | ~0,0084 USD |
| Ficha en pestaña Información | 163 | ~0,0001 USD |
| One Piece, pestaña Episodios (T1) | 1.119 | ~0,0007 USD |
| Apertura del panel sin editar anime | 13.965 | ~0,0084 USD |
| Tabla histórica completa | 509.220 | ~0,31 USD para el periodo que cubra la tabla |

Son cifras pequeñas en dinero absoluto; el beneficio principal es reducir cuota, picos, latencia y riesgo de agotar límites. El ahorro real de facturación no se puede medir hasta consultar Billing/Query Insights tras un periodo equivalente.

### 12.9 Estado de despliegue

- Publicado en `main` el 2026-11-03:
  - `b188129` — navegación estable de notificaciones y hueco reservado para imágenes.
  - `8833b10` — optimización de Firestore (esta fase).
  - `163413d` — likes de catálogo en la wiki (autor: Oscar).
  - `4cec74e` — parcheo de caché para likes y refresco de vistas montadas.
  - `4a6d123` — panel de administración con `seasonsCount` y temporadas por serie.
  - `fce3b54` — ficha paginada por temporada para episodios y personajes.
- Producción sirve el bundle de `main` (última verificación: `assets/index-DEIPVkRy.js`); `/busqueda/indice.json?v=<sha-del-build>` responde 200.
- Reglas de Firestore del commit `163413d` publicadas con `firebase deploy --only firestore:rules`. El CLI compiló `firestore.deploy.rules` (155.214 bytes), indicó que la última versión ya estaba al día y liberó el ruleset. No se desplegaron índices ni Functions nuevas.
- El árbol de trabajo quedó limpio: `firestore.rules`, `tests/firestore.likes.rules.test.cjs`, los likes de `CommunityContext`, `scripts/datos/*`, `scripts/importar-disponibilidad-justwatch.mjs` y `public/sitemap.xml` quedaron incluidos en `163413d`.

### 12.10 Pendientes de la segunda fase

1. Medir Query Insights tras un periodo equivalente y comparar con la tabla histórica.
2. Probar el panel autenticado: abrir Animes, editar un anime sin tocar streaming, desplegar disponibilidad, guardar/borrar y comprobar invalidación.
3. Frescura del índice: ahora está cacheado en `public/busqueda/indice.json.gz`. Una edición del panel no se refleja hasta ejecutar `npm run index:buscar`, commitear el `.gz` y desplegar. Es el precio de no leer ~13.962 documentos en cada push. Para actualización automática e instantánea haría falta un índice en Firestore/Storage mantenido por Cloud Functions (1 lectura + 1 escritura por edición), no implementado para no añadir escrituras ni reglas.
4. Las páginas, contadores y filtros montados ya escuchan la invalidación y se recargan; las fichas ya lo hacían y los likes parchean la caché en sitio. No se pretende actualización en tiempo real entre pestañas/usuarios: el resto de navegadores ve el cambio al caducar su TTL.
5. El panel ya no carga todas las temporadas: usa `seasonsCount` y pide las de cada serie al abrir su editor. Los scripts de importación masiva deben rellenar `seasonsCount` o ejecutar `npm run datos:seasons-count -- --escribir` después.
6. El índice de búsqueda es un solo archivo de ~0,9 MiB comprimido; si el tráfico crece, conviene dividirlo por tipo y cargarlo bajo demanda.
7. Las descripciones del índice se recortan a 160 caracteres (episodios) y 240 (personajes) para no disparar el tamaño. La búsqueda por título, japonés, romaji, alias y la mayor parte de la descripción sigue funcionando; una palabra al final de una descripción muy larga podría no encontrarse.
8. `GlobalSearch.tsx` no está montado; la búsqueda activa es `AnimeWiki` + `CatalogSearch`. Se adaptó al índice por si se vuelve a montar.
9. El índice cacheado reduce el push a ~214 lecturas, pero hay que recordar refrescarlo cuando cambie el catálogo (`npm run index:buscar`). Si se olvida, el buscador sigue mostrando el catálogo anterior hasta el siguiente refresco. Una GitHub Action programada puede ejecutar ese comando y commitear el `.gz`.

---

## 13. Tercera fase: animes estáticos, personajes por temporada y contadores (2026-11-04)

### 13.1 Cambios aplicados

- **Animes estáticos en Wiki y Perfiles**
  - `scripts/generar-indice-busqueda.mjs` genera además `public/busqueda/animes.json` (~259 KB) con el array de animes del índice. Incluye `likesCount` para que los perfiles no pierdan el contador y `seasonsCount` para detectar temporadas nuevas; `likedBy` se deja vacío y la ficha usa su documento completo. Se crea tanto al refrescar como al reutilizar el `.gz` cacheado; está ignorado por Git.
  - `cargarAnimesIndice()` en `src/services/searchIndex.ts` lo descarga con `cachedRead` (clave `search:animes:v1`, 1 h, IndexedDB). Si falta o falla, `CommunityContext` conserva la lectura completa de Firestore como red de seguridad.
  - La rejilla de la Wiki, los perfiles, las tier lists y los selectores que solo necesitan título/portada usan esa lista: **0 lecturas de la colección `animes`**.
  - Al abrir una ficha, `useAnimeDoc` lee únicamente `animes/<id>` (clave `anime-doc:<id>`, 2 min, IndexedDB). Si el slug no está en la lista, busca por `slug` y permite abrir series nuevas antes de refrescar el índice.
  - El editor del panel sigue usando `useAdminCatalog`, que lee los documentos completos; no edita sobre la copia ligera.
  - El like del anime usa un override local en la ficha y devuelve `Promise<boolean>` para revertir si falla la escritura. La copia `anime-doc:<id>` se invalida después de un like correcto.
- **Personajes filtrados por temporada**
  - `Character` incorpora `seasonKeys`: `['*']` para compartidos y los ids concretos para el resto. Es una desnormalización de `seasonIds`/`seasonId`.
  - `catalogAdmin` escribe `seasonKeys` al crear un personaje, al cambiar sus temporadas y al eliminar una temporada en cascada.
  - La ficha pagina personajes con `where('seasonKeys', 'array-contains-any', [temporada, '*'])`, en vez de descargar todos los de la serie y filtrar en local.
  - La clave de caché de la página incluye la temporada, así que dos temporadas no comparten la misma página.
  - Índice compuesto desplegado: `characters: animeId ASC + seasonKeys CONTAINS + __name__ ASC`, estado **READY**.
  - Migración `scripts/actualizar-season-keys.mjs` (`npm run datos:season-keys`): **4.935 personajes actualizados**, **2.593 compartidos**. Ya ejecutada en producción; no hay que repetirla.
- **Temporadas estáticas en la ficha**
  - `temporadas.json` agrupa las 481 temporadas por anime. La ficha ya no pide la colección `seasons` al abrirse: usa este archivo y solo cae a Firestore si falta, si no conoce la serie o si el contador `seasonsCount` del anime no coincide con la lista.
  - `seasonsCount` se incluye en `animes.json` y se mantiene al crear/borrar temporadas; es lo que detecta una lista estática antigua sin descargar nada.
  - El archivo se genera en `predev`/`prebuild` desde el índice cacheado, así que un push normal sigue sin leer temporadas.
- **Contadores visibles sin abrir la pestaña**
  - `useAnimeCollectionCount` se ejecuta al abrir la ficha, no cuando se activa la pestaña. Episodios filtra por `animeId` + `seasonId`; personajes por `animeId` + `seasonKeys`.
  - La etiqueta muestra la agregación en cuanto llega; mientras tanto enseña la longitud de la página cargada o `…`. Ya no se queda en `…` hasta entrar en Episodios/Personajes.
  - Los contadores se cachean con la misma `cachedRead` de 5 minutos y escuchan la invalidación de su colección. No se ha creado otro sistema de caché.

### 13.2 Mediciones locales

Medición con `firestoreDiagnostics` en Vite de desarrollo, IndexedDB vaciada, sesión de visitante y Firestore de producción. Las cifras son estimaciones del SDK, no facturación.

| Escenario | Antes | Después |
|---|---:|---:|
| Pintar la rejilla de la Wiki (195 animes) | 195 lecturas de `animes` | **0** (solo `animes.json`, 258.613 bytes) |
| Abrir la ficha de One Piece | Lectura de la colección + datos de la serie | **1** lectura (`anime:doc`) + episodios/personajes que ya se pedían |
| Temporadas de la ficha (One Piece) | 22 lecturas (`getDocs:anime`) | **0** (solo `temporadas.json`, 383.865 bytes) |
| Contador de episodios al abrir la ficha | `…` hasta entrar en la pestaña | **61** en cuanto responde la agregación |
| Contador de personajes al abrir la ficha | `…` hasta entrar en la pestaña | **41** en cuanto responde la agregación |
| Personajes de One Piece, temporada 1 | 61 de toda la serie, filtrados en local | **41** filtrados en Firestore |
| Navegar a la Wiki tras la ficha | — | 195 animes, **0 lecturas** |

En desarrollo, React StrictMode duplica algunos efectos y por eso se ven dos agregaciones por contador (`episodes:ficha:count#2`, `characters:ficha:count#2`); en producción el efecto se ejecuta una vez. Con las temporadas estáticas, Shingeki no Kyojin abre con 7 temporadas desde `temporadas.json` y **sin ninguna operación `getDocs:anime`**.

### 13.3 Pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto. El log muestra `indice-busqueda: usa cache local (197 animes, 489 temporadas, 7824 filas de streaming, 8514 episodios, 5051 personajes)`, `sitemap: reutiliza el indice de busqueda`, `streaming ES: reutiliza el indice (144 animes)` y 197 páginas de anime generadas. **0 lecturas del catálogo y 0 de streaming; solo quedan ~7 de plataformas.**
- Navegador limpio:
  - `/anime/one-piece` muestra `Episodios (61)` y `Personajes (41)` sin pulsar ninguna pestaña.
  - La pestaña de personajes muestra solo los de la temporada 1 (incluidos los compartidos) y no descarga las demás temporadas.
  - La rejilla de la Wiki muestra `Todo 195` con 0 lecturas de Firestore.
  - `/anime/shingeki-no-kyojin` muestra sus 7 temporadas desde `temporadas.json` y `Episodios (33)` / `Personajes (36)`; al cambiar a la T2, `Episodios (12)` y `Personajes (30)`.
  - En la ficha de Shingeki no aparece `getDocs:anime`: la colección `seasons` no se lee.
  - Cambiar de temporada actualiza el contador y la página de personajes.
  - No hay errores de consola distintos del aviso de `requestStorageAccess`.
- No probado end-to-end: like autenticado del anime, panel autenticado y Query Insights (sin credenciales/acceso a la consola).

### 13.4 Estado y pendientes

- Commits locales de esta fase: `786250e` (índice cacheado), `804089b` (guía) y el commit de esta tercera fase. **Sin push**: lo hará el usuario.
- El índice `characters: animeId + seasonKeys[CONTAINS] + __name__` y la migración de `seasonKeys` ya están aplicados en producción.
- Si se añade o renombra un anime, hay que ejecutar `npm run index:buscar` antes de desplegar para que aparezca en la rejilla de la Wiki/Perfil y en el sitemap. La ficha directa por slug sí funciona sin refrescar.
- Si cambia una temporada, conviene refrescar el índice antes de desplegar. Si solo cambia el número de temporadas, `seasonsCount` hace que la ficha pida la lista real a Firestore; los cambios de título, portada o sinopsis no se ven hasta el refresco.
- El refresco del índice ahora lee temporadas y streaming: ≈22.075 documentos (197 animes, 489 temporadas, 8.514 episodios, 5.051 personajes y 7.824 filas de streaming).
- Query Insights sigue pendiente de acceso a Firebase Console y de un periodo equivalente.

### 13.5 Streaming estático (2026-11-04)

- **Generación:** `generar-indice-busqueda.mjs` lee también `streamingAvailability` y guarda dos cosas:
  - las 7.824 filas dentro de `indice.json`/`.gz`;
  - `public/busqueda/streaming.json`, agrupado por anime y región (~1,69 MB en crudo, ~96 KB gzip).
- **Web pública:** `useStreamingAvailability` intenta primero `streaming.json`. Si el archivo falta o no conoce la serie, cae a Firestore. Al cambiar de región no hay ninguna consulta nueva: se filtra el mapa ya cargado.
- **Panel:** `StreamingAvailabilityEditor` pasa `preferStatic: false` y sigue leyendo `streamingAvailability` para ver el último cambio guardado.
- **Build:** `generar-paginas-anime.mjs` reutiliza `indice.streaming`; ya no lee las 207 filas de España. Solo quedan las 7 lecturas de `streamingPlatforms`.
- **Medición en navegador (ficha de 86: Eighty Six):**
  - `streaming.json` cargado (~1,69 MB en dev; ~96 KB gzip en producción).
  - **0 operaciones** sobre `streamingAvailability`.
  - Cambiar de España a Estados Unidos tampoco genera lecturas.
  - Las tarjetas siguen mostrando disponibles, no disponibles y datos antiguos sin verificar.
- **Coste:** el push normal baja de ~214 a ~7 lecturas. El refresco manual sube a ~22.075 documentos porque incluye el catálogo completo y el streaming.
- **Contrapartida:** un cambio de disponibilidad no se ve en la web pública hasta ejecutar `npm run index:buscar`, commitear el `.gz` y desplegar; el panel lo ve al momento. Es el intercambio aceptado para quitar las lecturas públicas de streaming.
- **Archivos nuevos:** `public/busqueda/streaming.json` (ignorado por Git), `cargarStreamingIndice()` en `src/services/searchIndex.ts` y el modo estático de `useStreamingAvailability`.

### 13.6 Comentarios: primera página de 50 (2026-11-04)

- **Ficha:** `COMMENTS_PAGE_SIZE` pasa de 200 a **50**. El botón «Cargar comentarios anteriores» sigue trayendo bloques de 50 y el contador muestra `50+` cuando quedan más.
- **Perfil:** `PROFILE_COMMENTS_PAGE_SIZE` pasa de 200 a **50**; la sección ya tenía «Cargar más» y el total sigue viniendo de `countCommentsByAuthor`.
- **Estadística de reacciones:** para que el perfil no sume solo los 50 comentarios cargados, `sumCommentReactionsByAuthor` pide una agregación `sum('reactionsTotal')` sobre todos los comentarios del autor. Son ~1 lectura de agregación en vez de 150 documentos. Los comentarios antiguos sin `reactionsTotal` aportan 0, igual que antes cuando tampoco tenían `reactionCounts`. Índice `comments: authorId + reactionsTotal + __name__` desplegado y **READY**.
- **Me gusta del perfil:** los comentarios a los que dio «me gusta» no tienen paginación propia, así que mantienen el tope de **200** (`MAX_COMENTARIOS_GUSTADOS`) para no perder contenido.
- **Hilos:** el contador usa `thread.commentsCount` (o la longitud cargada si el contador va por detrás), no solo la página visible.
- **Ahorro:** una ficha o un perfil con 200 comentarios pasa de ~200 lecturas iniciales a ~50 + 1 agregación; las 150 restantes solo se leen si el usuario pulsa «Cargar más».
- **Contenido:** no se elimina nada; solo se reparte la lectura. Los comentarios a los que se llega desde una notificación siguen cargándose con `ensureComment` aunque estén fuera de la primera página.
- **Pruebas:** `npm run lint` correcto; no hay datos de prueba con más de 50 comentarios en una misma ficha/perfil, así que la paginación se validó por lógica y por los botones existentes.

### 13.7 Perfil sin descargar todos los hilos (2026-11-04)

- Antes `ProfileView` llamaba a `ensureAllThreads()` y descargaba la colección `threads` completa para filtrar en memoria los hilos del usuario y los que le gustaban.
- Ahora `useProfileThreads` hace dos consultas acotadas:
  - `where('authorId', '==', uid)` + `orderBy('createdAt', 'desc')`;
  - `where('likedBy', 'array-contains', uid)` + `orderBy('createdAt', 'desc')`.
- Los índices `authorId + createdAt` y `likedBy[CONTAINS] + createdAt` ya estaban desplegados y `READY`.
- Los títulos de los hilos que aparecen en los comentarios se leen por id (`profile:thread-title:<id>`) y se cachean 2 minutos, en vez de tener todos los hilos en memoria.
- `PerfilDatos.threads` pasa a ser solo los hilos propios; los títulos ajenos van en `threadTitles`.
- `createThread`, `deleteThread` y los likes de hilo invalidan `profile:threads:` y el hook recarga las dos consultas; editar desde el panel sigue invalidando `community:threads`. El resto del perfil (comentarios, medallas, seguidores) no cambia.
- **Ahorro:** una visita al perfil ya no lee la colección `threads` entera; lee solo los hilos del autor, los que le gustan y los títulos puntuales de sus comentarios. Con el foro actual son pocos documentos, pero la lectura deja de crecer con el foro.
- **Pruebas:** `npm run lint` y `npm run build` correctos. No se pudo probar el perfil autenticado en el navegador porque el entorno de pruebas no tiene sesión iniciada.
