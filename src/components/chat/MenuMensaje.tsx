import React from 'react';
import { Ban, Pencil, Pin, Reply, Trash2, VolumeX } from 'lucide-react';

// ======================================================
// MENÚ DE ACCIONES DE UN MENSAJE
// ======================================================
// Va en un PORTAL, pegado al `body`, y su posición la calcula
// quien lo monta (ChatView) a partir del botón que lo abrió.
//
// Por qué en un portal y no dentro de la burbuja: el chat tiene
// scroll propio y el mensaje vive en una columna estrecha. Un
// menú `absolute` dentro se recortaba contra el chat y, según
// de dónde saliera, se salía de la pantalla. Con `fixed` en el
// `body` se coloca respecto a la VENTANA, así que se ve entero
// en cualquier resolución.
//
// Además lleva `max-h` y scroll propio: si el menú es más alto
// que el hueco, se desplaza en vez de salirse.
//
// Los permisos se comprueban AL ABRIR: el botón no es la
// seguridad, las reglas de Firestore lo son.
// ======================================================

export interface MenuMensajeProps {
  /** Esquina superior izquierda del menú, en píxeles de ventana. */
  posicion: { left: number; top: number };
  /** El mensaje es de quien mira. */
  esMio: boolean;
  /** Si quien mira puede fijar mensajes en esta conversación. */
  puedeFijar: boolean;
  /** El mensaje ya está fijado. */
  fijado: boolean;
  onResponder: () => void;
  onEditar: () => void;
  onBorrar: () => void;
  onFijar: () => void;
  /** Solo si quien mira puede moderar en este club. */
  onSilenciar?: () => void;
  onBanear?: () => void;
}

const ITEM =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-zinc-800';

export const MenuMensaje: React.FC<MenuMensajeProps> = ({
  posicion,
  esMio,
  puedeFijar,
  fijado,
  onResponder,
  onEditar,
  onBorrar,
  onFijar,
  onSilenciar,
  onBanear,
}) => {
  return (
    <div
      role="menu"
      data-menu-mensaje
      style={{ left: posicion.left, top: posicion.top }}
      className="fixed z-[120] block max-h-[70vh] w-48 overflow-y-auto overscroll-contain rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
    >
      <button type="button" role="menuitem" onClick={onResponder} className={ITEM}>
        <Reply size={13} className="shrink-0 text-violet-400" />
        <span>
          Responder
          <span className="block text-[10px] font-normal text-zinc-500">
            Citar este mensaje
          </span>
        </span>
      </button>

      {esMio && (
        <button type="button" role="menuitem" onClick={onEditar} className={ITEM}>
          <Pencil size={13} className="shrink-0 text-zinc-400" />
          <span>
            Editar
            <span className="block text-[10px] font-normal text-zinc-500">
              Cambiar el texto
            </span>
          </span>
        </button>
      )}

      {puedeFijar && (
        <button type="button" role="menuitem" onClick={onFijar} className={ITEM}>
          <Pin size={13} className="shrink-0 text-amber-400" />
          <span>
            {fijado ? 'Quitar de los fijados' : 'Fijar mensaje'}
            <span className="block text-[10px] font-normal text-zinc-500">
              {fijado ? 'Deja de aparecer en el panel' : 'Aparecerá en el panel del chat'}
            </span>
          </span>
        </button>
      )}

      <button type="button" role="menuitem" onClick={onBorrar} className={ITEM}>
        <Trash2 size={13} className="shrink-0 text-red-400" />
        <span>
          Eliminar mensaje
          <span className="block text-[10px] font-normal text-zinc-500">
            Para ti o para todos
          </span>
        </span>
      </button>

      {/* Moderación del club: la muestra quien puede moderar y
          solo sobre mensajes de OTRAS personas. */}
      {onSilenciar && onBanear && (
        <>
          <button type="button" role="menuitem" onClick={onSilenciar} className={ITEM}>
            <VolumeX size={13} className="shrink-0 text-orange-400" />
            <span>
              Silenciar usuario
              <span className="block text-[10px] font-normal text-zinc-500">
                No podrá escribir en este club
              </span>
            </span>
          </button>

          <button type="button" role="menuitem" onClick={onBanear} className={ITEM}>
            <Ban size={13} className="shrink-0 text-red-400" />
            <span>
              Banear del club
              <span className="block text-[10px] font-normal text-zinc-500">
                Sale y no puede volver
              </span>
            </span>
          </button>
        </>
      )}
    </div>
  );
};

export default MenuMensaje;
