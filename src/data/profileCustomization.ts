/**
 * Personalización del perfil: catálogo y desbloqueos en un solo sitio.
 *
 * Todo lo que un usuario puede ponerse (colores, banners, marcos)
 * vive aquí, con su nivel mínimo. NADA de esto se guarda como
 * "desbloqueado" en Firestore: el desbloqueo se DERIVA del nivel
 * (que sale del XP, escrito por las Cloud Functions) y de las
 * medallas (también del servidor). Así no hay ningún campo que
 * falsear desde la consola para conseguir algo antes de tiempo, y
 * desbloquear no concede XP porque no escribe nada.
 *
 * Si mañana cambian los niveles o se añaden colores, hay que tocar
 * este fichero Y las listas de `firestore.rules`
 * (`colorPermitido`, `marcoPermitido`, `bannerPermitido` y
 * `fondoPermitido`): las reglas no importan código, así que repiten
 * los ids y exigen el nivel guardado en el perfil. La validación del
 * cliente es solo para enseñar el candado; la del servidor es la que
 * impide equipar algo bloqueado desde una consola manipulada.
 */

export type Rareza = 'basico' | 'especial' | 'raro' | 'epico' | 'legendario';

export const RAREZAS: Record<
  Rareza,
  { nombre: string; clase: string; punto: string }
> = {
  basico: {
    nombre: 'Básico',
    clase: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-300',
    punto: 'bg-zinc-400',
  },
  especial: {
    nombre: 'Especial',
    clase: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    punto: 'bg-sky-400',
  },
  raro: {
    nombre: 'Raro',
    clase: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
    punto: 'bg-violet-400',
  },
  epico: {
    nombre: 'Épico',
    clase: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
    punto: 'bg-fuchsia-400',
  },
  legendario: {
    nombre: 'Legendario',
    clase: 'border-amber-300/35 bg-amber-400/10 text-amber-200',
    punto: 'bg-amber-300',
  },
};

export interface ColorPerfil {
  id: string;
  nombre: string;
  /** Hex en minúsculas, tal cual se guarda en `profileColor`. */
  hex: string;
  nivelMinimo: number;
  rareza: Rareza;
  /** Fondo completo de la tarjeta y del halo del avatar. */
  gradiente: string;
  descripcion: string;
}

/**
 * Los hex existentes se conservan para que ninguna cuenta pierda su
 * color ni su desbloqueo. Los ids son nuevos y las tarjetas llevan
 * el degradado completo; el hex sigue siendo el ancla guardada y el
 * acento del nivel/avatar.
 */
export const COLORES_PERFIL: ColorPerfil[] = [
  {
    id: 'aurora',
    nombre: 'Aurora',
    hex: '#38bdf8',
    nivelMinimo: 1,
    rareza: 'especial',
    gradiente:
      'linear-gradient(135deg,#0284c7 0%,#6366f1 48%,#2dd4bf 100%)',
    descripcion: 'Azul eléctrico, violeta y turquesa con un brillo de aurora.',
  },
  {
    id: 'nebulosa',
    nombre: 'Nebulosa',
    hex: '#8b5cf6',
    nivelMinimo: 1,
    rareza: 'basico',
    gradiente:
      'radial-gradient(ellipse at 20% 0%,rgba(236,72,153,.55),transparent 55%),linear-gradient(135deg,#2e1065,#6d28d9 50%,#1e1b4b)',
    descripcion: 'Morado profundo con polvo de estrellas rosa y azul.',
  },
  {
    id: 'sakura',
    nombre: 'Sakura',
    hex: '#ec4899',
    nivelMinimo: 3,
    rareza: 'especial',
    gradiente:
      'linear-gradient(135deg,#fbcfe8 0%,#f472b6 45%,#c4b5fd 100%)',
    descripcion: 'Rosa pastel, blanco y lavanda con pétalos suaves.',
  },
  {
    id: 'cyberpunk',
    nombre: 'Cyberpunk',
    hex: '#22d3ee',
    nivelMinimo: 1,
    rareza: 'especial',
    gradiente:
      'repeating-linear-gradient(90deg,rgba(34,211,238,.1) 0 2px,transparent 2px 18px),linear-gradient(135deg,#083344,#0e7490 45%,#6d28d9)',
    descripcion: 'Cian neón, violeta y azul oscuro de pantalla futurista.',
  },
  {
    id: 'inferno',
    nombre: 'Inferno',
    hex: '#ef4444',
    nivelMinimo: 8,
    rareza: 'raro',
    gradiente:
      'radial-gradient(ellipse at 50% 100%,rgba(251,146,60,.55),transparent 55%),linear-gradient(135deg,#450a0a,#b91c1c 55%,#111827)',
    descripcion: 'Rojo intenso, naranja y negro con pulso de lava.',
  },
  {
    id: 'esmeralda',
    nombre: 'Esmeralda',
    hex: '#10b981',
    nivelMinimo: 5,
    rareza: 'especial',
    gradiente:
      'linear-gradient(135deg,#022c22,#059669 55%,#2dd4bf 100%)',
    descripcion: 'Verde esmeralda y turquesa con reflejos minerales.',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    hex: '#f59e0b',
    nivelMinimo: 3,
    rareza: 'especial',
    gradiente:
      'linear-gradient(135deg,#fb923c 0%,#f43f5e 50%,#7c3aed 100%)',
    descripcion: 'Naranja coral, rosa y violeta de última hora del día.',
  },
  {
    id: 'galaxia',
    nombre: 'Galaxia',
    hex: '#4338ca',
    nivelMinimo: 12,
    rareza: 'raro',
    gradiente:
      'radial-gradient(circle at 22% 18%,#fff 0 1px,transparent 2px),radial-gradient(circle at 72% 32%,#ddd6fe 0 1px,transparent 2px),radial-gradient(circle at 48% 72%,#a5b4fc 0 1px,transparent 2px),linear-gradient(135deg,#020617,#312e81 52%,#7c3aed)',
    descripcion: 'Azul noche, púrpura y destellos de constelaciones.',
  },
  {
    id: 'dorado-imperial',
    nombre: 'Dorado imperial',
    hex: '#eab308',
    nivelMinimo: 10,
    rareza: 'legendario',
    gradiente:
      'radial-gradient(ellipse at 25% 0%,rgba(254,240,138,.75),transparent 48%),linear-gradient(135deg,#292524,#a16207 45%,#facc15 100%)',
    descripcion: 'Oro, negro y ámbar con acabado de corona imperial.',
  },
  {
    id: 'oceano',
    nombre: 'Océano',
    hex: '#0284c7',
    nivelMinimo: 6,
    rareza: 'raro',
    gradiente:
      'radial-gradient(ellipse at 80% 15%,rgba(103,232,249,.45),transparent 48%),linear-gradient(135deg,#082f49,#0369a1 52%,#164e63)',
    descripcion: 'Azul profundo, cian y tonos marinos con luz de superficie.',
  },
  {
    id: 'eclipse',
    nombre: 'Eclipse',
    hex: '#71717a',
    nivelMinimo: 1,
    rareza: 'especial',
    gradiente:
      'radial-gradient(circle at 74% 28%,#cbd5e1 0 5%,#64748b 6%,transparent 17%),linear-gradient(135deg,#020617,#18181b 48%,#3b0764)',
    descripcion: 'Negro, púrpura y reflejos plateados de luna oculta.',
  },
  {
    id: 'hielo-celestial',
    nombre: 'Hielo celestial',
    hex: '#7dd3fc',
    nivelMinimo: 15,
    rareza: 'epico',
    gradiente:
      'radial-gradient(circle at 20% 20%,rgba(255,255,255,.8) 0 1px,transparent 2px),linear-gradient(135deg,#e0f2fe,#7dd3fc 45%,#a5b4fc)',
    descripcion: 'Blanco azulado, plata y azul cristalino.',
  },
];

export const COLOR_POR_DEFECTO = '#8b5cf6';

/** Hex válidos, para validar sin recorrer objetos. */
export const HEXES_VALIDOS: string[] = COLORES_PERFIL.map((c) => c.hex);

/** Estilo completo de un color, con la misma comprobación de nivel. */
export function estiloColorDePerfil(
  profileColor: string | undefined,
  level: number,
): ColorPerfil {
  return (
    COLORES_PERFIL.find(
      (c) =>
        c.hex === (profileColor ?? '').toLowerCase() && level >= c.nivelMinimo,
    ) ?? COLORES_PERFIL.find((c) => c.hex === COLOR_POR_DEFECTO)!
  );
}

export interface BannerPerfil {
  id: string;
  nombre: string;
  nivelMinimo: number;
  rareza: Rareza;
  descripcion: string;
  /** Fondo CSS del banner. Sin imágenes: no pesa nada. */
  css: string;
}

export const BANNERS_PERFIL: BannerPerfil[] = [
  {
    id: 'defecto',
    nombre: 'Geekapoo',
    nivelMinimo: 1,
    rareza: 'basico',
    descripcion: 'El degradado de la casa, con su halo violeta.',
    css: 'radial-gradient(120% 100% at 50% 0%,rgba(139,92,246,.38),transparent 70%),linear-gradient(135deg,#18181b,#27272a)',
  },
  {
    id: 'ocaso',
    nombre: 'Ocaso',
    nivelMinimo: 1,
    rareza: 'basico',
    descripcion: 'Crepúsculo violeta, rosa y ámbar.',
    css: 'radial-gradient(ellipse at 70% 20%,rgba(251,146,60,.35),transparent 50%),linear-gradient(135deg,#3b0764,#9d174d 55%,#431407)',
  },
  {
    id: 'abismo',
    nombre: 'Abismo',
    nivelMinimo: 3,
    rareza: 'especial',
    descripcion: 'Azul abisal con corrientes de cian profundo.',
    css: 'radial-gradient(ellipse at 25% 0%,rgba(34,211,238,.3),transparent 55%),linear-gradient(135deg,#082f49,#155e75 50%,#1e1b4b)',
  },
  {
    id: 'neon',
    nombre: 'Neón',
    nivelMinimo: 5,
    rareza: 'especial',
    descripcion: 'Violeta, magenta y ámbar con energía de arcade.',
    css: 'repeating-linear-gradient(90deg,rgba(255,255,255,.045) 0 1px,transparent 1px 28px),linear-gradient(135deg,#4c1d95,#db2777 50%,#f59e0b)',
  },
  {
    id: 'cosmos',
    nombre: 'Cosmos',
    nivelMinimo: 8,
    rareza: 'raro',
    descripcion: 'Cian y rosa interestelar sobre azul noche.',
    css: 'radial-gradient(80% 90% at 20% 10%,rgba(34,211,238,.35),transparent 60%),radial-gradient(80% 90% at 80% 20%,rgba(236,72,153,.32),transparent 60%),linear-gradient(135deg,#020617,#0f172a)',
  },
  {
    id: 'leyenda',
    nombre: 'Leyenda',
    nivelMinimo: 10,
    rareza: 'epico',
    descripcion: 'Oro viejo y bronce con un resplandor de trofeo.',
    css: 'radial-gradient(100% 100% at 50% 0%,rgba(234,179,8,.44),transparent 65%),linear-gradient(135deg,#1c1917,#451a03 55%,#18181b)',
  },
  {
    id: 'sakura',
    nombre: 'Sakura',
    nivelMinimo: 5,
    rareza: 'especial',
    descripcion: 'Pétalos de rosa, blanco y lavanda.',
    css: 'radial-gradient(circle at 15% 20%,rgba(255,255,255,.45),transparent 18%),radial-gradient(circle at 84% 12%,rgba(251,207,232,.6),transparent 28%),linear-gradient(135deg,#4a044e,#9d174d 55%,#fbcfe8)',
  },
  {
    id: 'aurora',
    nombre: 'Aurora',
    nivelMinimo: 12,
    rareza: 'raro',
    descripcion: 'Cortinas de luz azul, violeta y turquesa.',
    css: 'radial-gradient(ellipse at 20% 0%,rgba(45,212,191,.45),transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(99,102,241,.5),transparent 60%),linear-gradient(135deg,#020617,#0f172a 45%,#1e1b4b)',
  },
  {
    id: 'cyberpunk',
    nombre: 'Cyberpunk',
    nivelMinimo: 14,
    rareza: 'raro',
    descripcion: 'Neones cian y magenta sobre una ciudad lluviosa.',
    css: 'repeating-linear-gradient(90deg,rgba(34,211,238,.08) 0 2px,transparent 2px 22px),radial-gradient(ellipse at 80% 20%,rgba(236,72,153,.5),transparent 55%),linear-gradient(135deg,#020617,#0e7490 55%,#4c1d95)',
  },
  {
    id: 'imperio',
    nombre: 'Imperio',
    nivelMinimo: 25,
    rareza: 'legendario',
    descripcion: 'Mármol negro, oro y luz de palacio.',
    css: 'radial-gradient(ellipse at 50% 0%,rgba(250,204,21,.35),transparent 55%),repeating-linear-gradient(120deg,rgba(255,255,255,.035) 0 1px,transparent 1px 26px),linear-gradient(135deg,#0c0a09,#3f2d12 55%,#171717)',
  },
  {
    id: 'oceano',
    nombre: 'Océano',
    nivelMinimo: 9,
    rareza: 'raro',
    descripcion: 'Azul profundo y cian con destellos marinos.',
    css: 'radial-gradient(ellipse at 70% 15%,rgba(103,232,249,.5),transparent 48%),radial-gradient(ellipse at 20% 90%,rgba(14,116,144,.45),transparent 60%),linear-gradient(135deg,#082f49,#0369a1 52%,#164e63)',
  },
  {
    id: 'eclipse',
    nombre: 'Eclipse',
    nivelMinimo: 18,
    rareza: 'epico',
    descripcion: 'Luna negra, plata y una corona violeta.',
    css: 'radial-gradient(circle at 72% 28%,#e2e8f0 0 6%,#64748b 8%,transparent 20%),radial-gradient(ellipse at 20% 100%,rgba(124,58,237,.4),transparent 55%),linear-gradient(135deg,#020617,#18181b 48%,#3b0764)',
  },
  {
    id: 'galaxia',
    nombre: 'Galaxia',
    nivelMinimo: 30,
    rareza: 'legendario',
    descripcion: 'Nebulosas, constelaciones y polvo de estrellas.',
    css: 'radial-gradient(circle at 18% 24%,#fff 0 1px,transparent 2px),radial-gradient(circle at 64% 18%,#ddd6fe 0 1px,transparent 2px),radial-gradient(circle at 82% 62%,#a5b4fc 0 1px,transparent 2px),radial-gradient(ellipse at 30% 80%,rgba(236,72,153,.4),transparent 55%),linear-gradient(135deg,#020617,#312e81 52%,#7c3aed)',
  },
  {
    id: 'fenix',
    nombre: 'Fénix',
    nivelMinimo: 35,
    rareza: 'legendario',
    descripcion: 'Plumas de fuego, oro y ceniza que vuelve a arder.',
    css: 'radial-gradient(ellipse at 50% 100%,rgba(251,146,60,.65),transparent 52%),radial-gradient(ellipse at 20% 20%,rgba(250,204,21,.35),transparent 50%),linear-gradient(135deg,#450a0a,#b91c1c 48%,#f59e0b)',
  },
  {
    id: 'hielo',
    nombre: 'Hielo celestial',
    nivelMinimo: 20,
    rareza: 'epico',
    descripcion: 'Cristal azul, plata y luz de invierno.',
    css: 'radial-gradient(circle at 22% 20%,rgba(255,255,255,.8) 0 1px,transparent 2px),radial-gradient(ellipse at 80% 30%,rgba(224,242,254,.5),transparent 50%),linear-gradient(135deg,#0f172a,#7dd3fc 55%,#a5b4fc)',
  },
  {
    id: 'dragon',
    nombre: 'Dragón',
    nivelMinimo: 16,
    rareza: 'raro',
    descripcion: 'Escamas oscuras, fuego y oro antiguo.',
    css: 'repeating-linear-gradient(135deg,rgba(250,204,21,.08) 0 1px,transparent 1px 18px),radial-gradient(ellipse at 80% 20%,rgba(239,68,68,.45),transparent 55%),linear-gradient(135deg,#1c1917,#7f1d1d 55%,#292524)',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    nivelMinimo: 10,
    rareza: 'raro',
    descripcion: 'Coral, naranja y violeta sobre el horizonte.',
    css: 'radial-gradient(ellipse at 50% 100%,rgba(251,146,60,.5),transparent 55%),linear-gradient(135deg,#fb923c 0%,#f43f5e 50%,#7c3aed 100%)',
  },
];

export const BANNER_PREDETERMINADO_ID = 'defecto';

/**
 * Nivel desde el que se puede subir un banner propio.
 *
 * La subida va a `community/{uid}/` con `uploadCommunityImage`, la
 * misma carpeta y reglas que los avatares: el GIF animado pasa si
 * es de verdad una imagen (ver `esImagenSegura` en
 * `storage.rules`), así que el "banner animado" no necesita nada
 * especial.
 */
export const BANNER_PROPIO_NIVEL = 3;

/** Prefijo con el que se guarda un banner de la lista. */
export const PREFIJO_BANNER = 'preset:';

export interface MarcoAvatar {
  id: string;
  nombre: string;
  nivelMinimo: number;
  rareza: Rareza;
  descripcion: string;
  /** Clase de anillo de respaldo. El efecto completo lo pinta `AvatarUsuario`. */
  clase: string;
}

export const MARCOS_AVATAR: MarcoAvatar[] = [
  {
    id: 'ninguno',
    nombre: 'Sin marco',
    nivelMinimo: 1,
    rareza: 'basico',
    descripcion: 'El avatar limpio, sin ornamentos.',
    clase: 'ring-zinc-800',
  },
  {
    id: 'neon',
    nombre: 'Neón',
    nivelMinimo: 5,
    rareza: 'raro',
    descripcion: 'Un anillo violeta con pulso de luz de neón.',
    clase: 'ring-violet-500/70 shadow-lg shadow-violet-500/30',
  },
  {
    id: 'dorado',
    nombre: 'Dorado',
    nivelMinimo: 10,
    rareza: 'epico',
    descripcion: 'Acabado dorado clásico, ya desbloqueado en tu cuenta.',
    clase: 'ring-amber-400/80 shadow-lg shadow-amber-500/30',
  },
  {
    id: 'oro-imperial',
    nombre: 'Oro imperial',
    nivelMinimo: 30,
    rareza: 'legendario',
    descripcion: 'Ornamentación de palacio, metales y reflejos de corona.',
    clase: 'ring-amber-300 shadow-[0_0_24px_rgba(250,204,21,.45)]',
  },
  {
    id: 'plata-celestial',
    nombre: 'Plata celestial',
    nivelMinimo: 18,
    rareza: 'raro',
    descripcion: 'Plata fría con pequeños destellos cristalinos.',
    clase: 'ring-slate-200/80 shadow-lg shadow-slate-200/20',
  },
  {
    id: 'cristal-real',
    nombre: 'Cristal real',
    nivelMinimo: 12,
    rareza: 'especial',
    descripcion: 'Bordes translúcidos y reflejos de vidrio pulido.',
    clase: 'ring-sky-200/70 shadow-lg shadow-sky-200/25',
  },
  {
    id: 'obsidiana',
    nombre: 'Obsidiana',
    nivelMinimo: 15,
    rareza: 'raro',
    descripcion: 'Piedra negra brillante con vetas violetas.',
    clase: 'ring-zinc-950 shadow-lg shadow-violet-950/60',
  },
  {
    id: 'sakura',
    nombre: 'Sakura',
    nivelMinimo: 8,
    rareza: 'especial',
    descripcion: 'Pétalos rosados flotando alrededor del avatar.',
    clase: 'ring-pink-300/80 shadow-lg shadow-pink-500/25',
  },
  {
    id: 'aura-magica',
    nombre: 'Aura mágica',
    nivelMinimo: 10,
    rareza: 'raro',
    descripcion: 'Energía violeta envolvente y partículas suaves.',
    clase: 'ring-fuchsia-400/70 shadow-lg shadow-fuchsia-500/30',
  },
  {
    id: 'dragon',
    nombre: 'Dragón',
    nivelMinimo: 22,
    rareza: 'epico',
    descripcion: 'Escamas, fuego y ornamentos de dragón antiguo.',
    clase: 'ring-red-500/80 shadow-lg shadow-orange-500/30',
  },
  {
    id: 'celestial',
    nombre: 'Celestial',
    nivelMinimo: 25,
    rareza: 'epico',
    descripcion: 'Estrellas y constelaciones alrededor del avatar.',
    clase: 'ring-indigo-300/80 shadow-lg shadow-indigo-400/30',
  },
  {
    id: 'llamas',
    nombre: 'Llamas',
    nivelMinimo: 14,
    rareza: 'raro',
    descripcion: 'Lenguas de fuego estilizadas y brasas.',
    clase: 'ring-orange-400/80 shadow-lg shadow-orange-500/35',
  },
  {
    id: 'espiritu',
    nombre: 'Espíritu',
    nivelMinimo: 20,
    rareza: 'raro',
    descripcion: 'Energía etérea, niebla y partículas luminosas.',
    clase: 'ring-teal-200/70 shadow-lg shadow-teal-300/25',
  },
  {
    id: 'cyberpunk',
    nombre: 'Cyberpunk',
    nivelMinimo: 6,
    rareza: 'raro',
    descripcion: 'Segmentos de neón cian y magenta.',
    clase: 'ring-cyan-400/80 shadow-lg shadow-fuchsia-500/30',
  },
  {
    id: 'holografico',
    nombre: 'Holográfico',
    nivelMinimo: 16,
    rareza: 'epico',
    descripcion: 'Reflejos multicolor de un holograma inestable.',
    clase: 'ring-cyan-200/70 shadow-lg shadow-violet-400/30',
  },
  {
    id: 'circuito-digital',
    nombre: 'Circuito digital',
    nivelMinimo: 9,
    rareza: 'especial',
    descripcion: 'Trazos de circuito y pulsos de datos.',
    clase: 'ring-emerald-300/70 shadow-lg shadow-emerald-400/25',
  },
  {
    id: 'nucleo-energetico',
    nombre: 'Núcleo energético',
    nivelMinimo: 18,
    rareza: 'raro',
    descripcion: 'Un núcleo futurista con descargas de energía.',
    clase: 'ring-sky-400/80 shadow-lg shadow-cyan-400/35',
  },
  {
    id: 'galaxia',
    nombre: 'Galaxia',
    nivelMinimo: 28,
    rareza: 'epico',
    descripcion: 'Nebulosas, estrellas y pequeños destellos.',
    clase: 'ring-violet-400/80 shadow-lg shadow-indigo-500/35',
  },
  {
    id: 'dimensional',
    nombre: 'Dimensional',
    nivelMinimo: 32,
    rareza: 'epico',
    descripcion: 'Planos superpuestos y profundidad de otro mundo.',
    clase: 'ring-purple-400/70 shadow-lg shadow-purple-500/35',
  },
  {
    id: 'cristales-flotantes',
    nombre: 'Cristales flotantes',
    nivelMinimo: 40,
    rareza: 'legendario',
    descripcion: 'Cristales decorativos que flotan alrededor del avatar.',
    clase: 'ring-cyan-200/80 shadow-lg shadow-cyan-300/35',
  },
  {
    id: 'eclipse',
    nombre: 'Eclipse',
    nivelMinimo: 24,
    rareza: 'epico',
    descripcion: 'Halo oscuro con reflejos violetas y plateados.',
    clase: 'ring-slate-400/70 shadow-lg shadow-violet-500/30',
  },
  {
    id: 'fenix',
    nombre: 'Fénix',
    nivelMinimo: 35,
    rareza: 'legendario',
    descripcion: 'Fuego dorado y plumas de energía renacida.',
    clase: 'ring-amber-300/80 shadow-lg shadow-orange-500/40',
  },
  {
    id: 'aura-violeta',
    nombre: 'Aura violeta',
    nivelMinimo: 26,
    rareza: 'epico',
    descripcion: 'Halo luminoso y destellos violetas.',
    clase: 'ring-violet-400 shadow-[0_0_28px_rgba(139,92,246,.5)]',
  },
  {
    id: 'dorado-imperial',
    nombre: 'Dorado imperial',
    nivelMinimo: 45,
    rareza: 'legendario',
    descripcion: 'La recompensa de prestigio: oro, palacio y corona.',
    clase: 'ring-amber-300 shadow-[0_0_32px_rgba(250,204,21,.55)]',
  },
];

export const MARCO_POR_DEFECTO: string | null = null;

/** El avatar rojo clásico se conserva tal cual. */
export const AVATAR_ROJO_CLASICO =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80';

/**
 * Avatares predeterminados nuevos, recortados de `public/img`.
 * El primero es la excepción roja que ya existía.
 */
export const AVATAR_PRESETS: string[] = [
  AVATAR_ROJO_CLASICO,
  ...Array.from(
    { length: 51 },
    (_, i) => `/img/avatars/avatar-${String(i + 1).padStart(2, '0')}.jpg`,
  ),
];

/** Límites. Los mira el editor, la validación y las reglas. */
export const MAX_INSIGNIAS_VISIBLES = 6;
export const MAX_DESTACADAS = 3;
export const MAX_NOMBRE_PERSONAJE = 60;
export const MAX_URL_IMAGEN_PERFIL = 500;

// ──────────────────────────────────────────────────────────
// RESOLUCIÓN (valores guardados → lo que se pinta)
// ──────────────────────────────────────────────────────────
//
// Todo con valores por defecto: una cuenta anterior a esta
// función no tiene ningún campo y se ve como la casa (banner y
// color por defecto, sin marco ni personaje). Si un valor
// guardado ya no existe o aún no está desbloqueado para ese
// nivel, también cae al defecto: nunca se pinta nada roto.

export function colorDePerfil(profileColor: string | undefined, level: number): string {
  const color = COLORES_PERFIL.find((c) => c.hex === (profileColor ?? '').toLowerCase());
  if (!color) return COLOR_POR_DEFECTO;
  if (level < color.nivelMinimo) return COLOR_POR_DEFECTO;
  return color.hex;
}

export type BannerResuelto =
  | { tipo: 'preset'; css: string }
  | { tipo: 'url'; url: string };

export function bannerDePerfil(
  bannerUrl: string | undefined,
  level: number,
): BannerResuelto {
  const porDefecto = BANNERS_PERFIL[0];
  if (!bannerUrl) return { tipo: 'preset', css: porDefecto.css };

  if (bannerUrl.startsWith(PREFIJO_BANNER)) {
    const preset = BANNERS_PERFIL.find(
      (b) => b.id === bannerUrl.slice(PREFIJO_BANNER.length),
    );
    if (!preset || level < preset.nivelMinimo) return { tipo: 'preset', css: porDefecto.css };
    return { tipo: 'preset', css: preset.css };
  }

  if (/^https:\/\//i.test(bannerUrl) && level >= BANNER_PROPIO_NIVEL) {
    return { tipo: 'url', url: bannerUrl };
  }

  return { tipo: 'preset', css: porDefecto.css };
}

export function marcoDeAvatar(avatarFrame: string | null | undefined, level: number): string {
  const base = MARCOS_AVATAR[0].clase;
  if (!avatarFrame) return base;
  const marco = MARCOS_AVATAR.find((m) => m.id === avatarFrame);
  if (!marco || level < marco.nivelMinimo) return base;
  return marco.clase;
}

/** Si un requisito de nivel está cumplido. Para los candados. */
export function desbloqueadoPorNivel(nivelMinimo: number, level: number): boolean {
  return level >= nivelMinimo;
}

/**
 * Arma el fondo tal cual se guarda en Firestore.
 *
 * Solo con claves DEFINIDAS: Firestore rechaza `undefined`
 * dentro de un mapa ("Unsupported field value: undefined"), así
 * que aquí no vale el atajo de `preset: x || undefined`. Sin
 * preset ni URL es null (campo ausente = fondo del sitio).
 */
export function fondoAGuardar(
  preset: string,
  url: string,
  position: string,
  dim: number,
): FondoPerfil | null {
  const p = (preset || '').trim();
  const u = (url || '').trim();
  if (!p && !u) return null;

  const fondo: FondoPerfil = {
    position: position === 'top' || position === 'bottom' ? position : 'center',
    dim: Number.isFinite(dim) ? Math.min(DIM_MAXIMO, Math.max(0, dim)) : 50,
  };
  if (p) fondo.preset = p;
  if (u) fondo.url = u;
  return fondo;
}

// ──────────────────────────────────────────────────────────
// FONDO DE PÁGINA (estilo Steam)
// ──────────────────────────────────────────────────────────
//
// El banner es la tira de la cabecera; el FONDO cubre la zona
// principal del perfil. Reutiliza la misma galería (los presets
// valen para los dos) más los ajustes propios: posición,
// oscurecido y subida personalizada (nivel 3, GIF animado
// incluido si es imagen de verdad).
//
// Se guarda en `profileBackground`: ausente o `preset:ninguno`
// es el fondo del sitio (cuentas antiguas, sin cambios).

export type PosicionFondo = 'center' | 'top' | 'bottom';

export const POSICIONES_FONDO: PosicionFondo[] = ['center', 'top', 'bottom'];

/** Oscurecido 0-80 (para que el texto se lea sobre el fondo). */
export const DIM_MAXIMO = 80;

export const FONDO_PREDETERMINADO_ID = 'ninguno';

export interface FondoPerfil {
  preset?: string;
  url?: string;
  position?: PosicionFondo;
  dim?: number;
}

export type FondoResuelto =
  | { tipo: 'ninguno' }
  | { tipo: 'preset'; css: string }
  | { tipo: 'url'; url: string; position: PosicionFondo; dim: number };

export function fondoDePerfil(
  fondo: FondoPerfil | undefined | null,
  level: number,
): FondoResuelto {
  if (!fondo) return { tipo: 'ninguno' };

  if (fondo.url && /^https:\/\//.test(fondo.url) && level >= BANNER_PROPIO_NIVEL) {
    const dim = typeof fondo.dim === 'number' ? Math.min(DIM_MAXIMO, Math.max(0, fondo.dim)) : 50;
    const position: PosicionFondo = POSICIONES_FONDO.includes(fondo.position as PosicionFondo)
      ? (fondo.position as PosicionFondo)
      : 'center';
    return { tipo: 'url', url: fondo.url, position, dim };
  }

  if (fondo.preset && fondo.preset !== FONDO_PREDETERMINADO_ID) {
    const preset = BANNERS_PERFIL.find((b) => b.id === fondo.preset);
    if (preset && level >= preset.nivelMinimo) return { tipo: 'preset', css: preset.css };
  }

  return { tipo: 'ninguno' };
}

// ──────────────────────────────────────────────────────────
// PEGATINAS Y DECORACIONES
// ──────────────────────────────────────────────────────────
//
// Sin assets nuevos: emoticonos (cero peso), imágenes subidas
// por el usuario e iconos de SUS medallas desbloqueadas (los
// pinta `MedalCard`, aquí solo viaja el id). Nada de HTML ni de
// URLs arbitrarias como decoración: `image` es https validado y
// `medal` tiene que estar desbloqueado de verdad.

export type TipoDecoracion = 'sticker' | 'image' | 'medal';
export type TamanoDecoracion = 's' | 'm' | 'l';

export interface Pegatina {
  id: string;
  emoji: string;
  nombre: string;
  nivelMinimo: number;
}

export const PEGATINAS: Pegatina[] = [
  { id: 'mando', emoji: '🎮', nombre: 'Mando', nivelMinimo: 1 },
  { id: 'marciano', emoji: '👾', nombre: 'Marcianito', nivelMinimo: 1 },
  { id: 'robot', emoji: '🤖', nombre: 'Robot', nivelMinimo: 1 },
  { id: 'dragon', emoji: '🐉', nombre: 'Dragón', nivelMinimo: 3 },
  { id: 'espadas', emoji: '⚔️', nombre: 'Espadas', nivelMinimo: 3 },
  { id: 'cohete', emoji: '🚀', nombre: 'Cohete', nivelMinimo: 5 },
  { id: 'ramen', emoji: '🍜', nombre: 'Ramen', nivelMinimo: 5 },
  { id: 'torii', emoji: '⛩️', nombre: 'Torii', nivelMinimo: 8 },
  { id: 'corona', emoji: '👑', nombre: 'Corona', nivelMinimo: 10 },
];

export const IDS_PEGATINAS: string[] = PEGATINAS.map((p) => p.id);

export interface Decoracion {
  id: string;
  kind: TipoDecoracion;
  /** Pegatina (`id`), imagen (URL https) o medalla (`id`). */
  ref: string;
  /** Posición en % sobre la zona de decoración (cabecera). */
  x: number;
  y: number;
  size: TamanoDecoracion;
}

/** Cuántas decoraciones como máximo (para no tapar el contenido). */
export const MAX_DECORACIONES = 6;

/** Tamaños en px (lado mayor). Con tope: nada tapa la cabecera. */
export const TAMANOS_DECORACION: Record<TamanoDecoracion, number> = { s: 40, m: 64, l: 96 };

/** Posiciones predefinidas (rejilla 3x3) para quien no quiera arrastrar. */
export const POSICIONES_PREDEFINIDAS: Array<{ id: string; nombre: string; x: number; y: number }> = [
  { id: 'sup-izq', nombre: 'Arriba izquierda', x: 6, y: 8 },
  { id: 'sup-cen', nombre: 'Arriba centro', x: 50, y: 8 },
  { id: 'sup-der', nombre: 'Arriba derecha', x: 94, y: 8 },
  { id: 'cen-izq', nombre: 'Centro izquierda', x: 6, y: 50 },
  { id: 'centro', nombre: 'Centro', x: 50, y: 50 },
  { id: 'cen-der', nombre: 'Centro derecha', x: 94, y: 50 },
  { id: 'inf-izq', nombre: 'Abajo izquierda', x: 6, y: 92 },
  { id: 'inf-cen', nombre: 'Abajo centro', x: 50, y: 92 },
  { id: 'inf-der', nombre: 'Abajo derecha', x: 94, y: 92 },
];

export function sujetarDecoracion(d: Decoracion): Decoracion {
  const x = Number.isFinite(d.x) ? Math.min(100, Math.max(0, d.x)) : 50;
  const y = Number.isFinite(d.y) ? Math.min(100, Math.max(0, d.y)) : 50;
  const size: TamanoDecoracion = d.size === 's' || d.size === 'm' || d.size === 'l' ? d.size : 'm';
  return { ...d, x: Math.round(x), y: Math.round(y), size };
}

// ──────────────────────────────────────────────────────────
// VITRINAS (showcases)
// ──────────────────────────────────────────────────────────
//
// Bloques que el dueño añade, ordena y quita. El nivel/XP, las
// estadísticas, la actividad y el contenido propio NO son
// vitrinas: son la identidad fija del perfil (como la cabecera
// fija de Steam) y siempre están. Las vitrinas son el resto.
//
// `showcases` guarda SOLO los ids en orden. Ausente = diseño de
// siempre (logros + destacadas), para no cambiarle el perfil a
// nadie por actualizar.

export type TipoVitrina =
  | 'personajes'
  | 'principal'
  | 'logros'
  | 'destacadas'
  | 'coleccion'
  | 'texto';

export interface Vitrina {
  id: TipoVitrina;
  nombre: string;
  descripcion: string;
  nivelMinimo: number;
}

export const VITRINAS: Vitrina[] = [
  { id: 'personajes', nombre: 'Personajes favoritos', descripcion: 'Varios personajes con imagen y serie', nivelMinimo: 1 },
  { id: 'principal', nombre: 'Personaje principal', descripcion: 'Un personaje a lo grande, con descripción', nivelMinimo: 1 },
  { id: 'logros', nombre: 'Logros', descripcion: 'Medallas y títulos conseguidos', nivelMinimo: 1 },
  { id: 'destacadas', nombre: 'Publicaciones destacadas', descripcion: 'Tus hilos fijados', nivelMinimo: 1 },
  { id: 'coleccion', nombre: 'Colección', descripcion: 'Series que te gustan', nivelMinimo: 3 },
  { id: 'texto', nombre: 'Texto personal', descripcion: 'Tu presentación y gustos', nivelMinimo: 1 },
];

/** Orden de siempre, para quien nunca tocó las vitrinas. */
export const VITRINAS_POR_DEFECTO: TipoVitrina[] = ['logros', 'destacadas'];

export const MAX_VITRINAS = 6;

/** Personajes de la vitrina (y de las decoraciones propias). */
export interface PersonajeFavorito {
  name: string;
  imageUrl: string;
  /** Serie a la que pertenece (opcional). */
  serie?: string;
}

export const MAX_PERSONAJES = 6;
export const MAX_SERIE_PERSONAJE = 60;
export const MAX_DESC_PERSONAJE = 140;
