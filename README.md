# ⚡ geekapoo.com — Plataforma Web, Foro & Wiki Otaku

<p align="center">
  <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80" alt="Geekapoo Banner" width="100%" style="border-radius: 16px;" />
</p>

<p align="center">
  <b>Un espacio cómodo, libre y seguro para la comunidad otaku, gamer y geek.</b><br/>
  Sin censura, sin filtros innecesarios y con una única regla inquebrantable: <b>el respeto mutuo</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase-v9%2B-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 🌟 Características Principales

### 💬 1. Foro & Hilos de Debate
- **Publicación de Hilos:** Creación de discusiones con categorías, etiquetas personalizadas (`#tags`) y soporte multimedia.
- **Encuestas Interactivas (Polls):** Creación de encuestas con opciones múltiples, temporizador de caducidad e historial de votos protegido en Firestore sin manipulación.
- **Reacciones Múltiples:** Reacciones paralelas con emojis (`🔥`, `😂`, `😱`, `😭`, `🏆`, `❤️`) sin alterar el contador tradicional de *Me gusta*.
- **Integración de GIFs:** Inserción de GIFs animados mediante la API de GIPHY/Tenor en comentarios y respuestas.
- **Comentarios Anidados:** Conversaciones ordenadas por hilos principales y respuestas directas.

### 📚 2. Anime Wiki & Catálogo
- **Fichas Técnicas:** Sinopsis, año de emisión, estudio de animación, estado, puntuación y enlaces oficiales a plataformas de streaming (Crunchyroll, Netflix, Prime Video).
- **Directorio de Episodios:** Listado completo con títulos oficiales, fechas de emisión, descripciones y miniaturas en HD.
- **Galería de Personajes & Seiyuus:** Fichas de personajes principales y secundarios con sus respectivos actores de voz japoneses (*seiyuus*).

### 🏆 3. Gamificación & Sistema de Niveles
- **Progreso por Experiencia (XP):** Recompensas de XP automáticas tras acciones clave (crear hilos, comentar, votar en encuestas, recibir reacciones).
- **Curva de Niveles (Nivel 1 al 100):** Escalado progresivo desde Nivel 1 hasta el Nivel 100 (**Geek de Geeks** / **Kapo-Sama**).
- **Medallas & Logros:** Catálogo de insignias desbloqueables visibles en el perfil público del usuario.

### 🔔 4. Centro de Notificaciones en Tiempo Real
- **Suscripción `onSnapshot`:** Campana de alertas en la barra superior (*Navbar*) con actualización instantánea de respuestas, reacciones, subidas de nivel y logros.
- **Gestión por Lotes (`WriteBatch`):** Opción de "Marcar todas como leídas" optimizada.

### 💬 5. Mensajería Directa & Grupal (ChatID)
- **Identificador Único (`ChatID`):** Conexión segura 1 a 1 entre usuarios sin exponer correos electrónicos (ej. `GK-8842-OTAKU`).
- **Salas de Debate Grupal:** Creación de salas de chat temáticas.

### 🦊 6. Mascota Virtual Guardiana (Kapo-chan)
- Asistente flotante interactivo que reacciona según la sección abierta en la web, promueve el respeto mutuo en la comunidad y guía a los usuarios.

### 📰 7. Noticias RSS Integradas
- Sincronización automática mediante Cloud Functions de las últimas noticias de anime de medios internacionales.

### ⚙️ 8. Panel de Administración Full-Stack
- Herramienta interna para moderar usuarios, administrar encuestas, hilos y cargar imágenes en alta calidad mediante **ImgBB API** o **Firebase Storage**.

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS, Lucide React (iconos), Vite |
| **Backend** | Firebase Cloud Functions v2 (TypeScript / Node.js) |
| **Base de Datos** | Firebase Firestore (NoSQL en tiempo real) |
| **Autenticación** | Firebase Auth (Email/Contraseña & GitHub OAuth) |
| **Almacenamiento** | ImgBB API & Firebase Storage |
| **APIs Externas** | GIPHY API / Tenor API, RSS Feeds |
| **Hosting & CI/CD** | Vercel (Frontend), Firebase CLI (Backend & Rules) |
| **Pruebas** | Vitest + `@firebase/rules-unit-testing` |

---

## 📁 Estructura del Proyecto

```text
geekapoo/
├── functions/                  # Cloud Functions v2 (Backend Node.js/TS)
│   ├── src/
│   │   └── index.ts            # Triggers de XP, notificaciones y cierre de encuestas
│   └── package.json
├── src/
│   ├── app/                    # Estructura de vistas/rutas principales
│   ├── components/
│   │   ├── admin/              # Panel de control y moderación
│   │   ├── auth/               # Modales de registro, login y reset
│   │   ├── chat/               # Vista de mensajería 1a1 y grupos
│   │   ├── community/          # PollCard, ReactionBar, GifPicker
│   │   ├── home/               # Feed del foro y noticias RSS
│   │   ├── layout/             # Navbar, Sidebar y navegación global
│   │   ├── mascot/             # OtakuMascot (Kapo-chan)
│   │   ├── notifications/      # NotificationBell y panel dropdown
│   │   └── wiki/               # AnimeWiki, episodios y personajes
│   ├── context/                # AuthContext, CommunityContext, ChatContext, NotificationsContext
│   ├── data/                   # mockData.ts (catálogo base inicial)
│   ├── services/               # Clientes Firestore (threads, comments, polls, reactions, gifs)
│   ├── types/                  # Definición de interfaces TypeScript
│   └── utils/                  # Algoritmos de progresión XP, polyfills y helpers
├── tests/
│   └── firestore.community.rules.test.cjs # Tests automatizados de seguridad
├── firestore.rules             # Reglas de seguridad NoSQL
├── firestore.indexes.json      # Índices compuestos de Firestore
└── package.json