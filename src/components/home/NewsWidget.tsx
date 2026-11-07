import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Newspaper, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

import {
  getNewsCached,
  NEWS_REFRESH_MS,
  NOTICIAS_VISIBLES,
  sincronizarAhora,
} from '../../services/news';
import { useAuth } from '../../context/AuthContext';
import type { NewsItem } from '../../types';

/**
 * Las últimas noticias de anime, en la barra lateral.
 *
 * ── DE DÓNDE SALEN LOS DATOS ────────────────────────────────────────
 *
 * De Firestore, y solo de Firestore. El navegador no pide ningún feed
 * RSS: lo hace la Cloud Function `syncRssNews` cada dos horas y deja el
 * resultado en la colección `news`. Aquí no hay ninguna llamada a un
 * servidor de noticias, ni CORS, ni tiempo de espera.
 *
 * ── POR QUÉ ESTÁ EN LA BARRA LATERAL Y NO EN EL FEED ───────────────
 *
 * Porque son datos de fuera, que envejecen solos y que nadie de la
 * comunidad crea. Encajan con "lo que pasa por el mundo del anime",
 * que es lo que ya cuenta esa columna, y no con el contenido del sitio.
 *
 * ── EL ESTILO ───────────────────────────────────────────────────────
 *
 * Copiado del bloque de hilos que tiene justo encima: mismo fondo, mismo
 * borde, mismo `p-5`, mismo título en versalitas y mismo icono de 16 px a
 * la izquierda. No es una aproximación: si un día cambia el estilo de los
 * bloques de la barra, este tiene que cambiar con ellos.
 */

/**
 * "Hace 3 h", "ayer", "hace 4 días"...
 *
 * ── POR QUÉ NO UNA FECHA LARGA ──────────────────────────────────────
 *
 * "Thu, 08 Oct 2026 12:00:00 -0400" dentro de una tarjeta de la barra
 * lateral no cabe ni se lee: son 30 caracteres de los que la mitad son
 * el día de la semana en inglés. Con un feed RSS, además, las fechas
 * vienen en inglés siempre.
 *
 * Se usa una librería de verdad para los días, porque un día no son
 * 86 400 000 milisegundos por la tarde: con horario de verano hay días
 * de 23 y de 25 horas. Restar sin mirar eso acumula un error de una hora
 * cada pocos meses, y "hace 23 h" cuando han pasado 24 es de las cosas
 * que se notan cuando aparecen dos a la vez.
 *
 * @param {string} iso fecha en ISO
 * @returns {string} texto corto, o cadena vacía si la fecha no vale
 */
function tiempoCorto(iso: string): string {
  const cuando = Date.parse(iso);

  // Una fecha que no se puede leer no es una fecha. Sale vacía y el
  // componente la omite, en vez de pintar "Invalid Date".
  if (Number.isNaN(cuando)) return '';

  const minutos = Math.round((Date.now() - cuando) / 60000);

  if (minutos < 1) return 'ahora mismo';
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);

  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.round(horas / 24);

  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;

  const meses = Math.round(dias / 30);

  return meses <= 1 ? 'hace 1 mes' : `hace ${meses} meses`;
}

export const NewsWidget: FC = () => {
  const { isAdmin, isModerator } = useAuth();

  const [noticias, setNoticias] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState(false);

  // ── Sincronizar a mano ─────────────────────────────────
  //
  // Solo para el equipo, y solo aparece cuando hay algo que hacer:
  // sin noticias, o con pocas. Con el widget lleno no se ve, porque
  // entonces no hay nada que forzar.
  //
  // Va aquí y no en el panel de administración a propósito: quien ve
  // "todavía no hay noticias" es justo quien necesita el botón, y no
  // tiene que ir a buscarlo a otra pantalla para entender por qué está
  // vacío.
  const [sincronizando, setSincronizando] = useState(false);
  const [avisoAdmin, setAvisoAdmin] = useState('');

  const esEquipo = isAdmin || isModerator;

  const sincronizar = async () => {
    setSincronizando(true);
    setAvisoAdmin('');

    try {
      const r = await sincronizarAhora();

      // No hace falta repintar: la escucha de Firestore avisa en cuanto
      // aparecen los documentos, que es más rápido que esperar a que
      // termine la respuesta.
      setAvisoAdmin(
        r.guardadas > 0
          ? `Guardadas ${r.guardadas} noticias nuevas.`
          : r.leidas > 0
            ? `Leídas ${r.leidas}, pero ya estaban todas guardadas.`
            : 'Los feeds no devolvieron nada.',
      );
    } catch (e) {
      console.error('[Noticias] No se pudo sincronizar:', e);

      setAvisoAdmin(
        e instanceof Error
          ? e.message
          : 'No se ha podido sincronizar. Mira los registros.',
      );
    } finally {
      setSincronizando(false);
    }
  };

  // ── La escucha ─────────────────────────────────────────
  //
  // Se abre al montar y se cierra al desmontar. El `return` de `useEffect`
  // es lo que la cierra, y por eso está en un efecto aparte y no dentro
  // del `then`: un `then` no se cancela, y sin esto el widget escucharía
  // noticias de una columna que ya no existe cuando se navega a otra
  // página.
  useEffect(() => {
    let activo = true;
    let ultimaCarga = 0;

    const cargar = (force = false) => {
      void getNewsCached(force)
        .then((lista) => {
          if (!activo) return;
          setNoticias(lista);
          setError(false);
          ultimaCarga = Date.now();
        })
        .catch((e: Error) => {
          if (!activo) return;
          console.error('[Noticias] No se pudieron leer las noticias:', e);
          setError(true);
        });
    };

    // Sin listener permanente: se revisa cada minuto si ya pasó el
    // TTL, y solo entonces se hace una consulta de 6 documentos.
    const revisar = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaCarga < NEWS_REFRESH_MS) return;
      cargar(true);
    };

    const alInvalidar = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key === 'news:latest') cargar(true);
    };

    const intervalo = window.setInterval(revisar, 60_000);
    document.addEventListener('visibilitychange', revisar);
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    cargar();

    return () => {
      activo = false;
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', revisar);
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
  }, []);

  return (
    <section className="geo-panel rounded-2xl border border-zinc-800 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Newspaper size={16} className="text-violet-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Últimas Noticias Anime
        </h2>
      </div>

      {/* Cargando. Es un bloque con la forma del contenido, no un
          "cargando" suelto: al aparecer y desaparecer el hueco se ve
          menos que si el contenido salta de golpe. */}
      {noticias === null && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando noticias">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3"
            >
              <div className="h-2 w-16 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-full rounded bg-zinc-800" />
              <div className="mt-1.5 h-3 w-2/3 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* Error. Se enseña dentro del widget, no en una franja por encima
          de la página: el problema es de este bloque y se queda aquí. */}
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-dashed border-red-500/25 bg-red-500/5 px-3 py-4 text-[11px] leading-relaxed text-red-300/80">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          No se pudieron cargar las noticias ahora mismo.
        </p>
      )}

      {/* Sin noticias. La función puede no haber corrido todavía, y
          un bloque vacío del mismo alto que los demás es mejor que
          quitar el hueco y que la barra salte al cargar los datos. */}
      {noticias !== null && !error && noticias.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 px-3 py-5 text-center text-[11px] leading-relaxed text-zinc-500">
          Todavía no hay noticias.
          <span className="mt-1 block text-zinc-600">
            Aparecen aquí en cuanto se sincronice el primero.
          </span>

          {esEquipo && <BotonSincronizar {...{ sincronizando, aviso: avisoAdmin, onClick: sincronizar }} />}
        </div>
      )}

      {/* Cuando ya hay noticias pero poquitas, el botón también sale: el
          equipo lo usa para comprobar que una fuente nueva entra, y eso
          se nota antes de que se llene la lista del todo. */}
      {esEquipo && noticias !== null && !error && noticias.length > 0 && noticias.length < 5 && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <BotonSincronizar {...{ sincronizando, aviso: avisoAdmin, onClick: sincronizar }} />
        </div>
      )}

      {noticias !== null && !error && noticias.length > 0 && (
        <div className="space-y-3">
          {noticias.slice(0, NOTICIAS_VISIBLES).map((noticia) => {
            const cuando = tiempoCorto(noticia.pubDate);

            return (
              <article
                key={noticia.id}
                className="group rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 transition-all hover:border-violet-500/50 hover:bg-zinc-800/40"
              >
                <div className="flex items-center gap-2">
                  {noticia.sourceName && (
                    <span className="truncate text-[10px] font-bold uppercase tracking-wide text-violet-400">
                      {noticia.sourceName}
                    </span>
                  )}
                  {cuando && (
                    <span className="ml-auto flex-shrink-0 text-[10px] text-zinc-600">
                      {cuando}
                    </span>
                  )}
                </div>

                <h4 className="mt-1.5 line-clamp-3 text-xs font-bold leading-snug text-zinc-200 transition-colors group-hover:text-violet-300">
                  {noticia.title}
                </h4>

                {noticia.snippet && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                    {noticia.snippet}
                  </p>
                )}

                <a
                  href={noticia.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-violet-400 transition-colors hover:text-violet-300"
                >
                  <span>Leer noticia completa</span>
                  <ExternalLink size={11} />
                </a>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

/**
 * El botón de sincronizar a mano.
 *
 * Sale en su propio componente, y no escrito en el sitio, porque
 * aparece en dos: dentro del bloque vacío y debajo de una lista corta.
 * Duplicarlo sería copiar el mismo botón, el mismo icono y el mismo
 * texto de error dos veces.
 *
 * El aviso se enseña tal cual. El error de una función callable trae
 * el mensaje que ha puesto la función, y ese mensaje ya está escrito
 * para quien lo lee; taparlo con uno genérico perdería la única pista
 * que sirve cuando algo falla.
 */
const BotonSincronizar: FC<{
  sincronizando: boolean;
  aviso: string;
  onClick: () => void;
}> = ({ sincronizando, aviso, onClick }) => (
  <div className="mt-3">
    <button
      type="button"
      onClick={onClick}
      disabled={sincronizando}
      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold text-violet-300 transition-colors hover:border-violet-500/70 hover:bg-violet-500/20 disabled:opacity-50"
    >
      <RefreshCw size={11} className={sincronizando ? 'animate-spin' : ''} />
      {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
    </button>

    {aviso && <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">{aviso}</p>}
  </div>
);
