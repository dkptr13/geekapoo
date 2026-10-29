# Auditoría de seguridad de Geekapoo

- **Fecha:** 28-29 de octubre de 2026
- **Proyecto Firebase:** `geekapoo-7624d`
- **Commit de referencia (auditoría):** `64a68a7` (`seguridad(firestore): proteger contadores e implementar gestión de likes con funciones de servidor`)
- **Correcciones:** P0 `cc35d84`; P1 `19a3912`
- **Integración:** `main` en `b8f63c3` (PR #2); la rama `seguridad/p0-auditoria` se eliminó después del merge
- **Alcance:** reglas de Firestore, Cloud Functions con Admin SDK, servicios React/TypeScript y modelo de datos de las superficies de comunidad, chats, clubes, gamificación y moderación.
- **Estado:** **P0 y P1 desplegados en producción.** P1 (F4, G1 y fecha de los fijados) verificado en Firebase Emulator Suite y publicado: Hosting sirve `assets/index-DpFW21Z8.js` y el release `cloud.firestore` apunta al ruleset `c5bb00c8-686a-403a-80e6-e775d580af61` desde el 29-10-2026 18:22:49 UTC. Quedan residuales P1/P2 y rutas sin prueba de extremo a extremo. **No se declara la aplicación segura en su conjunto.**

---

## 1. Resumen ejecutivo

La auditoría inicial revisó `firestore.rules`, `functions/src/index.ts` y los servicios de `src/services`, y convirtió la revisión estática en pruebas ejecutables contra Firebase Emulator Suite. Esa primera pasada confirmó **19 casos vulnerables en reglas**, **9 callables de administración invocables por un moderador** y **farmeo de XP de extremo a extremo** con comentarios apuntando a objetivos inexistentes.

Sobre la rama `seguridad/p0-auditoria` se aplicaron las correcciones P0 en reglas, Functions y el servicio de chats. Esas correcciones se commitearon en `cc35d84` y se desplegaron en `geekapoo-7624d`. Las pruebas de caracterización se invirtieron: los 17 casos P0 que antes usaban `assertSucceeds` ahora usan `assertFails` y actúan como regresión.

Después se corrigieron los P1, se commitearon en `19a3912` y se desplegaron:

- **F4:** `replyTo` ahora exige que el mensaje citado exista en el mismo chat y que autor y texto canónico coincidan exactamente.
- **G1:** las solicitudes usan ids deterministas, `fromName`/`fromAvatar` se derivan del perfil, `createdAt` debe ser `request.time`, hay cooldown de 24 h tras un rechazo y una sola ruta por par/grupo-persona.
- **Fecha de los fijados:** `mensajeCreadoEnMs` se contrasta con `createdAt.toMillis()` del mensaje real (o con el texto exacto en mensajes antiguos).

Queda un residual P1: **no hay un límite global de solicitudes por emisor**. El id determinista impide crear varias rutas para el mismo par, pero una cuenta todavía puede escribir a muchos destinatarios distintos. Cerrarlo exige una callable o un libro mayor por usuario.

### Resultados finales

| Prueba | Resultado |
|---|---|
| Reglas de la auditoría (32 casos) | **32 passing**, 0 failing; 17 regresiones P0 y 4 regresiones P1 (F4/G1) en `assertFails`, 11 controles |
| Suite completa de reglas (`npm run test:rules`) | **791 passing**, 0 failing |
| Corrida focalizada de 5 suites afectadas | **240 passing**, 0 failing |
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

- **Rate limit global de solicitudes:** no hay un límite por emisor para escribir a muchas personas o grupos distintos. El id determinista solo impide duplicados contra el mismo destinatario.
- **Cambio de dueño de un grupo:** una solicitud de grupo ya creada conserva el `toId` del dueño original; si el grupo se transfiere, una reapertura puede quedar apuntando a quien ya no lo administra. Es un borde de producto, no un bypass de permisos.
- **Altas directas de club:** un dueño *activo* todavía puede añadir a alguien sin consentimiento; es un asunto de producto y de confianza en las estadísticas (P1), no ya un bypass de baneo.
- **Estadísticas de club** calculadas desde documentos que el cliente puede escribir (L).
- **Cobertura E2E incompleta:** canales, Storage, App Check, encuestas, tier lists, noticias, `reports`/`notifications` y flujos de aceptación/rechazo.
- **Migración de datos** y **alineación de región** de las Functions.

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
- Funciones locales servidas por el emulador en `us-central1`; en producción `firebase functions:list` las muestra en `europe-southwest1`. La lógica es la misma, pero conviene fijar la región de forma explícita para que el emulador y producción no diverjan.
- Se añadió el emulador de Auth a `firebase.json` (puerto 9099) para poder probar las callables con tokens reales del emulador. Es un cambio de infraestructura de pruebas, sin efecto en producción.

### 2.3 Salvaguardas

- Los scripts abortan si el proyecto no empieza por `demo-` o si falta `FIRESTORE_EMULATOR_HOST`.
- La revisión y las pruebas se hicieron íntegramente en emuladores; no se ejecutaron pruebas destructivas contra producción.
- No se probó nada contra `geekapoo-7624d` durante la auditoría.
- La sincronización de noticias del caso H9 escribió 168 documentos **en el emulador**, no en producción.
- El P0 se commitó en `cc35d84` y se desplegó en `geekapoo-7624d` con autorización. El P1 se commitó en `19a3912`, se integró en `main` con `b8f63c3` (PR #2) y se desplegó (Hosting y reglas de Firestore).

---

## 3. Resultados de las pruebas

| Prueba | Comando | Resultado |
|---|---|---|
| Reglas de la auditoría | `npx firebase emulators:exec --only firestore --project demo-geekapoo-auditoria "npx mocha tests/auditoria/firestore.hallazgos.rules.test.cjs --timeout 60000"` | **32 passing**, 0 failing |
| Callables post-P0 | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-callables.mjs"` | **0 hallazgos**, 14 controles OK, 0 errores |
| Trigger de comentarios post-P0 | `npx firebase emulators:exec --only firestore,auth,functions --project demo-geekapoo-auditoria "node scripts/auditoria-triggers.mjs"` | **3/3 rechazados**; XP 0 → 0; `commentsCreated = 0`; `bloqueado = true` |
| Suite completa de reglas | `npm run test:rules` | **791 passing**, 0 failing |
| Corrida focalizada | 5 suites de chat, fijados, solicitudes, privacidad y groupCodes | **240 passing**, 0 failing |
| TypeScript | `npm run lint` | Correcto |
| Lógica | `npm run test:logica` | Correcto |
| Build de Functions | `npm --prefix functions run build` | Correcto |
| Build de la web | `npm run build` | Correcto |

> **Nota sobre los errores esperados:** en las pruebas negativas aparecen mensajes `evaluation error at L...` y «maximum of 1000 expressions» para operaciones que deben fallar. Son el resultado de evaluar reglas contra escrituras denegadas; no son fallos de la suite. Las pruebas que exigen éxito pasan y las que exigen `permission-denied` también.

Archivos de resultados:

- `docs/auditoria/resultados-callables.json`
- `docs/auditoria/resultados-triggers.json`

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
| E | Comentarios a objetivos inexistentes pagan XP | **Alto** | **Corregido P0**; rate limit P1 |
| F | Un miembro oculta/limpia/falsea el chat de otro | **Alto** | **Corregido P0** (F1-F3) |
| C1/C3/C4 | Clubes: creación/edición por baneados y altas sin consentimiento | **Alto** | **Corregido P0** el bypass de baneo; altas directas P1 |
| B | `createdAt` manipulable → medalla de veterano | **Medio** | **Corregido P0** |
| D | Hilos: `pinned` por autor, tamaños sin revalidar, edición por baneados | **Medio** | **Corregido P0** |
| G | Fijados con texto/autor falsos | **Medio** | **Corregido P0**; fecha del mensaje **corregida P1** |
| K | Spam de solicitudes de chat y remitente falsificado | **Medio** | **Corregido P1** (G1); rate limit global residual |
| L | Estadísticas de club desde documentos del cliente | **Medio** | **P1 abierto** |
| H | `replyTo` fabricado | **Bajo** | **Corregido P1** (F4) |
| M | Canales de club gestionados por baneados | **Medio/Bajo** | **Corregido en reglas**; E2E pendiente |

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

**Pendiente P1:** migrar los `memberIds` de chats de club ya existentes para quitar a quien ya no pertenece al club.

#### C3/C4. Un dueño baneado seguía editando el club y añadía miembros sin consentimiento

**Severidad:** Alto  
**Estado:** **corregido P0** el bypass de baneo; las altas directas de un dueño activo quedan como P1 de producto/estadísticas.

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

**Pendiente P1:** añadir límites de frecuencia o un libro mayor por objetivo para evitar farmeo con comentarios válidos repetidos.

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
**Estado:** **corregido, verificado en el emulador y desplegado**. Queda un residual de rate limit global.

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

**Residual P1:**

- **Rate limit global por emisor:** el id determinista limita a una solicitud por destinatario, pero no impide escribir a muchos destinatarios o grupos distintos. Cerrarlo requiere una callable o un libro mayor por usuario; las reglas solas no pueden contar escrituras entre rutas.
- **Cambio de dueño de un grupo:** una solicitud de grupo ya creada conserva el `toId` del dueño original. Si el grupo se transfiere, la reapertura puede quedar apuntando a quien ya no administra. No otorga permisos, pero conviene migrar o regenerar la solicitud al transferir.

---

### L. Estadísticas de club desde documentos que controla el cliente — P1 abierto

**Severidad:** Medio  
**Estado:** estático; pendiente de reproducción E2E.

**Evidencia:**

- `onClubCreated` marca `clubesCreados`/`clubesUnidos` a partir de `ownerId`.
- `onClubMembersChanged` marca `clubesUnidos` a cualquier uid nuevo en `memberIds`, aunque el dueño lo haya añadido directamente.
- `onChannelCreated` confía en `createdBy`.
- `onChatParticipado` confía en `senderId`.
- `marcarMapa` actualiza estadísticas y evalúa medallas.

**Impacto:** inflación de estadísticas y medallas sin acciones reales. C4 ya no permite el bypass por un dueño baneado, pero un dueño activo todavía puede añadir a alguien directamente y el trigger lo contará como “unido”.

**Corrección propuesta:**

- Que los triggers de estadísticas solo se disparen desde flujos servidor (callables/transacciones), no desde documentos que el cliente pueda escribir libremente.
- Validar `createdBy == request.auth.uid` y que el canal/club exista y sea coherente.
- Añadir pruebas E2E de las medallas afectadas.

---

### M. Canales de club gestionados por cuentas baneadas

**Severidad:** Medio/Bajo  
**Estado:** **corregido en reglas**; E2E pendiente.

**Evidencia original:**

- La creación de canales usaba `puedeGestionarCanales()` o `isAdmin()`, pero `puedeGestionarCanales` no exigía `isActive()`.
- La ruta de migración del canal `general` permitía crearlo a cualquier miembro del club, sin `isActive()`.

**Impacto:** un dueño o gestor baneado podía seguir creando canales y modificando la estructura del club.

**Corrección aplicada:**

- Las ramas de creación, actualización y borrado de canales exigen `isActive()`.
- La migración del `general` exige membresía activa y coherencia con el club/chat.
- Las sanciones de club y las solicitudes de acceso también exigen `isActive()`.

**Verificación:** la suite de canales (`tests/firestore.clubs-channels.rules.test.cjs`) pasa, incluidos los casos de canal `mods`, chat del canal y gestión por el equipo. Queda pendiente una prueba E2E explícita con dueño baneado en el emulador.

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
- **Vista previa de chats:** `lastMessage*` solo lo escribe el trigger, en transacción y comparando fechas.
- **Regresión P0/P1:** los 17 casos P0 y los 4 casos P1 están invertidos a `assertFails` y ya no pueden volver a abrirse sin que falle la suite.
- **La suite completa de reglas** (791 pruebas) sigue siendo la línea base y pasa tras los cambios.

---

## 6. Tareas pendientes

### P1 — residuales y siguientes

1. **Rate limit global de solicitudes:** añadir una callable transaccional o un libro mayor por usuario que limite cuántas solicitudes puede enviar por ventana, no solo una por destinatario (G1 residual).
2. **Cambio de dueño de grupo:** al transferir un grupo, regenerar o invalidar las solicitudes de entrada pendientes para que no queden apuntando al dueño anterior (G1 residual).
3. **Altas directas de club:** mover altas/bajas a una callable transaccional con consentimiento y hacer que `onClubMembersChanged` solo cuente altas del flujo servidor (C4/L).
4. **Estadísticas de club:** no confiar en `ownerId`/`memberIds`/`createdBy` escritos por el cliente; probar las medallas afectadas (L).
5. **Migración de datos:** limpiar `memberIds` de chats de club ya existentes, revisar `createdAt` sospechosos y recalcular medallas/estadísticas si procede.
6. **Canales de club:** prueba E2E explícita con dueño baneado y con miembro baneado en la ruta `general` (M).
7. **Cobertura E2E restante:** Storage, App Check, encuestas, tier lists, noticias, `reports`/`notifications` y flujos de aceptación/rechazo.
8. **Bloqueos (`blocks`):** hoy es una barrera de cliente; si el producto quiere que bloquear impida solicitudes/mensajes, aplicarlo en reglas/callables.
9. **Auditoría de acciones administrativas:** registrar en una colección inmutable quién ajusta XP, concede medallas, cambia configuración y banea/desbanea; alertar de picos.

### P2 — higiene y cobertura

10. **Fijar la región de las Functions** de forma explícita y verificar que el emulador y producción coinciden (`us-central1` vs `europe-southwest1`).
11. **Añadir pruebas de carga/abuso** para límites de tamaño y frecuencia (comentarios, solicitudes, chats).
12. **Revisar dependencias y configuración de Auth** (verificación de email, proveedores, dominios autorizados), fuera del alcance de esta auditoría.
13. **Repetir la suite completa** después de cada corrección: `npm run test:rules`, `npm run test:logica`, `npm run lint`, `npm --prefix functions run build`, `npm run build`, más las tres suites de auditoría.

### Despliegue realizado

1. P1 integrado en `main` mediante el PR #2 (`b8f63c3`), con `19a3912` como commit de corrección.
2. Hosting publicado con el bundle P1 (`assets/index-DpFW21Z8.js`), que coincide con el build local.
3. Reglas de Firestore publicadas: release `cloud.firestore` → ruleset `c5bb00c8-686a-403a-80e6-e775d580af61`, actualizado el 29-10-2026 a las 18:22:49 UTC. El ruleset contiene `citaCoincideConMensaje`, `idDeSolicitudCorrecto` y `mensajeCreadoEnMs`.
4. Verificación: el bundle servido y el release de reglas se comprobaron contra producción; no se hizo una pasada funcional completa con cuentas reales.

No se desplegaron Functions, índices ni Storage para estos P1. La rama `seguridad/p0-auditoria` se eliminó en local y en `origin`; solo queda `main`.

**Ventana de compatibilidad:** las pestañas ya abiertas con el bundle anterior pueden fallar al citar, fijar o pedir entrada hasta que se recarguen. Los mensajes sin cita y el resto del chat no dependen de ese cambio.

---

## 7. Artefactos

| Archivo | Contenido |
|---|---|
| `firestore.rules` | Correcciones P0 y P1: roles activos, `createdAt`, hilos, comentarios, chats, fijados con fecha real, citas contra el mensaje real, clubes, canales, sanciones y solicitudes con id determinista e identidad derivada del perfil |
| `functions/src/index.ts` | `exigirRol`/`exigirAdmin`/`exigirModerador`, jerarquía de baneos, objetivo real de comentarios, vista previa de chats y limpieza de chats de club |
| `src/services/chats.ts` | Deja de escribir `lastMessage*` desde el cliente; construye `replyTo.texto` completo |
| `src/utils/chatCita.ts` | `textoParaCita()` canónico sin recortar y `fragmentoParaCita()` para la vista |
| `src/services/chatFijados.ts` | Añade `autorAvatar`, guarda el texto completo y `mensajeCreadoEnMs` para contrastar la fecha |
| `src/services/chatRequests.ts` | Ids deterministas, `crearOReabrir()`, cooldown local y limpieza de la respuesta al reabrir |
| `src/components/chat/ChatView.tsx` | Construye la cita desde el mensaje real y pinta `texto` con recorte solo visual |
| `src/types/index.ts` | `ChatReplyTo` con `texto` (canónico) y `snippet` (compatibilidad de lectura) |
| `tests/auditoria/firestore.hallazgos.rules.test.cjs` | 32 pruebas de regresión: 17 P0 y 4 P1 en `assertFails`, 11 controles |
| `scripts/auditoria-callables.mjs` | Verificación post-P0 de las 9 callables con token de moderador y 5 controles |
| `scripts/auditoria-triggers.mjs` | Verificación E2E de que los comentarios con objetivo inexistente no pagan XP |
| `docs/auditoria/resultados-callables.json` | Resultado estructurado de las callables |
| `docs/auditoria/resultados-triggers.json` | Resultado estructurado del trigger de comentarios |
| `firebase.json` | Emulador de Auth (puerto 9099) para las pruebas |

El P0 está en `cc35d84`, integrado en `main` y desplegado. El P1 está en `19a3912`, integrado en `main` con el merge `b8f63c3` (PR #2) y desplegado: Hosting sirve `assets/index-DpFW21Z8.js` y el release `cloud.firestore` apunta al ruleset `c5bb00c8-686a-403a-80e6-e775d580af61` desde el 29-10-2026 18:22:49 UTC. La rama `seguridad/p0-auditoria` se eliminó en local y en `origin`; solo queda `main`.

---

## 8. Limitaciones

- **No es una auditoría exhaustiva de toda la aplicación.** Se cubrieron las superficies principales de Firestore, las callables revisadas y los servicios inventariados; quedan rutas de Storage, App Check, encuestas, tier lists, noticias, moderación de clubes y flujos de aceptación que no se probaron E2E.
- **Las pruebas P0/P1 son de regresión, no una certificación de seguridad.** Confirman que los agujeros corregidos vuelven a fallar si alguien reabre la regla, pero no demuestran que no existan otros.
- **No se probó en producción.** Todos los resultados son del emulador; pueden existir diferencias de configuración, índices, reglas desplegadas o datos reales. Del despliegue P0/P1 se comprobó que Hosting sirve el bundle P1 y que el release de reglas es el P1 (ruleset y marcadores); no se hizo una pasada funcional completa en producción con cuentas reales.
- **El emulador sirve las Functions en `us-central1`**, mientras que `functions:list` muestra `europe-southwest1` en producción. La lógica probada es la misma, pero la diferencia de región debe resolverse.
- **La sincronización de noticias del emulador** escribió 168 documentos en el proyecto demo; no se tocó la colección `news` de producción.
- **No se evaluaron** vulnerabilidades de dependencias, XSS, CSP, configuración de Auth, correo o infraestructura. Este informe se limita a las capas indicadas.

---

**Conclusión:** los P0 de la auditoría están corregidos, desplegados y verificados: un admin baneado ya no conserva privilegios, salir de un club corta el acceso al chat, un moderador no puede ejecutar callables de administración, los baneos respetan la jerarquía, los comentarios sin objetivo real no pagan XP y los chats/fijados no se pueden manipular como antes. Los P1 de citas (F4), solicitudes (G1) y fecha de fijados están corregidos, verificados en el emulador y **desplegados en producción**. **La aplicación todavía no puede declararse segura en su conjunto**: quedan el rate limit global de solicitudes, el farmeo de XP con comentarios válidos, las altas directas de club, las estadísticas de club, la migración de datos y varias superficies sin E2E. La rama de trabajo se eliminó; `main` es la única rama.
