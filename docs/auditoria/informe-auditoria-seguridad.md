# Auditoría de seguridad de Geekapoo

- **Fecha:** 28-31 de octubre de 2026
- **Proyecto Firebase:** `geekapoo-7624d`
- **Commit de referencia (auditoría):** `64a68a7` (`seguridad(firestore): proteger contadores e implementar gestión de likes con funciones de servidor`)
- **Correcciones:** P0 `cc35d84`; P1 `19a3912`
- **Residuales 4.N:** commits `2c9ecd4` (reglas, cliente, Functions y pruebas) y `e2185b8` (región de los triggers); verificados en el emulador el 30-10-2026 y desplegados
- **Integración:** `main` sincronizado con `origin/main`; código desplegado en `e2185b8`; la rama `seguridad/p0-auditoria` se eliminó después del merge
- **Alcance:** reglas de Firestore, Cloud Functions con Admin SDK, servicios React/TypeScript y modelo de datos de las superficies de comunidad, chats, clubes, gamificación y moderación.
- **Estado:** **P0, P1 y residuales desplegados en producción.** Hosting sirve `assets/index-CjW2VmpW.js`; el release `cloud.firestore` apunta al ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de` (152.933 bytes, 30-10-2026 23:55:24 UTC) y `firebase.storage` al ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7` (11.644 bytes, 23:55:20 UTC). Las Functions siguen en **21 triggers en `europe-southwest1` + 22 callables/scheduled en `us-central1`**, 43 en total y sin duplicados. Verificado: **830 reglas + 105 de chat + 6/6 E2E de residuales**; altas/estadísticas de club **167 focalizadas + 7/7 E2E**; Storage y bloqueos en directos desplegados. App Check está inicializado con reCAPTCHA Enterprise, pero **el enforcement sigue pendiente**. Quedan residuales P2 y superficies sin prueba de extremo a extremo. **No se declara la aplicación segura en su conjunto.**

---

## 1. Resumen ejecutivo

La auditoría inicial revisó `firestore.rules`, `functions/src/index.ts` y los servicios de `src/services`, y convirtió la revisión estática en pruebas ejecutables contra Firebase Emulator Suite. Esa primera pasada confirmó **19 casos vulnerables en reglas**, **9 callables de administración invocables por un moderador** y **farmeo de XP de extremo a extremo** con comentarios apuntando a objetivos inexistentes.

Sobre la rama `seguridad/p0-auditoria` se aplicaron las correcciones P0 en reglas, Functions y el servicio de chats. Esas correcciones se commitearon en `cc35d84` y se desplegaron en `geekapoo-7624d`. Las pruebas de caracterización se invirtieron: los 17 casos P0 que antes usaban `assertSucceeds` ahora usan `assertFails` y actúan como regresión.

Después se corrigieron los P1, se commitearon en `19a3912` y se desplegaron:

- **F4:** `replyTo` ahora exige que el mensaje citado exista en el mismo chat y que autor y texto canónico coincidan exactamente.
- **G1:** las solicitudes usan ids deterministas, `fromName`/`fromAvatar` se derivan del perfil, `createdAt` debe ser `request.time`, hay cooldown de 24 h tras un rechazo y una sola ruta por par/grupo-persona.
- **Fecha de los fijados:** `mensajeCreadoEnMs` se contrasta con `createdAt.toMillis()` del mensaje real (o con el texto exacto en mensajes antiguos).

Los residuales de G1 están cerrados, verificados y **desplegados** desde el 30-10-2026:

- **Rate limit global:** libro mayor `rateLimits/{uid}` con 20 solicitudes por usuario cada 24 h. Se escribe en la misma transacción que la solicitud y la regla exige, con `getAfter()`, que `ultimaSolicitudId` sea el id exacto de la solicitud creada o reabierta, de modo que un incremento no puede cubrir varias.
- **Cambio de dueño de grupo:** `onChatOwnerChanged` borra las solicitudes pendientes dirigidas al dueño anterior y las invitaciones firmadas por él, conserva las históricas, las de terceros y las ya dirigidas al dueño nuevo, y repara el índice `groupCodes`.
- **Farmeo de XP con comentarios válidos:** se pagan como máximo 10 comentarios por ventana de 10 minutos y 50 por día UTC. El comentario que excede el cupo se sigue publicando y cuenta en `commentsCount`, pero no paga XP ni suma a `stats.commentsCreated`.
- **Bloqueos:** crear o reabrir una solicitud y aceptarla respetan los bloqueos en ambos sentidos; si quien bloqueó es el receptor, aceptar desbloquea.

La evidencia está en la sección 4.N y en `docs/auditoria/resultados-residuales.json`.

### Resultados finales

| Prueba | Resultado |
|---|---|
| Reglas de la auditoría (32 casos) | **32 passing**, 0 failing; 17 regresiones P0 y 4 regresiones P1 (F4/G1) en `assertFails`, 11 controles |
| Suite completa de reglas (`npm run test:rules`) | **830 passing**, 0 failing (15 min) |
| Corrida focalizada de chat | **105 passing**, 0 failing; incluye el bypass de lote del cupo |
| Corrida focalizada de group-codes, privacidad y auditoría | **91 passing**, 0 failing |
| E2E de residuales (`scripts/auditoria-residuales.mjs`) | **6/6 comprobaciones correctas**; cupo 10/11 y diario, traspaso y bloqueos |
| Suite de fijados | Fecha real contrastada, milisegundo falso y campo omitido rechazados |
| Callables post-P0 | **0 hallazgos, 14 controles correctos, 0 errores** |
| Trigger de comentarios post-P0 | **3/3 rechazados**, XP 0 → 0, `commentsCreated = 0`, `bloqueado = true` |
| `npm run test:logica` | Correcto |
| `npm run lint` | Correcto |
| `npm --prefix functions run build` | Correcto |
| `npm run build` | Correcto |

### Riesgos cerrados en P0

1. Un administrador baneado conservaba `isAdmin()` y podía leer datos privados, cambiar roles y borrar perfiles.
2. Quien salía de un club conservaba el acceso a su chat, incluida la escritura de mensajes.
3. Un moderador podía ejecutar 9 callables que la interfaz mostraba como admin-only.
4. `desbanearUsuario` no aplicaba la jerarquía de `banearUsuario`.
5. Cualquier comentario a un objetivo inexistente pagaba XP y medallas.
6. Cualquier miembro de un chat podía ocultar/limpiar el chat a otra persona, falsear la vista previa y fijar mensajes con texto o autor inventados.
7. Los clubes aceptaban creación por baneados y chats inventados; el dueño baneado seguía administrando y añadiendo miembros.
8. Los hilos permitían `pinned` por el autor, tamaños sin revalidar y edición por baneados.
9. `createdAt` era manipulable y alimentaba la medalla de veterano.

### Riesgos cerrados en P1 (verificados en el emulador y desplegados)

1. **F4:** se podía fabricar una cita de un mensaje inexistente o atribuir a otra persona un texto que nunca escribió.
2. **G1:** se podían inundar las solicitudes con ids arbitrarios y presentarse con un nombre o avatar falsos.
3. **Fecha de los fijados:** `mensajeCreadoEn` no se contrastaba con el `createdAt` real del mensaje.

### Riesgos que siguen abiertos

- **Cobertura E2E incompleta:** canales, Storage, App Check, encuestas, tier lists, noticias, `reports`/`notifications` y moderación de clubes.

La auditoría no hizo pruebas destructivas contra producción. El P0 y el P1 se desplegaron después, con autorización. Todos los datos de las pruebas se crearon en proyectos `demo-*` del emulador.

---

## 2. Método y entornos

### 2.1 Capas revisadas

1. **Inventario:** colecciones, subcolecciones, rutas de escritura del cliente y callables.
2. **Revisión estática:** permisos, cambios de rol, suplantación, chats privados, canales restringidos, bypass de baneos, XP/medallas, solicitudes, datos personales, spam de escrituras, contadores y moderación de clubes.
3. **Pruebas en Emulator Suite:** casos positivos (lo legítimo sigue funcionando) y negativos (lo abusivo debe fallar).
4. **Corrección P0:** cambios en `firestore.rules`, `functions/src/index.ts` y `src/services/chats.ts`.
5. **Regresión:** inversión de las pruebas de caracterización y ejecución de las suites completas.
6. **Documentación:** evidencia, impacto, corrección aplicada y tareas pendientes.

### 2.2 Entorno

- Firestore Emulator, Auth Emulator y Functions Emulator.
- Proyecto de pruebas: `demo-geekapoo-auditoria`.
- Funciones locales servidas por el emulador con la misma distribución que producción: los 21 triggers de Firestore en `europe-southwest1` y los 22 callables/scheduled en `us-central1`. La región de los triggers se fijó en `e2185b8` para que un despliegue no cree duplicados.
- Se añadió el emulador de Auth a `firebase.json` (puerto 9099) para poder probar las callables con tokens reales del emulador. Es un cambio de infraestructura de pruebas, sin efecto en producción.
- El compilador de Firestore cuenta los comentarios y rechaza el conjunto si supera **262.144 bytes**. `firestore.rules` pasó de ese límite, así que `npm run rules:build` genera `firestore.deploy.rules` sin comentarios (152.854 bytes), conservando los números de línea. `firebase.json` apunta a ese artefacto y lo regenera en el `predeploy`; `npm run test:rules` también lo regenera antes de arrancar el emulador.

### 2.3 Salvaguardas

- Los scripts abortan si el proyecto no empieza por `demo-` o si falta `FIRESTORE_EMULATOR_HOST`.
- La revisión y las pruebas se hicieron íntegramente en emuladores; no se ejecutaron pruebas destructivas contra producción.
- No se probó nada contra `geekapoo-7624d` durante la auditoría.
- La sincronización de noticias del caso H9 escribió 168 documentos **en el emulador**, no en producción.
- El P0 se commitó en `cc35d84` y se desplegó en `geekapoo-7624d` con autorización. El P1 se commitó en `19a3912`, se integró en `main` con `b8f63c3` (PR #2) y se desplegó. Los residuales (`2c9ecd4`), la región de los triggers (`e2185b8`) y las altas/estadísticas de club (`4026f9c`) se desplegaron el 30-10-2026 con autorización expresa.

---

## 3. Resultados de las pruebas

| Prueba | Comando | Resultado |
|---|---|---|
| Reglas de la auditoría | `npx firebase emulators:exec --only firestore --project demo-geekapoo-auditoria "npx mocha tests/auditoria/firestore.hallazgos.rules.test.cjs --timeout 60000"` | **32 passing**, 0 failing |
| Callables post-P0 | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-callables.mjs"` | **0 hallazgos**, 14 controles OK, 0 errores |
| Trigger de comentarios post-P0 | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-triggers.mjs"` | **3/3 rechazados**; XP 0 → 0; `commentsCreated = 0`; `bloqueado = true` |
| Suite completa de reglas | `npm run test:rules` | **830 passing**, 0 failing (15 min) |
| Corrida focalizada de chat | `npx mocha tests/firestore.chat.rules.test.cjs` | **105 passing**, 0 failing |
| Corrida focalizada de Storage | `npx mocha tests/storage.rules.test.cjs` | **25 passing**, 0 failing |
| Corrida focalizada de encuestas de chat | `npx mocha tests/firestore.chat-polls.rules.test.cjs` | **23 passing**, 0 failing |
| Corrida focalizada de tier lists | `npx mocha tests/firestore.tierlists.rules.test.cjs` | **34 passing**, 0 failing |
| Corrida focalizada de noticias | `npx mocha tests/firestore.noticias.rules.test.cjs` | **14 passing**, 0 failing |
| Corrida focalizada de group-codes, privacidad y auditoría | `npx mocha` sobre las tres suites | **91 passing**, 0 failing |
| Corrida focalizada de clubes | `npx mocha` sobre clubs, clubs-join, clubs-channels y club-moderacion | **167 passing**, 0 failing |
| E2E de residuales | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-residuales.mjs"` | **6/6 comprobaciones correctas**, 0 errores |
| E2E de clubes | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-clubes.mjs"` | **7/7 comprobaciones correctas**, 0 errores |
| Migración de clubes (simulación) | `node scripts/migrar-clubes.mjs --project geekapoo-7624d` | **2 clubes, 8 usuarios, 0 cambios, 0 fechas futuras** |
| Migración de clubes (emulador) | Simulación + escritura sobre 2 chats de prueba | Simulación no escribe; escritura reconcilia `general` y `mods` |
| TypeScript | `npm run lint` | Correcto |
| Lógica | `npm run test:logica` | Correcto |
| Build de Functions | `npm --prefix functions run build` | Correcto |
| Build de la web | `npm run build` | Correcto |
| App Check | Build con `VITE_FIREBASE_APP_CHECK_KEY` de reCAPTCHA Enterprise | Correcto; el script de reCAPTCHA Enterprise carga en producción. Enforcement pendiente |
| Verificación de Hosting | `GET https://geekapoo-7624d.web.app` | Sirve `assets/index-CjW2VmpW.js`, idéntico al build local |
| Verificación de reglas Firestore | API `projects/geekapoo-7624d/releases/cloud.firestore` | Ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de`, 152.933 bytes, 0 comentarios, 23:55:24 UTC |
| Verificación de reglas Storage | API `projects/geekapoo-7624d/releases/firebase.storage` | Ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7`, 11.644 bytes, 23:55:20 UTC |
| Verificación de Functions | `firebase functions:list` + Cloud Functions API | **43 funciones**: 21 en `europe-southwest1` + 22 en `us-central1`, sin duplicados |

> **Nota sobre los errores esperados:** en las pruebas negativas aparecen mensajes `evaluation error at L...` y «maximum of 1000 expressions» para operaciones que deben fallar. Son el resultado de evaluar reglas contra escrituras denegadas; no son fallos de la suite. Las pruebas que exigen éxito pasan y las que exigen `permission-denied` también.

Archivos de resultados:

- `docs/auditoria/resultados-callables.json`
- `docs/auditoria/resultados-triggers.json`
- `docs/auditoria/resultados-residuales.json`
- `docs/auditoria/resultados-clubes.json`

---

## 4. Hallazgos y correcciones

Escala usada:

- **Crítico:** compromete datos privados o privilegios de administración a escala, o permite eludir una sanción de forma directa.
- **Alto:** escalada de privilegios, bypass de baneo o integridad de contenido/gamificación con abuso directo.
- **Medio:** abuso que requiere interacción o tiene alcance limitado.
- **Bajo:** integridad menor, ruido o higiene.

### Matriz rápida

| ID | Hallazgo | Severidad | Estado |
|---|---|---|---|
| A | Un admin baneado conserva `isAdmin()` en reglas | **Crítico** | **Corregido P0** |
| C2 | Salir de un club conserva el acceso a su chat | **Alto** | **Corregido P0**; migración de chats pendiente |
| I | Un moderador ejecuta callables de panel admin-only | **Alto** | **Corregido P0** (9 funciones) |
| J | `desbanearUsuario` no aplica jerarquía | **Alto** | **Corregido P0** |
| E | Comentarios a objetivos inexistentes pagan XP | **Alto** | **Corregido P0**; techo de XP desplegado (4.N) |
| F | Un miembro oculta/limpia/falsea el chat de otro | **Alto** | **Corregido P0** (F1-F3) |
| C1/C3/C4 | Clubes: creación/edición por baneados y altas sin consentimiento | **Alto** | **Corregido P0** el bypass de baneo; altas directas P1 |
| B | `createdAt` manipulable → medalla de veterano | **Medio** | **Corregido P0** |
| D | Hilos: `pinned` por autor, tamaños sin revalidar, edición por baneados | **Medio** | **Corregido P0** |
| G | Fijados con texto/autor falsos | **Medio** | **Corregido P0**; fecha del mensaje **corregida P1** |
| K | Spam de solicitudes de chat y remitente falsificado | **Medio** | **Corregido P1** (G1); rate limit y traspaso desplegados (4.N) |
| L | Estadísticas de club desde documentos del cliente | **Medio** | **Corregido, verificado y desplegado** |
| H | `replyTo` fabricado | **Bajo** | **Corregido P1** (F4) |
| M | Canales de club gestionados por baneados | **Medio/Bajo** | **Corregido, verificado y desplegado** |
| S | Storage: rol espejo y baneos en imágenes de club | **Medio** | **Corregido, verificado y desplegado** |
| B2 | El bloqueo no cortaba chats directos existentes | **Medio** | **Corregido, verificado y desplegado** |
| AC | App Check sin enforcement | **Cobertura** | Inicializado con reCAPTCHA Enterprise; enforcement pendiente |

---

### A. Un administrador baneado conserva los permisos de administrador en Firestore

**Severidad:** Crítico  
**Estado:** **corregido en P0**; regresión A1/A2 en `assertFails`.

**Evidencia original:**

- `isAdmin()` e `isModerator()` solo miraban `users/{uid}.role`; no llamaban a `isActive()` ni a `isBanned()`.
- `userPrivate` permitía `get` y `list` a `isAdmin()`.
- El `update` de `users` permitía al admin cambiar `role`, `xp`, `stats`, `medals` y el resto de campos no privados de cualquier usuario.
- El `delete` de `users` permitía al admin borrar el perfil de otra persona.
- Las callables ya comprobaban perfil, baneo y rol; el fallo estaba en las reglas.

**Impacto:** un administrador baneado seguía leyendo correos y ajustes privados, promoviendo o degradando admins, alterando XP/medallas y borrando perfiles. El baneo dejaba de ser una revocación efectiva.

**Corrección aplicada:**

```rules
function isAdmin() {
  return isActive() && myRole() == 'admin';
}

function isModerator() {
  return isActive() && (myRole() == 'admin' || myRole() == 'moderator');
}
```

`isActive()` exige sesión, perfil existente y ausencia de baneo. Con esto, todas las ramas que usan `isAdmin()`/`isModerator()` —incluidas `userPrivate`, `users`, contenido y moderación— quedan cerradas para una cuenta baneada.

**Verificación:** A1 (leer `userPrivate` ajeno) y A2 (promover a admin) fallan con `permission-denied`. El control de admin activo sigue funcionando.

---

### B. `createdAt` lo controla el usuario y alimenta la medalla de veterano

**Severidad:** Medio  
**Estado:** **corregido en P0**; regresión B1/B2 en `assertFails`.

**Evidencia original:**

- El `create` de `users` no prohibía `createdAt`.
- El `update` propio tampoco lo incluía entre las claves protegidas.
- `antiguedadDias: diasDesde(data.createdAt, ...)` alimenta `medal_veterano_comunidad` con `>= 365` días.

**Impacto:** un usuario podía nacer con una fecha de 2019 o cambiarla a 2020 y obtener la medalla de veterano sin cumplir el año.

**Corrección aplicada:**

- En `create`, el único valor aceptado es `request.resource.data.createdAt == request.time`.
- En `update`, `createdAt` queda congelado aunque quien escriba sea admin.
- Los perfiles antiguos sin el campo pueden rellenarlo, pero solo con la hora del servidor; una vez existe, no se mueve.

**Verificación:** B1 (retrasar la fecha al actualizar) y B2 (nacer con fecha inventada) fallan. La creación legítima con `serverTimestamp()` sigue pasando.

**Pendiente P1:** revisar y migrar perfiles con fechas sospechosas; recalcular la medalla de veterano si procede.

---

### C. Clubes

#### C1. Un baneado podía crear clubes con un `chatId` inventado

**Severidad:** Alto  
**Estado:** **corregido en P0**; regresión C1 en `assertFails`.

**Evidencia original:**

- `allow create` usaba `isSignedIn()`, no `isActive()`.
- La regla solo exigía que `chatId` fuera un string no vacío; no comprobaba que el chat existiera, fuera de tipo `club` ni que perteneciera al creador.
- `onClubCreated` marcaba estadísticas a partir del `ownerId` del documento.

**Impacto:** una cuenta baneada seguía creando contenido y disparando estadísticas/medallas, y podía dejar clubes huérfanos o apuntando a chats ajenos.

**Corrección aplicada:**

- `create` exige `isActive()`.
- Se valida que el chat exista, sea `type == 'club'`, tenga el mismo `slug` que el club, el mismo `ownerId` que el creador y exactamente al creador como único miembro.
- El trigger de clubes sigue siendo defensivo, pero la puerta principal es la regla.

**Verificación:** C1 (baneado creando club con chat inventado) falla. La creación legítima de club con su chat previo sigue pasando.

#### C2. Salir de un club conservaba el acceso a su chat

**Severidad:** Alto  
**Estado:** **corregido en P0**; regresión C2 con salida legítima y accesos posteriores denegados.

**Evidencia original:**

- La salida solo actualizaba `clubs/{clubId}`; no tocaba `chats/{chatId}.memberIds`.
- La lectura de chats solo miraba `request.auth.uid in resource.data.memberIds`.
- La escritura de mensajes usaba `isChatMember(chatId)`, que tampoco cruzaba con el club.
- `quitarMiembro` limpiaba los chats en una transacción, pero una escritura directa del cliente podía saltarse ese servicio.

**Impacto:** quien salía o era expulsado conservaba lectura y escritura de todos los chats del club, incluidos los canales restringidos.

**Corrección aplicada:**

- `isChatMember(chatId)` exige, para chats de tipo `club`, que el club exista y que el uid siga en `clubs/{slug}.memberIds`.
- `onClubMembersChanged` elimina a los que salieron de `memberIds` de todos los chats del club (chat principal y canales) y los añade a `hiddenFor`.
- `src/services/clubs.ts` sigue limpiando en la transacción del cliente, pero ya no es la única barrera.
- La consulta de la bandeja sigue usando `memberIds` del chat para que `where('memberIds', 'array-contains', uid)` funcione; la protección efectiva de subcolecciones está en `isChatMember()`.

**Verificación:** C2 comprueba que la salida del club sigue funcionando, que el usuario ya no lee ni escribe mensajes del chat y que, tras simular la limpieza del trigger, tampoco lee la ficha del chat.

**Ventana residual:** la lectura de la ficha `chats/{chatId}` sigue usando `memberIds` del chat para no romper la consulta de la bandeja. Hasta que el trigger limpia esa lista, quien acaba de salir podría leer metadatos del chat (nombre, vista previa), pero **no los mensajes**, que ya pasan por `isChatMember()`. El trigger reduce la ventana a milisegundos.

**Migración revisada (31-10-2026):** `scripts/migrar-clubes.mjs` en simulación sobre producción: **2 clubes, 8 usuarios, 0 chats con membresía distinta y 0 fechas futuras**. No hubo que escribir. El script queda para futuras revisiones y exige `--escribir --confirmar <proyecto>` para tocar producción.

#### C3/C4. Un dueño baneado seguía editando el club y añadía miembros sin consentimiento

**Severidad:** Alto  
**Estado:** **corregido P0** el bypass de baneo; las altas directas de un dueño activo se cerraron en la sección 4.L y **se desplegaron el 30-10-2026**.

**Evidencia original:**

- La rama del propietario no exigía `isActive()`.
- El borrado del club tampoco.
- La creación de canales no exigía `isActive()` en la rama de gestión.
- `onClubMembersChanged` marcaba `clubesUnidos` para cualquier uid nuevo en `memberIds`, aunque el dueño lo hubiera añadido directamente.

**Impacto:** un dueño baneado seguía administrando el club, borrándolo, creando canales y añadiendo a cualquiera. Esas altas disparaban estadísticas y posibles medallas sin consentimiento.

**Corrección aplicada:**

- Todas las ramas de gestión de clubes (edición, borrado, salida, canales y migración del `general`) exigen `isActive()`.
- La salida de un miembro exige coherencia entre `members`, `memberIds` y `memberCount`; no se puede usar para alterar a terceros.
- Se mantiene la posibilidad de que un dueño activo añada miembros directamente porque el flujo legítimo de desbaneo con lote la necesita; cerrarlo requiere una callable de consentimiento (P1).

**Verificación:** C3 (dueño baneado editando) y C4 (dueño baneado añadiendo a Alice) fallan. La salida legítima y la gestión por el dueño activo siguen pasando.

#### P1 asociado a clubes

- Mover altas/bajas a una callable transaccional con consentimiento.
- Hacer que `onClubMembersChanged` solo cuente altas producidas por el flujo servidor.
- Migrar chats existentes y revisar estadísticas/medallas de clubes.

---

### D. Hilos del foro: `pinned` por el autor, tamaños sin revalidar y edición por baneados

**Severidad:** Medio  
**Estado:** **corregido en P0**; regresión D1-D4 en `assertFails`.

**Evidencia original:**

- El autor podía actualizar `title`, `body`, `tags` y `pinned`; no se revalidaban longitudes ni formato.
- Los límites de `title <= 200` y `body <= 10000` solo existían en `create`.
- La rama del autor usaba `isSignedIn()`, no `isActive()`.

**Impacto:** cualquier autor podía fijar su hilo en el feed, publicar títulos de 300 caracteres o cuerpos de 20.000, y un autor baneado seguía editando.

**Corrección aplicada:**

- `update` del autor exige `isActive()` y revalida `title` (1-200) y `body` (<= 10.000).
- `pinned` queda fuera de las claves que puede tocar el autor; en `create` solo el equipo puede nacer con `pinned: true`.
- Las ramas de encuesta y tier list del autor también exigen `isActive()`.
- El borrado del autor exige `isActive()`.

**Verificación:** D1 (auto-fijado), D2 (título de 300), D3 (cuerpo de 20.000) y D4 (autor baneado editando) fallan. La edición legítima dentro de los límites sigue pasando.

---

### E. Comentarios a objetivos inexistentes pagan XP y medallas

**Severidad:** Alto  
**Estado:** **corregido en P0**; regresión E1/E2 y prueba E2E post-P0.

**Evidencia original:**

- El `create` solo exigía que `targetId` fuera string; no validaba `targetType` ni que el objetivo existiera.
- El `update` del autor solo permitía cambiar `body`, sin revalidar el máximo de 5.000.
- `onCommentCreated` contaba el comentario y concedía hitos sin comprobar que `targetType`/`targetId` correspondieran a un documento real.

**Prueba E2E original:** tres comentarios con `targetType: 'inventado'` y `targetId: 'objetivo-fantasma-N'` produjeron XP 0 → 15, `stats.commentsCreated` 0 → 3 y las medallas `medal_primera_voz` y `medal_novato_multiverso`.

**Impacto:** farmeo ilimitado de XP, niveles y medallas; alteración de la clasificación y de los requisitos. Los comentarios no aparecían en ninguna vista, así que el abuso era invisible para la moderación.

**Corrección aplicada:**

- `create` exige `targetType` en `['thread', 'anime', 'episode', 'character']` y que el documento correspondiente exista (`objetivoDeComentarioExiste`).
- `update` del autor exige `isActive()`, `body is string`, `body <= 5000` y la misma regla de cuerpo vacío con GIF/imagen.
- `onCommentCreated` vuelve a comprobar el objetivo con Admin SDK antes de pagar XP o contar; si no existe, registra un aviso y sale sin recompensa. Esto cubre también escrituras hechas con Admin SDK o comentarios anteriores al despliegue.

**Verificación:** E1 (editar a 6.000 caracteres) y E2 (crear con objetivo inventado) fallan. La prueba E2E post-P0 intenta tres comentarios y los tres son rechazados; XP sigue en 0, `commentsCreated` en 0 y `bloqueado = true`.

**Residual (cerrado y desplegado el 30-10-2026):** el techo de recompensas por comentario válido está en la sección 4.N: 10 por ventana de 10 minutos y 50 por día UTC, con reserva idempotente por `commentId`. El comentario que excede el cupo se publica y cuenta, pero no paga.

---

### F. Un miembro del chat podía ocultar, limpiar o falsear el chat de otra persona

**Severidad:** Alto  
**Estado:** **corregido en P0** F1-F3 y **en P1** F4.

**Evidencia original:**

- La rama de miembro permitía escribir `lastMessage`, `lastMessageAt`, `lastMessageSenderId`, `readAt`, `hiddenFor` y `clearedAt`, incluidas las claves de otros usuarios.
- No había validación de tipos, longitudes ni de que las claves correspondieran al uid que llamaba.

**Impacto:** ocultar o limpiar el chat a otra persona, falsear la vista previa y el remitente, marcar como leídos mensajes ajenos y engordar el documento del chat.

**Corrección aplicada:**

- `lastMessage*` ya no lo escribe el cliente: `onChatMessageCreated` actualiza la vista previa en una transacción y solo si el mensaje es más reciente. `src/services/chats.ts` dejó de escribir esos campos.
- `readAt`, `clearedAt` y `hiddenFor` solo pueden añadir o quitar la clave del uid autenticado; `chatHiddenForSoloCambiaSuUid()` compara la lista anterior y la nueva en ambos sentidos.
- Se consolidaron las ramas de `allow update` para no agotar el límite de 1.000 expresiones: admin con `isAdmin()` (que ya incluye `isActive()`), ramas de club con `type == 'club'` antes de `isActive()` y una rama final para miembro/grupo.
- Las encuestas de mensajes comparan contra `resource.data.poll` en lugar de repetir `get()`.

**Verificación:** F1 (falsear la vista previa), F2 (ocultar/limpiar a Alice) y F3 (fijado con autor/texto falsos) fallan. La actualización legítima de la propia preferencia sigue pasando.

#### F4. Citas (`replyTo`) fabricadas — corregido en P1

**Severidad:** Bajo  
**Estado:** **corregido, verificado en el emulador y desplegado**.

**Evidencia original:**

- `replyTo` solo se validaba como mapa con `messageId`, `senderName` y `snippet` de tipo string y `snippet <= 200`.
- No se comprobaba que el mensaje citado existiera ni que el autor o el texto coincidieran.

**Impacto:** se podía citar un mensaje inexistente o atribuir a alguien una frase que no dijo.

**Corrección aplicada:**

- `citaCoincideConMensaje(chatId, cita)` lee `chats/{chatId}/messages/{cita.messageId}` y exige que exista.
- Compara `senderName` con el autor real del mensaje y `texto` con el texto canónico completo.
- El texto canónico replica `textoParaCita` del cliente: cuerpo sin espacios en los extremos o, si no hay, `[Foto]`, `GIF`, `Ubicación`, `📊 pregunta` o `🏆 título`.
- Se guarda el texto **completo** (hasta 4.000 caracteres) porque las reglas no tienen `slice`/`substring` y no podrían validar un prefijo. El recorte a 120 caracteres es solo de la vista (`fragmentoParaCita`).
- Solo se admiten `messageId`, `senderName` y `texto`; `snippet` queda como compatibilidad de lectura para citas antiguas y los mensajes nuevos ya no lo escriben.

**Verificación:** citar un mensaje inexistente, cambiar el autor, cambiar el texto, escribir solo `snippet` o superar el tamaño fallan. Citar un mensaje real, un texto largo, una foto y una encuesta pasa. La regresión de auditoría F4 está en `assertFails` y el control positivo también pasa.

---

### G. Mensajes fijados con texto y autor falsos

**Severidad:** Medio  
**Estado:** **corregido en P0** y **fecha corregida en P1**; regresión F3 en `assertFails`.

**Evidencia original:**

- Se comprobaba que el mensaje existiera, que `fijadoPor` fuera el uid y que los campos tuvieran la forma esperada.
- `texto`, `autorId`, `autorNombre`, `tipo` y `mensajeCreadoEn` se copiaban del cliente y no se contrastaban con el mensaje original.

**Impacto:** un miembro podía fijar un mensaje citando a un administrador o a otra persona con un texto que nunca escribió.

**Corrección aplicada:**

- `fijadoCoincideConMensaje(chatId, messageId)` lee el mensaje real y compara `autorId`, `autorNombre`, `autorAvatar`, `texto`, `tipo` y la fecha.
- Si `createdAt` es un `Timestamp`, exige que `mensajeCreadoEnMs == createdAt.toMillis()` y que `mensajeCreadoEn` siga siendo un string acotado. Si `createdAt` es un string antiguo, exige `mensajeCreadoEn` exacto y un `mensajeCreadoEnMs` numérico.
- El cliente (`chatFijados.ts`) calcula `mensajeCreadoEnMs` con `Date.parse(msg.createdAt)`, que coincide con los milisegundos del `Timestamp`.
- El `texto` se guarda completo (hasta 4.000 caracteres, el máximo del mensaje) y se compara de forma exacta. Antes el cliente lo truncaba a 300 y la regla solo podía comprobar la longitud: un mensaje largo se podía fijar con otra frase.
- La creación sigue exigiendo membresía, `isActive()`, permiso de fijado, `chatId`/`messageId` coherentes y `fijadoPor == request.auth.uid`.
- `autorAvatar` se añadió a la forma validada y al cliente (`chatFijados.ts`).

**Verificación:** F3 (fijado con `autorId: 'admin'` y texto inventado) falla. También falla fijar un mensaje largo con un resumen inventado, un milisegundo falso o sin `mensajeCreadoEnMs`; pasa el fijado con el texto exacto y la fecha real. El fijado legítimo de un mensaje real sigue pasando.

---

### H. Citas (`replyTo`) fabricadas

Ver **F4** en la sección anterior. **Corregido en P1**, verificado y desplegado.

---

### I. Un moderador ejecuta callables que la interfaz muestra como admin-only

**Severidad:** Alto  
**Estado:** **corregido en P0**; regresión H1-H9 con token de moderador.

**Evidencia original:**

- `exigirAdmin` aceptaba `role === 'admin'` **o** `role === 'moderator'`.
- La interfaz usaba `isAdmin` para avisar y deshabilitar los controles de gamificación.
- `abrirChatDirecto` usaba `exigirAdmin` y creaba un chat privado sin solicitud ni consentimiento.
- `desbanearUsuario` usaba `exigirAdmin` y no aplicaba jerarquía.
- El comentario de `sincronizarNoticias` decía que las funciones de panel “admiten admin y moderacion”.

**Pruebas originales confirmadas con token de moderador:** `ajustarXp`, `concederMedalla`, `configurarGamificacion`, `recalcularUsuario`, `abrirChatDirecto`, `desbanearUsuario`, `gestionarTriviaDiaria`, `sincronizarBaneos` y `sincronizarNoticias` devolvían 200 y ejecutaban la acción.

**Impacto:** escalada vertical de privilegios. Un moderador podía alterar la gamificación global, conceder medallas, ajustar XP, recalcular cuentas, abrir conversaciones privadas, levantar baneos de administradores, cerrar trivias y ejecutar mantenimiento. El nombre `exigirAdmin` y la interfaz prometían una barrera que el backend no aplicaba.

**Corrección aplicada:**

- `exigirRol(auth, permitidos)` comprueba sesión, perfil, rol permitido, baneo y registro duradero.
- `exigirAdmin()` acepta solo `admin`; `exigirModerador()` acepta `admin` y `moderator`.
- Las 9 callables de panel pasan a `exigirAdmin`: `ajustarXp`, `concederMedalla`, `configurarGamificacion`, `recalcularUsuario`, `abrirChatDirecto`, `desbanearUsuario`, `gestionarTriviaDiaria`, `sincronizarBaneos` y `sincronizarNoticias`.
- `banearUsuario`, `desbanearUsuario` y `gestionarEncuesta` usan `exigirModerador` con las comprobaciones de jerarquía o de permiso que correspondan.

**Verificación post-P0:** el script `scripts/auditoria-callables.mjs` confirma que un moderador recibe `permission-denied` en las 9 callables. Los 5 controles (usuario normal, moderador baneado, moderador baneando a admin/moderador, admin cambiando la configuración) se comportan correctamente. Resultado: **0 hallazgos, 14 controles correctos, 0 errores**.

---

### J. `desbanearUsuario` no aplica la jerarquía de `banearUsuario`

**Severidad:** Alto  
**Estado:** **corregido en P0**; regresión H6.

**Evidencia original:**

- `banearUsuario` impedía que un moderador banease a un admin o a otro moderador.
- `desbanearUsuario` solo comprobaba que el llamante pasara `exigirAdmin`; no miraba el rol del objetivo.

**Impacto:** un moderador podía levantar el baneo de un administrador o de otro moderador, revocando una decisión de un superior.

**Corrección aplicada:**

- `desbanearUsuario` usa `exigirModerador` y lee el perfil del objetivo.
- Si el objetivo es `admin` o `moderator` y el llamante no es `admin`, devuelve `permission-denied`.
- La misma jerarquía se mantiene en `banearUsuario`.

**Verificación:** H6 (moderador desbaneando a un admin) falla. Los controles de moderador baneando a admin/moderador también fallan; el admin sigue pudiendo desbanear.

---

### K. Spam de solicitudes de chat y remitente falsificado — corregido en P1

**Severidad:** Medio  
**Estado:** **corregido, verificado en el emulador y desplegado**. Los residuales de rate limit global y traspaso de grupo están cerrados y desplegados (sección 4.N).

**Evidencia original:**

- El `create` de `chatRequests` no imponía un id determinista ni un límite de frecuencia.
- `fromName` y `fromAvatar` los escribía el cliente y solo se validaban por tipo/tamaño; no se contrastaban con `users/{fromId}`.
- `acceptsChatRequests` sí validaba que el destinatario existiera, estuviera activo y aceptara solicitudes (control correcto).

**Impacto:** un usuario podía inundar la bandeja de otro con solicitudes y presentarse como “Soporte oficial” o con el avatar que quisiera.

**Corrección aplicada:**

- Ids deterministas: `direct_{fromId}_{toId}`, `group_{groupId}_{fromId}` e `invite_{groupId}_{fromId}_{toId}`. La regla reconstruye el id con los campos del documento, así que no se puede elegir una ruta nueva por intento.
- `fromName`/`fromAvatar` se comparan con `users/{fromId}`. En solicitudes directas y en invitaciones también se comparan `toName`/`toAvatar` con el perfil del destinatario. En solicitudes de grupo se exige que `groupName` coincida con el nombre real del chat.
- `createdAt == request.time`: la fecha la pone el servidor.
- Una sola solicitud por par/grupo-persona. Se puede reabrir una cancelada; una rechazada, tras 24 h; una aceptada de grupo o invitación, solo si la persona ya no es miembro. La reapertura solo toca `status` y limpia `respondedAt`/`respondedBy`.
- `src/services/chatRequests.ts` usa `crearOReabrir()` y aplica el mismo cooldown en el cliente para dar un error legible.

**Verificación:** la regresión G1 de auditoría está en `assertFails`: nombre/avatar falsos, ids arbitrarios y suplantación de remitente fallan; una solicitud legítima con id determinista e identidad real pasa. La suite principal cubre además destinatario falso, `createdAt` falso, `groupName` falso, reapertura de canceladas, cooldown de 24 h, reapertura a las 25 h, grupos/invitaciones aceptados con y sin membresía, y el caso directo aceptado (no se reabre).

**Residuales (cerrados y desplegados el 30-10-2026):**

- **Rate limit global por emisor:** libro mayor `rateLimits/{uid}` con 20 solicitudes cada 24 h. La solicitud y el contador se escriben en la misma transacción; la regla usa `getAfter()` y `ultimaSolicitudId == request.resource.id` para impedir que un único incremento cubra varias solicitudes. Una ventana caducada solo se reinicia con `count == 1` y `windowStart == request.time`.
- **Cambio de dueño de un grupo:** `onChatOwnerChanged` borra las solicitudes pendientes dirigidas al dueño anterior y las invitaciones firmadas por él, conserva las históricas, las de terceros y las ya dirigidas al dueño nuevo, y repara `groupCodes`.
- **Bloqueos:** crear o reabrir una solicitud exige que no haya bloqueo en ningún sentido. Aceptar un directo se rechaza si bloqueó el emisor y desbloquea si bloqueó el receptor. Las solicitudes de grupo/invitación se rechazan si hay bloqueo en cualquier sentido.

---

### L. Estadísticas de club desde documentos que controla el cliente — corregido y desplegado

**Severidad:** Medio  
**Estado:** **corregido, verificado en Firebase Emulator Suite y desplegado el 30-10-2026**.

**Evidencia:**

- `onClubCreated` marca `clubesCreados`/`clubesUnidos` a partir de `ownerId`.
- `onClubMembersChanged` marca `clubesUnidos` a cualquier uid nuevo en `memberIds`, aunque el dueño lo haya añadido directamente.
- `onChannelCreated` confía en `createdBy`.
- `onChatParticipado` confía en `senderId`.
- `marcarMapa` actualiza estadísticas y evalúa medallas.

**Impacto:** inflación de estadísticas y medallas sin acciones reales. C4 ya no permite el bypass por un dueño baneado, pero un dueño activo todavía puede añadir a alguien directamente y el trigger lo contará como “unido”.

**Corrección aplicada:**

- **Altas solo por servidor:** las reglas de `clubs/{clubId}` exigen `sinAltasDeMiembros()`. El propietario, un admin y el propio usuario ya no pueden añadir a nadie desde el cliente; la rama de auto-unión pública se eliminó. Las altas pasan por `unirseClubPublico`, `responderSolicitudClub` o `levantarSancionClub`.
- **Desbaneo por callable:** como el desbaneo vuelve a meter a la persona en el club, se movió a `levantarSancionClub`, que replica la jerarquía de `puedeLevantar`, restaura el rol previo y la reincorpora a sus chats en una transacción.
- **Medalla solo desde el flujo servidor:** `onClubMembersChanged` ya no concede `clubesUnidos`; lo hacen las tres callables después de la transacción. Una escritura directa en `memberIds` (Admin SDK/consola) no paga medalla. `onClubCreated` sigue marcando al creador porque la creación exige `ownerId == request.auth.uid`, un único miembro y un chat coherente.
- **Canales:** `onChannelCreated` confía en `createdBy`, pero la regla lo ata al usuario: alta normal `createdBy == request.auth.uid`; migración del `general` `createdBy == ownerId` del club. Así nadie infla la medalla de un tercero.
- **Chats participados:** `onChatParticipado` sigue leyendo `senderId`, pero la regla de mensajes ya exige `senderId == request.auth.uid`; no hay atribución falsa posible.
- **Pruebas:** 3 regresiones nuevas de altas en `tests/firestore.clubs.rules.test.cjs`, 1 de `createdBy` en canales, 2 en la suite de auditoría (C5/C6) y una E2E de 7 casos con medallas, solicitud aceptada, desbaneo y canales.

**Verificación:** suite completa **830 passing**, focalizadas de clubes **167 passing** y E2E **7/7 comprobaciones correctas**. Desplegado: ruleset `799da4a3-2030-4546-a1f1-728c9a2e1c82`, bundle `index-BruzyIzl.js` y 43 Functions (21 Europa + 22 US).

---

### M. Canales de club gestionados por cuentas baneadas

**Severidad:** Medio/Bajo  
**Estado:** **corregido, verificado en el emulador y desplegado**. La E2E de clubes cubre dueño baneado y miembro sancionado en el canal `general`.

**Evidencia original:**

- La creación de canales usaba `puedeGestionarCanales()` o `isAdmin()`, pero `puedeGestionarCanales` no exigía `isActive()`.
- La ruta de migración del canal `general` permitía crearlo a cualquier miembro del club, sin `isActive()`.

**Impacto:** un dueño o gestor baneado podía seguir creando canales y modificando la estructura del club.

**Corrección aplicada:**

- Las ramas de creación, actualización y borrado de canales exigen `isActive()`.
- La migración del `general` exige membresía activa y coherencia con el club/chat.
- Las sanciones de club y las solicitudes de acceso también exigen `isActive()`.

**Verificación:** la suite de canales (`tests/firestore.clubs-channels.rules.test.cjs`) pasa, incluidos los casos de canal `mods`, chat del canal y gestión por el equipo. La E2E `scripts/auditoria-clubes.mjs` añade **7/7** comprobaciones: dueño baneado que no crea/edita/borra canales y miembro sancionado que no escribe en `general` (y sí escribe al levantar el silencio).

---

### N. Residuales de G1, farmeo de XP y bloqueos — corregidos y desplegados

**Severidad:** Medio  
**Estado:** **corregido, verificado en Firebase Emulator Suite y desplegado el 30-10-2026** (`2c9ecd4`, con la región de los triggers en `e2185b8`).

**Evidencia original:**

- El id determinista de `chatRequests` impedía duplicados contra el mismo destinatario, pero no limitaba cuántos destinatarios o grupos distintos podía escribir una cuenta.
- Al transferir un grupo, las solicitudes pendientes conservaban el `toId` del dueño anterior y las invitaciones seguían firmadas por él.
- Un comentario válido pagaba 5 XP y sumaba a `stats.commentsCreated` sin techo: escribir cien comentarios en el mismo hilo inflaba la clasificación.
- Los bloqueos eran una barrera de cliente: las reglas de `chatRequests` y la callable `responderSolicitudChat` no los aplicaban.

**Corrección aplicada:**

- **Cupo de solicitudes:** `rateLimits/{uid}` guarda `count`, `windowStart`, `ultimaSolicitud` y `ultimaSolicitudId`. `src/services/chatRequests.ts` escribe la solicitud y el libro en la misma transacción. La regla de `chatRequests` exige `getAfter()` con `count` incrementado exactamente uno y `ultimaSolicitud == request.time`; `ultimaSolicitudId == request.resource.id` ata el hueco a esa solicitud concreta. Límite: 20 por usuario cada 24 h; la ventana caducada solo se reinicia con `count == 1` y `windowStart == request.time`.
- **Traspaso de grupo:** `onChatOwnerChanged` borra solo las solicitudes `group` pendientes con `toId` del dueño anterior y las `invite` pendientes con `fromId` del anterior. Conserva las históricas, las de terceros y las ya dirigidas al dueño nuevo. Repara `ownerId`/`ownerName` de `groupCodes` si el cliente no lo hizo.
- **Techo de XP por comentarios:** `reservarCupoComentario()` usa ventanas de 10 minutos y de día UTC (10 y 50 recompensas), con una reserva idempotente por `commentId`. Si no hay cupo, el comentario se publica y `commentsCount` sube igual, pero no se concede XP ni se incrementa `stats.commentsCreated`.
- **Bloqueos:** las reglas de creación y reapertura de `chatRequests` llaman a `hayBloqueoCon()`; `responderSolicitudChat` rechaza si bloqueó el emisor y, si bloqueó el receptor de un directo, acepta y elimina el bloqueo. Para grupos e invitaciones, cualquier bloqueo impide aceptar.
- **Presupuesto de accesos:** `acceptsChatRequests()` usa un solo `get()` en lugar de `exists()` + `get()`, y el cupo usa un único `getAfter()`. Así las ramas de grupo no superan el límite de 10 accesos por operación.

**Verificación:**

- `npm run test:rules`: **830 passing, 0 failing**.
- `tests/firestore.chat.rules.test.cjs`: **105 passing, 0 failing**. Incluye el caso nuevo «dos solicitudes no pueden compartir un solo hueco» y los bloqueos en directos.
- `tests/firestore.group-codes.rules.test.cjs` + `tests/firestore.privacidad-perfiles.rules.test.cjs` + `tests/auditoria/firestore.hallazgos.rules.test.cjs`: **91 passing, 0 failing**.
- E2E `scripts/auditoria-residuales.mjs` con Firestore, Auth y Functions: **6/6 comprobaciones correctas**.
  - 11 comentarios: `xp=50`, `stats.commentsCreated=10`, `commentsCount=11`.
  - Cupo diario agotado: publica, `xp=0`, `stats.commentsCreated=0`.
  - Traspaso: solicitudes obsoletas borradas; histórica, de tercero y dirigida al dueño nuevo conservadas; índice actualizado.
  - Bloqueo del emisor: `400 FAILED_PRECONDITION`, solicitud pendiente y sin chat.
  - Bloqueo de la receptora: `200`, chat creado con 2 miembros y bloqueo eliminado.

**Despliegue:** reglas, Functions y cliente publicados el 30-10-2026; el detalle está en la sección 6.

---

### O. Migración de chats de club — revisada, sin cambios

**Severidad:** Bajo (higiene de datos)

**Estado:** revisada el 31-10-2026; **no hizo falta escribir**.

**Alcance:**

- `memberIds` de los chats de club frente a `clubs/{id}.memberIds` y al equipo (`ownerId` + `moderatorIds`).
- `createdAt` de clubes, canales, chats y usuarios en el futuro.
- Medallas y estadísticas: no se recalcularon.

**Herramienta:** `scripts/migrar-clubes.mjs`.

- Por defecto es una **simulación**: no escribe nada.
- En producción, escribir exige `--escribir --confirmar geekapoo-7624d`.
- Lee clubes, canales y chats; calcula quién debería estar en cada chat; reporta extras, faltantes, conflictos de visibilidad, chats inexistentes y chats enlazados que no son de club.
- Antes de escribir guarda una copia local en `docs/auditoria/backups/` (ignorada por Git) y, al terminar, relee y verifica cada chat.
- Solo actualiza `memberIds`; no toca mensajes, `hiddenFor`, contadores ni fechas.

**Verificación en el emulador:** con dos chats de prueba, la simulación no escribió y la escritura dejó `general` con los miembros del club y `mods` solo con el equipo, quitando al miembro normal.

**Resultado en producción (simulación):**

- **2 clubes** y **8 usuarios** revisados.
- **0 chats** con membresía distinta.
- **0 clubes** con espejos inconsistentes.
- **0 conflictos**, **0 chats inexistentes**, **0 chats enlazados que no sean de club**.
- **0 fechas futuras**.
- No se escribió nada.

**Por qué no se recalcularon medallas:** `recalcularUsuario` usa mapas aditivos (`stats.clubesUnidos`). Una marca falsa de una alta directa antigua es indistinguible de una pertenencia histórica legítima; borrarla eliminaría también historial real. Sin un libro de altas anterior a `2c9ecd4`, no hay evidencia para hacerlo. La corrección evita marcas nuevas; las antiguas quedan como están y se documentan como limitación.

**Artefactos:** `scripts/migrar-clubes.mjs`, `docs/auditoria/resultados-migracion-clubes.json` y las copias locales ignoradas de `docs/auditoria/backups/`.

---

### P. Storage: imágenes de club y baneos — corregido

**Severidad:** Medio

**Estado:** **corregido, verificado y desplegado el 30-10-2026** (Storage ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7`).

**Evidencia:**

- `esAdminDeClub()` comprobaba `members[uid].role`, un espejo que el equipo puede reescribir. La autoridad real está en `ownerId`/`moderatorIds`/`adminIds`.
- `isAdmin()`/`isModerator()` de Storage no miraban el baneo, así que un admin o moderador baneado podía subir y borrar imágenes de `content/`.
- El borrado de imágenes de chat, club y comunidad no comprobaba `!isBanned()` en la rama del miembro.

**Impacto:** un moderador podía ascender a un miembro solo en el espejo y darle la carpeta de imágenes del club; un admin baneado conservaba la escritura del catálogo.

**Corrección aplicada:**

- `esAdminDeClub()` usa `ownerId`/`moderatorIds`/`adminIds` y exige pertenencia real y cuenta activa.
- `isAdmin()`/`isModerator()` incorporan `!isBanned()`.
- `esPropietarioDeClub()` exige `!isBanned()`; los borrados de chats y comunidad no permiten a un baneado por la rama del miembro.
- Pruebas nuevas: moderador real sube, miembro con rol de espejo no, miembro normal no, carpeta inválida no, SVG no, admin baneado no sube ni borra, admin activo sí.

**Verificación:** 25 pruebas de Storage en verde; el detalle está en la tabla de resultados.

---

### Q. App Check, encuestas, tier lists y noticias — revisado

**Estado:** **encuestas, tier lists y noticias verificadas**; **App Check inicializado pero sin enforcement**.

**App Check:**

- La web ya inicializa App Check con **reCAPTCHA Enterprise** (`ReCaptchaEnterpriseProvider`) usando la site key configurada en el build.
- En producción se carga `enterprise.js` de reCAPTCHA y no hay errores de consola. En el navegador automatizado de la auditoría la assessment quedó pendiente, así que no se pudo confirmar un token completo; hay que mirar las métricas reales en Firebase Console.
- El enforcement no se activa desde el código: hay que activarlo en Firebase Console para Firestore, Storage y Functions. Mientras no se haga, **App Check no bloquea nada**.

**Encuestas:**

- Los votos de hilo y de mensaje son documentos por uid, privados para el votante; los resúmenes (`pollStats`) los escribe solo el servidor.
- Se comprueba que no se vota dos veces, que la opción existe, que no se vota cerrada/caducada y que cambiar de opción requiere permiso.
- Se añadieron 4 pruebas del resumen de encuestas de chat: miembro lee, ajeno no, cliente no escribe y solo existe `summary`.

**Tier lists:**

- Un voto por uid, solo en niveles existentes, solo si la votación está activa y la tier es legible.
- Se añadió la prueba de que los votos de una tier de club no se filtran a quien no es miembro.
- **Limitación de privacidad:** los votos de una tier pública son legibles por quien puede ver la lista, porque el cliente cuenta los votos directamente. Si se quiere anonimato, habría que mover el recuento a un agregado del servidor.

**Noticias:**

- `news` no tiene ninguna rama de escritura: ni admin ni moderador pueden tocarla desde el navegador. La sincronización la hace la Cloud Function con Admin SDK y `sincronizarNoticias` exige admin.
- La suite de noticias cubre lectura anónima, orden por `pubDate` y rechazo de creación/edición/borrado por todos los roles.

---

### R. Bloqueos en chats directos existentes — corregido

**Severidad:** Medio

**Estado:** **corregido, verificado y desplegado el 30-10-2026** (Firestore ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de`).

**Evidencia:** los bloqueos impedían crear o reabrir solicitudes, pero no enviar mensajes en un chat directo que ya existía. Quien bloqueaba seguía recibiendo mensajes de la otra persona.

**Corrección aplicada:**

- Nueva comprobación `bloqueoEnDirecto(chatId)` en la creación de mensajes: si el chat es `direct`, tiene dos miembros y hay bloqueo en cualquier sentido, ninguno de los dos puede enviar.
- Los grupos y clubes no se ven afectados: bloquear a una persona no silencia la conversación de todos.
- El bloqueo sigue impidiendo crear/reabrir solicitudes y se levanta al aceptar una solicitud directa, como antes.

**Verificación:** 3 pruebas de reglas (ambos sentidos, desbloqueo y grupo intacto) y E2E **6/6**, que incluye un chat directo real: antes del bloqueo se escribe, después fallan ambos, al desbloquear vuelve a pasar y el grupo sigue funcionando.

---

## 5. Controles que sí funcionan

Estos casos se probaron y se comportaron correctamente. No compensan los riesgos abiertos, pero acotan el alcance:

- **Usuario normal no lee datos privados ajenos** ni cambia roles de otros (`userPrivate`/`users`).
- **Baneado no crea hilos ni comentarios nuevos**; las ramas `create` usan `isActive()`.
- **No miembro no lee, escribe ni fija mensajes** en un chat ajeno.
- **No se puede suplantar el `fromId`** de una solicitud de chat.
- **`exigirRol` rechaza a un usuario normal y a un moderador baneado**, y exige que el perfil exista.
- **`banearUsuario` impide que un moderador bane a un admin o a otro moderador**; `desbanearUsuario` aplica la misma jerarquía.
- **`acceptsChatRequests` valida al destinatario** (existencia, actividad y preferencia) antes de aceptar una solicitud.
- **`concederMedalla` valida el catálogo del servidor**; no se pueden conceder medallas fuera de `MEDALLAS`.
- **Likes:** el modelo `threads/{threadId}/likes/{uid}` y `comments/{commentId}/likes/{uid}` mantiene los contadores solo en el servidor.
- **Fijados:** el autor, el avatar, el texto exacto y la fecha real se contrastan con el mensaje real (incluidos los mensajes largos).
- **Citas:** el mensaje citado tiene que existir en el mismo chat, y autor y texto canónico tienen que coincidir exactamente.
- **Solicitudes:** id determinista, identidad derivada del perfil, `createdAt` del servidor, una sola ruta por par y cooldown tras un rechazo.
- **Cupo de solicitudes:** 20 por usuario cada 24 h con libro mayor y `ultimaSolicitudId`; varias solicitudes no pueden compartir un solo incremento (caso de regresión incluido).
- **Techo de XP:** 10 comentarios por ventana de 10 min y 50 por día UTC; el comentario que excede el cupo se publica y cuenta, pero no paga.
- **Bloqueos:** crear/reabrir y aceptar solicitudes respeta el bloqueo en ambos sentidos; en un chat directo existente, ninguno de los dos puede escribir mientras el bloqueo siga. Los grupos no se silencian.
- **Storage:** las imágenes de club se autorizan por `ownerId`/`moderatorIds`/`adminIds`, no por el rol espejo; un admin o moderador baneado no escribe en `content/` ni borra imágenes.
- **Encuestas:** un voto por uid, privado; el resumen de las encuestas de chat solo lo escribe el servidor y solo lo lee un miembro.
- **Tier lists:** un voto por uid y solo en niveles existentes; los votos de una tier de club no se filtran a quien no es miembro.
- **Noticias:** `news` no tiene ninguna rama de escritura para el cliente; solo la Cloud Function la actualiza.
- **Vista previa de chats:** `lastMessage*` solo lo escribe el trigger, en transacción y comparando fechas.
- **Regresión P0/P1:** los 17 casos P0 y los 4 casos P1 están invertidos a `assertFails` y ya no pueden volver a abrirse sin que falle la suite.
- **La suite completa de reglas** (830 pruebas) sigue siendo la línea base y pasa tras los cambios.

---

## 6. Tareas pendientes

### P1 — residuales y siguientes

**Cerrados y desplegados (sección 4.N):** rate limit global de solicitudes (20 por usuario cada 24 h, con `ultimaSolicitudId`), cambio de dueño de grupo, techo de XP por comentarios y bloqueos en solicitudes. **Altas directas y estadísticas de club:** corregidas y desplegadas el 30-10-2026 (sección 4.L). **Migración de chats de club:** revisada en simulación, 0 cambios necesarios. **Canales con dueño/miembro baneado:** E2E 7/7 (sección 4.M). **Storage, encuestas, tier lists, noticias y bloqueos en chats directos:** revisados y desplegados el 30-10-2026 (secciones 4.P, 4.Q y 4.R).

1. **App Check:** ya está registrado con reCAPTCHA Enterprise y la web lo inicializa. Falta revisar las métricas y activar el enforcement en Firebase Console para Firestore, Storage y Functions. Sin enforcement no protege nada.
2. **Cobertura E2E restante:** `reports`/`notifications`, moderación de clubes y flujos de interfaz que aún no tienen prueba de extremo a extremo.
3. **Auditoría de acciones administrativas:** registrar en una colección inmutable quién ajusta XP, concede medallas, cambia configuración y banea/desbanea; alertar de picos.

### P2 — higiene y cobertura

4. **Añadir pruebas de carga/abuso** para límites de tamaño y frecuencia (comentarios, solicitudes, chats).
5. **Revisar dependencias y configuración de Auth** (verificación de email, proveedores, dominios autorizados), fuera del alcance de esta auditoría.
6. **Repetir la suite completa** después de cada corrección: `npm run test:rules`, `npm run test:logica`, `npm run lint`, `npm --prefix functions run build`, `npm run build`, más las tres suites de auditoría.

### Despliegue realizado

1. P1 integrado en `main` mediante el PR #2 (`b8f63c3`), con `19a3912` como commit de corrección.
2. Hosting P1 publicado con `assets/index-DpFW21Z8.js`; reglas P1: release `cloud.firestore` → ruleset `c5bb00c8-686a-403a-80e6-e775d580af61`, actualizado el 29-10-2026 a las 18:22:49 UTC.
3. Residuales commiteados en `2c9ecd4` (reglas, cliente, Functions, pruebas y evidencia); región de los 21 triggers fijada en `e2185b8`.
4. Reglas y Hosting desplegados el 30-10-2026: release `cloud.firestore` → ruleset `e9bfa3ec-6bbc-4aa9-8844-bcba58b4118c`, 152.854 bytes, 13:54:19 UTC; Hosting sirve `assets/index-BfKM3yC0.js`, idéntico al build local.
5. Functions: `onCommentCreated` y `onChatOwnerChanged` actualizados en `europe-southwest1`; `responderSolicitudChat` en `us-central1` (13:57:48–13:57:58 UTC). Inventario: 21 triggers en Europa + 21 callables/scheduled en US, 42 en total, sin duplicados.
6. Altas y estadísticas de club commiteadas en `4026f9c` y documentadas en `c44c0ff`.
7. Functions de club desplegadas el 30-10-2026: `levantarSancionClub` creada en `us-central1`; `unirseClubPublico`, `responderSolicitudClub` y `onClubMembersChanged` actualizadas (22:50:42–22:50:53 UTC). Inventario final: **21 triggers en Europa + 22 callables/scheduled en US, 43 en total**, sin duplicados.
8. Reglas y Hosting desplegados el 30-10-2026: release `cloud.firestore` → ruleset `799da4a3-2030-4546-a1f1-728c9a2e1c82`, 152.460 bytes, 22:51:21 UTC; Hosting sirve `assets/index-BruzyIzl.js`, idéntico al build local.
9. Storage y bloqueos desplegados el 30-10-2026: `cloud.firestore` → ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de`, 152.933 bytes, 23:55:24 UTC; `firebase.storage` → ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7`, 11.644 bytes, 23:55:20 UTC; Hosting sirve `assets/index-CLuyPo_1.js`.
10. App Check con reCAPTCHA Enterprise desplegado en Hosting: bundle `assets/index-CjW2VmpW.js`; el script `enterprise.js` carga y no hay errores de consola. **Enforcement pendiente.**
11. Verificación: bundle servido, releases de Firestore y Storage e inventario de Functions comprobados contra producción; no se hizo una pasada funcional completa con cuentas reales.

No se desplegaron índices. La rama `seguridad/p0-auditoria` se eliminó en local y en `origin`; solo queda `main`.

**Ventana de compatibilidad:** las pestañas ya abiertas con el bundle anterior pueden fallar al citar, fijar, pedir entrada, desbanear o escribir en un directo bloqueado hasta que se recarguen. Las altas directas ya no se hacen desde el cliente; el bundle nuevo usa las callables. Storage mantiene las URLs públicas de las imágenes.

---

## 7. Artefactos

| Archivo | Contenido |
|---|---|
| `firestore.rules` | Correcciones P0, P1 y residuales desplegados: roles activos, `createdAt`, hilos, comentarios, chats, fijados con fecha real, citas contra el mensaje real, clubes con `sinAltasDeMiembros`, canales con `createdBy` atado, sanciones, solicitudes con id determinista e identidad derivada del perfil, `rateLimits` con ventana de 24 h, bloqueos en solicitudes y bloqueos en chats directos |
| `storage.rules` | Imágenes de club por `ownerId`/`moderatorIds`/`adminIds`, no por el rol espejo; admin/moderador baneado sin escritura en `content/`; borrados sin baneados |
| `src/lib/firebase.ts` | Inicialización opcional de App Check con reCAPTCHA Enterprise (`ReCaptchaEnterpriseProvider`) si existe `VITE_FIREBASE_APP_CHECK_KEY` |
| `functions/src/index.ts` | `exigirRol`/`exigirAdmin`/`exigirModerador`, jerarquía de baneos, objetivo real de comentarios, vista previa de chats, limpieza de chats de club, `reservarCupoComentario`, bloqueos en `responderSolicitudChat`, `onChatOwnerChanged`, `levantarSancionClub` y medallas de club concedidas desde `unirseClubPublico`/`responderSolicitudClub` |
| `src/services/chats.ts` | Deja de escribir `lastMessage*` desde el cliente; construye `replyTo.texto` completo |
| `src/utils/chatCita.ts` | `textoParaCita()` canónico sin recortar y `fragmentoParaCita()` para la vista |
| `src/services/chatFijados.ts` | Añade `autorAvatar`, guarda el texto completo y `mensajeCreadoEnMs` para contrastar la fecha |
| `src/services/chatRequests.ts` | Ids deterministas, `crearOReabrir()` transaccional con `rateLimits`, cooldown local y limpieza de la respuesta al reabrir |
| `src/services/clubModeracion.ts` | El desbaneo llama a `levantarSancionClub`; la transacción de ficha y chats ya no la hace el cliente |
| `src/components/chat/ChatView.tsx` | Construye la cita desde el mensaje real y pinta `texto` con recorte solo visual |
| `src/types/index.ts` | `ChatReplyTo` con `texto` (canónico) y `snippet` (compatibilidad de lectura) |
| `tests/auditoria/firestore.hallazgos.rules.test.cjs` | 34 pruebas de regresión: 17 P0 y 6 P1 en `assertFails`, 11 controles |
| `tests/helpers/solicitudes.cjs` | Escritura de solicitudes + `rateLimits` en la misma transacción para las suites positivas |
| `tests/firestore.chat.rules.test.cjs` | 105 pruebas de chat, incluidos el bypass de lote del cupo y los bloqueos en directos |
| `tests/storage.rules.test.cjs` | 25 pruebas de Storage, incluidas las imágenes de club y el admin baneado |
| `tests/firestore.chat-polls.rules.test.cjs` | 23 pruebas de encuestas de chat, incluido el resumen del servidor |
| `tests/firestore.tierlists.rules.test.cjs` | 34 pruebas de tier lists, incluida la privacidad de votos de club |
| `tests/firestore.noticias.rules.test.cjs` | 14 pruebas de noticias: lectura pública y escritura prohibida |
| `tests/firestore.clubs.rules.test.cjs` + `tests/firestore.clubs-channels.rules.test.cjs` | Altas directas del dueño y auto-unión bloqueadas; `createdBy` del `general` atado al propietario |
| `scripts/auditoria-callables.mjs` | Verificación post-P0 de las 9 callables con token de moderador y 5 controles |
| `scripts/auditoria-triggers.mjs` | Verificación E2E de que los comentarios con objetivo inexistente no pagan XP |
| `scripts/auditoria-residuales.mjs` | Verificación E2E del cupo de comentarios, traspaso de grupo, aceptación con bloqueos y bloqueo en chat directo |
| `scripts/auditoria-clubes.mjs` | Verificación E2E de altas por callable, altas directas rechazadas, medallas no inflables, desbaneo y canales con dueño/miembro baneado |
| `scripts/migrar-clubes.mjs` | Simulación/escritura para reconciliar `memberIds` de chats de club; copia de seguridad local y guardas de producción |
| `docs/auditoria/resultados-callables.json` | Resultado estructurado de las callables |
| `docs/auditoria/resultados-triggers.json` | Resultado estructurado del trigger de comentarios |
| `docs/auditoria/resultados-residuales.json` | Resultado estructurado de la E2E de residuales (6/6) |
| `docs/auditoria/resultados-clubes.json` | Resultado estructurado de la E2E de clubes (7/7) |
| `docs/auditoria/resultados-migracion-clubes.json` | Simulación sobre producción: 2 clubes, 8 usuarios, 0 cambios |
| `scripts/build-reglas.mjs` | Genera `firestore.deploy.rules` sin comentarios para no superar el límite de 262.144 bytes del compilador |
| `firebase.json` | Emulador de Auth (puerto 9099); reglas de Firestore generadas sin comentarios en el `predeploy` |
| `.env.example` | Añade `VITE_FIREBASE_APP_CHECK_KEY`, vacía por defecto |

El P0 está en `cc35d84`, integrado en `main` y desplegado. El P1 está en `19a3912`, integrado en `main` con el merge `b8f63c3` (PR #2) y desplegado. Los residuales están en `2c9ecd4`, la región de los triggers en `e2185b8` y las altas/estadísticas de club en `4026f9c`; todo ello se publicó el 30-10-2026: Hosting sirve `assets/index-CjW2VmpW.js`, `cloud.firestore` apunta al ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de` y `firebase.storage` al ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7`. La rama `seguridad/p0-auditoria` se eliminó en local y en `origin`; solo queda `main`.

Los residuales de la sección 4.N están **desplegados**: reglas y Hosting el 30-10-2026 (ruleset `e9bfa3ec-6bbc-4aa9-8844-bcba58b4118c`, bundle `index-BfKM3yC0.js`) y Functions (`onCommentCreated` y `onChatOwnerChanged` en `europe-southwest1`; `responderSolicitudChat` en `us-central1`). El inventario de producción quedó en 21 triggers europeos + 21 callables/scheduled en US, sin duplicados.

Las correcciones de altas y estadísticas de club (sección 4.L) están **desplegadas**: Functions el 30-10-2026 (`levantarSancionClub` nueva; `unirseClubPublico`, `responderSolicitudClub` y `onClubMembersChanged` actualizadas) y reglas + Hosting. El inventario quedó en 43 Functions: 21 triggers europeos + 22 callables/scheduled en US, sin duplicados.

Storage y los bloqueos en chats directos (secciones 4.P y 4.R) se desplegaron en el mismo lote: Storage ruleset `ab1a5c29-9ed5-4d86-931f-30939eaab2c7` y Firestore ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de`.

---

## 8. Limitaciones

- **No es una auditoría exhaustiva de toda la aplicación.** Se cubrieron las superficies principales de Firestore, Storage, callables y servicios inventariados; quedan `reports`/`notifications`, flujos de interfaz y moderación de clubes sin E2E completa.
- **App Check está inicializado pero no exigido.** La web carga reCAPTCHA Enterprise y puede emitir tokens, pero el enforcement en Firebase Console sigue pendiente. Mientras tanto, no aporta protección real.
- **Storage sirve las imágenes por URL pública** y los votos de una tier list pública son legibles por quien puede ver la lista. Son decisiones de producto documentadas; si se requiere privacidad, hay que pasar a URLs firmadas y a un agregado de votos en el servidor.
- **Las correcciones de Storage y de bloqueos en directos están desplegadas.** Se publicaron el 30-10-2026; en producción solo se comprobaron los artefactos y el inventario, no cada flujo con datos reales.
- **Las pruebas P0/P1 son de regresión, no una certificación de seguridad.** Confirman que los agujeros corregidos vuelven a fallar si alguien reabre la regla, pero no demuestran que no existan otros.
- **No se probó funcionalmente en producción.** Todos los resultados de comportamiento son del emulador; pueden existir diferencias de configuración, índices o datos reales. Del despliegue se comprobaron el bundle servido, el release de reglas y el inventario de Functions, pero no se hizo una pasada completa con cuentas reales.
- **Las correcciones de la sección 4.N están desplegadas.** Se verificaron en el emulador y se publicaron el 30-10-2026; en producción solo se comprobaron los artefactos y el inventario, no cada flujo con datos reales.
- **Las altas y estadísticas de club (4.L) están desplegadas.** Se publicaron el 30-10-2026 junto con reglas y Hosting; en producción solo se comprobaron los artefactos y el inventario, no cada flujo con datos reales.
- **La migración de chats de club fue una simulación de producción.** Se revisaron 2 clubes y 8 usuarios: 0 chats con membresía distinta y 0 fechas futuras, así que no se escribió nada. El script queda para futuras revisiones, con copia local y confirmación explícita para escribir.
- **La región de los triggers está fijada en `europe-southwest1`** y los callables siguen en `us-central1`, igual que en producción. El emulador usa la misma distribución tras el cambio.
- **La sincronización de noticias del emulador** escribió 168 documentos en el proyecto demo; no se tocó la colección `news` de producción.
- **No se evaluaron** vulnerabilidades de dependencias, XSS, CSP, configuración de Auth, correo o infraestructura. Este informe se limita a las capas indicadas.

---

**Conclusión:** los P0 de la auditoría están corregidos, desplegados y verificados: un admin baneado ya no conserva privilegios, salir de un club corta el acceso al chat, un moderador no puede ejecutar callables de administración, los baneos respetan la jerarquía, los comentarios sin objetivo real no pagan XP y los chats/fijados no se pueden manipular como antes. Los P1 de citas (F4), solicitudes (G1) y fecha de fijados están corregidos, verificados en el emulador y **desplegados en producción**. Los residuales de G1 (rate limit global con `ultimaSolicitudId` y traspaso de grupo), el techo de XP por comentarios y los bloqueos en solicitudes están corregidos, verificados en el emulador (**830 reglas, 105 de chat y 6/6 E2E**) y **desplegados el 30-10-2026**. Las altas directas y las estadísticas de club están corregidas y verificadas (**167 focalizadas y 7/7 E2E de clubes**) y **desplegadas**. Storage y los bloqueos en directos también: `cloud.firestore` apunta al ruleset `8bc79ee8-792d-41e2-9e79-fc1c42d0f7de`, `firebase.storage` al `ab1a5c29-9ed5-4d86-931f-30939eaab2c7`, Hosting sirve `index-CjW2VmpW.js` y hay 43 Functions (21 triggers europeos + 22 callables/scheduled en US). La migración de chats de club se revisó en simulación (2 clubes, 8 usuarios, 0 cambios) y la E2E cubre canales con dueño y miembro baneados. **App Check sigue sin enforcement**: solo se inicializa si se configura la clave. **La aplicación todavía no puede declararse segura en su conjunto**: quedan los P2 y varias superficies sin E2E. La rama de trabajo se eliminó; `main` es la única rama.
