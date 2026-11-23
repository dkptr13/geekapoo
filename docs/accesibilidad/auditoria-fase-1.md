# Auditoría de accesibilidad — Fase 1

Fecha de inicio: 2026-11-19
Referencia: WCAG 2.2, nivel AA (cuando el criterio es aplicable)
Alcance: aplicación React de Geekapoo (`src/`), navegación, vistas públicas y privadas,
componentes compartidos, formularios, modales y Kapo-chan.

> Este documento es el registro de trabajo de la fase 1. No afirma que la web
> cumpla WCAG 2.2 AA en su totalidad: recoge lo encontrado, lo corregido y lo
> que queda pendiente con su prioridad.
>
> La fase 2 (Centro de Accesibilidad y preferencias persistentes) se documenta
> en [`centro-accesibilidad-fase-2.md`](./centro-accesibilidad-fase-2.md).

## Cómo se ha revisado

1. Lectura de la estructura de `App.tsx`, Navbar, Sidebar y de cada vista de
   primer nivel.
2. Búsqueda estática en todo `src/` de:
   - contenedores con `onClick` sin semántica de control;
   - imágenes sin `alt` o con `alt` genérico;
   - campos sin `label` asociada o sin nombre accesible;
   - `role="dialog"` sin trampa de foco, Escape, foco inicial o restauración;
   - `outline-none` y ausencia de `:focus-visible`;
   - regiones dinámicas sin `aria-live`;
   - encabezados duplicados o saltos de nivel.
3. Revisión manual de los flujos: inicio, wiki, ficha, búsqueda, hilos,
   comentarios, chats, clubes, perfil, ajustes, soporte, extras, admin,
   autenticación, notificaciones y mascota.
4. Pruebas de compilación y tipado.
5. Pruebas en navegador con teclado, zoom y herramientas automatizadas
   (resultados en la sección final).

## Problemas encontrados

Prioridad:

- **P0**: impide o bloquea una tarea con teclado o lector de pantalla.
- **P1**: barrera importante de uso o de comprensión.
- **P2**: mejora necesaria de calidad, semántica o consistencia.

### Estructura y navegación

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| E-01 | Global | No existía enlace de salto al contenido principal. | 2.4.1 | P0 |
| E-02 | Global | El foco no se gestionaba al cambiar de sección SPA: quedaba en el botón anterior y el lector no sabía que había cambiado el contenido. | 2.4.3, 2.4.6 | P1 |
| E-03 | Global | No había región viva global para anunciar cambios de sección y resultados de acciones. | 4.1.3 | P1 |
| E-04 | Navbar | Los destinos eran `<button>` incluso cuando navegaban; no se anunciaban como enlaces ni permitían abrir en otra pestaña. | 1.3.1, 2.4.4 | P1 |
| E-05 | Navbar | El estado activo era solo visual: faltaba `aria-current`. | 1.3.1, 4.1.2 | P1 |
| E-06 | Navbar móvil | El menú no tenía `aria-controls` ni identificador de región; al cerrarse con Escape no devolvía el foco al disparador. | 4.1.2, 2.4.3 | P1 |
| E-07 | Sidebar | Las tarjetas de hilos usaban `h4` dentro de un `<button>` (HTML inválido) y saltaban de `h2` a `h4`. | 1.3.1 | P1 |
| E-08 | Footer | "Soporte" y "Wiki" eran botones, no enlaces de navegación. | 1.3.1 | P2 |
| E-09 | Global | Varias vistas no tenían `h1` (wiki en catálogo, chats, soporte, extras, ajustes, estados de acceso restringido). | 1.3.1, 2.4.6 | P1 |
| E-10 | Inicio | Los comentarios usaban `h4` bajo un `h2`, saltándose `h3`. | 1.3.1 | P2 |

### Teclado y foco

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| K-01 | Global | Numerosos `focus:outline-none` sin un indicador alternativo global; el foco era invisible o casi invisible en campos y botones. | 2.4.7, 2.4.11 | P0 |
| K-02 | Global | El indicador de foco no era consistente ni tenía contraste suficiente con el fondo morado/oscuro. | 2.4.11, 1.4.11 | P1 |
| K-03 | Cuenta | El menú de cuenta usaba `role="menu"` pero no tenía navegación con flechas ni foco inicial en las opciones. | 2.1.1, 4.1.2 | P1 |
| K-04 | Notificaciones | El panel no devolvía el foco a la campana al cerrarse con Escape. | 2.4.3 | P2 |
| K-05 | Diálogos | Varios modales no atrapaban el foco: Tab se escapaba al contenido de detrás (AuthModal, IdentitySetupModal, ReportDialog, FollowersModal, CustomizeProfileModal, clubes, canales, apariencia, fijados, etc.). | 2.4.3, 2.1.2 | P0 |
| K-06 | Diálogos | Varios modales no enfocaban nada al abrirse y no restauraban el foco al cerrarse. | 2.4.3 | P1 |
| K-07 | Chat | Las filas de conversación usan `role="button"`; se revisó que Enter y Espacio funcionen, pero el patrón debe mantenerse y probarse con lector. | 2.1.1 | P2 |
| K-08 | Pestañas | `role="tablist"` en wiki, ajustes y chat sin navegación con flechas ni `aria-controls`/`tabpanel`. | 2.1.1, 4.1.2 | P2 |

### Lectores de pantalla y nombres accesibles

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| S-01 | Global | Botones que solo mostraban un icono y ocultaban el texto con `hidden sm:inline` quedaban sin nombre accesible en móvil (me gusta, comentarios, compartir, guardar, borrar, reportar). | 4.1.2, 1.1.1 | P0 |
| S-02 | Auth | Los `<label>` no estaban asociados con `htmlFor`/`id`; el placeholder era la única pista de algunos campos. | 1.3.1, 3.3.2 | P0 |
| S-03 | Auth | El modal no tenía `role="dialog"`, `aria-modal` ni `aria-labelledby`. | 4.1.2 | P0 |
| S-04 | Auth | El resultado del formulario no era una región viva: errores y éxito no se anunciaban. | 4.1.3, 3.3.1 | P1 |
| S-05 | Auth | Las pestañas de acceso/registro no comunicaban el modo seleccionado con semántica de pestañas. | 4.1.2 | P2 |
| S-06 | Wiki | El buscador no tenía etiqueta accesible; solo placeholder. | 3.3.2, 1.3.1 | P0 |
| S-07 | Wiki | Las pestañas de la ficha (Información/Episodios/Personajes) eran botones sin `role="tab"` ni `aria-selected`. | 4.1.2 | P1 |
| S-08 | Wiki | El selector de temporada no comunicaba cuál estaba activo (`aria-pressed`). | 4.1.2 | P1 |
| S-09 | Inicio | Los filtros de orden, tipo de publicación, técnica, etiquetas y estado original no comunicaban su estado. | 4.1.2 | P1 |
| S-10 | Inicio | El botón de me gusta y el de comentarios no incluían el estado ni el contexto en el nombre accesible. | 4.1.2 | P1 |
| S-11 | Soporte | Etiquetas sin asociación, categorías sin estado, errores y éxito sin `alert`/`status`, y sin `h1`. | 3.3.1, 4.1.3, 1.3.1 | P1 |
| S-12 | Ajustes | Pestañas sin `aria-controls`/`tabpanel`; selección de visibilidad sin `aria-pressed`; mensajes sin región viva. | 4.1.2, 4.1.3 | P1 |
| S-13 | Chat | El campo de mensaje no tenía etiqueta accesible; el `<input type="file">` estaba oculto sin nombre. | 3.3.2, 4.1.2 | P0 |
| S-14 | Chat | La lista de mensajes no era una región `log`: los cambios no se anunciaban y no había límite para no releer toda la conversación. | 4.1.3 | P1 |
| S-15 | Notificaciones | El panel no tenía nombre de región ni `aria-controls`; el error de acción no era `alert`. | 4.1.2, 4.1.3 | P1 |
| S-16 | Admin | Las pestañas de secciones no comunicaban el estado seleccionado. | 4.1.2 | P2 |
| S-17 | Kapo-chan | El globo tiene `role="dialog"` pero no `aria-modal`, trampa de foco ni restauración al cerrar. | 2.4.3, 4.1.2 | P1 |

### Imágenes

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| I-01 | Inicio | Las imágenes adjuntas a hilos/comentarios usaban `alt` genérico ("Imagen adjunta al hilo") sin contexto de la publicación. | 1.1.1 | P1 |
| I-02 | Perfil | Imágenes de personaje favorito y logos decorativos repetían información adyacente o no tenían contexto. | 1.1.1 | P2 |
| I-03 | Chat | Las fotos enviadas usaban `alt="Foto adjunta"`; las imágenes de mensajes no identificaban el mensaje ni el autor. | 1.1.1 | P1 |
| I-04 | Wiki | Portadas y pósteres dentro de botones/tarjetas se marcaron como decorativos cuando el título ya estaba al lado; se revisó que las imágenes informativas sí tuvieran texto alternativo. | 1.1.1 | P2 |
| I-05 | Global | Avatares dentro de botones con nombre accesible usan `alt=""` correctamente para no duplicar; en cabeceras y perfiles sí llevan el nombre. | 1.1.1 | OK |

### Contraste y legibilidad

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| C-01 | Global | `text-zinc-500` sobre fondos `#080810`/`#0c0c14` da ~4,1:1: por debajo de 4,5:1 para texto normal. | 1.4.3 | P1 |
| C-02 | Global | `text-zinc-600` da ~2,5:1 y se usa en fechas, ayudas y metadatos. | 1.4.3 | P1 |
| C-03 | Global | Los bordes de campos `border-zinc-800` tienen ~1,4:1 frente al fondo; no se distinguen como componente. | 1.4.11 | P1 |
| C-04 | Global | Algunos indicadores de estado (puntos de no leído, selección) dependen solo del color. | 1.4.1 | P2 |
| C-05 | Global | No había un indicador de foco con contraste suficiente (ver K-01/K-02). | 1.4.11, 2.4.11 | P0 |

### Formularios y errores

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| F-01 | Auth/Soporte/Inicio/Chat | Campos sin `label` asociada; algunos solo con placeholder. | 1.3.1, 3.3.2 | P0 |
| F-02 | Global | Los mensajes de error no se asociaban al campo ni se anunciaban; el campo incorrecto no se marcaba con `aria-invalid`. | 3.3.1, 3.3.3 | P1 |
| F-03 | Auth/Soporte | No se indicaba de forma textual qué campos eran obligatorios (solo el atributo `required`). | 3.3.2 | P2 |
| F-04 | Inicio | El formulario de publicación y los comentarios no tenían región de error/estado viva. | 4.1.3 | P1 |
| F-05 | Ajustes | Los mensajes de guardado/cambio no se anunciaban. | 4.1.3 | P1 |
| F-06 | Global | No se borran los datos al fallar (correcto); se mantiene el comportamiento. | 3.3.4 | OK |

### Modales, menús y componentes emergentes

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| M-01 | Auth, identidad, reportes, seguidores, personalización, clubes, canales, apariencia, fijados, tier lists | Faltaba `aria-labelledby` o `aria-label`, foco inicial, trampa de foco, Escape consistente o restauración del foco. | 2.4.3, 2.1.2, 4.1.2 | P0/P1 |
| M-02 | Notificaciones | El diálogo de "eliminar todas" no tenía foco inicial ni trampa; Escape no restauraba foco. | 2.4.3 | P1 |
| M-03 | Cuenta | `role="menu"` sin patrón de teclado completo. | 2.1.1, 4.1.2 | P1 |
| M-04 | Emojis/GIF | Paneles flotantes sin foco gestionado ni cierre con Escape uniforme. | 2.4.3, 2.1.2 | P2 |

### Actualizaciones dinámicas

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| D-01 | Global | No había anunciador global; los toasts y avisos no siempre eran regiones vivas. | 4.1.3 | P1 |
| D-02 | Chat | Cada actualización podía hacer que el lector releyera la conversación; no había `role="log"` con `aria-relevant`. | 4.1.3 | P1 |
| D-03 | Notificaciones | Los avisos de error no eran `alert`; el contador no se anunciaba al cambiar. | 4.1.3 | P1 |
| D-04 | Búsqueda | Los resultados no se anunciaban ni se indicaba el número de coincidencias. | 4.1.3 | P1 |
| D-05 | Acciones | "Mensaje enviado", "publicación creada", "datos guardados" no tenían anuncio sistemático. | 4.1.3 | P1 |

### Móvil, zoom y rendimiento

| ID | Zona | Problema | WCAG | Prioridad |
|---|---|---|---|---|
| R-01 | Global | Hay textos de 9–10 px; con zoom 200 % deben crecer sin romper. Se revisa en pruebas. | 1.4.4 | P2 |
| R-02 | Chat móvil | El chat a pantalla completa y los paneles laterales deben caber a 320 px y con teclado externo. | 1.4.10 | P2 |
| R-03 | Rendimiento | No se añadieron listeners globales permanentes ni consultas nuevas a Firestore; los efectos nuevos dependen de apertura/cierre y cambio de ruta. | — | OK |

## Plan de corrección aplicado en esta fase

1. Infraestructura compartida:
   - `useDialogA11y` para foco inicial, trampa de Tab, Escape, bloqueo de scroll y
     restauración del foco.
   - `A11yProvider` con regiones `polite` y `assertive`.
   - Enlace "Saltar al contenido principal".
   - Gestión de foco y anuncio al cambiar de sección.
2. Semántica:
   - Landmarks (`header`, `nav`, `main`, `aside`, `footer`), `aria-label` en
     navegaciones y `aria-current` en el destino activo.
   - Enlaces reales para navegación; botones para acciones.
   - Un `h1` por vista y corrección de saltos de nivel.
3. Foco y contraste:
   - `:focus-visible` global con contorno de 3 px, offset y alto contraste.
   - Ajuste de textos secundarios, placeholders y bordes de campos.
4. Formularios:
   - `label` + `id`, `aria-describedby`, `aria-invalid`, `required` visible y
     mensajes en `alert`/`status`.
5. Diálogos:
   - Título accesible, foco inicial, trampa, Escape y restauración.
6. Dinámica:
   - Región `log` del chat, anuncios de envío/guardado y errores urgentes.
7. Imágenes:
   - `alt` contextual en adjuntos; decorativas con `alt=""`; avatares con nombre
     cuando son la única información.

## Infraestructura compartida creada

- `src/hooks/useDialogA11y.ts`
  - foco inicial síncrono y en el siguiente frame
  - trampa de Tab y Mayús+Tab
  - Escape
  - bloqueo opcional del scroll
  - devolución del foco al control de origen
- `src/components/common/LiveAnnouncer.tsx`
  - `A11yProvider`
  - región `polite` (`role="status"`)
  - región `assertive` (`role="alert"`)
  - hook `useAnnouncer`
- `src/context/AccessibilityPrefsContext.tsx`
  - preferencias de presentación del usuario;
  - persistencia en `localStorage` (`geekapoo:accesibilidad`);
  - ninguna escritura en Firestore ni dato enviado al servidor.
- Pestaña **Accesibilidad** dentro de Configuración de cuenta:
  - Reducir animaciones.
  - Alto contraste.
  - Subrayar enlaces.
  - Texto más grande.
  - Restablecer preferencias.
  - Ayuda de teclado y atajos.
- Enlace `Saltar al contenido principal` en `App.tsx`.
- `:focus-visible` global de 3 px, offset y halo oscuro en `src/index.css`.
- Ajustes de contraste de textos secundarios, placeholders y bordes de campos.
- Gestión de foco y anuncio al cambiar de sección SPA.
- Título de documento: ya lo cubría `useSeo`; se mantiene y se usa para el
  anuncio de sección.

## Archivos modificados

Infraestructura y estilos:

- `index.html`
- `src/App.tsx`
- `src/index.css`
- `src/hooks/useDialogA11y.ts` (nuevo)
- `src/components/common/LiveAnnouncer.tsx` (nuevo)
- `src/context/AccessibilityPrefsContext.tsx` (nuevo)

Navegación y estructura:

- `src/components/layout/Navbar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/AccountMenu.tsx`

Inicio y comunidad:

- `src/components/home/HomeFeed.tsx`
- `src/components/home/NewsWidget.tsx`
- `src/components/community/ReactionBar.tsx` (revisado, sin cambios)
- `src/components/community/PollCard.tsx`
- `src/components/community/PollComposer.tsx`
- `src/components/community/ReportDialog.tsx`
- `src/components/community/GifPicker.tsx`
- `src/components/community/EmojiPicker.tsx`
- `src/components/community/EmojiPickerButton.tsx`
- `src/components/community/FanartGallery.tsx`

Wiki y fichas:

- `src/components/wiki/AnimeWiki.tsx`
- `src/components/wiki/CatalogBrowser.tsx`
- `src/components/wiki/CatalogSearch.tsx`
- `src/components/wiki/MainTabs.tsx`
- `src/components/wiki/AdvancedFilters.tsx`
- `src/components/wiki/WhereToWatch.tsx`
- `src/components/wiki/WikiPopularityRankings.tsx`

Chat, clubes y mensajería:

- `src/components/chat/ChatView.tsx`
- `src/components/chat/ChatPrefsPanel.tsx`
- `src/components/chat/ChatAparienciaPanel.tsx`
- `src/components/chat/ChatFijadosPanel.tsx`
- `src/components/chat/ClubCreateModal.tsx`
- `src/components/chat/ClubChannelModal.tsx`
- `src/components/chat/ClubSancionDialog.tsx`
- `src/components/chat/ClubModerationPanel.tsx`
- `src/components/chat/ClubDetail.tsx`
- `src/components/chat/ClubDiscovery.tsx`
- `src/components/chat/LocationPicker.tsx`

Autenticación, perfil y ajustes:

- `src/components/auth/AuthModal.tsx`
- `src/components/auth/IdentitySetupModal.tsx`
- `src/components/profile/ProfileView.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/AccountSettings.tsx`
- `src/components/profile/CustomizeProfileModal.tsx`
- `src/components/follows/FollowersModal.tsx`

Notificaciones, soporte, extras y gamificación:

- `src/components/notifications/NotificationBell.tsx`
- `src/components/support/SupportView.tsx`
- `src/components/extras/ExtrasView.tsx`
- `src/components/gamification/AchievementsView.tsx`
- `src/components/gamification/MedalCard.tsx`

Mascota y documentos:

- `src/components/mascot/OtakuMascot.tsx`
- `src/components/docs/ArchitectureModal.tsx`

Administración y componentes reutilizados:

- `src/components/admin/AdminPanel.tsx`
- `src/components/admin/CatalogSections.tsx`
- `src/components/admin/DailyTriviaSection.tsx`
- `src/components/admin/fields.tsx`
- `src/components/admin/GamificationSection.tsx`
- `src/components/admin/ImagePicker.tsx`
- `src/components/admin/ImageUploader.tsx`
- `src/components/admin/QuickImageEditor.tsx`
- `src/components/admin/SiteSections.tsx`
- `src/components/common/CropEditor.tsx`
- `src/components/tierlists/TierListEditor.tsx`
- `src/components/trivia/DailyTriviaView.tsx`
- `tests/logica.hilos-imagen.ts`
- `tests/logica.chat-responsive.ts`
- `tests/logica.chat-diseno.ts`

## Resultados de pruebas automatizadas

Herramienta: Lighthouse 12/13 (motor axe-core) desde el navegador integrado,
sobre el servidor de desarrollo local. Puntuación de accesibilidad:

| Vista | Puntuación | Fallos |
|---|---:|---|
| Inicio | 1,00 | Ninguno |
| Wiki / catálogo | 1,00 | Ninguno |
| Ficha de anime (Información) | 1,00 | Ninguno |
| Ficha de anime (Episodios) | 1,00 | Ninguno |
| Ficha de anime (Personajes) | 1,00 | Ninguno |
| Soporte | 1,00 | Ninguno |
| Extras | 1,00 | Ninguno |
| Logros y medallas | 1,00 | Ninguno |
| Chats (estado sin sesión) | 1,00 | Ninguno |
| Perfil (estado sin sesión) | 1,00 | Ninguno |
| Ajustes (estado sin sesión) | 1,00 | Ninguno |
| Ajustes → Accesibilidad (con sesión) | 1,00 | Ninguno |
| Panel de administración (acceso denegado) | 1,00 | Ninguno |
| Trivia (estado sin sesión) | 1,00 | Ninguno |

Fallos detectados durante las rondas y corregidos:

- `color-contrast`:
  - contadores de las pestañas de la wiki con `opacity-60` (2,95:1);
  - tarjetas de medallas bloqueadas atenuadas con `opacity-70` (3,81:1);
  - iniciales sobre el color de marca de una plataforma (2,73:1);
  - textos secundarios `zinc-500`/`zinc-600` (4,13:1 y 2,58:1).
- `label-content-name-mismatch`:
  - acciones de hilo («Me gusta», «Comentarios», «Compartir»);
  - me gusta de Extras;
  - me gusta de la ficha de anime;
  - botón «Ver comentarios» de episodios;
  - botón de Kapo-chan («¡Tócame!»).
- `target-size`: controles del globo de Kapo-chan de 20×20 px; ahora 28×28 px.

También se corrigieron en la misma ronda los botones con `aria-label` que
sustituían el texto visible por un nombre distinto: ahora el nombre accesible
incluye el texto visible mediante `sr-only`, no mediante un `aria-label`
contradictorio.

## Resultados de pruebas manuales

### Teclado

Comprobado en Chromium con teclado real del navegador integrado:

- `Tab` desde el inicio de la página enfoca «Saltar al contenido principal».
- El enlace de salto se hace visible al recibir foco (transform 0, contorno
   visible de 3 px) y `Enter` lleva el foco a `<main id="contenido-principal">`
  sin desplazar la página (`scrollY` se mantiene en 0).
- Orden de Tab en Inicio: salto → logo → Inicio → Wiki → Chats → Extras →
  Trivia → Logros → Soporte → Buscar → Iniciar sesión → contenido.
- Los destinos de navegación son enlaces reales, se puede usar `Enter` y el
  destino activo lleva `aria-current="page"`.
- Al navegar a la wiki, el título del documento cambia, el `h1` es «Wiki de
  Anime & Series», el foco pasa al `main` y la región viva anuncia
  «Nueva sección: Wiki de anime y series | Geekapoo».
- Modal de acceso: el foco entra en el correo electrónico; `Tab` recorre todos
  los controles y vuelve al primer control sin salir del diálogo; `Escape`
  cierra y devuelve el foco al botón «Iniciar sesión».
- Modal de reporte: el foco entra en «Cerrar la ventana de reporte»; el cierre
  con Escape devuelve el foco al control de origen (probado por evento de
  teclado; el botón de la herramienta de navegador no siempre entrega Escape
  a la página).
- Menú de cuenta: implementadas flechas Arriba/Abajo/Inicio/Fin, foco inicial y
  devolución al disparador con Escape (revisión de código; requiere sesión para
  probarlo en vivo).
- Pestañas: flechas en las pestañas principales de la wiki, en las vistas de
  chat y en los ajustes de cuenta.

### Lector de pantalla / árbol de accesibilidad

Se inspeccionó el árbol de accesibilidad del navegador en Inicio y Wiki:

- `banner`, `navigation` con nombre «Navegación principal», `main` con nombre
  «Contenido principal», `complementary` con nombres y `contentinfo`.
- Un solo `h1` por vista y jerarquía sin saltos en el contenido de la página.
- Regiones vivas permanentes (`status` y `alert`) presentes en el DOM.
- Nombres accesibles de enlaces, botones de acciones de hilo, buscador de la
  wiki y pestañas.

No se pudo ejecutar NVDA ni VoiceOver: no hay un lector de pantalla instalado o
automatizable en este entorno. Por tanto, **no se afirma** que la experiencia
con esos lectores esté verificada manualmente; solo se verificó la estructura,
los nombres y los estados que recibe el árbol de accesibilidad.

### Contraste y foco

- Contorno global comprobado con teclado: `rgb(196, 181, 253)` sólido de 3 px,
  offset 3 px, visible sobre el fondo oscuro.
- Textos secundarios medidos tras el ajuste: `zinc-500` → `#9a9aa6` y
  `zinc-600` → `#8a8a96`; todos los Lighthouse de las vistas listadas dan
  1,00 de accesibilidad.
- Bordes de campos: `#6b6b78` (≥3:1) en lugar de `zinc-800`.
- Estado de error: borde rojo + mensaje textual + `aria-invalid` en los
  formularios principales.

### Móvil y zoom

Prueba en iframe de 320 px (viewport CSS real para media queries) sobre Inicio:

- Sin desbordamiento horizontal: `scrollWidth === clientWidth` (312 px útiles
  tras la barra de scroll).
- Menú móvil: `aria-expanded` pasa a `true`, se muestran los enlaces y el botón
  de inicio de sesión.
- Modal de acceso: 288 px de ancho, entra completo en el viewport, foco en el
  correo.
- Texto al 200 % (raíz a 32 px): aparece scroll horizontal
  (`scrollWidth` 430 px) para poder acceder al contenido; ya no se recorta con
  `overflow-x: clip` porque el body usa `overflow-x: auto`.
- La barra de filtros del feed, que se cortaba 3 px a 320 px, ahora usa
  `flex-wrap` y cabe entera.

### Preferencias de accesibilidad del usuario

Se probó la pestaña **Configuración de cuenta → Accesibilidad** con una sesión
real:

- Las cuatro preferencias se activan y desactivan, actualizan `aria-checked`,
  aplican las clases `a11y-*` en `<html>` y se guardan en `localStorage`.
- «Restablecer preferencias» deja las cuatro en `false`, retira las clases y
  anuncia el cambio en la región viva.
- Recargar conserva las preferencias. Se comprobó que el proveedor las aplica
  antes de pintar y que no hay ninguna escritura en Firestore.
- El texto visible del menú de cuenta y su nombre accesible coinciden; se
  corrigió la última discrepancia que detectó Lighthouse (`label-content-name-mismatch`).

### Consola

No hay errores de la aplicación en consola. El único error observado es
`requestStorageAccess: Permission denied` del iframe de reCAPTCHA de Google,
ajeno a Geekapoo.

### Compilación y pruebas de lógica

- `npm run lint` (`tsc --noEmit`): correcto.
- `npm run test:logica`: 45 suites, todas correctas.
- `npm run build`: correcto; el índice se generó desde la caché local sin leer
  Firestore.
- Se actualizaron los contratos de `tests/logica.hilos-imagen.ts` y
  `tests/logica.chat-responsive.ts`/`logica.chat-diseno.ts` para reflejar el
  alt contextual y la fila de chat con dos botones hermanos en vez de un
  `div role="button"`.

## Problemas que siguen pendientes

1. **Prueba real con NVDA y VoiceOver.** No ejecutada en este entorno.
2. **Pruebas end-to-end con sesión iniciada.** No se creó una cuenta de prueba:
   chats privados, clubes, perfil, ajustes, panel de administración y todos sus
   formularios se revisaron de forma estática y con la compilación, pero no se
   recorrieron en vivo con teclado y lector.
3. **Formularios profundos de administración, personalización de perfil y tier
   lists.** Se añadieron etiquetas a los campos principales reutilizados y
   `role="alert"` a los errores de `fields.tsx`, pero quedan controles menores
   (URLs de imágenes, ajustes avanzados, colores, algunos campos de filas
   dinámicas) cuya asociación campo-error se puede refinar.
4. **Paneles y modales secundarios.** La mayoría de los diálogos principales
   usan `useDialogA11y`; quedan paneles no modales (filtros avanzados, globo de
   Kapo-chan, panel de detalle de club) que no necesitan trampa de foco, pero
   conviene revisar su orden de tabulación en vivo.
5. **Reflujo a 200 % de texto.** Ya no se pierde contenido porque el body
   permite scroll horizontal, pero el objetivo ideal es que el contenido
   refluya sin scroll en más componentes. A 320 px (el caso de 1.4.10) sí
   refluye sin desbordamiento en Inicio.
6. **Chat en vivo.** La lista de mensajes ya es `role="log"` con
   `aria-relevant="additions"`, pero no se pudo comprobar con mensajes reales
   que el lector no relea el historial completo en todas las combinaciones.
7. **Auditoría completa de todas las páginas estáticas de anime.** Se probaron
   tres pestañas de una ficha y las vistas principales. Las 337 páginas
   generadas comparten el mismo componente, pero no se recorrieron una a una.
8. **Cumplimiento WCAG 2.2 AA completo.** No se afirma. Esta fase corrige
   cimientos y las barreras detectadas; una conformidad completa exige la
   verificación de todos los criterios aplicables, incluidos los anteriores.

## Conclusión de la fase

La base compartida de accesibilidad está implementada: foco visible y
consistente, enlace de salto, landmarks y jerarquía de encabezados, nombres
accesibles, formularios etiquetados, diálogos con foco gestionado, regiones
vivas, contraste corregido y chat con región de registro. Las vistas públicas
principales superan Lighthouse con accesibilidad 1,00 y las comprobaciones
manuales de teclado, foco, 320 px y texto al 200 % no encontraron barreras
bloqueantes nuevas. Queda pendiente la validación con lectores de pantalla
reales y con sesión iniciada para poder hablar de una cobertura completa.
