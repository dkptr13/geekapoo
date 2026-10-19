/**
 * Moderación de clubes: jerarquía, permisos, plazos y formatos.
 *
 * Lógica pura de `src/data/clubModeracion.ts`, sin React ni
 * Firebase. Es la parte que decide qué se PINTA; la que decide
 * qué se PERMITE son las reglas de Firestore, y aquí se
 * comprueba que ambasdigieren lo mismo para que un botón
 * deshabilitado no esté mintiendo.
 *
 *   npx tsx tests/logica.club-moderacion.ts
 */
import assert from 'node:assert/strict';

import {
  PESO_RANGO,
  RANGO_META,
  calcularFin,
  estadoDe,
  fechaLegible,
  filtrarSanciones,
  minutosAMs,
  motivoValido,
  puedeAdvertir,
  puedeHacer,
  puedeLevantar,
  puedeSancionar,
  permisosDe,
  rangoEnClub,
  DURACIONES_SANCION,
  MOTIVO_MAX,
} from '../src/data/clubModeracion.ts';
import type { Club, ClubSancion } from '../src/types/index.ts';

const DUE = 'due';
const ADMIN = 'admin';
const MOD = 'mod';
const OTRO_MOD = 'mod2';
const M1 = 'm1';
const M2 = 'm2';

const club: Club = {
  id: 'club',
  slug: 'club',
  name: 'Club',
  description: 'Un club de prueba',
  category: 'anime-manga',
  accessType: 'public',
  ownerId: DUE,
  moderatorIds: [MOD, OTRO_MOD],
  adminIds: [ADMIN],
  members: {
    [DUE]: { uid: DUE, role: 'owner', joinedAt: '2024-01-01T00:00:00.000Z' },
    [ADMIN]: { uid: ADMIN, role: 'admin', joinedAt: '2024-01-01T00:00:00.000Z' },
    [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2024-01-01T00:00:00.000Z' },
    [OTRO_MOD]: { uid: OTRO_MOD, role: 'moderator', joinedAt: '2024-01-01T00:00:00.000Z' },
    [M1]: { uid: M1, role: 'member', joinedAt: '2024-01-01T00:00:00.000Z' },
    [M2]: { uid: M2, role: 'member', joinedAt: '2024-01-01T00:00:00.000Z' },
  },
  memberCount: 6,
  chatId: 'chat',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ── 1. El cargo sale de los arrays, no de `members[].role` ──
assert.equal(rangoEnClub(club, DUE), 'owner');
assert.equal(rangoEnClub(club, ADMIN), 'admin');
assert.equal(rangoEnClub(club, MOD), 'moderator');
assert.equal(rangoEnClub(club, M1), 'member');
// Fuera del club: null, no "member". La diferencia importa al
// sanctionar: no se puede sancionar a alguien que no es miembro.
assert.equal(rangoEnClub(club, 'nadie'), 'member');
assert.equal(rangoEnClub(club, null), null);

// Un club viejo sin `adminIds` (la clave no existe) NO debe
// reventar: se trata como si nadie fuera admin.
const clubViejo = { ...club } as Club;
delete (clubViejo as { adminIds?: string[] }).adminIds;
assert.equal(rangoEnClub(clubViejo, DUE), 'owner');
assert.equal(rangoEnClub(clubViejo, MOD), 'moderator');
assert.equal(rangoEnClub(clubViejo, ADMIN), 'member');

// Y si el ROL dice admin pero el array no, manda el array: es
// lo que leen las reglas.
const clubFalso = {
  ...club,
  members: { ...club.members, [M1]: { ...club.members[M1], role: 'admin' as const } },
};
assert.equal(rangoEnClub(clubFalso, M1), 'member');

// ── 2. La jerarquía es ordenable ──
assert.ok(PESO_RANGO.owner > PESO_RANGO.admin);
assert.ok(PESO_RANGO.admin > PESO_RANGO.moderator);
assert.ok(PESO_RANGO.moderator > PESO_RANGO.member);

// ── 3. Quién puede sancionar a quién (casos 8 y 9) ──
// Un miembro normal no puede sancionar a nadie.
assert.equal(puedeSancionar(club, M1, M2, 'silencio', false).ok, false);
assert.equal(puedeSancionar(club, M1, M2, 'baneo', false).ok, false);
// Tampoco a sí mismo.
assert.equal(puedeSancionar(club, MOD, MOD, 'silencio', false).ok, false);
// Ni a alguien de su rango o superior (caso 9).
assert.equal(puedeSancionar(club, MOD, OTRO_MOD, 'silencio', false).ok, false);
assert.equal(puedeSancionar(club, ADMIN, DUE, 'silencio', false).ok, false);
// El dueño está POR ENCIMA del admin, así que sí puede
// sanctionarlo: es lo que permite deshacer un exceso de un admin.
assert.equal(puedeSancionar(club, DUE, ADMIN, 'silencio', false).ok, true);
// Pero el dueño no puede sancionarse a sí mismo.
assert.equal(puedeSancionar(club, DUE, DUE, 'silencio', false).ok, false);

// Un moderador sí puede silenciar a un miembro.
assert.equal(puedeSancionar(club, MOD, M1, 'silencio', false).ok, true);
// Pero NO banear: el propietario no se lo ha habilitado.
assert.equal(puedeSancionar(club, MOD, M1, 'baneo', false).ok, false);

// Con el permiso dado, sí.
const clubConBaneo = {
  ...club,
  permisos: { moderadorBanea: true, moderadorBaneoPermanente: false },
};
assert.equal(puedeSancionar(clubConBaneo, MOD, M1, 'baneo', false).ok, true);
// El permanente sigue reservado aunque pueda banear.
assert.equal(puedeSancionar(clubConBaneo, MOD, M1, 'baneo', true).ok, false);
assert.equal(puedeSancionar(club, MOD, M1, 'silencio', true).ok, false);

// Un admin puede banear, pero el PERMANENTE depende de un
// permiso que el propietario concede (viene apagado). El dueño
// siempre puede.
assert.equal(puedeSancionar(club, ADMIN, M1, 'baneo', false).ok, true);
assert.equal(puedeSancionar(club, ADMIN, M1, 'baneo', true).ok, false);
assert.equal(puedeSancionar(club, DUE, M1, 'baneo', true).ok, true);

// ── 4. Levantar sanciones ──
const sanctionDe = (actor: string, rango: ClubSancion['aplicadaPorRango']) =>
  ({ aplicadaPor: actor, aplicadaPorRango: rango }) as Pick<
    ClubSancion,
    'aplicadaPor' | 'aplicadaPorRango'
  >;

// Cada uno levanta la suya.
assert.equal(puedeLevantar(club, MOD, sanctionDe(MOD, 'moderator')).ok, true);
assert.equal(puedeLevantar(club, ADMIN, sanctionDe(ADMIN, 'admin')).ok, true);
// Un admin no levanta la de otro admin.
assert.equal(puedeLevantar(club, ADMIN, sanctionDe(OTRO_MOD, 'moderator')).ok, true);
assert.equal(puedeLevantar(club, OTRO_MOD, sanctionDe(ADMIN, 'admin')).ok, false);
// Un moderador no levanta la de otro sin permiso.
assert.equal(puedeLevantar(club, OTRO_MOD, sanctionDe(MOD, 'moderator')).ok, false);
assert.equal(
  puedeLevantar(clubConBaneo, OTRO_MOD, sanctionDe(MOD, 'moderator')).ok,
  false,
);
assert.equal(
  puedeLevantar({ ...clubConBaneo, permisos: { moderadorLevanta: true } }, OTRO_MOD, sanctionDe(MOD, 'moderator')).ok,
  true,
);
// El dueño puede deshacer cualquier cosa (caso 5).
assert.equal(puedeLevantar(club, DUE, sanctionDe(OTRO_MOD, 'moderator')).ok, true);

// ── 5. Un silencio NUNCA es permanente (caso 3) ──
const inicio = Date.parse('2026-10-20T10:00:00.000Z');
const fin1h = calcularFin(60 * 60_000, 'silencio', inicio);
assert.equal(fin1h.permanente, false);
assert.equal(fin1h.fin, '2026-10-20T11:00:00.000Z');
// Si se pide permanente para un silencio, cae a 24 h en vez de
// quedarse sin caducidad.
const silencioForzado = calcularFin(null, 'silencio', inicio);
assert.equal(silencioForzado.permanente, false);
assert.equal(silencioForzado.fin, '2026-10-21T10:00:00.000Z');
// El baneo sí puede ser permanente.
assert.equal(calcularFin(null, 'baneo', inicio).permanente, true);
assert.equal(calcularFin(null, 'baneo', inicio).fin, null);
assert.equal(calcularFin(60_000, 'baneo', inicio).fin, '2026-10-20T10:01:00.000Z');

// ── 6. La caducidad se decide por fecha, no por reloj (caso 3) ──
const base: ClubSancion = {
  id: 's1',
  clubId: 'club',
  tipo: 'silencio',
  objetivoUid: M1,
  objetivoNombre: 'M1',
  motivo: 'Motivo de prueba',
  inicio: '2026-10-20T10:00:00.000Z',
  fin: '2026-10-20T11:00:00.000Z',
  permanente: false,
  aplicadaPor: MOD,
  aplicadaPorNombre: 'Mod',
  aplicadaPorRango: 'moderator',
  retirada: false,
  createdAt: '2026-10-20T10:00:00.000Z',
};
assert.equal(estadoDe(base, Date.parse('2026-10-20T10:30:00.000Z')), 'activa');
// Justo al llegar la hora, ya caducó: bloquea hasta ese instante.
assert.equal(estadoDe(base, Date.parse('2026-10-20T11:00:00.000Z')), 'expirada');
assert.equal(estadoDe(base, Date.parse('2026-10-20T23:59:00.000Z')), 'expirada');
// Caducada sigue caducada aunque se reinicie la sesión: el
// estado no depende de ningún contador en memoria.
assert.equal(estadoDe(base, Date.parse('2027-01-01T00:00:00.000Z')), 'expirada');
// Retirada manda sobre todo lo demás.
assert.equal(estadoDe({ ...base, retirada: true }, inicio), 'retirada');
// Un permanente no caduca nunca por tiempo.
assert.equal(
  estadoDe({ ...base, fin: null, permanente: true, tipo: 'baneo' }, inicio + 1e12),
  'activa',
);

// ── 7. Motivo obligatorio y acotado (caso 6) ──
assert.equal(motivoValido('hola'), null);
assert.equal(motivoValido('  '), null);
assert.equal(motivoValido('   a   '), null);
assert.equal(motivoValido('  insults  '), 'insults');
const largo = 'x'.repeat(MOTIVO_MAX + 50);
assert.equal(motivoValido(largo)?.length, MOTIVO_MAX);
// Colapsa espacios: el motivo que se guarda es el que se leyó.
assert.equal(motivoValido('insultos   repetidos\n a  otros'), 'insultos repetidos a otros');

// ── 8. Duración personalizada validada ──
assert.equal(minutosAMs(5), 300_000);
assert.equal(minutosAMs(0), null);
assert.equal(minutosAMs(-1), null);
assert.equal(minutosAMs(1.5), null);
assert.equal(minutosAMs(NaN), null);
assert.equal(minutosAMs(525_601), null);
assert.equal(minutosAMs(525_600), 525_600 * 60_000);
// El catálogo ofrece todo lo pedido, incluido el permanente.
const ids = DURACIONES_SANCION.map((d) => d.id);
for (const id of ['5m', '15m', '30m', '1h', '6h', '12h', '24h', '3d', '7d', '30d', 'permanente']) {
  assert.ok(ids.includes(id), `falta la duración ${id}`);
}

// ── 9. Aviso con motivo y fecha (caso 6) ──
const texto = fechaLegible('2026-10-20T16:30:00.000Z');
assert.ok(texto.includes('2026'), 'la fecha debe traer el año');
assert.ok(!texto.includes('undefined'), 'no puede quedar un undefined');
assert.equal(fechaLegible(null), 'sin fecha');
assert.equal(fechaLegible('no-es-fecha'), 'sin fecha');

// ── 10. El panel filtra y ordena ──
const lista: ClubSancion[] = [
  { ...base, id: 'a', inicio: '2026-01-01T00:00:00.000Z', fin: '2026-01-02T00:00:00.000Z' },
  {
    ...base,
    id: 'b',
    retirada: true,
    inicio: '2026-05-01T00:00:00.000Z',
    motivo: 'Flood en el canal de teorias',
  },
  {
    ...base,
    id: 'c',
    tipo: 'baneo',
    fin: null,
    permanente: true,
    inicio: '2026-03-01T00:00:00.000Z',
  },
];
const ahora = Date.parse('2026-06-01T00:00:00.000Z');
// La más reciente primero (b=mayo, c=marzo, a=enero).
assert.deepEqual(
  filtrarSanciones(lista, '', 'todas', ahora).map((s) => s.id),
  ['b', 'c', 'a'],
);
assert.deepEqual(
  filtrarSanciones(lista, '', 'activa', ahora).map((s) => s.id),
  ['c'],
);
assert.deepEqual(
  filtrarSanciones(lista, '', 'retirada', ahora).map((s) => s.id),
  ['b'],
);
assert.deepEqual(
  filtrarSanciones(lista, '', 'expirada', ahora).map((s) => s.id),
  ['a'],
);
// Búsqueda por nombre, por motivo y por moderador.
assert.equal(filtrarSanciones(lista, 'Flood', 'todas', ahora).length, 1);
assert.equal(filtrarSanciones(lista, 'm1', 'todas', ahora).length, 3);
assert.equal(filtrarSanciones(lista, 'mod', 'todas', ahora).length, 3);
assert.equal(filtrarSanciones(lista, 'nada', 'todas', ahora).length, 0);

// ── 11. Los distintivos del chat ──
assert.equal(RANGO_META.owner.emoji, '👑');
assert.equal(RANGO_META.owner.etiqueta, 'Propietario');
assert.equal(RANGO_META.admin.emoji, '🛡️');
assert.equal(RANGO_META.admin.etiqueta, 'Admin');
assert.equal(RANGO_META.moderator.emoji, '🔨');
assert.equal(RANGO_META.moderator.etiqueta, 'Moderador');
// Un miembro normal no tiene distintivo: se devuelve vacío.
assert.equal(RANGO_META.member.etiqueta, '');

// ── Permisos delegables ─────────────────────────────
//
// Un club SIN `permisos` se comporta con los valores por
// defecto. Un permiso presente en `false` está apagado a
// propósito: esa diferencia es la que permite al propietario
// QUITAR una capacidad que venía de serie.
const clubConPermisos = { ...club, permisos: { moderadorBanea: true } };

assert.equal(permisosDe(club).moderadorBanea, false, 'baneo a mods: apagado de serie');
assert.equal(permisosDe(clubConPermisos).moderadorBanea, true);
assert.equal(permisosDe(club).moderadorRetiraMensajes, true, 'retirar mensajes: encendido de serie');
assert.equal(
  permisosDe({ ...club, permisos: { moderadorRetiraMensajes: false } }).moderadorRetiraMensajes,
  false,
  'apagado a propósito aunque el club lo guarde en false',
);
assert.equal(permisosDe(club).adminBaneaPermanente, false, 'baneo permanente: apagado de serie');
assert.equal(permisosDe(club).adminExpulsa, true, 'expulsar: encendido de serie');

// El dueño puede TODO, con o sin permisos guardados.
assert.equal(puedeHacer(club, DUE, 'moderadorBanea').ok, true);
assert.equal(puedeHacer(club, DUE, 'adminBaneaPermanente').ok, true);
assert.equal(puedeHacer(club, DUE, 'adminEditaAspecto').ok, true);

// Un miembro no puede nada.
assert.equal(puedeHacer(club, M1, 'moderadorBanea').ok, false);
assert.equal(puedeHacer(club, M1, 'adminExpulsa').ok, false);

// Un admin solo lo que le hayan concedido.
assert.equal(puedeHacer(club, ADMIN, 'adminBaneaPermanente').ok, false);
assert.equal(
  puedeHacer(clubConPermisos, ADMIN, 'adminBaneaPermanente').ok,
  false,
  'el permiso es de los admins, no de los moderadores',
);
assert.equal(puedeHacer(club, ADMIN, 'adminExpulsa').ok, true, 'expulsar: sí de serie');
assert.equal(puedeHacer(club, ADMIN, 'adminEditaAspecto').ok, false);

// Un moderador solo lo suyo.
assert.equal(puedeHacer(club, MOD, 'moderadorBanea').ok, false);
assert.equal(puedeHacer(clubConPermisos, MOD, 'moderadorBanea').ok, true);
assert.equal(puedeHacer(club, MOD, 'moderadorRetiraMensajes').ok, true);
assert.equal(puedeHacer(club, MOD, 'adminExpulsa').ok, false, 'un mod no expulsa');

// Un moderador con el permiso de moderar NO puede}bquear
// permanentemente: eso no se delega a nadie.
assert.equal(puedeSancionar(clubConPermisos, MOD, M1, 'baneo', false).ok, true);
assert.equal(puedeSancionar(clubConPermisos, MOD, M1, 'baneo', true).ok, false);

// El baneo permanente de un admin depende de su permiso.
assert.equal(puedeSancionar(club, ADMIN, M1, 'baneo', true).ok, false);
assert.equal(
  puedeSancionar({ ...club, permisos: { adminBaneaPermanente: true } }, ADMIN, M1, 'baneo', true).ok,
  true,
);

// Los roles de un club no afectan a otros: un admin de un
// club no es admin de otro.
const clubAjeno = { ...club, id: 'otro', slug: 'otro', ownerId: M1, adminIds: [], moderatorIds: [] };
assert.equal(rangoEnClub(clubAjeno, ADMIN), 'member');
assert.equal(puedeHacer(clubAjeno, ADMIN, 'adminExpulsa').ok, false);
assert.equal(puedeSancionar(clubAjeno, ADMIN, M2, 'silencio', false).ok, false);

// Advertir: lo puede el equipo, y no es una sanción.
assert.equal(puedeAdvertir(club, MOD), true);
assert.equal(puedeAdvertir(club, ADMIN), true);
assert.equal(puedeAdvertir(club, DUE), true);
assert.equal(puedeAdvertir(club, M1), false, 'un miembro no advierte');
assert.equal(
  puedeAdvertir({ ...club, permisos: { moderadorAdvierte: false } }, MOD),
  false,
  'el propietario puede quitarle el aviso a los moderadores',
);

// Un aviso NUNCA está activo: no bloquea nada.
const aviso = { ...base, tipo: 'advertencia' as const, fin: null, permanente: false };
assert.equal(estadoDe(aviso, ahora), 'expirada');
console.log('  club-moderacion: TODO CORRECTO');