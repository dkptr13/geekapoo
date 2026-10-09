import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ======================================================
// IR AL PERFIL DE UN USUARIO
// ======================================================
//
// El perfil de una persona se guarda en la URL, y no como ruta
// ("/perfil/oscar") sino como parámetro ("?tab=perfil&usuario=...").
// Es el mismo criterio que ya usa la web para todo lo demás
// (pestaña, anime, comentario), y por eso recargar conserva la
// vista y el botón "atrás" del navegador funciona.
//
// Esto es un hook y no una prop a propósito: el autor de un hilo,
// de un comentario, de un mensaje de chat y de un miembro de un
// grupo son cuatro sitios distintos, y cuatro listas de props
// atravesando el árbol para entregar el mismo "navega" es justo
// la forma de que se quede sin conectar en alguno.

export function useGoToProfile(): (uid: string) => void {
  const navigate = useNavigate();

  return useCallback(
    (uid: string) => {
      if (!uid) return;
      navigate({
        pathname: '/',
        search: `?tab=perfil&usuario=${encodeURIComponent(uid)}`,
      });
    },
    [navigate],
  );
}

export default useGoToProfile;