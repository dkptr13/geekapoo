import { useEffect, useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Flag,
  Loader2,
  MessageSquare,
  Trash2,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import {
  deleteReport,
  etiquetaMotivo,
  listenReports,
  resolveReport,
  type ContentReport,
} from '../../services/reports';
import { textoDeComment } from '../../services/comments';
import { useNavigate } from 'react-router-dom';

// ======================================================
// COLA DE REPORTES
// ======================================================
//
// Lo primero que hace esta sección es dejar claro lo que hay
// pendiente, porque una cola vacía no dice si es que no ha
// pasado nada o si es que la vista está rota.
//
// Cada reporte da tres salidas, que son las tres cosas que se
// pueden hacer con una queja:
//
//   - Ver: salta al hilo para juzgarlo por el contexto.
//   - Borrar el contenido: la acción de moderación de verdad.
//   - Descartar: se cierra sin borrar, que es lo que pasa
//     cuando el reporte no era para tanto.
//
// Y las dos reglas del sistema se notan aquí: un contenido
// borrado deja de existir, así que sus reportes se descartan
// solos; y cerrar un reporte NO borra nada por sí solo, porque
// borrar es una decisión aparte y-taking-nada de ella.

/** Texto del contenido denunciado, para decidir sin saltar de pestaña. */
function useResumenContenido(reportes: ContentReport[]) {
  const [textos, setTextos] = useState<Record<string, string>>({});

  // Solo se leen los comentarios de los reportes de comentarios:
  // leerlos todos sería una llamada por cada línea de la cola, y el
  // hilo ya se abre en pestaña aparte.
  const idsComentarios = reportes
    .filter((r) => r.targetType === 'comment')
    .map((r) => r.targetId);

  useEffect(() => {
    let vivo = true;
    if (idsComentarios.length === 0) {
      setTextos({});
      return;
    }

    Promise.all(
      idsComentarios.map(async (id) => {
        const t = await textoDeComment(id);
        return [id, t ? `"${t.body}" — ${t.authorName}` : null] as const;
      }),
    )
      .then((pares) => {
        if (!vivo) return;
        const mapa: Record<string, string> = {};
        pares.forEach(([id, texto]) => {
          if (texto) mapa[id] = texto;
        });
        setTextos(mapa);
      })
      .catch(() => {
        if (vivo) setTextos({});
      });

    return () => {
      vivo = false;
    };
    // los ids solo cambian cuando cambia la cola: se comparan en un
    // texto para no releer todo en cada repintado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsComentarios.join('|')]);

  return textos;
}

export const ReportsSection: FC = () => {
  const { currentUser, canManage } = useAuth();
  const { deleteComment, deleteThread } = useCommunity();
  const navegar = useNavigate();

  const [reportes, setReportes] = useState<ContentReport[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState<string | null>(null);
  const [error, setError] = useState('');

  const textos = useResumenContenido(reportes);

  useEffect(() => {
    setCargando(true);
    return listenReports('pendiente', (lista) => {
      setReportes(lista);
      setCargando(false);
    });
  }, []);

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <AlertCircle size={22} className="mx-auto mb-2 text-amber-500" />
        <p className="text-xs text-zinc-400">
          Los administradores y moderadores pueden ver los reportes.
        </p>
      </div>
    );
  }

  /**
   * Borra el contenido denunciado y cierra sus reportes.
   *
   * Se hace en dos pasos y no en uno porque no hay cascada: al
   * borrar el comentario, sus reportes se quedan apuntando a algo
   * que ya no existe. Por eso, después de borrar, se descartan
   * todos los reportes de ese contenido, y así no queda ninguna
   * línea en la cola pidiendo algo que nadie puede hacer.
   */
  const borrarYDescartar = async (reporte: ContentReport) => {
    setBuscando(reporte.id);
    setError('');

    try {
      const ok =
        reporte.targetType === 'comment'
          ? await deleteComment(reporte.targetId)
          : await deleteThread(reporte.targetId);

      if (!ok) {
        setError('No se pudo borrar. Puede que ya no exista, o que la red falle.');
        setBuscando(null);
        return;
      }

      for (const r of reportes.filter((x) => x.id !== reporte.id && x.targetId === reporte.targetId && x.targetType === reporte.targetType)) {
        await resolveReport(r.id, 'descartado', currentUser?.uid ?? '', 'borrado');
      }

      await resolveReport(reporte.id, 'resuelto', currentUser?.uid ?? '', 'borrado');
      setBuscando(null);
    } catch (e) {
      console.error('[Reportes] No se pudo borrar el contenido:', e);
      setError('No se pudo resolver el reporte.');
      setBuscando(null);
    }
  };

  const descartar = async (reporte: ContentReport) => {
    setBuscando(reporte.id);
    try {
      await resolveReport(reporte.id, 'descartado', currentUser?.uid ?? '', 'nada');
    } catch (e) {
      console.error('[Reportes] No se pudo descartar:', e);
      setError('No se pudo cerrar el reporte.');
    } finally {
      setBuscando(null);
    }
  };

  /**
   * Salta al sitio donde está el contenido.
   *
   * Los comentarios no tienen URL propia (viven dentro de su hilo,
   * o en la ficha de la wiki), así que hay que leer el comentario
   * para averiguar DÓNDE está antes de saltar.
   *
   * Antes se saltaba siempre a `?hilo=<id del comentario>`, que no
   * lleva a ningún sitio: un hilo y un comentario son documentos
   * distintos con ids distintos. Ahora se usa el `targetType` y el
   * `targetId` de verdad del comentario.
   */
  const verEnSuSitio = async (reporte: ContentReport) => {
    setBuscando(reporte.id);
    setError('');

    try {
      if (reporte.targetType === 'thread') {
        navegar(`/?tab=inicio&hilo=${encodeURIComponent(reporte.targetId)}`);
        setBuscando(null);
        return;
      }

      const comentario = await textoDeComment(reporte.targetId);
      if (!comentario) {
        setError('Ese comentario ya no existe: el reporte se cerrará al descartarlo.');
        setBuscando(null);
        return;
      }

      if (comentario.targetType === 'thread' && comentario.targetId) {
        navegar(
          `/?tab=inicio&hilo=${encodeURIComponent(comentario.targetId)}` +
            `&comentario=${encodeURIComponent(reporte.targetId)}`,
        );
      } else if (comentario.targetType === 'anime' && comentario.targetId) {
        navegar(`/?tab=wiki&anime=${encodeURIComponent(comentario.targetId)}`);
      } else {
        // Episodio o personaje: la wiki se abre por serie, y desde
        // aquí no se sabe cuál es sin leer el catálogo. Se lleva a
        // la wiki y se avisa de que hay que ir a la serie a mano.
        navegar('?tab=wiki');
        setError(
          'El comentario está en un capítulo o un personaje: búscalo en la wiki ' +
            '(el catálogo no guarda de qué serie es cada uno).',
        );
      }

      setBuscando(null);
    } catch (e) {
      console.error('[Reportes] No se pudo abrir el contenido:', e);
      setError('No se pudo abrir el contenido.');
      setBuscando(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Resumen ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
        <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <Flag size={14} className="text-amber-400" />
          Reportes pendientes
        </h3>
        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-300">
          {reportes.length}
        </span>
      </div>

      {cargando ? (
        <p className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
          <Loader2 size={14} className="animate-spin" />
          Cargando la cola de reportes...
        </p>
      ) : reportes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center">
          <CheckCircle2 size={22} className="mx-auto mb-2 text-emerald-500" />
          <p className="text-xs text-zinc-300">No hay nada pendiente.</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Nadie ha reportado nada. Buen día para la comunidad.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {reportes.map((r) => {
            const motivo = etiquetaMotivo(r.motivo);
            const ocupado = buscando === r.id;

            return (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-zinc-200">
                      <span>{motivo.emoji}</span>
                      {motivo.texto}
                      <span className="text-zinc-600">·</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                        {r.targetType === 'thread' ? (
                          <MessageSquare size={9} />
                        ) : (
                          <MessageSquare size={9} />
                        )}
                        {r.targetType === 'thread' ? 'hilo' : 'comentario'}
                      </span>
                    </p>

                    {/* El texto del contenido, si se pudo leer. Si no
                        se puede (ya borrado), se avisa en vez de
                        dejar un hueco raro. */}
                    {r.targetType === 'comment' && (
                      <p className="mt-1 truncate text-[11px] text-zinc-400">
                        {textos[r.targetId] ?? '(el comentario ya no existe)'}
                      </p>
                    )}
                    {r.targetType === 'thread' && (
                      <p className="mt-1 truncate text-[11px] text-zinc-400">
                        Hilo {r.targetId.slice(0, 12)}...
                      </p>
                    )}

                    {r.detalle && (
                      <p className="mt-1 rounded-lg bg-zinc-950/70 px-2 py-1.5 text-[11px] italic text-zinc-300">
                        “{r.detalle}”
                      </p>
                    )}

                    <p className="mt-1 text-[10px] text-zinc-600">
                      @{r.reportadoPorNombre} ·{' '}
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'sin fecha'}
                    </p>
                  </div>

                  {/* ── Acciones ───────────────────────── */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => verEnSuSitio(r)}
                      disabled={ocupado}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      <ExternalLink size={10} />
                      Ver
                    </button>

                    <button
                      type="button"
                      onClick={() => borrarYDescartar(r)}
                      disabled={ocupado}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {ocupado ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Borrar contenido
                    </button>

                    <button
                      type="button"
                      onClick={() => descartar(r)}
                      disabled={ocupado}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      <XCircle size={10} />
                      Descartar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};
