# Gamificación: niveles, XP, medallas y títulos

Este documento es la guía de despliegue. El código ya está en el
repositorio; lo que falta es activarlo en Firebase.

Si algo de aquí no cuadra con lo que ves, es que el código cambió
después de escribir el documento: los ficheros que mandan son
`functions/src/index.ts` (lo que concede) y `firestore.rules` (lo
que se puede escribir).

---

## 1. Qué hay montado

| Cosa | Dónde |
|---|---|
| Tipos de XP, nivel, medalla, título | `src/types/gamification.ts` |
| Curva de niveles y catálogo de medallas | `src/utils/progression.ts` |
| Cloud Functions (lo único que escribe XP) | `functions/src/index.ts` |
| Reglas de seguridad | `firestore.rules` |
| Listener del progreso en tiempo real | `src/context/ProgressionContext.tsx` |
| Panel "Nivel y logros" del perfil | `src/components/profile/ProgressionPanel.tsx` |
| Página de catálogo de logros | `src/components/gamification/AchievementsView.tsx` |
| Avisos de subida de nivel y medalla | `src/components/gamification/ProgressionToasts.tsx` |
| Panel de administración | `src/components/admin/GamificationSection.tsx` |

### Dónde se guarda

El progreso va **dentro de `users/{uid}`**, no en una colección
aparte: así siempre se lee junto al perfil y el usuario no puede
tener dos sitios de la verdad.

```
users/{uid}
  xp, level, xpEnNivel, xpParaSiguienteNivel   ← los escribe la función
  stats { threadsCreated, commentsCreated,
          commentsInThreads, likesReceived,
          animeXp { animeId → xp } }
  medals { medalId → "2026-10-03T..." }        ← id → fecha ISO
  equippedTitle: medalId | null               ← lo escribe el usuario
  lastLevelUpAt, lastLevelUpLevel              ← aviso de subida
  rewardLedger/{id}                            ← libro mayor (anti-fraude)

gamification/config                            ← un solo documento
```

`rewardLedger` es la pieza que evita el fraude. Cada recompensa
escribe un documento con un id **determinista** derivado del
contenido (`thread_created_x`, `like_thread_y_z`), y la concesión
va en una transacción que primero mira si ese documento ya existe.
Si existe, no se concede nada.

---

## 2. Recompensas

| Acción | XP | Clave |
|---|---|---|
| Crear un hilo | +20 | `thread_created` |
| Publicar un comentario | +5 | `comment_created` |
| "Me gusta" en tu hilo | +3 | `thread_like_received` |
| "Me gusta" en tu comentario | +2 | `comment_like_received` |
| Cruzar un hito de nivel (5, 10, 25, 50) | +100 | `level_milestone` |

Los "Me gusta" del catálogo (animes, episodios, personajes, trivia)
**no dan XP**: es contenido que escribe el equipo, no la comunidad.

---

## 3. Curva de niveles

`xpParaNivel(n) = 100 × n^1.5`, tope en el nivel 60.

| Nivel | XP total |
|---|---|
| 1 | 0 |
| 2 | 283 |
| 5 | 1.118 |
| 10 | 3.162 |
| 25 | 12.500 |
| 50 | 35.355 |
| **60 (máximo)** | **46.476** |

---

## 4. Despliegue

### Requisitos

- Node 22 (para las funciones).
- **Plan Blaze de Firebase.** Cloud Functions en plan gratuito ya no
  está disponible: hace falta facturación, aunque el proyecto no
  gaste nada.
- Para probar las reglas en local, Java instalado (lo necesita el
  emulador de Firestore).

### Pasos

```bash
# 1. Instalar las dependencias de las funciones
npm --prefix functions install

# 2. Desplegar las reglas y las funciones
firebase deploy --only firestore:rules,functions

# 3. Crear la configuración con la gamificación DESACTIVADA
#    (esto no lo hace nadie: se hace desde el panel, en el paso 4)
```

El paso 3 es a propósito. `gamification/config` tiene
`activo: false` por defecto, y mientras siga así **las funciones no
escriben nada**. Si el despliegue falla a medias, es preferible
quedarse sin XP que llenarlo de XP y medallas que habría que
recalcular a mano.

### 4. Activar

En el panel de administración → **Gamificación**:

1. Asigna el anime de cada medalla temática (Frieren, Cyberpunk).
   Sin esto, esas dos medallas son imposibles de ganar.
2. Activa el interruptor de arriba.

### 5. Recalcular a los usuarios anteriores

Las funciones solo saltan con contenido **nuevo**. Todo lo que ya
estaba en Firestore no genera ningún evento, así que los usuarios
antiguos se quedan con 0 XP hasta que se recalculen a mano:

Panel → Gamificación → **Recalcular**, con el uid del usuario.

Es idempotente: repetirlo no vuelve a pagar lo ya pagado. Se hace
uno a uno y no en lote a propósito, porque recorrer toda la
comunidad leyendo cada hilo y cada comentario es trabajo caro, y
decidir a quién se le calcula el histórico es decisión del
administrador.

---

## 5. Verificación tras desplegar

Checklist para comprobar que el sistema funciona de verdad:

| Caso | Cómo comprobarlo |
|---|---|
| Crear un hilo | Publicar uno → el nivel sube en ≤30 s (los triggers son asíncronos) |
| Publicar un comentario | Comentar → +5 XP |
| Recibir un "Me gusta" | Que otro usuario lo pulse → +3 XP al autor del hilo |
| **No duplica** | Quitar y volver a poner el "Me gusta" → el XP no sube la segunda vez |
| **Retira al quitar** | Quitar el "Me gusta" → el XP baja |
| Subida de nivel | Llenar la barra → sale el aviso «¡Has subido al nivel X!» |
| Desbloqueo de medalla | Al cumplir el requisito, aparece en el perfil y salta el aviso |
| Equipar título | Panel del perfil → «Equipar título»; solo ofrece los desbloqueados |
| **No puedes falsear el XP** | En la consola del navegador: `updateDoc(doc(db,'users',miUid), {xp: 999999})` → **permission-denied** |
| **No puedes crear la cuenta con XP** | Igual, pero en el `create` del documento → **permission-denied** |
| **No puedes inventar una medalla** | Escribir `equippedTitle` con un id que no esté en `medals` → **permission-denied** |
| Permisos del panel | Un moderador ve la sección; los botones de ajustar XP salen deshabilitados |

### Comprobar que los triggers están vivos

```bash
firebase functions:log --only onThreadCreated,onCommentCreated
```

### Ojo con el BOM en los ficheros de texto

El emulador no compila las reglas si el fichero empieza con un BOM
UTF-8, y `firebase deploy` tampoco. PowerShell 5.1 lo añade con
`Set-Content -Encoding UTF8`, así que si editas `firestore.rules` con
eso, comprueba que no se ha colado:

```powershell
$b = [System.IO.File]::ReadAllBytes("firestore.rules")
if ($b[0] -eq 0xEF) { "TIENE BOM: quitaselo antes de desplegar" } else { "sin BOM" }
```

---

## 6. Notas importantes

### El catálogo de medallas está duplicado

`src/utils/progression.ts` (lo pinta) y `functions/src/index.ts` (lo
comprueba) son paquetes distintos y **no comparten código**. Los
**ids tienen que coincidir**, porque son la clave con la que se
guarda `users/{uid}.medals`.

Si añades una medalla, va en los dos sitios. Para comprobar que
siguen en sincronía:

```bash
# Debe responder "los 12 ids coinciden exactamente"
```

Un id **nunca** se renombra ni se reutiliza: si una medalla desaparece
del catálogo, sus usuarios conservan el registro y el nombre guardado
junto a la fecha.

### La curva de niveles también está duplicada

La fórmula `Math.round(curva.base * Math.pow(n, curva.exponente))`
está escrita literalmente en los dos sitios. Si se cambia en uno, la
barra del cliente y el nivel guardado dejaran de cuadrar.

### Las reglas SÍ se pueden probar, y hay prueba

Hay 32 pruebas en `tests/firestore.rules.test.cjs` que las levantan
en el emulador y comprueban los vectores de ataque de verdad, no de
palabras:

```bash
# El harness no está en package.json a propósito:
# @firebase/rules-unit-testing@4 declara peer de firebase@^11 y el
# proyecto usa firebase@12, así que añadirlo rompe el `npm install`
# normal. Se instala solo cuando se quiere probar.
npm i -D --legacy-peer-deps @firebase/rules-unit-testing mocha
npm run test:rules
```

Necesita Java (es lo que requiere el emulador de Firestore).

Estas pruebas ya han encontrado dos fallos reales que `tsc` no puede
ver, porque las reglas son otro lenguaje:

1. La rama general de auto-edición del perfil no tenía
   `equippedTitle` en su lista de campos prohibidos, así que un
   usuario se ponía el título que quisiera **sin pasar por la
   comprobación** de que tenía la medalla. La rama que sí lo
   validaba era código muerto.
2. `isBanned()` leía `myDoc().data.isBanned` con punto. En las
   reglas, leer una clave ausente de un mapa lanza un error de
   evaluación y la regla entera cae con `PERMISSION_DENIED`, así que
   cualquier cuenta sin ese campo (las anteriores a que existiera)
   no podía publicar nada.
3. El baneo se podía esquivar borrando el perfil. `isBanned()` solo
   miraba `users/{uid}.isBanned`, un documento que su dueño puede
   borrar; al volver a entrar, `AuthContext` lo recreaba con
   `isBanned: false` y el baneo desaparecía. Ahora la fuente de
   verdad es `accountRestrictions/{uid}`, que solo escriben las
   callables `banearUsuario` / `desbanearUsuario` con el Admin SDK.
   `tests/firestore.baneregistro.rules.test.cjs` comprueba el ciclo
   completo: borrar el perfil, recrearlo y seguir sin poder publicar.
   Además, `isActive()` exige que el perfil exista: antes una cuenta
   de Auth sin documento en `users` podía escribir en toda la web.

Si ya había baneos antes de este cambio, sus documentos no tienen
registro duradero. Después de desplegar las funciones hay que llamar
una vez a la callable `sincronizarBaneos` (solo equipo) —o pulsar
«Sincronizar baneos» en el panel de Migración— para volcarlos; es
idempotente y no toca los que ya estén registrados.

Si añades o cambias reglas, añade también el caso a esa prueba. Es
la única forma de que alguien lo compruebe sin desplegar.

---

## 7. Si algo falla

| Síntoma | Causa probable |
|---|---|
| Nadie gana XP | `gamification/config` sigue con `activo: false` |
| El aviso no sale | Las funciones no están desplegadas, o el listener no estaba conectado al subir de nivel (se ve al volver, no mientras) |
| "Missing or insufficient permissions" al equipar un título | Esa medalla no está desbloqueada en el documento del usuario |
| Las medallas temáticas no se conceden | Falta asignar el anime en el panel |
| Un usuario antiguo tiene 0 XP | Hay que recalcularlo a mano |
| Un baneo anterior a este cambio no sobrevive a borrar el perfil | Falta ejecutar una vez la callable `sincronizarBaneos` |
| El panel dice que la callable no existe | Las funciones no están desplegadas, o el nombre de la función no coincide |
