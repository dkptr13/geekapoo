# Auditoría y reducción del consumo de Firebase

Fecha: 2026-11-02  
Ámbito: cliente React, contextos, servicios, chats, notificaciones, Wiki, perfiles, panel, Cloud Functions, reglas e índices.

> Este documento separa siempre **llamadas al SDK**, **documentos devueltos** y **estimación de lecturas**.
> No se presentan como facturación real. La factura depende de métricas de Firebase/Google Cloud y de las reglas.

## 1. Resumen ejecutivo

Se ha eliminado la mayor parte del consumo que se producía al entrar en la web:

- Inicio dejó de cargar el catálogo completo de series, episodios, personajes, temporadas y toda la colección de comentarios. Solo pide unas pocas series para la barra lateral.
- La Wiki carga el catálogo de series; al abrir una ficha pide únicamente los datos de esa serie.
- Los buscadores y pestañas globales siguen pudiendo cargar el catálogo completo cuando de verdad lo necesitan.
- Los comentarios se leen por objetivo y solo mientras están abiertos.
- El historial de chat se carga en tramos de 80 mensajes, manteniendo el listener en tiempo real.
- Se comparte una caché en memoria y otra persistente en IndexedDB (solo datos públicos) con TTL, deduplicación de peticiones simultáneas, separación por cuenta e invalidación.
- Se corrigieron dependencias de React que reabrían listeners al cambiar XP, medallas o cualquier dato del perfil.
- Se eliminó el listener duplicado del documento del usuario en gamificación y los `ProgressionProvider` anidados.
- Se optimizaron consultas del panel y una lectura duplicada de las Cloud Functions.

## 2. Línea base y mediciones

Entorno: Vite en desarrollo, sesión de visitante (sin usuario autenticado), Firestore de producción.  
Instrumentación: `src/lib/firestoreDiagnostics.ts`, activa solo con `import.meta.env.DEV`.

### Inicio en frío

| Escenario | Documentos devueltos | Lecturas estimadas | Listeners permanentes |
|---|---:|---:|---:|
| Antes de diferir el catálogo (medición conservadora) | 11.400 | 11.400 | 13 |
| Después, primera visita | **37** | **37** | **1** |
| Después, recarga dentro del TTL | **7** | **7** | **1** |
| Variación en la primera visita | **−11.363 (−99,7 %)** | **−11.363** | **−12** |

La medición anterior se tomó después de convertir los listeners estáticos en lecturas, pero antes de diferir el catálogo. No incluía la colección completa de comentarios que el código anterior también escuchaba, por lo que el consumo original real era **igual o superior** a 11.400 documentos.

El único listener permanente de Comunidad en Inicio es el feed de hilos. La sesión autenticada añade los listeners propios de Auth, chats, clubes y notificaciones descritos más abajo.

### Wiki

| Escenario | Antes | Después |
|---|---:|---:|
| Abrir el catálogo de la Wiki | 11.197 documentos | **172 documentos** |
| Abrir una ficha concreta | 11.197 documentos | **63 documentos** |
| Volver a abrir una ficha ya visitada | Nueva lectura completa | **0 lecturas nuevas** (caché en memoria) |
| Recargar la ficha dentro del TTL | Nueva lectura completa | **7 documentos** (solo el feed de hilos) |
| Pestaña global de episodios/personajes o búsqueda | Colección completa | Colección completa **solo al solicitarla** |

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
  - TTL orientativos: listado de animes, 5 min; fichas/episodios/personajes, 30 min; configuración, 60 min.
  - El navegador que hace un cambio invalida su propia caché al momento; otros navegadores ven el cambio al caducar su TTL o al limpiar la caché.
- `src/lib/firestoreDiagnostics.ts`
  - Solo en desarrollo.
  - Registra operación, colección, origen, documentos, tiempo, listeners creados/eliminados y aciertos/fallos de caché.
  - No registra mensajes, tokens, correos ni identificadores de documentos.
  - Consola: `window.__geekapooFirestore.snapshot()` y `reset()`.

### Comunidad y Wiki

- Inicio solo carga 6 series para la barra lateral, además de categorías, curiosidades y diálogos de la mascota.
- El listado completo de series se carga al entrar en la Wiki, el perfil o el panel.
- Temporadas, episodios y personajes de cada serie se cargan solo al abrir su ficha.
- `ensureAnimeData(animeId)` carga solo la serie abierta.
- `ensureCatalogData()` carga el catálogo completo solo para búsqueda global o pestañas globales de episodios/personajes.
- La caché se invalida desde las escrituras del panel, incluidas las de una serie concreta.
- Los comentarios se cargan con `useCommentsForTarget` únicamente al desplegar el objetivo y se limpian al cerrar.
- El historial anterior del hilo/episodio/personaje se pagina con “Cargar comentarios anteriores”.
- El perfil consulta solo los comentarios del autor y los que le gustaron, con paginación y caché corta.
- El total de comentarios del perfil usa una consulta agregada del servidor; no se deduce del primer tramo cargado.

### Chats

- Historial inicial de 80 mensajes, no la conversación completa.
- Botón “Cargar mensajes anteriores” con conservación de la posición del scroll.
- Los listeners se mantienen en tiempo real.
- Se estabilizaron las dependencias por `uid`: un cambio de XP no reabre chats, solicitudes, bloqueos ni mensajes.

### Clubes y seguidos

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

### Configuración y disponibilidad

- Ajustes del sitio y obras semanales usan caché larga con invalidación al guardar.
- Plataformas, regiones y disponibilidad regional usan caché y consultas puntuales, no listeners permanentes.
- Las páginas que siguen necesitando tiempo real (chats, clubes, notificaciones, hilos, comentarios abiertos, reacciones) lo conservan.

### Panel y Cloud Functions

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
  - Inicio en frío: 37 documentos, 1 listener activo.
  - Inicio recargado dentro del TTL: 7 documentos (solo el feed de hilos), 16 aciertos de caché.
  - Wiki catálogo: 172 documentos (solo el listado de series).
  - Ficha Kaguya: 63 documentos.
  - Volver a la ficha: 0 lecturas, aciertos de caché.
  - Recargar la ficha dentro del TTL: 7 documentos, 22 aciertos de caché.
  - Abrir/cerrar comentarios: 1 documento y 0 listeners al cerrar.
  - Búsqueda/pestañas globales: cargan el catálogo completo solo al pedirlo.
  - No se creó contenido de prueba con más de 200 comentarios en producción; la paginación nueva está compilada y cubierta por tipos, pero falta probarla con un hilo real de ese tamaño.
  - La escucha de canales solo para el club abierto está compilada, pero necesita una prueba autenticada real para confirmar el cambio de club y el estado de carga.
- `npm run test:rules`: se ejecutó durante más de 15 minutos; todos los casos mostrados pasaron, pero el proceso superó el límite de tiempo antes del resumen final. No se observaron fallos. No se presenta como suite completa certificada.

## 8. Archivos principales modificados

- Nuevos:
  - `src/lib/firestoreCache.ts`
  - `src/lib/persistentCache.ts`
  - `src/lib/firestoreDiagnostics.ts`
  - `src/hooks/useCommentsForTarget.ts`
  - `src/hooks/useProfileComments.ts`
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
  - `src/components/wiki/AnimeWiki.tsx`
  - `src/components/wiki/MainTabs.tsx`
  - `src/components/profile/ProfileView.tsx`
  - `src/components/profile/ProfileContent.tsx`
  - `src/components/chat/ChatView.tsx`
  - `src/components/search/GlobalSearch.tsx`
  - `src/components/admin/AdminPanel.tsx`
  - `src/components/tierlists/TierListEditor.tsx`
  - `src/hooks/useStreamingAvailability.ts`
- Servicios:
  - `src/services/chats.ts`
  - `src/services/comments.ts`
  - `src/services/likes.ts`
  - `src/services/notifications.ts`
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

- **Estimación de lecturas evitadas en rutas medidas:** 11.363 documentos menos en Inicio, 11.025 menos al abrir el catálogo de la Wiki y hasta 11.134 menos al abrir una ficha.
- **Porcentaje estimado en esas rutas:** 99,7 % en Inicio, 98,5 % en el catálogo y 99,4 % en la ficha.
- **Recargas dentro del TTL:** Inicio baja de 37 a 7 documentos y una ficha ya cacheada de 63 a 7; los 7 son el listener de hilos, no el catálogo.
- **Ahorro monetario real:** no medido. Falta contrastar con las métricas de Firebase/Google Cloud tras desplegar.
- Los documentos devueltos no son una factura: no se deben multiplicar por el precio sin validar las métricas reales.

## 10. Pendientes y siguientes pasos

1. **Feed de hilos:** sigue escuchando la colección de hilos completa. Debe paginarse por cursor; perfiles, búsqueda y panel necesitan consultas propias antes de recortarlo.
2. **Catálogo global de episodios/personajes:** al abrir sus pestañas o buscar se sigue descargando completo. La siguiente mejora es búsqueda/paginación del lado del servidor.
3. **Panel de administración:** mantiene listeners de todas las colecciones mientras está abierto. Es aceptable por uso restringido, pero se puede pasar a consultas bajo demanda.
4. **Medición real:** ejecutar los mismos escenarios con una cuenta de prueba y comparar con las métricas de Firebase.

## 11. Despliegue

La primera tanda (índices, Functions y frontend) ya fue desplegada por el usuario.  
Las mejoras posteriores de paginación, canales y caché persistente son **solo frontend**: requieren una nueva publicación en Vercel, sin nuevos índices ni Functions.

No se ha desplegado nada automáticamente desde este entorno.
