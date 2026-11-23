# Centro de Accesibilidad — Fase 2

Fecha: 2026-11-19
Alcance: preferencias globales de accesibilidad de Geekapoo (texto,
contraste, movimiento, sonidos, controles y simplificación visual),
persistencia local y sincronización con el perfil.

> Este documento distingue lo que se ha probado de lo que queda
> pendiente. La persistencia remota en producción no puede darse por
> terminada hasta desplegar las reglas de Firestore incluidas en este
> cambio.

## 1. Archivos modificados y creados

### Nuevos

| Archivo | Contenido |
|---|---|
| `src/data/accessibilityPreferences.ts` | Modelo versionado, valores por defecto, presets, perfiles rápidos, normalizador, firma de comparación y decisión de preferencias iniciales. |
| `src/context/AccessibilityPrefsContext.tsx` | Estado global, caché local por invitado/usuario, sincronización con `userPrivate` y guardado con debounce. |
| `src/components/accessibility/AccessibilityCenter.tsx` | Interfaz completa del centro: perfiles, texto, contraste, movimiento, sonidos, controles, simplificación y restablecimiento. |
| `src/components/common/SoundEffects.tsx` | Disparadores únicos de sonidos opcionales de interfaz, notificaciones y mensajes. |
| `src/services/sound.ts` | Tonos sintetizados con Web Audio, volumen y desbloqueo por gesto. Sin archivos ni dependencias nuevas. |
| `tests/logica.accesibilidad.ts` | Pruebas de saneo, migración, perfiles y estrategia de sincronización. |
| `docs/accesibilidad/centro-accesibilidad-fase-2.md` | Este informe. |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Orden de proveedores, `SoundEffects`, acceso público al centro para invitados, enlace en el pie y limpieza de `ajustes` al cambiar de pestaña. |
| `src/components/profile/AccountSettings.tsx` | Pestaña de accesibilidad con el componente nuevo y pestaña persistida en la URL. |
| `src/components/layout/AccountMenu.tsx` | Entrada «Accesibilidad» en el menú de cuenta. |
| `src/components/layout/Navbar.tsx` | Acceso directo desde el menú de cuenta y desde el menú móvil, incluido el de invitados. |
| `src/index.css` | Variables y atributos globales, escalado de texto, espaciado, contraste, movimiento, controles grandes, interfaz simplificada y correcciones de reflujo. |
| `src/context/AuthContext.tsx` | `privateDataReadyFor` para no confundir «sin preferencias» con «todavía no leídas». |
| `src/services/userPrivate.ts` | `accessibility` como campo privado y su unión con `currentUser`. |
| `src/types/index.ts` | Tipos de `User` y `UserPrivateData`. |
| `src/hooks/useDialogA11y.ts` | Restauración de foco fiable con la pestaña en segundo plano y con StrictMode. |
| `firestore.rules` | `accesibilidadValida()` y permiso del campo en `userPrivate`. |
| `tests/firestore.rules.test.cjs` | Pruebas de escritura válida, valores inventados y documento ajeno. |
| `package.json` | Nueva prueba de lógica en `test:logica`. |

`firestore.deploy.rules` se regenera con `npm run rules:build`; está
ignorado por Git y no se despliega desde este cambio.

## 2. Componentes creados y reutilizados

- **Creados:** `AccessibilityCenter`, `AccessibilityPrefsProvider`,
  `SoundEffects`, motor de sonido y modelo de preferencias.
- **Reutilizados:** `useDialogA11y` para el diálogo de confirmación,
  `useAnnouncer` para anunciar cambios, `LiveAnnouncer`, estilos y
  componentes visuales existentes, `AccountSettings`, `AccountMenu` y
  `Navbar`.
- **Sin dependencias nuevas.** Los sonidos se generan con la Web Audio
  API del navegador.

## 3. Opciones nuevas

### Perfiles rápidos

- Lectura cómoda.
- Alta visibilidad.
- Menos movimiento.
- Controles grandes.
- Interfaz simplificada.

Son puntos de partida: después se puede cambiar cualquier opción por
separado y el perfil deja de mostrarse como activo si sus valores ya no
coinciden.

### Visualización y texto

- Cinco presets: pequeño, normal, ligeramente grande, grande y muy
  grande.
- Control gradual del 90 % al 200 %.
- Vista previa en vivo con título, comentario y texto secundario.
- Espaciado de lectura normal, cómodo, amplio y WCAG 1.4.12.
- Ajuste manual de altura de línea, separación entre letras, entre
  palabras y entre párrafos.

### Contraste y colores

- Normal, contraste mejorado y alto contraste.
- Subrayar enlaces.
- Bordes más visibles.
- Destacar elementos seleccionados.
- Reducir transparencias.

No se invierten imágenes, avatares ni ilustraciones.

### Movimiento

- Normal (respeta el sistema operativo).
- Animaciones reducidas.
- Sin animaciones decorativas.

### Sonidos

- Interruptor general.
- Sonidos de interfaz, notificaciones y mensajes.
- Volumen.
- Botones de prueba.
- Todos los sonidos están desactivados por defecto y nunca sustituyen a
  un aviso visual.

### Controles y preferencias adicionales

- Controles grandes, con objetivo de 44 × 44 px.
- Interfaz simplificada.
- Restablecer preferencias con confirmación.

## 4. Cómo se aplican globalmente

El proveedor escribe atributos y variables en `<html>`:

```text
data-text-size   custom | ausente
data-spacing     normal | comfortable | wide | wcag | custom
data-contrast    normal | enhanced | high
data-motion      system | reduced | none
data-controls    normal | large
data-borders     normal | strong
data-selection   normal | strong
data-transparency normal | reduced
data-underline   true | false
data-simplified  true | false
```

Variables principales:

```css
--a11y-text-scale
--a11y-line-height
--a11y-letter-spacing
--a11y-word-spacing
--a11y-paragraph-spacing
```

El escalado se aplica al `font-size` raíz y a los tamaños fijos en píxeles
de etiquetas pequeñas. `--spacing` y los contenedores de Tailwind se
mantienen en píxeles para que las cajas no crezcan en la misma proporción
que las letras. Los iconos SVG con `width`/`height` propios no se
deforman.

No hay condiciones de accesibilidad repartidas por los componentes: los
componentes siguen usando sus clases actuales y el CSS global responde a
los atributos de `<html>`. Los cambios se ven al instante, sin recargar.

## 5. Persistencia en Firebase

Las preferencias viven en:

```text
userPrivate/{uid}.accessibility
```

No se guardan en `users/{uid}` (documento público). El objeto está
versionado (`version: 2`) y solo contiene valores de presentación:

```text
version, textScale, spacingPreset, lineHeight, letterSpacing,
wordSpacing, paragraphSpacing, contrast, underlineLinks,
strongBorders, highlightSelection, reduceTransparency, motion,
soundEnabled, soundInterface, soundNotifications, soundMessages,
soundVolume, largeControls, simplified
```

No hay campos de salud, discapacidad ni clasificación de personas.

`AuthContext` ya escuchaba `userPrivate`; se añadió
`privateDataReadyFor` para saber cuándo termina la primera lectura. No se
añadió ninguna consulta nueva a Firestore.

Las reglas nuevas validan tipos, valores permitidos y rangos, y rechazan
campos inventados o escrituras en el documento de otra persona. Se
comprobaron en el emulador (ver pruebas).

## 6. Almacenamiento local para invitados

Claves:

```text
geekapoo:accesibilidad:invitado
geekapoo:accesibilidad:usuario:<uid>
geekapoo:accesibilidad              (legado de la Fase 1)
```

- El invitado puede abrir el centro en
  `/?tab=ajustes&ajustes=accesibilidad` sin cuenta.
- La preferencia se aplica desde la primera carga posible.
- Se guarda en localStorage y sobrevive a recargas y visitas posteriores.
- La clave antigua de la Fase 1 se migra a la primera y se elimina.
- También se guarda una copia local por usuario para evitar parpadeos y
  conservar la configuración si Firestore no responde.

## 7. Sincronización entre dispositivos

Estrategia aplicada al entrar en una cuenta:

1. Si `userPrivate/{uid}.accessibility` existe, **manda el perfil**. Es la
   sincronización entre dispositivos.
2. Si el perfil no tiene preferencias, se usa la copia local de ese
   usuario y se sube.
3. Si tampoco hay copia, se usan las preferencias de invitado y se suben.
4. Si todo son valores por defecto, no se escribe nada.

Los cambios locales se aplican al instante y se guardan con un debounce de
700 ms. No hay una escritura por cada píxel que se mueve un control. Los
cambios remotos llegan por el listener existente de `userPrivate` y se
aplican sin recargar. Al cerrar sesión, la configuración actual se
conserva como preferencia de invitado.

La decisión de qué configuración inicial aplicar está cubierta por
`tests/logica.accesibilidad.ts`.

## 8. Pruebas realizadas

### Compilación y pruebas automáticas

| Prueba | Resultado |
|---|---|
| `npm run lint` (`tsc --noEmit`) | Correcto. |
| `npm run test:logica` | Correcto, incluida `logica.accesibilidad.ts`. |
| `npm run build` | Correcto. Solo aparecen los avisos ya existentes de tamaño de chunks e imports dinámicos. |
| `npm run rules:build` | Correcto: 171 889 bytes, 90 255 de margen. |
| Pruebas de reglas centradas en accesibilidad | 3 correctas: escritura válida, valores inventados y documento ajeno. |

La suite completa de reglas se intentó ejecutar, pero el entorno la cortó
por tiempo antes de terminar. Las tres pruebas nuevas se ejecutaron
aparte con el emulador y terminaron correctamente.

### Navegador real (sesión de prueba)

- Enlace profundo `?tab=ajustes&ajustes=accesibilidad` y entrada
  «Accesibilidad» del menú de cuenta.
- Acceso de invitado desde el pie, el menú móvil y el aviso de inicio de
  sesión.
- Cambio de tamaño de texto y comprobación del `font-size` raíz
  (16 → 20 → 24 → 32 px en las pruebas).
- Vista previa y espaciado WCAG: línea 1,5, letras 0,12 em, palabras
  0,16 em y párrafos 2 em.
- Contraste alto: texto principal con ratio medido ≈ 18,15:1 y texto
  secundario ≈ 15,72:1 sobre `#080810`; imágenes con `filter: none`.
- Enlaces subrayados, bordes reforzados, selección con contorno interior y
  transparencias reducidas comprobados con estilos calculados.
- Movimiento reducido: animaciones decorativas desactivadas y spinner
  esencial a 1 s. Movimiento desactivado: transiciones fuera y spinner
  esencial conservado.
- Sonidos: maestro, canales y volumen; botones de prueba habilitados y
  deshabilitados correctamente; campana de notificaciones siempre
  visible. No se produjeron errores de audio al probar los tonos.
- Controles grandes: altura mínima de 44 px en botones y campos, sin
  solapamientos.
- Interfaz simplificada: se ocultan halos y desenfoques, pero siguen
  visibles la navegación, las publicaciones y las notificaciones.
- Persistencia de invitado: cambio, recarga y recuperación correcta.
- Persistencia con sesión: cambio, tres recargas seguidas y recuperación
  correcta desde la copia local.
- Restablecimiento: diálogo con foco inicial, trampa de Tab, Escape,
  restauración del foco al botón y vuelta a los valores por defecto.
- Los datos de la cuenta siguen intactos después del restablecimiento
  (correo, apariencia del chat y región continúan en `userPrivate`).

### Reflujo y ampliación

Con viewport de 320 px, texto al 200 %, espaciado WCAG y controles grandes:

- Inicio, perfil, centro de accesibilidad, chats y wiki: `scrollWidth`
  igual al ancho del viewport, sin desplazamiento horizontal.
- El diálogo de restablecimiento cabe en 288 px dentro de un viewport de
  320 px.
- Se corrigieron la cabecera, el pie, las rejillas de insignias, las barras
  de acciones y las palabras largas.

### Lighthouse

Con preferencias activas (texto grande, alto contraste, controles grandes,
movimiento reducido, interfaz simplificada):

| Vista | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|
| Centro de accesibilidad (normal y con preferencias) | 100 | 100 | 100 |
| Inicio | 100 | 100 | 100 |
| Wiki | 100 | 100 | 100 |

La primera pasada del centro con los valores por defecto detectó un
contraste de 3,03:1 en las ayudas de los sonidos desactivados: el
contenedor entero usaba `opacity-60`. Se corrigió para atenuar solo el
interruptor, no el texto explicativo.

## 9. Problemas encontrados y corregidos

1. **Desbordamiento horizontal a 320 px con texto al 200 %.** La cabecera,
   el pie, las rejillas y las barras de acciones no cedían. Se permitió el
   salto de línea, se limitaron botones al ancho disponible y se añadió
   `min-width: 0` a las rejillas.
2. **Palabras largas en títulos.** Se añadió `overflow-wrap: break-word`
   solo al contenido de lectura.
3. **Foco del diálogo de restablecimiento.** En una pestaña en segundo
   plano `requestAnimationFrame` está pausado y el foco caía al `body`.
   Ahora se enfoca de inmediato y se refuerza en el siguiente frame, con
   protección para StrictMode.
4. **Spinner en movimiento reducido.** La regla global lo dejaba girando a
   0,12 s. Se mantiene a 1 s porque es información de estado, no
   decoración.
5. **El centro no era accesible para invitados.** Se añadió el acceso
   público por URL, pie, menú móvil y aviso de inicio de sesión.
6. **Contraste de las ayudas desactivadas.** Los textos de los sonidos
   desactivados heredaban la opacidad del contenedor y bajaban a 3,03:1.
   Ahora solo se atenúa el interruptor; la explicación sigue legible.
7. **Reglas de producción sin desplegar.** El guardado remoto devuelve
   `Missing or insufficient permissions`; la interfaz lo explica y
   conserva la copia local. No es un fallo del código de la aplicación,
   pero impide dar por cerrada la persistencia en producción.

## 10. Funcionalidades pendientes y límites de las pruebas

- **Desplegar las reglas de Firestore** y verificar el guardado real en
  `userPrivate/{uid}.accessibility`. Hasta entonces, la sincronización
  entre dispositivos no está operativa en producción.
- **Probar la sincronización invitado → cuenta con una sesión real** una
  vez desplegadas las reglas. La lógica de decisión está probada, pero no
  se cerró la única sesión de prueba para no perderla.
- **Lectores de pantalla reales** (NVDA, VoiceOver). Se revisaron
  semántica, nombres accesibles, foco y regiones vivas, y Lighthouse da
  100, pero no se ha hecho una pasada manual con un lector.
- **Preferencia real `prefers-reduced-motion` del sistema operativo.** La
  regla CSS está implementada; el navegador automatizado no permitió
  emularla. Las reglas equivalentes con `data-motion` sí se probaron.
- **Salida audible de los tonos.** Se comprobó que los botones de prueba
  se ejecutan sin errores y que los avisos visuales siguen ahí; no se
  verificó el sonido con oído en todos los dispositivos.
- **Pulsaciones reales de teclado en el navegador automatizado.** El
  entorno no entregó eventos de teclado a la página; se probaron foco,
  trampa de Tab, Escape y restauración con eventos equivalentes, y todos
  los controles son botones, radios y rangos nativos.
- **Perfilado con React Profiler.** No se añadieron consultas ni
  listeners nuevos y el guardado está agrupado, pero no se hizo una
  medición formal de renderizados.
- **Pruebas con personas** con baja visión, dificultades motoras,
  sensibilidad al movimiento o necesidades cognitivas.
