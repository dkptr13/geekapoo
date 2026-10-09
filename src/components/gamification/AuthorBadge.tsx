import React from 'react';
import { Shield, ShieldCheck, Sparkles } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useGoToProfile } from '../../hooks/useGoToProfile';
import { medallaPorId } from '../../utils/progression';
import type { User } from '../../types';
import type { Medal } from '../../types/gamification';

// ======================================================
// AUTOR CON ROL Y TÍTULO
// ======================================================
//
// Los hilos y los comentarios guardan el nombre del autor
// DESNORMALIZADO ("authorName"), para no tener que hacer un join
// con "users" cada vez que se pinta la lista. El problema es que
// ahí solo va el nombre: ni el rol ni el título.
//
// La solución es NO desnormalizar el título. Las dos razones:
//
//  1. Si el nombre va copiado en el hilo, el título también
//     quedaría congelado el día que se escribió: si el usuario
//     cambia su título equipped, sus hilos viejos seguirían
//     enseñando el de antes, para siempre.
//
//  2. `usersList` ya está cargado en memoria por `AuthContext`.
//     Resolver es un `.find()`, sin ninguna lectura extra.
//
// Y no se copia nada: solo se lee del usuario, en el momento de
// pintar. Por eso el título sale siempre al día y desaparece en
// el acto si un admin le retira la medalla.

/** Etiquetas de rol. No hay etiqueta para 'user': no ser nada es lo normal. */
const ROL: Record<string, { texto: string; clase: string; icono: typeof Shield } | null> = {
  admin: {
    texto: 'Admin',
    clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    icono: ShieldCheck,
  },
  moderator: {
    texto: 'Mod',
    clase: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    icono: Shield,
  },
};

/**
 * Nombre del autor, con su rol y su título equipado debajo.
 *
 * @param authorId    Quién escribió. Es lo que se usa para
 *                    encontrarlo en `usersList`.
 * @param nombre      El nombre guardado en el hilo. Se usa solo si
 *                    el usuario ya no existe (cuenta borrada) o
 *                    aún no está en la lista: así nunca sale un
 *                    hueco en blanco.
 * @param tamano      'sm' para listas compactas (buscador,
 *                    barra lateral) y 'md' para hilo o comentario.
 */
/**
 * El título principal de una persona, o `null`.
 *
 * Va fuera del componente porque el cálculo se repite en varios
 * sitios (el perfil, su cabecera, el modal de seguidores) y es el
 * que decide si un título se puede enseñar.
 *
 * Ojo al detalle: no basta con que `equippedTitle` tenga algo,
 * también hay que mirar que su medalla siga desbloqueada en
 * `medals`. Un admin puede habérsela retirado y el campo se queda
 * sin borrar, así que enseñar el título ahí sería mostrar una
 * insignia que ya no corresponde.
 *
 * @param usuario El documento de la persona. `null` si no existe.
 */
export function tituloDeUsuario(usuario: User | undefined): Medal | null {
  if (!usuario?.equippedTitle) return null;

  const medalla = medallaPorId(usuario.equippedTitle);
  if (!medalla) return null;
  if (!usuario.medals?.[medalla.id]) return null;

  return medalla;
}

/** El texto del título, o `null`. Ver `tituloDeUsuario`. */
export function textoTitulo(usuario: User | undefined): string | null {
  const medalla = tituloDeUsuario(usuario);
  return medalla ? (medalla.titulo ?? medalla.nombre) : null;
}

export const AuthorBadge: React.FC<{
  authorId: string;
  nombre: string;
  tamano?: 'sm' | 'md';
}> = ({ authorId, nombre, tamano = 'md' }) => {
  const { usersList } = useAuth();
  const goToProfile = useGoToProfile();

  const usuario: User | undefined = usersList.find((u) => u.uid === authorId);

  // El rol y el título salen del documento del usuario. Si no
  // existe, se cae al nombre guardado y no se enseña nada más: es
  // preferible a mostrar el rol de la cuenta equivocada.
  const rol = usuario?.role ? (ROL[usuario.role] ?? null) : null;

  // El titulo sale de `tituloDeUsuario`, que ya comprueba que la
  // medalla siga desbloqueada. Ver ahi el porque.
  const medallaTitulo = tituloDeUsuario(usuario);
  const titulo = textoTitulo(usuario);

  const compacto = tamano === 'sm';

  // El nombre es un botón, y no un enlace de verdad: la web no
  // tiene rutas (todo vive en "/" con parámetros), así que un
  // <a href> recargaría la página entera y perdería la sesión.
  return (
    <button
      type="button"
      onClick={() => goToProfile(authorId)}
      title={`Ver el perfil de ${nombre.replace(/^@/, '')}`}
      className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-left"
    >
      <span
        className={`truncate font-bold ${compacto ? 'text-[11px]' : 'text-xs'} text-white hover:text-violet-300`}
      >
        {nombre}
      </span>

      {rol && (
        <span
          className={`flex flex-shrink-0 items-center gap-0.5 rounded border px-1 py-px text-[9px] font-bold uppercase ${rol.clase}`}
        >
          <rol.icono size={8} />
          {rol.texto}
        </span>
      )}

      {titulo && (
        <span
          title={medallaTitulo?.descripcion}
          className="flex min-w-0 max-w-full items-center gap-0.5 rounded border border-amber-500/30 bg-amber-500/10 px-1 py-px text-[9px] font-bold text-amber-300"
        >
          <Sparkles size={8} className="flex-shrink-0" />
          <span className="truncate">{titulo}</span>
        </span>
      )}
    </button>
  );
};

export default AuthorBadge;