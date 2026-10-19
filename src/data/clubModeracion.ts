import type {
  Club,
  ClubPermisos,
  ClubRango,
  ClubSancion,
  SancionEstado,
  SancionTipo,
} from '../types';

// ======================================================
// LÓGICA DE MODERACIÓN DE CLUBES (pura)
// ======================================================
//
// Jerarquía, permisos, plazos y formatos. Sin React y sin
// Firebase, para que se pueda probar con `npx tsx`.
//
// OJO, y es importante: aquí solo se decide qué se PINTA. La
// autoridad real la comprueban las reglas de Firestore (y, para
// lo que no se puede validar allí, una Cloud Function). Ocultar
// un botón nunca es una medida de seguridad: esto es la misma
// interfaz, no el candado.
// ======================================================

/**
 * Peso de cada rango. Mayor = más autoridad.
 *
 * Es un número y no un array para que "no puede tocar a alguien
 * de rango igual o superior" sea una comparación (`miRango > suRango`)
 * en vez de una lista que hay que mantener sincronizada.
 */
export const PESO_RANGO: Record<ClubRango, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
};

/** Etiqueta corta y emoji de cada cargo, para los distintivos. */
export const RANGO_META: Record<
  ClubRango,
  { etiqueta: string; emoji: string; clase: string }
> = {
  owner: {
    etiqueta: 'Propietario',
    emoji: '👑',
    clase: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  },
  admin: {
    etiqueta: 'Admin',
    emoji: '🛡️',
    clase: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  },
  moderator: {
    etiqueta: 'Moderador',
    emoji: '🔨',
    clase: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  },
  member: { etiqueta: '', emoji: '', clase: '' },
};

/**
 * Rango de una persona DENTRO de un club.
 *
 * Se lee de `ownerId`, `adminIds` y `moderatorIds`, nunca de
 * `members[uid].role`: ese campo es un reflejo que el cliente
 * puede escribir, y las reglas tampoco lo miran. Si no aparece
 * en ninguno de los tres, es miembro normal.
 */
export function rangoEnClub(club: Club | null | undefined, uid: string | null | undefined): ClubRango | null {
  if (!club || !uid) return null;
  if (club.ownerId === uid) return 'owner';
  if (club.moderatorIds?.includes(uid)) return 'moderator';
  if (club.adminIds?.includes(uid)) return 'admin';
  return 'member';
}

/**
 * Permisos delegables: los que el propietario puede activar o
 * desactivar.
 *
 * `porDefecto` es lo que pasa cuando el club NO guarda ese
 * permiso. Importa distinguir «no está» de «está en false»:
 * lo primero usa el valor por defecto, lo segundo lo apaga a
 * propósito. Por eso `permisosDe` mira si la clave EXISTE.
 */
export const PERMISOS_DELEGABLES: {
  id: keyof ClubPermisos;
  etiqueta: string;
  descripcion: string;
  /**
   * A qué rol se le concede.
   *
   * Habla el MISMO idioma que `ClubRango` ('moderator'), no el
   * del texto: si se mezclaran, la comparación con el rango del
   * actor no casaría nunca y ningún moderador podría recibir un
   * permiso.
   */
  para: 'moderator' | 'admin';
  porDefecto: boolean;
}[] = [
  {
    id: 'moderadorBanea',
    etiqueta: 'Moderadores pueden banear',
    descripcion: 'Aplicar baneos temporales. El baneo permanente nunca les corresponde.',
    para: 'moderator',
    porDefecto: false,
  },
  {
    id: 'moderadorLevanta',
    etiqueta: 'Moderadores levantan sanciones ajenas',
    descripcion: 'Quitar sanciones que aplicaron otros moderadores. Las suyas siempre puede quitarlas.',
    para: 'moderator',
    porDefecto: false,
  },
  {
    id: 'moderadorRetiraMensajes',
    etiqueta: 'Moderadores retiran mensajes',
    descripcion: 'Borrar mensajes de otros que incumplan las normas del club.',
    para: 'moderator',
    porDefecto: true,
  },
  {
    id: 'moderadorAdvierte',
    etiqueta: 'Moderadores pueden advertir',
    descripcion: 'Avisar a alguien sin llegar a sanctionarlo. Queda registrado en el historial.',
    para: 'moderator',
    porDefecto: true,
  },
  {
    id: 'moderadorGestionaCanales',
    etiqueta: 'Moderadores gestionan canales',
    descripcion: 'Crear, editar, ordenar y eliminar canales del club.',
    para: 'moderator',
    porDefecto: false,
  },
  {
    id: 'adminBaneaPermanente',
    etiqueta: 'Admins pueden banear permanentemente',
    descripcion: 'Banear sin fecha de fin. Es la decisión más grave del club, así que va apagada por defecto.',
    para: 'admin',
    porDefecto: false,
  },
  {
    id: 'adminEditaAspecto',
    etiqueta: 'Admins editan el aspecto del club',
    descripcion: 'Cambiar nombre, descripción, icono, banner y normas del club.',
    para: 'admin',
    porDefecto: false,
  },
  {
    id: 'adminGestionaCanales',
    etiqueta: 'Admins gestionan canales',
    descripcion: 'Crear, editar, ordenar y eliminar canales del club.',
    para: 'admin',
    porDefecto: false,
  },
  {
    id: 'adminLevanta',
    etiqueta: 'Admins levantan sanciones de moderadores',
    descripcion: 'Quitar sanciones aplicadas por moderadores. Las de otro admin o las del propietario nunca.',
    para: 'admin',
    porDefecto: true,
  },
  {
    id: 'adminExpulsa',
    etiqueta: 'Admins expulsan miembros',
    descripcion: 'Quitar a alguien del club y quitarle el acceso al chat.',
    para: 'admin',
    porDefecto: true,
  },
  {
    id: 'adminFijaMensajes',
    etiqueta: 'Admins fijan mensajes',
    descripcion: 'Marcar un mensaje como importante para que el club lo tenga a mano.',
    para: 'admin',
    porDefecto: true,
  },
];

/**
 * Permisos efectivos del club, rellenando los que no guarda.
 *
 * Un permiso ausente usa su valor por defecto; uno presente en
 * `false` está apagado a propósito. Esa diferencia es la que
 * permite al propietario «quitar» un permiso que venía activado.
 */
export function permisosDe(club: Club): Required<ClubPermisos> {
  const p = (club.permisos ?? {}) as Record<string, unknown>;
  const valor = (id: keyof ClubPermisos, porDefecto: boolean): boolean => {
    const info = PERMISOS_DELEGABLES.find((x) => x.id === id);
    const def = info ? info.porDefecto : porDefecto;
    return id in p ? p[id] === true : def;
  };

  return {
    moderadorBanea: valor('moderadorBanea', false),
    moderadorLevanta: valor('moderadorLevanta', false),
    moderadorRetiraMensajes: valor('moderadorRetiraMensajes', true),
    moderadorAdvierte: valor('moderadorAdvierte', true),
    moderadorGestionaCanales: valor('moderadorGestionaCanales', false),
    adminBaneaPermanente: valor('adminBaneaPermanente', false),
    adminEditaAspecto: valor('adminEditaAspecto', false),
    adminGestionaCanales: valor('adminGestionaCanales', false),
    adminLevanta: valor('adminLevanta', true),
    adminExpulsa: valor('adminExpulsa', true),
    adminFijaMensajes: valor('adminFijaMensajes', true),
  };
}

/**
 * Si `actorUid` puede hacer esta cosa en ESTE club.
 *
 * Es la pregunta que hace la interfaz antes de pintar un
 * botón. La respuesta real la dan las reglas de Firestore, que
 * aplican los mismos valores por defecto: esto es la misma
 * respuesta, no la seguridad.
 *
 * Lo que NO se puede delegar nunca, ni con todos los permisos
 * activated: la propiedad del club, el reparto de roles
 * superiores, la eliminación del club y los permisos globales
 * de la web.
 */
export function puedeHacer(
  club: Club,
  actorUid: string,
  permiso: keyof ClubPermisos,
): { ok: boolean; motivo?: string } {
  const rango = rangoEnClub(club, actorUid);
  if (!rango || rango === 'member') {
    return { ok: false, motivo: 'Solo el equipo del club puede hacer esto.' };
  }
  // El dueño lo puede todo: es el que reparte los permisos.
  if (rango === 'owner') return { ok: true };

  const p = permisosDe(club);
  if (!p[permiso]) {
    const info = PERMISOS_DELEGABLES.find((x) => x.id === permiso);
    return {
      ok: false,
      motivo: `El propietario no te ha dado este permiso (${info?.etiqueta ?? permiso}).`,
    };
  }
  // Y el permiso solo vale para el rango al que se le concede.
  const info = PERMISOS_DELEGABLES.find((x) => x.id === permiso);
  if (info && info.para !== rango) {
    return {
      ok: false,
      motivo: `Este permiso es para ${
        info.para === 'admin' ? 'los administradores' : 'los moderadores'
      }.`,
    };
  }
  return { ok: true };
}

/**
 * Si `actorUid` puede ADVERTIR a alguien en este club.
 *
 * Un aviso no bloquea nada, así que es menos grave que una
 * sanción: el dueño siempre puede, y un moderador con el
 * permiso `moderadorAdvierte` (encendido de serie).
 */
export function puedeAdvertir(club: Club, actorUid: string): boolean {
  const rango = rangoEnClub(club, actorUid);
  if (!rango || rango === 'member') return false;
  if (rango === 'owner') return true;
  if (rango === 'admin') return true;
  return permisosDe(club).moderadorAdvierte;
}

/** `true` si la persona es parte del equipo (dueño, admin o mod). */
export function esEquipo(club: Club, uid: string | null | undefined): boolean {
  const r = rangoEnClub(club, uid);
  return r === 'owner' || r === 'admin' || r === 'moderator';
}

/**
 * Si `actorUid` puede(open) `objetivoUid` en este club.
 *
 * Tres barreras, en este orden:
 *
 *   1. Que el sancionado esté en el club (si no, no hay a quién).
 *   2. Que el sancionado sea de rango ESTRICTAMENTE inferior. Por
 *      eso un moderador no puede tocar a otro moderador, un admin no
 *      puede tocar a otro admin y nadie (ni el dueño) puede
 *      sancionarse a sí mismo.
 *   3. Que el actor pueda aplicar este TIPO de sanción: un
 *      moderador solo banea si el propietario se lo permite, y
 *      nunca con baneo permanente salvo permiso explícito.
 */
export function puedeSancionar(
  club: Club,
  actorUid: string,
  objetivoUid: string,
  tipo: SancionTipo,
  permanente: boolean,
): { ok: boolean; motivo?: string } {
  const actor = rangoEnClub(club, actorUid);
  const objetivo = rangoEnClub(club, objetivoUid);

  if (!actor || actor === 'member') {
    return { ok: false, motivo: 'Solo el equipo del club puede aplicar sanciones.' };
  }
  if (objetivo === null) {
    return { ok: false, motivo: 'Esa persona ya no es miembro del club.' };
  }
  if (actorUid === objetivoUid) {
    return { ok: false, motivo: 'No puedes aplicarte una sanción a ti mismo.' };
  }
  if (PESO_RANGO[objetivo] >= PESO_RANGO[actor]) {
    return {
      ok: false,
      motivo: `No puedes sancionar a alguien de rango igual o superior (${objetivo}).`,
    };
  }

  // Qué tipo de sanción puede aplicar este actor:
  //
  //   · moderador → baneo temporal solo con `moderadorBanea`.
  //     El permanente NUNCA: ni con todos los permisos.
  //   · admin     → baneo permanente solo con
  //     `adminBaneaPermanente`; el temporal con `moderadorBanea`
  //     no le hace falta (un admin banea por defecto).
  //   · dueño     → todo.
  const p = permisosDe(club);
  if (actor === 'moderator') {
    if (tipo === 'baneo' && !p.moderadorBanea) {
      return {
        ok: false,
        motivo: 'El propietario no ha habilitado el baneo a los moderadores.',
      };
    }
    if (tipo === 'baneo' && permanente) {
      return {
        ok: false,
        motivo: 'El baneo permanente no corresponde a los moderadores.',
      };
    }
  }
  if (actor === 'admin' && tipo === 'baneo' && permanente && !p.adminBaneaPermanente) {
    return {
      ok: false,
      motivo: 'El propietario no ha habilitado el baneo permanente a los administradores.',
    };
  }

  // Un silencio nunca es permanente, para nadie: sin fecha de fin
  // sería un baneo sin expulsar del club. Se comprueba aquí
  // también (y no solo en `calcularFin`) para que el botón y las
  // reglas digan exactamente lo mismo.
  if (tipo === 'silencio' && permanente) {
    return {
      ok: false,
      motivo: 'Un silencio siempre tiene fecha de fin; elige una duración.',
    };
  }

  return { ok: true };
}

/**
 * Si `actorUid` puede levantar una sanción concreta.
 *
 * No basta con ser del equipo: nadie levanta una sanción aplicada
 * por alguien de rango igual o superior (un admin no toca lo de
 * otro admin; el dueño es el único que puede deshacer cualquier
 * cosa, y los moderadores solo lo que el propietario habilite).
 */
export function puedeLevantar(
  club: Club,
  actorUid: string,
  sancion: Pick<ClubSancion, 'aplicadaPor' | 'aplicadaPorRango'>,
): { ok: boolean; motivo?: string } {
  const actor = rangoEnClub(club, actorUid);
  if (!actor || actor === 'member') {
    return { ok: false, motivo: 'Solo el equipo del club puede levantar sanciones.' };
  }
  if (sancion.aplicadaPor === actorUid) return { ok: true };

  const pesoActor = PESO_RANGO[actor];
  const pesoQuienPuso = PESO_RANGO[sancion.aplicadaPorRango];

  // Rango SUPERIOR es el bloqueo duro: nadie deshace lo de un
  // superior, ni con permisos. Un admin no toca lo de otro admin.
  if (pesoActor < pesoQuienPuso) {
    return {
      ok: false,
      motivo: `No puedes levantar una sanción aplicada por alguien de rango superior (${sancion.aplicadaPorRango}).`,
    };
  }

  // Mismo rango: aquí decide el permiso que el propietario haya
  // dejado a los moderadores. Sin él, un moderador solo levanta
  // la suya, que es lo que se comprueba arriba.
  if (pesoActor === pesoQuienPuso && actor === 'moderator') {
    if (!permisosDe(club).moderadorLevanta) {
      return {
        ok: false,
        motivo:
          'El propietario no ha habilitado a los moderadores a levantar sanciones de otros moderadores.',
      };
    }
  }

  // Rango inferior (un admin levantando la de un moderador):
  // el propietario puede quitarle esa capacidad al admin.
  if (pesoActor > pesoQuienPuso && actor === 'admin') {
    if (!permisosDe(club).adminLevanta) {
      return {
        ok: false,
        motivo:
          'El propietario no ha habilitado a los administradores a levantar sanciones de moderadores.',
      };
    }
  }

  return { ok: true };
}

/** Duraciones ofrecidas en el diálogo. `null` = permanente. */
export const DURACIONES_SANCION: { id: string; nombre: string; ms: number | null }[] = [
  { id: '5m', nombre: '5 minutos', ms: 5 * 60_000 },
  { id: '15m', nombre: '15 minutos', ms: 15 * 60_000 },
  { id: '30m', nombre: '30 minutos', ms: 30 * 60_000 },
  { id: '1h', nombre: '1 hora', ms: 60 * 60_000 },
  { id: '6h', nombre: '6 horas', ms: 6 * 60 * 60_000 },
  { id: '12h', nombre: '12 horas', ms: 12 * 60 * 60_000 },
  { id: '24h', nombre: '24 horas', ms: 24 * 60 * 60_000 },
  { id: '3d', nombre: '3 días', ms: 3 * 24 * 60 * 60_000 },
  { id: '7d', nombre: '7 días', ms: 7 * 24 * 60 * 60_000 },
  { id: '30d', nombre: '30 días', ms: 30 * 24 * 60 * 60_000 },
  { id: 'permanente', nombre: 'Permanente', ms: null },
];

/** Tope del motivo. El mismo número que comprueban las reglas. */
export const MOTIVO_MAX = 500;
export const MOTIVO_MIN = 5;

/**
 * Duración personalizada en minutos → milisegundos.
 *
 * Devuelve `null` si no es válida, para que el diálogo pueda
 * avisar en vez de crear una sanción sin caducidad por error
 * (un silencio sin fin sería un baneo disfrazado).
 */
export function minutosAMs(minutos: number): number | null {
  if (!Number.isFinite(minutos) || !Number.isInteger(minutos)) return null;
  if (minutos < 1) return null;
  // Un año es el tope: evita «999999» que dejaría a alguien
  // fuera del club hasta dentro de mil años por una errata.
  if (minutos > 525_600) return null;
  return minutos * 60_000;
}

/**
 * Estado visible de una sanción en el instante `ahora`.
 *
 * Una sanción retirada manda sobre todo lo demás, y una
 * expirada por tiempo se distingue de la activa para que el
 * panel pueda filtrar sin tener que recalcular nada.
 */
export function estadoDe(sancion: ClubSancion, ahora: number = Date.now()): SancionEstado {
  if (sancion.retirada) return 'retirada';
  // Un aviso no es una sanción: no bloquea nada y no caduca, así
  // que nunca está «activo». Se muestra como caducado, que es
  // como aparece en el historial: un hecho, no una medida.
  if (sancion.tipo === 'advertencia') return 'expirada';
  if (!sancion.permanente && sancion.fin) {
    const fin = Date.parse(sancion.fin);
    if (Number.isFinite(fin) && fin <= ahora) return 'expirada';
  }
  return 'activa';
}

/**
 * Fin calculado de una sanción a partir de los milisegundos.
 *
 * Un silencio NUNCA es permanente: si no se pasa `ms`, se cae en
 * 24 horas. Un baneo sí puede serlo (`ms === null`).
 */
export function calcularFin(ms: number | null, tipo: SancionTipo, desde: number = Date.now()) {
  if (tipo === 'baneo' && ms === null) return { fin: null, permanente: true };
  const duracion = ms ?? 24 * 60 * 60_000;
  return { fin: new Date(desde + duracion).toISOString(), permanente: false };
}

/**
 * ¿La sanción le impide escribir AHORA MISMO?
 *
 * Es la misma condición que comprueban las reglas, con la misma
 * regla de expiración: contra la fecha de fin, no contra un
 * contador del navegador. Por eso cerrar y abrir la sesión no
 * cambia nada.
 */
export function bloqueaEscritura(sancion: ClubSancion, ahora: number = Date.now()): boolean {
  return estadoDe(sancion, ahora) === 'activa';
}

/**
 * Fecha en el formato que ve la persona sancionada.
 *
 * `es-ES` con hora de España: el texto es el que la persona lee
 * («20/10/2026 a las 18:30»), no un ISO crudo ni un id de
 * Firestore.
 */
export function fechaLegible(iso: string | null | undefined): string {
  if (!iso) return 'sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'sin fecha';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Texto del aviso para la persona sancionada.
 *
 * Sin identificadores técnicos ni datos de otros miembros: solo
 * el tipo, el motivo y cuándo termina.
 */
export function avisoDeSancion(sancion: ClubSancion): string {
  const fecha = fechaLegible(sancion.fin);
  if (sancion.tipo === 'baneo') {
    return sancion.permanente
      ? `No puedes participar en este club porque tienes una sanción permanente. Motivo: ${sancion.motivo}`
      : `No puedes participar en este club hasta el ${fecha}. Motivo: ${sancion.motivo}`;
  }
  return `Has sido silenciado en este club hasta el ${fecha}. Motivo: ${sancion.motivo}`;
}

/** Sanciones de un usuario, de la más reciente a la más antigua. */
export function ordenarSanciones(lista: ClubSancion[]): ClubSancion[] {
  return [...lista].sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
}

/**
 * Filtro del panel: texto libre (nombre o motivo) y estado.
 *
 * `'todas'` incluye también las expiradas, que se conservan para
 * la trazabilidad pero ya no bloquean nada.
 */
export function filtrarSanciones(
  lista: ClubSancion[],
  texto: string,
  estado: SancionEstado | 'todas',
  ahora: number = Date.now(),
): ClubSancion[] {
  const q = texto.trim().toLowerCase();
  return ordenarSanciones(lista).filter((s) => {
    if (estado !== 'todas' && estadoDe(s, ahora) !== estado) return false;
    if (!q) return true;
    return (
      s.objetivoNombre.toLowerCase().includes(q) ||
      s.motivo.toLowerCase().includes(q) ||
      s.aplicadaPorNombre.toLowerCase().includes(q)
    );
  });
}

/** Motivo limpio, o `null` si no cumple lo mínimo. */
export function motivoValido(motivo: string): string | null {
  const limpio = motivo.trim().replace(/\s+/g, ' ');
  if (limpio.length < MOTIVO_MIN) return null;
  return limpio.slice(0, MOTIVO_MAX);
}