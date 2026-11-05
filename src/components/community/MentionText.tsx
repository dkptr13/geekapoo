import { Fragment } from 'react';
import type { FC } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useGoToProfile } from '../../hooks/useGoToProfile';

/**
 * Texto con menciones `@usuario` clicables.
 *
 * Resuelve el identificador contra el directorio que ya está en
 * memoria. Si el nombre no existe (texto normal, cuenta borrada o una
 * mención antigua), se pinta como texto y no se rompe nada.
 */
export const MentionText: FC<{ text: string }> = ({ text }) => {
  const { usersList } = useAuth();
  const goToProfile = useGoToProfile();

  if (!text) return null;

  const partes = text.split(/(@[A-Za-z0-9._-]{1,24})/g);

  return (
    <>
      {partes.map((parte, indice) => {
        if (!parte.startsWith('@')) {
          return <Fragment key={indice}>{parte}</Fragment>;
        }

        const username = parte.slice(1).toLowerCase();
        const usuario = usersList.find(
          (u) =>
            (u.username ?? '').toLowerCase() === username ||
            u.usernameAliases?.some(
              (alias) => alias.toLowerCase() === username,
            ),
        );

        if (!usuario) {
          return <Fragment key={indice}>{parte}</Fragment>;
        }

        return (
          <button
            key={indice}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToProfile(usuario.uid);
            }}
            className="font-semibold text-violet-300 transition-colors hover:text-violet-200 hover:underline"
            title={`Ver el perfil de ${usuario.displayName || usuario.username}`}
          >
            {parte}
          </button>
        );
      })}
    </>
  );
};
