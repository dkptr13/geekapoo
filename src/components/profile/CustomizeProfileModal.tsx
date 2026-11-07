import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Save,
  ImagePlus,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  RotateCcw,
  Check,
  Pin,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useProgression } from '../../context/ProgressionContext';
import { uploadCommunityImage, deleteReplacedImage, esGif } from '../../services/imageUpload';
import { validarEditable } from '../../utils/profile';
import {
  DISPLAY_NAME_MAX,
  puedeCambiarDisplayName,
  siguienteCambioDisplayName,
} from '../../data/usernames';
import { nivelDesdeXp } from '../../utils/progression';
import {
  AVATAR_PRESETS,
  BANNERS_PERFIL,
  BANNER_PREDETERMINADO_ID,
  BANNER_PROPIO_NIVEL,
  COLORES_PERFIL,
  COLOR_POR_DEFECTO,
  DIM_MAXIMO,
  FONDO_PREDETERMINADO_ID,
  IDS_PEGATINAS,
  MARCOS_AVATAR,
  MAX_DECORACIONES,
  MAX_DESC_PERSONAJE,
  MAX_DESTACADAS,
  MAX_INSIGNIAS_VISIBLES,
  MAX_NOMBRE_PERSONAJE,
  MAX_PERSONAJES,
  MAX_SERIE_PERSONAJE,
  MAX_VITRINAS,
  PEGATINAS,
  POSICIONES_FONDO,
  POSICIONES_PREDEFINIDAS,
  PREFIJO_BANNER,
  TAMANOS_DECORACION,
  VITRINAS,
  VITRINAS_POR_DEFECTO,
  bannerDePerfil,
  colorDePerfil,
  desbloqueadoPorNivel,
  fondoAGuardar,
  fondoDePerfil,
  marcoDeAvatar,
  sujetarDecoracion,
  type Decoracion,
  type PersonajeFavorito,
  type TamanoDecoracion,
  type TipoVitrina,
} from '../../data/profileCustomization';
import { ESTILO_RAREZA } from '../gamification/MedalCard';
import { CropEditor } from '../common/CropEditor';
import { ProfileHeader } from './ProfileHeader';
import { textoTitulo } from '../gamification/AuthorBadge';
import type { ImageCropSettings } from '../../services/imageCrop';
import type { PerfilEditable } from '../../types/profile';
import type { Thread, User } from '../../types';

// ======================================================
// PERSONALIZAR PERFIL
// ======================================================
//
// El editor completo, por pestañas y con vista previa. Sustituye
// al modal viejo de cuatro campos (`EditProfileModal`): lo que
// hacía aquel (avatar con recorte, nombre, bio, anime favorito y
// título) está aquí dentro, en sus pestañas, así que no hay dos
// editores compitiendo.
//
// Lo que se puede tocar está en `PerfilEditable`. Lo que no
// (rol, XP, nivel, medallas, contadores) ni aparece: no se enseña
// lo que no se puede hacer.
//
// ── Los desbloqueos no dan XP ──────────────────────────
//
// Elegir un color o un banner no escribe en `xp`, `level`,
// `medals` ni `stats`, y las reglas lo prohíben de todos modos.
// El desbloqueo se comprueba contra el nivel (que sale del XP
// del servidor) antes de dejar elegir: lo bloqueado lleva
// candado y no se puede marcar.

type Pestana = 'apariencia' | 'fondos' | 'decoracion' | 'vitrinas' | 'info' | 'titulos' | 'insignias' | 'publicaciones';

const PESTANAS: Array<{ id: Pestana; nombre: string }> = [
  { id: 'apariencia', nombre: 'Apariencia' },
  { id: 'fondos', nombre: 'Fondos' },
  { id: 'decoracion', nombre: 'Decoración' },
  { id: 'vitrinas', nombre: 'Vitrinas' },
  { id: 'info', nombre: 'Identidad' },
  { id: 'titulos', nombre: 'Títulos' },
  { id: 'insignias', nombre: 'Insignias' },
  { id: 'publicaciones', nombre: 'Publicaciones' },
];

/** Id único para una decoración nueva (sin librerías). */
const nuevoIdDecoracion = () =>
  `dec-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export const CustomizeProfileModal: React.FC<{
  onCerrar: () => void;
  /** Avatar por defecto, para el `src` vacío. */
  avatarPorDefecto: string;
  /** Hilos del dueño (los más nuevos primero), para fijar. */
  hilosPropios: Thread[];
}> = ({ onCerrar, avatarPorDefecto, hilosPropios }) => {
  const { currentUser, updateProfileData } = useAuth();
  const { desbloqueadas, equipar, config } = useProgression();

  const [pestana, setPestana] = useState<Pestana>('apariencia');

  const [datos, setDatos] = useState<PerfilEditable>(() => ({
    displayName: currentUser?.displayName || '',
    bio: currentUser?.bio || '',
    avatarUrl: currentUser?.avatarUrl || '',
    avatarCrop: currentUser?.avatarCrop ?? null,
    favoriteAnime: currentUser?.favoriteAnime || '',
    equippedTitle: currentUser?.equippedTitle ?? null,
    bannerUrl: currentUser?.bannerUrl || '',
    profileColor: currentUser?.profileColor || COLOR_POR_DEFECTO,
    avatarFrame: currentUser?.avatarFrame ?? null,
    favoriteCharacterName: currentUser?.favoriteCharacter?.name || '',
    favoriteCharacterImage: currentUser?.favoriteCharacter?.imageUrl || '',
    favoriteCharacterDesc: currentUser?.favoriteCharacter?.desc || '',
    favoriteCharacters: (currentUser?.favoriteCharacters ?? []).map((p) => ({
      name: p?.name || '',
      imageUrl: p?.imageUrl || '',
      serie: p?.serie || '',
    })),
    visibleBadgeIds: currentUser?.visibleBadgeIds ?? null,
    featuredPostIds: currentUser?.featuredPostIds ?? [],
    backgroundPreset: currentUser?.profileBackground?.preset || '',
    backgroundUrl: currentUser?.profileBackground?.url || '',
    backgroundPosition:
      currentUser?.profileBackground?.position === 'top' ||
      currentUser?.profileBackground?.position === 'bottom'
        ? currentUser.profileBackground.position
        : 'center',
    backgroundDim:
      typeof currentUser?.profileBackground?.dim === 'number'
        ? Math.min(DIM_MAXIMO, Math.max(0, currentUser.profileBackground.dim))
        : 50,
    decorations: (currentUser?.decorations ?? [])
      .filter((d) => d && typeof d.id === 'string')
      .map((d) =>
        sujetarDecoracion({
          id: d.id,
          kind: d.kind === 'sticker' || d.kind === 'image' || d.kind === 'medal' ? d.kind : 'sticker',
          ref: String(d.ref || ''),
          x: Number(d.x),
          y: Number(d.y),
          size: d.size === 's' || d.size === 'm' || d.size === 'l' ? d.size : 'm',
        }),
      )
      .slice(0, MAX_DECORACIONES),
    showcases: (currentUser?.showcases ?? []).filter((v): v is TipoVitrina =>
      VITRINAS.some((t) => t.id === v),
    ),
  }));

  const [avatarSinRecortar, setAvatarSinRecortar] = useState<File | null>(null);
  const [bannerSinRecortar, setBannerSinRecortar] = useState<File | null>(null);
  const [fondoSinRecortar, setFondoSinRecortar] = useState<File | null>(null);
  const [pjSinRecortar, setPjSinRecortar] = useState<File | null>(null);
  /** A qué fila de personajes va la imagen que se está subiendo (`-1` = principal). */
  const [subidaPj, setSubidaPj] = useState<number>(-1);
  /** Decoración seleccionada en el lienzo. */
  const [decoracionSel, setDecoracionSel] = useState<string | null>(null);

  const lienzoRef = React.useRef<HTMLDivElement | null>(null);

  // Arrastre en curso: id + desplazamiento entre el cursor y el
  // centro del elemento al agarrar, más la última posición
  // pintada (NaN hasta el primer movimiento).
  const agarreRef = React.useRef<{ id: string; dx: number; dy: number; x: number; y: number } | null>(
    null,
  );

  // Ancho del marco del lienzo, para encoger la cabecera con
  // `zoom`. Se mide al abrir la pestaña (antes no existe).
  const marcoRef = React.useRef<HTMLDivElement | null>(null);
  const [anchoMarco, setAnchoMarco] = React.useState(0);

  React.useEffect(() => {
    if (pestana !== 'decoracion') return;
    const el = marcoRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAnchoMarco(el.clientWidth));
    setAnchoMarco(el.clientWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pestana]);

  /** La cabecera real mide 768 de referencia; se encoge a lo que quepa. */
  const escalaLienzo = anchoMarco > 0 ? Math.min(1, anchoMarco / 768) : 1;

  const [errores, setErrores] = useState<Partial<Record<keyof PerfilEditable, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !guardando && !subiendo) onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar, guardando, subiendo]);

  if (!currentUser) return null;

  const level = nivelDesdeXp(currentUser.xp ?? 0, config).level;
  const puedeCambiarNombre = puedeCambiarDisplayName(currentUser);
  const siguienteNombre = siguienteCambioDisplayName(currentUser);
  const fechaSiguienteNombre = siguienteNombre
    ? siguienteNombre.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const cambiar = <K extends keyof PerfilEditable>(campo: K, valor: PerfilEditable[K]) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
    setAviso(null);
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  // ── Subidas ──────────────────────────────────────
  //
  // El mismo patrón del editor viejo: la URL solo se guarda en el
  // borrador, no en Firestore. Cancelar no deja nada a medias, y
  // el archivo viejo se borra al guardar, no al subir.

  const alSubirAvatar = async (recortada: File, ajustes: ImageCropSettings) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(recortada, currentUser.uid);
      cambiar('avatarUrl', url);
      cambiar('avatarCrop', ajustes);
      setAvatarSinRecortar(null);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      setAvatarSinRecortar(null);
    } finally {
      setSubiendo(false);
    }
  };

  // Subida directa sin recorte (para GIFs animados). Sin
  // ajustes de recorte: se guarda `avatarCrop` en null para que
  // no se aplique el encuadre de un avatar anterior al nuevo.
  const alSubirAvatarDirecto = async (fichero: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(fichero, currentUser.uid);
      cambiar('avatarUrl', url);
      cambiar('avatarCrop', null);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const alSubirBanner = async (recortada: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(recortada, currentUser.uid);
      cambiar('bannerUrl', url);
      setBannerSinRecortar(null);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      setBannerSinRecortar(null);
    } finally {
      setSubiendo(false);
    }
  };

  // Subida directa sin recorte (para GIFs animados).
  const alSubirBannerDirecto = async (fichero: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(fichero, currentUser.uid);
      cambiar('bannerUrl', url);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  // El fondo tiene su propio recorte y su propio campo. Antes
  // compartía el del banner (`bannerSinRecortar` + `alSubirBanner`)
  // y la imagen acababa guardada como banner.
  const alSubirFondo = async (recortada: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(recortada, currentUser.uid);
      cambiar('backgroundUrl', url);
      cambiar('backgroundPreset', '');
      setFondoSinRecortar(null);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      setFondoSinRecortar(null);
    } finally {
      setSubiendo(false);
    }
  };

  // Subida directa sin recorte (para GIFs animados). Comparte el
  // guardado con `alSubirFondo`, pero sin abrir el editor.
  const alSubirFondoDirecto = async (fichero: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(fichero, currentUser.uid);
      cambiar('backgroundUrl', url);
      cambiar('backgroundPreset', '');
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const alSubirPersonaje = async (recortada: File) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(recortada, currentUser.uid);
      guardarPersonajeUrl(url, subidaPj);
      setPjSinRecortar(null);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
      setPjSinRecortar(null);
    } finally {
      setSubiendo(false);
    }
  };

  // Guarda la URL del personaje en su fila: `-1` es el
  // principal, el resto son índices de la vitrina.
  const guardarPersonajeUrl = (url: string, indice: number) => {
    if (indice === -1) {
      cambiar('favoriteCharacterImage', url);
    } else {
      setDatos((prev) => ({
        ...prev,
        favoriteCharacters: (prev.favoriteCharacters ?? []).map((p, i) =>
          i === indice ? { ...p, imageUrl: url } : p,
        ),
      }));
      setGuardado(false);
    }
  };

  // Subida directa sin recorte (para GIFs animados). Lleva el
  // índice como parámetro porque el diálogo de archivo de la
  // vitrina se abre a mano y el estado `subidaPj` podría no
  // haberse actualizado todavía al elegir.
  const alSubirPersonajeDirecto = async (fichero: File, indice: number) => {
    setSubiendo(true);
    setErrorGeneral(null);
    try {
      const url = await uploadCommunityImage(fichero, currentUser.uid);
      guardarPersonajeUrl(url, indice);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  // ── Insignias y destacadas ───────────────────────

  const conId = (id: string) => desbloqueadas.some((m) => m.id === id);

  const alternarInsignia = (id: string) => {
    const actual = datos.visibleBadgeIds;
    // `null` son todas: al tocar una se pasa a explícito con esa
    // quitada o puesta según estuviera.
    const base: string[] = actual ?? desbloqueadas.map((m) => m.id);
    const quitando = base.includes(id);
    const siguiente = quitando ? base.filter((x) => x !== id) : [...base, id];
    // Quitar siempre se permite (es como se sale de un estado con
    // más de 6 marcadas, p. ej. cuentas con `null` = todas y más de
    // 6 desbloqueadas). Solo añadir por encima del tope se bloquea.
    if (!quitando && siguiente.length > MAX_INSIGNIAS_VISIBLES) {
      setErrorGeneral(`Como máximo ${MAX_INSIGNIAS_VISIBLES} insignias visibles.`);
      return;
    }
    setErrorGeneral(null);
    cambiar('visibleBadgeIds', siguiente);
  };

  const alternarDestacada = (id: string) => {
    const actual = datos.featuredPostIds ?? [];
    const siguiente = actual.includes(id)
      ? actual.filter((x) => x !== id)
      : [...actual, id];
    if (siguiente.length > MAX_DESTACADAS) {
      setErrorGeneral(`Como máximo ${MAX_DESTACADAS} publicaciones destacadas.`);
      return;
    }
    cambiar('featuredPostIds', siguiente);
  };

  // ── Decoraciones ─────────────────────────────────
  //
  // Se colocan sobre la cabecera en % (estable entre
  // dispositivos). Arrastrar en el lienzo, presets de posición
  // o botones de mover: las tres vías escriben lo mismo.

  const anadirDecoracion = (kind: Decoracion['kind'], ref: string) => {
    const actual = datos.decorations ?? [];
    if (actual.length >= MAX_DECORACIONES) {
      setErrorGeneral(`Como máximo ${MAX_DECORACIONES} decoraciones.`);
      return;
    }
    const nueva: Decoracion = sujetarDecoracion({
      id: nuevoIdDecoracion(),
      kind,
      ref,
      x: 50,
      y: 20,
      size: 'm',
    });
    cambiar('decorations', [...actual, nueva]);
    setDecoracionSel(nueva.id);
  };

  const tocarDecoracion = (id: string, parche: Partial<Decoracion>) => {
    cambiar(
      'decorations',
      (datos.decorations ?? []).map((d) =>
        d.id === id ? sujetarDecoracion({ ...d, ...parche }) : d,
      ),
    );
  };

  const quitarDecoracion = (id: string) => {
    cambiar('decorations', (datos.decorations ?? []).filter((d) => d.id !== id));
    if (decoracionSel === id) setDecoracionSel(null);
  };

  const moverDecoracion = (id: string, dx: number, dy: number) => {
    const d = (datos.decorations ?? []).find((x) => x.id === id);
    if (d) tocarDecoracion(id, { x: d.x + dx, y: d.y + dy });
  };

  // ── Arrastre en el lienzo ────────────────────────
  //
  // Durante el gesto NO se toca el estado de React: la posición
  // se escribe directa en el DOM (zona de agarre + elemento
  // visible, los dos llevan `data-decor-id`). Repintar el modal
  // entero en cada movimiento es lo que dejaba el elemento por
  // detrás del cursor al mover rápido. Al soltar, un solo
  // `tocarDecoracion` guarda el sitio final.
  //
  // El movimiento se escucha en la VENTANA: no depende de que la
  // captura sobreviva a los re-renders ni de seguir encima del
  // lienzo. El `preventDefault` del inicio impide el arrastre
  // nativo de la imagen fantasma.

  const alAgarrar = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    const caja = e.currentTarget.getBoundingClientRect();
    const agarre = {
      id,
      dx: e.clientX - (caja.left + caja.width / 2),
      dy: e.clientY - (caja.top + caja.height / 2),
      x: NaN,
      y: NaN,
    };
    agarreRef.current = agarre;
    setDecoracionSel(id);

    const pintar = (x: number, y: number) => {
      agarre.x = x;
      agarre.y = y;
      lienzoRef.current
        ?.querySelectorAll(`[data-decor-id="${CSS.escape(id)}"]`)
        .forEach((el) => {
          (el as HTMLElement).style.left = `${x}%`;
          (el as HTMLElement).style.top = `${y}%`;
        });
    };
    const mover = (ev: PointerEvent) => {
      const el = lienzoRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      pintar(
        Math.min(100, Math.max(0, ((ev.clientX - r.left - agarre.dx) / r.width) * 100)),
        Math.min(100, Math.max(0, ((ev.clientY - r.top - agarre.dy) / r.height) * 100)),
      );
    };
    const soltar = () => {
      const g = agarreRef.current;
      agarreRef.current = null;
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      // Sin moverse no hay nada que guardar: sería llevar el
      // elemento al 0,0 con un simple clic.
      if (g && Number.isFinite(g.x) && Number.isFinite(g.y)) {
        tocarDecoracion(g.id, { x: g.x, y: g.y });
      }
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
  };

  // ── Vitrinas ─────────────────────────────────────

  const alternarVitrina = (id: TipoVitrina) => {
    const actual = datos.showcases ?? [];
    if (actual.includes(id)) {
      cambiar('showcases', actual.filter((v) => v !== id));
    } else {
      if (actual.length >= MAX_VITRINAS) {
        setErrorGeneral(`Como máximo ${MAX_VITRINAS} vitrinas.`);
        return;
      }
      cambiar('showcases', [...actual, id]);
    }
  };

  const moverVitrina = (id: TipoVitrina, dir: -1 | 1) => {
    const actual = datos.showcases ?? [];
    const i = actual.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= actual.length) return;
    const siguiente = [...actual];
    [siguiente[i], siguiente[j]] = [siguiente[j], siguiente[i]];
    cambiar('showcases', siguiente);
  };

  // ── Vista previa ─────────────────────────────────
  //
  // Un usuario ficticio con el borrador, para ver el resultado
  // antes de guardar. El título se resuelve igual que en la
  // cabecera de verdad (`textoTitulo` sobre el documento con el
  // título del borrador).

  const vistaPrevia: User = useMemo(
    () => ({
      ...currentUser,
      displayName: datos.displayName.trim() || currentUser.username,
      bio: datos.bio.trim(),
      avatarUrl: datos.avatarUrl.trim(),
      bannerUrl: datos.bannerUrl.trim(),
      profileColor: datos.profileColor,
      avatarFrame: datos.avatarFrame,
      favoriteAnime: datos.favoriteAnime.trim(),
      favoriteCharacter: datos.favoriteCharacterName.trim()
        ? {
            name: datos.favoriteCharacterName.trim(),
            imageUrl: datos.favoriteCharacterImage.trim(),
          }
        : null,
      equippedTitle: datos.equippedTitle ?? null,
      // Las decoraciones del borrador: la cabecera del lienzo las
      // pinta con su propia capa, igual que en el perfil.
      decorations: datos.decorations ?? [],
    }),
    [currentUser, datos],
  );

  const bannerVista = bannerDePerfil(vistaPrevia.bannerUrl, level);
  const colorVista = colorDePerfil(vistaPrevia.profileColor, level);
  const marcoVista = marcoDeAvatar(vistaPrevia.avatarFrame, level);
  const tituloVista = textoTitulo(vistaPrevia);

  // ── Guardar ──────────────────────────────────────

  const alRestablecer = () => {
    cambiar('bannerUrl', '');
    cambiar('profileColor', COLOR_POR_DEFECTO);
    cambiar('avatarFrame', null);
    cambiar('backgroundPreset', '');
    cambiar('backgroundUrl', '');
    cambiar('backgroundDim', 50);
    cambiar('decorations', []);
    setAviso('Diseño restablecido (apariencia, fondo y decoración). Pulsa Guardar para aplicarlo.');
    setPestana('apariencia');
  };

  const alGuardar = async () => {
    const validacion = validarEditable(datos);
    if (!validacion.ok) {
      setErrores(validacion.errores);
      return;
    }

    // `null` son todas: solo vale si las desbloqueadas caben en el
    // tope. Con más de 6, guardar `null` enseñaría más de 6 (y las
    // reglas lo deniegan: `visibleBadgeIds` lista de ≤6). Se obliga
    // a elegir cuáles 6 en vez de guardar un estado inválido.
    if (datos.visibleBadgeIds === null && desbloqueadas.length > MAX_INSIGNIAS_VISIBLES) {
      setErrores((prev) => ({
        ...prev,
        visibleBadgeIds: `Tienes ${desbloqueadas.length} insignias: elige cuáles ${MAX_INSIGNIAS_VISIBLES} mostrar.`,
      }));
      setErrorGeneral(
        `Como máximo ${MAX_INSIGNIAS_VISIBLES} insignias visibles. Quita hasta quedarte con ${MAX_INSIGNIAS_VISIBLES}.`,
      );
      setPestana('insignias');
      return;
    }

    // Defensa en profundidad: aunque la interfaz no deja marcar
    // lo bloqueado, aquí se vuelve a filtrar. Lo que no está
    // desbloqueado para este nivel no sale de este modal.
    const colorOk = COLORES_PERFIL.some(
      (c) => c.hex === datos.profileColor.toLowerCase() && level >= c.nivelMinimo,
    );
    const bannerPreset = datos.bannerUrl.startsWith(PREFIJO_BANNER)
      ? BANNERS_PERFIL.find((b) => b.id === datos.bannerUrl.slice(PREFIJO_BANNER.length))
      : null;
    const bannerOk =
      datos.bannerUrl === '' ||
      (bannerPreset !== null && bannerPreset !== undefined && level >= bannerPreset.nivelMinimo) ||
      (/^https:\/\//.test(datos.bannerUrl) && level >= BANNER_PROPIO_NIVEL);
    const marcoOk =
      (datos.avatarFrame ?? null) === null ||
      MARCOS_AVATAR.some((m) => m.id === datos.avatarFrame && level >= m.nivelMinimo);

    if (!colorOk || !bannerOk || !marcoOk) {
      setErrorGeneral('Hay elementos bloqueados para tu nivel en el borrador. Elige otros.');
      return;
    }

    // Fondo: el preset tiene que existir y estar desbloqueado; la
    // URL propia pide nivel 3 como el banner.
    const fondoPresetOk =
      datos.backgroundPreset === '' ||
      BANNERS_PERFIL.some(
        (b) => b.id === datos.backgroundPreset && level >= b.nivelMinimo,
      );
    const fondoUrlOk =
      datos.backgroundUrl === '' ||
      (/^https:\/\//.test(datos.backgroundUrl) && level >= BANNER_PROPIO_NIVEL);
    if (!fondoPresetOk || !fondoUrlOk) {
      setErrorGeneral('El fondo elegido está bloqueado para tu nivel.');
      return;
    }

    // Decoraciones: pegatinas desbloqueadas, medallas de verdad
    // desbloqueadas e imágenes https. Lo demás se tira sin
    // avisar: es lo que impide colar una medalla que no se tiene.
    const medallasIds = new Set(desbloqueadas.map((m) => m.id));
    const decoracionesOk = (datos.decorations ?? [])
      .map(sujetarDecoracion)
      .filter((d) => {
        if (d.kind === 'sticker') {
          const p = PEGATINAS.find((s) => s.id === d.ref);
          return !!p && level >= p.nivelMinimo;
        }
        if (d.kind === 'medal') return medallasIds.has(d.ref);
        return /^https:\/\//.test(d.ref);
      })
      .slice(0, MAX_DECORACIONES);

    // Personajes: sin filas vacías ni de más.
    const personajesOk: PersonajeFavorito[] = (datos.favoriteCharacters ?? [])
      .map((p) => ({
        name: (p?.name || '').trim(),
        imageUrl: (p?.imageUrl || '').trim(),
        serie: (p?.serie || '').trim(),
      }))
      .filter((p) => p.name)
      .slice(0, MAX_PERSONAJES);

    // Vitrinas: conocidas, desbloqueadas y sin repetir.
    const vitrinasOk: TipoVitrina[] = [];
    for (const v of datos.showcases ?? []) {
      const ficha = VITRINAS.find((t) => t.id === v);
      if (ficha && level >= ficha.nivelMinimo && !vitrinasOk.includes(ficha.id)) {
        vitrinasOk.push(ficha.id);
      }
    }

    setGuardando(true);
    setErrorGeneral(null);

    try {
      const avatarAnterior = currentUser.avatarUrl;
      const bannerAnterior = currentUser.bannerUrl || '';
      const avatarNuevo = datos.avatarUrl.trim();
      const bannerNuevo = datos.bannerUrl.trim();

      // El fondo se arma con `fondoAGuardar` (sin claves
      // `undefined`, que Firestore rechaza dentro de un mapa).
      const fondo = fondoAGuardar(
        datos.backgroundPreset,
        datos.backgroundUrl,
        datos.backgroundPosition,
        datos.backgroundDim,
      );

      await updateProfileData({
        displayName: datos.displayName.trim(),
        bio: datos.bio.trim(),
        avatarUrl: avatarNuevo,
        avatarCrop: datos.avatarCrop ?? null,
        favoriteAnime: datos.favoriteAnime.trim(),
        bannerUrl: bannerNuevo,
        profileColor: datos.profileColor.trim().toLowerCase(),
        avatarFrame: datos.avatarFrame ?? null,
        favoriteCharacter: datos.favoriteCharacterName.trim()
          ? {
              name: datos.favoriteCharacterName.trim(),
              imageUrl: datos.favoriteCharacterImage.trim(),
              // Igual que el fondo: sin `desc` no se escribe la
              // clave, en lugar de mandarla como `undefined`.
              ...(datos.favoriteCharacterDesc.trim()
                ? { desc: datos.favoriteCharacterDesc.trim() }
                : {}),
            }
          : null,
        favoriteCharacters: personajesOk,
        // `null` son todas: se guarda tal cual y los lectores lo
        // entienden igual que la ausencia (cuentas antiguas).
        visibleBadgeIds: datos.visibleBadgeIds,
        featuredPostIds: (datos.featuredPostIds ?? []).filter((id) =>
          hilosPropios.some((h) => h.id === id),
        ),
        // Sin fondo es null (campo ausente = fondo del sitio).
        profileBackground: fondo,
        decorations: decoracionesOk.map((d) => ({
          id: d.id,
          kind: d.kind,
          ref: d.ref,
          x: d.x,
          y: d.y,
          size: d.size,
        })),
        showcases: vitrinasOk.length > 0 ? vitrinasOk : [...VITRINAS_POR_DEFECTO],
      });

      // El título va por su propio camino (`equipar`), que es el
      // que comprueba que la medalla esté desbloqueada de verdad.
      if ((datos.equippedTitle ?? null) !== (currentUser.equippedTitle ?? null)) {
        await equipar(datos.equippedTitle ?? null);
      }

      if (avatarAnterior && avatarAnterior !== avatarNuevo) {
        deleteReplacedImage(avatarAnterior, avatarNuevo);
      }
      if (bannerAnterior && bannerAnterior !== bannerNuevo) {
        deleteReplacedImage(bannerAnterior, bannerNuevo);
      }

      setGuardado(true);
      window.setTimeout(onCerrar, 900);
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const puedeBannerPropio = desbloqueadoPorNivel(BANNER_PROPIO_NIVEL, level);

  return (
    <>
      {avatarSinRecortar && (
        <CropEditor
          file={avatarSinRecortar}
          aspectRatio={1}
          forma="circular"
          maximo={512}
          titulo="Recortar tu avatar"
          initial={datos.avatarCrop ?? undefined}
          onCancelar={() => setAvatarSinRecortar(null)}
          onGuardar={(fichero, ajustes) => alSubirAvatar(fichero, ajustes)}
        />
      )}

      {bannerSinRecortar && (
        <CropEditor
          file={bannerSinRecortar}
          aspectRatio={3}
          forma="rectangular"
          maximo={1200}
          titulo="Recortar tu banner"
          onCancelar={() => setBannerSinRecortar(null)}
          onGuardar={(fichero) => alSubirBanner(fichero)}
        />
      )}

      {fondoSinRecortar && (
        <CropEditor
          file={fondoSinRecortar}
          aspectRatio={16 / 9}
          forma="rectangular"
          maximo={1920}
          titulo="Recortar tu fondo"
          onCancelar={() => setFondoSinRecortar(null)}
          onGuardar={(fichero) => alSubirFondo(fichero)}
        />
      )}

      {pjSinRecortar && (
        <CropEditor
          file={pjSinRecortar}
          aspectRatio={1}
          forma="rectangular"
          maximo={512}
          titulo="Recortar la imagen del personaje"
          onCancelar={() => setPjSinRecortar(null)}
          onGuardar={(fichero) => alSubirPersonaje(fichero)}
        />
      )}

      <div
        className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={guardando || subiendo ? undefined : onCerrar}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Personalizar perfil"
          onClick={(e) => e.stopPropagation()}
          className="flex h-[100dvh] max-h-none w-full flex-col overflow-hidden border border-white/[0.06] bg-[#0c0c14] shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-3xl"
        >
          {/* ── Cabecera ─────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles size={15} className="text-violet-400" />
              Personalizar perfil
              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-400">
                Nv. {level}
              </span>
            </h2>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Vista previa ─────────────────────────── */}
          <div className="shrink-0 border-b border-white/[0.06] px-5 py-3">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
              {bannerVista.tipo === 'url' ? (
                <img
                  src={bannerVista.url}
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-full object-cover"
                />
              ) : (
                <div aria-hidden="true" style={{ background: bannerVista.css }} className="h-16 w-full" />
              )}
              <div className="flex items-center gap-3 bg-[#080810]/95 p-3">
                <img
                  src={vistaPrevia.avatarUrl || avatarPorDefecto}
                  alt=""
                  aria-hidden="true"
                  style={{ boxShadow: `0 0 0 3px ${colorVista}55` }}
                  className={`h-12 w-12 rounded-2xl object-cover ring-2 ${marcoVista}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {vistaPrevia.displayName || currentUser.username || 'Usuario'}
                  </p>
                  {tituloVista ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-px text-[10px] font-bold text-amber-300">
                      <Sparkles size={9} />
                      {tituloVista}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-zinc-600">Sin título</p>
                  )}
                </div>
                {vistaPrevia.favoriteCharacter && (
                  <p className="ml-auto hidden items-center gap-1.5 text-[10px] text-zinc-400 sm:flex">
                    {vistaPrevia.favoriteCharacter.imageUrl && (
                      <img
                        src={vistaPrevia.favoriteCharacter.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6 rounded-lg object-cover"
                      />
                    )}
                    <span className="max-w-24 truncate font-semibold text-zinc-300">
                      {vistaPrevia.favoriteCharacter.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Pestañas ─────────────────────────────── */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPestana(p.id)}
                aria-pressed={pestana === p.id}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  pestana === p.id
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300'
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>

          {/* ── Cuerpo ─────────────────────────────── */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {pestana === 'apariencia' && (
              <>
                {/* BANNER */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Banner
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {BANNERS_PERFIL.map((b) => {
                      const desbloqueado = desbloqueadoPorNivel(b.nivelMinimo, level);
                      const elegido = datos.bannerUrl === `${PREFIJO_BANNER}${b.id}` || (b.id === BANNER_PREDETERMINADO_ID && datos.bannerUrl === '');
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() =>
                            cambiar('bannerUrl', b.id === BANNER_PREDETERMINADO_ID ? '' : `${PREFIJO_BANNER}${b.id}`)
                          }
                          title={desbloqueado ? b.nombre : `${b.nombre} (nivel ${b.nivelMinimo})`}
                          className={`relative h-14 overflow-hidden rounded-xl border-2 transition-all ${
                            elegido
                              ? 'scale-[1.02] border-violet-500 shadow-md shadow-violet-500/30'
                              : desbloqueado
                                ? 'border-white/[0.06] opacity-80 hover:opacity-100'
                                : 'cursor-not-allowed border-white/[0.06] opacity-40'
                          }`}
                        >
                          <span aria-hidden="true" style={{ background: b.css }} className="absolute inset-0" />
                          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-0.5 text-[10px] font-bold text-white">
                            {!desbloqueado && <Lock size={9} />}
                            {b.nombre}
                            {!desbloqueado && ` · Nv. ${b.nivelMinimo}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Banner propio */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    O sube el tuyo {!puedeBannerPropio && `(nivel ${BANNER_PROPIO_NIVEL})`}
                  </label>
                  {!puedeBannerPropio ? (
                    <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.06] bg-[#080810]/85 px-3 py-2.5 text-[11px] text-zinc-500">
                      <Lock size={12} className="flex-shrink-0" />
                      Subir un banner propio se desbloquea en el nivel {BANNER_PROPIO_NIVEL}.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#080810] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                        <ImagePlus size={14} />
                        Subir banner
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const elegido = e.target.files?.[0];
                            e.target.value = '';
                            if (!elegido) return;
                            // El GIF se sube tal cual, sin recorte.
                            if (esGif(elegido)) {
                              void alSubirBannerDirecto(elegido);
                              return;
                            }
                            setBannerSinRecortar(elegido);
                          }}
                        />
                      </label>
                      <input
                        type="url"
                        value={datos.bannerUrl.startsWith(PREFIJO_BANNER) ? '' : datos.bannerUrl}
                        onChange={(e) => cambiar('bannerUrl', e.target.value)}
                        placeholder="https://..."
                        className={`min-w-0 flex-1 rounded-xl border bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                          errores.bannerUrl ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                        }`}
                      />
                    </div>
                  )}
                  {errores.bannerUrl && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.bannerUrl}</p>
                  )}
                  {datos.bannerUrl && !datos.bannerUrl.startsWith(PREFIJO_BANNER) && (
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Banner personalizado en uso.
                      <button
                        type="button"
                        onClick={() => cambiar('bannerUrl', '')}
                        className="ml-2 font-bold text-violet-400 hover:text-violet-300"
                      >
                        Quitar
                      </button>
                    </p>
                  )}
                </div>

                {/* AVATAR */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={datos.avatarUrl || avatarPorDefecto}
                      alt="Tu avatar"
                      onError={(e) => {
                        e.currentTarget.src = avatarPorDefecto;
                      }}
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-zinc-800"
                    />
                    {subiendo && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#080810]/70">
                        <Loader2 size={18} className="animate-spin text-violet-400" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#080810] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                      <ImagePlus size={14} />
                      Subir una imagen
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const elegido = e.target.files?.[0];
                          e.target.value = '';
                          if (!elegido) return;
                          // El GIF se sube tal cual, sin recorte.
                          if (esGif(elegido)) {
                            void alSubirAvatarDirecto(elegido);
                            return;
                          }
                          setAvatarSinRecortar(elegido);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    O elige uno de los de siempre
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_PRESETS.map((url) => {
                      const elegido = datos.avatarUrl === url;
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => cambiar('avatarUrl', url)}
                          aria-label={`Usar este avatar${elegido ? ' (seleccionado)' : ''}`}
                          aria-pressed={elegido}
                          className={`relative h-14 w-14 overflow-hidden rounded-2xl border-2 transition-all ${
                            elegido
                              ? 'scale-105 border-violet-500 shadow-md shadow-violet-500/30'
                              : 'border-white/[0.06] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {elegido && (
                            <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-[9px] text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    O pega la URL de una imagen
                  </label>
                  <input
                    type="url"
                    value={datos.avatarUrl}
                    onChange={(e) => cambiar('avatarUrl', e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-xl border bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                      errores.avatarUrl ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                    }`}
                  />
                  {errores.avatarUrl && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.avatarUrl}</p>
                  )}
                </div>

                {/* COLOR */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Color de perfil
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {COLORES_PERFIL.map((c) => {
                      const desbloqueado = desbloqueadoPorNivel(c.nivelMinimo, level);
                      const elegido = datos.profileColor.toLowerCase() === c.hex;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() => cambiar('profileColor', c.hex)}
                          title={desbloqueado ? c.nombre : `${c.nombre} (nivel ${c.nivelMinimo})`}
                          aria-label={`${c.nombre}${elegido ? ' (seleccionado)' : ''}`}
                          aria-pressed={elegido}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all ${
                            elegido
                              ? 'scale-105 border-white shadow-md'
                              : desbloqueado
                                ? 'border-white/[0.06] hover:scale-105'
                                : 'cursor-not-allowed border-white/[0.06] opacity-40'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {!desbloqueado ? (
                            <Lock size={12} className="text-white drop-shadow" />
                          ) : (
                            elegido && <Check size={14} className="text-white drop-shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errores.profileColor && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.profileColor}</p>
                  )}
                </div>

                {/* MARCO */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Marco del avatar
                  </label>
                  <div className="space-y-2">
                    {MARCOS_AVATAR.map((m) => {
                      const desbloqueado = desbloqueadoPorNivel(m.nivelMinimo, level);
                      const elegido = (datos.avatarFrame ?? null) === (m.id === 'ninguno' ? null : m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() => cambiar('avatarFrame', m.id === 'ninguno' ? null : m.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                            elegido
                              ? 'border-violet-500/60 bg-violet-500/10'
                              : desbloqueado
                                ? 'border-white/[0.06] bg-[#080810] hover:border-white/[0.1]'
                                : 'cursor-not-allowed border-white/[0.06] bg-[#080810] opacity-50'
                          }`}
                        >
                          <img
                            src={datos.avatarUrl || avatarPorDefecto}
                            alt=""
                            aria-hidden="true"
                            className={`h-9 w-9 rounded-xl object-cover ring-2 ${m.clase}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-zinc-200">{m.nombre}</span>
                            <span className="block text-[10px] text-zinc-500">
                              {desbloqueado ? 'Disponible' : `Nivel ${m.nivelMinimo}`}
                            </span>
                          </span>
                          {!desbloqueado && <Lock size={13} className="text-zinc-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {errores.avatarFrame && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.avatarFrame}</p>
                  )}
                </div>
              </>
            )}

            {pestana === 'fondos' && (
              <>
                {/* GALERÍA */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Fondo de página
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        cambiar('backgroundPreset', '');
                        cambiar('backgroundUrl', '');
                      }}
                      title="Fondo del sitio"
                      className={`relative flex h-14 items-center justify-center overflow-hidden rounded-xl border-2 transition-all ${
                        datos.backgroundPreset === '' && datos.backgroundUrl === ''
                          ? 'scale-[1.02] border-violet-500 shadow-md shadow-violet-500/30'
                          : 'border-white/[0.06] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span aria-hidden="true" className="absolute inset-0 bg-[#080810]" />
                      <span className="relative text-[10px] font-bold text-zinc-300">
                        Ninguno (el del sitio)
                      </span>
                    </button>
                    {BANNERS_PERFIL.map((b) => {
                      const desbloqueado = desbloqueadoPorNivel(b.nivelMinimo, level);
                      const elegido =
                        datos.backgroundPreset === b.id && datos.backgroundUrl === '';
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() => {
                            cambiar('backgroundPreset', b.id);
                            cambiar('backgroundUrl', '');
                          }}
                          title={desbloqueado ? b.nombre : `${b.nombre} (nivel ${b.nivelMinimo})`}
                          className={`relative h-14 overflow-hidden rounded-xl border-2 transition-all ${
                            elegido
                              ? 'scale-[1.02] border-violet-500 shadow-md shadow-violet-500/30'
                              : desbloqueado
                                ? 'border-white/[0.06] opacity-80 hover:opacity-100'
                                : 'cursor-not-allowed border-white/[0.06] opacity-40'
                          }`}
                        >
                          <span aria-hidden="true" style={{ background: b.css }} className="absolute inset-0" />
                          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-0.5 text-[10px] font-bold text-white">
                            {!desbloqueado && <Lock size={9} />}
                            {b.nombre}
                            {!desbloqueado && ` · Nv. ${b.nivelMinimo}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errores.backgroundPreset && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.backgroundPreset}</p>
                  )}
                </div>

                {/* FONDO PROPIO */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    O sube el tuyo {!puedeBannerPropio && `(nivel ${BANNER_PROPIO_NIVEL})`}
                  </label>
                  {!puedeBannerPropio ? (
                    <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/[0.06] bg-[#080810]/85 px-3 py-2.5 text-[11px] text-zinc-500">
                      <Lock size={12} className="flex-shrink-0" />
                      Subir un fondo propio se desbloquea en el nivel {BANNER_PROPIO_NIVEL}.
                      Los GIF animados valen si son imagen de verdad.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#080810] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                        <ImagePlus size={14} />
                        Subir fondo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const elegido = e.target.files?.[0];
                            e.target.value = '';
                            if (!elegido) return;
                            // El GIF se sube tal cual, sin pasar por el
                            // recorte: el canvas solo guarda el primer
                            // fotograma y mataría la animación. El fondo
                            // se encuadra solo con `object-cover`.
                            if (esGif(elegido)) {
                              void alSubirFondoDirecto(elegido);
                              return;
                            }
                            setFondoSinRecortar(elegido);
                          }}
                        />
                      </label>
                      <input
                        type="url"
                        value={datos.backgroundUrl}
                        onChange={(e) => {
                          cambiar('backgroundUrl', e.target.value);
                          if (e.target.value.trim()) cambiar('backgroundPreset', '');
                        }}
                        placeholder="https://..."
                        className={`min-w-0 flex-1 rounded-xl border bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                          errores.backgroundUrl ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                        }`}
                      />
                    </div>
                  )}
                  {errores.backgroundUrl && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.backgroundUrl}</p>
                  )}
                </div>

                {/* PRESENTACIÓN */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Posición
                    </label>
                    <div className="flex gap-1.5">
                      {POSICIONES_FONDO.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => cambiar('backgroundPosition', pos)}
                          aria-pressed={datos.backgroundPosition === pos}
                          className={`flex-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                            datos.backgroundPosition === pos
                              ? 'border-violet-500/60 bg-violet-500/10 text-white'
                              : 'border-white/[0.06] bg-[#080810] text-zinc-400 hover:border-white/[0.1]'
                          }`}
                        >
                          {pos === 'center' ? 'Centro' : pos === 'top' ? 'Arriba' : 'Abajo'}
                        </button>
                      ))}
                    </div>
                    {errores.backgroundPosition && (
                      <p className="mt-1 text-[10px] text-red-400">{errores.backgroundPosition}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <span>Oscurecido</span>
                      <span className="font-mono normal-case text-zinc-500">{datos.backgroundDim}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={DIM_MAXIMO}
                      step={10}
                      value={datos.backgroundDim}
                      onChange={(e) => cambiar('backgroundDim', Number(e.target.value))}
                      aria-label="Oscurecido del fondo"
                      className="w-full accent-violet-500"
                    />
                    {errores.backgroundDim && (
                      <p className="mt-1 text-[10px] text-red-400">{errores.backgroundDim}</p>
                    )}
                  </div>
                </div>

                {/* VISTA PREVIA DEL FONDO */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Cómo se verá
                  </label>
                  <div className="relative h-24 overflow-hidden rounded-2xl border border-white/[0.06]">
                    {(() => {
                      const vista = fondoDePerfil(
                        {
                          preset: datos.backgroundPreset || undefined,
                          url: datos.backgroundUrl.trim() || undefined,
                          position: datos.backgroundPosition as 'center' | 'top' | 'bottom',
                          dim: datos.backgroundDim,
                        },
                        level,
                      );
                      if (vista.tipo === 'ninguno') {
                        return (
                          <span className="flex h-full items-center justify-center bg-[#080810] text-[11px] text-zinc-600">
                            Fondo del sitio
                          </span>
                        );
                      }
                      return (
                        <>
                          {vista.tipo === 'preset' ? (
                            <span aria-hidden="true" style={{ background: vista.css }} className="absolute inset-0" />
                          ) : (
                            <img
                              src={vista.url}
                              alt=""
                              aria-hidden="true"
                              style={{ objectPosition: `center ${vista.position}` }}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          )}
                          {vista.tipo === 'url' && (
                            <span aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: vista.dim / 100 }} />
                          )}
                          <span className="absolute inset-x-0 bottom-1 text-center text-[11px] font-bold text-white drop-shadow">
                            Así se lee el texto encima
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {pestana === 'decoracion' && (
              <>
                <p className="-mt-2 text-[11px] text-zinc-500">
                  Hasta {MAX_DECORACIONES} elementos sobre tu cabecera, tal cual se
                  verá: arrastra en el lienzo o usa las posiciones fijas; en el
                  móvil, los botones de mover.
                </p>

                {/* LIENZO: la cabecera de verdad, encogida.
                    No es una imitación con estructura fija: es
                    `ProfileHeader` con el borrador, al que se le
                    aplica `zoom` para que quepa. Si añades
                    personaje favorito, bio o título, la tarjeta
                    crece aquí igual que en el perfil, y las
                    posiciones en % caen en el mismo sitio. Lo que
                    se ve lo pinta su propia capa (la misma del
                    perfil); encima van zonas de agarre invisibles
                    para arrastrar. */}
                <div
                  ref={marcoRef}
                  className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c14]/95"
                >
                  {anchoMarco > 0 && (
                    <div
                      ref={lienzoRef}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ width: 768, zoom: escalaLienzo }}
                      className="relative touch-none select-none"
                    >
                      <div className="pointer-events-none">
                        <ProfileHeader
                          perfil={vistaPrevia}
                          esPropio={false}
                          seguidores={undefined}
                          seguidos={undefined}
                          onVerLista={() => {}}
                          onEditar={undefined}
                          avatarPorDefecto={avatarPorDefecto}
                          config={config}
                        />
                      </div>
                      {(datos.decorations ?? []).map((d) => {
                        const px = TAMANOS_DECORACION[d.size];
                        const sel = decoracionSel === d.id;
                        return (
                          <span
                            key={d.id}
                            data-decor-id={d.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Mover decoración ${d.ref}`}
                            onPointerDown={(e) => alAgarrar(e, d.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowLeft') moverDecoracion(d.id, -2, 0);
                              if (e.key === 'ArrowRight') moverDecoracion(d.id, 2, 0);
                              if (e.key === 'ArrowUp') moverDecoracion(d.id, 0, -2);
                              if (e.key === 'ArrowDown') moverDecoracion(d.id, 0, 2);
                            }}
                            style={{
                              left: `${d.x}%`,
                              top: `${d.y}%`,
                              width: px,
                              height: px,
                              transform: 'translate(-50%,-50%)',
                            }}
                            className={`pointer-events-auto absolute flex cursor-move items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 ${
                              sel
                                ? 'bg-violet-500/20 outline outline-2 outline-violet-400'
                                : 'hover:bg-white/5'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SELECCIONADA */}
                {(() => {
                  const sel = (datos.decorations ?? []).find((d) => d.id === decoracionSel);
                  if (!sel) {
                    return (
                      <p className="text-[11px] text-zinc-500">
                        Toca un elemento del lienzo para moverlo, cambiarle el tamaño o
                        quitarlo. Añade abajo.
                      </p>
                    );
                  }
                  return (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#080810]/95 p-3">
                      <span className="text-xs font-bold text-zinc-300">Tamaño:</span>
                      {(['s', 'm', 'l'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => tocarDecoracion(sel.id, { size: t })}
                          aria-pressed={sel.size === t}
                          className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${
                            sel.size === t
                              ? 'border-violet-500/60 bg-violet-500/10 text-white'
                              : 'border-white/[0.06] text-zinc-400'
                          }`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                      <span className="mx-1 h-5 w-px bg-white/[0.04]" aria-hidden="true" />
                      <div className="flex gap-1" role="group" aria-label="Mover">
                        {(
                          [
                            ['←', -2, 0],
                            ['→', 2, 0],
                            ['↑', 0, -2],
                            ['↓', 0, 2],
                          ] as const
                        ).map(([etiqueta, dx, dy]) => (
                          <button
                            key={etiqueta}
                            type="button"
                            onClick={() => moverDecoracion(sel.id, dx, dy)}
                            aria-label={`Mover ${etiqueta}`}
                            className="rounded-lg border border-white/[0.06] px-2 py-1 text-[11px] text-zinc-300 hover:border-white/[0.15]"
                          >
                            {etiqueta}
                          </button>
                        ))}
                      </div>
                      <span className="mx-1 h-5 w-px bg-white/[0.04]" aria-hidden="true" />
                      <select
                        aria-label="Posición predefinida"
                        value=""
                        onChange={(e) => {
                          const pos = POSICIONES_PREDEFINIDAS.find((p) => p.id === e.target.value);
                          if (pos) tocarDecoracion(sel.id, { x: pos.x, y: pos.y });
                        }}
                        className="rounded-lg border border-white/[0.06] bg-[#080810] px-2 py-1 text-[11px] text-zinc-300"
                      >
                        <option value="">Mover a…</option>
                        {POSICIONES_PREDEFINIDAS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => quitarDecoracion(sel.id)}
                        className="ml-auto rounded-lg border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/10"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                })()}

                {/* PEGATINAS */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Pegatinas ({(datos.decorations ?? []).length}/{MAX_DECORACIONES})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PEGATINAS.map((p) => {
                      const desbloqueado = desbloqueadoPorNivel(p.nivelMinimo, level);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() => anadirDecoracion('sticker', p.id)}
                          title={desbloqueado ? p.nombre : `${p.nombre} (nivel ${p.nivelMinimo})`}
                          className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-all ${
                            desbloqueado
                              ? 'border-white/[0.06] bg-[#080810] hover:border-violet-500/50 hover:scale-105'
                              : 'cursor-not-allowed border-white/[0.06] opacity-40'
                          }`}
                        >
                          {p.emoji}
                          {!desbloqueado && (
                            <Lock size={9} className="absolute bottom-0.5 right-0.5 text-zinc-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IMAGEN PROPIA */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    O una imagen tuya (https)
                  </label>
                  <div className="flex gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#080810] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                      <ImagePlus size={13} />
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const elegido = e.target.files?.[0];
                          e.target.value = '';
                          if (!elegido) return;
                          setSubiendo(true);
                          setErrorGeneral(null);
                          try {
                            const url = await uploadCommunityImage(elegido, currentUser.uid);
                            anadirDecoracion('image', url);
                          } catch (err) {
                            setErrorGeneral(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
                          } finally {
                            setSubiendo(false);
                          }
                        }}
                      />
                    </label>
                    <input
                      id="decoracion-url"
                      type="url"
                      placeholder="https://..."
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (/^https:\/\//.test(v)) {
                          anadirDecoracion('image', v);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    Pega la URL y pulsa Intro. Solo https, como el resto del perfil.
                  </p>
                </div>

                {/* MEDALLAS */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Tus medallas, de adorno
                  </label>
                  {desbloqueadas.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">Aún no tienes medallas.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {desbloqueadas.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => anadirDecoracion('medal', m.id)}
                          title={m.nombre}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-[#080810] text-xl transition-all hover:border-violet-500/50 hover:scale-105"
                        >
                          {m.icono}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {errores.decorations && (
                  <p className="text-[10px] text-red-400">{errores.decorations}</p>
                )}
              </>
            )}

            {pestana === 'vitrinas' && (
              <div>
                <p className="mb-2 text-[11px] text-zinc-500">
                  Añade, quita y ordena (arrastra o usa las flechas). Sin
                  vitrinas se ven logros + destacadas, como siempre.
                </p>
                <div className="space-y-2">
                  {VITRINAS.map((v) => {
                    const activa = (datos.showcases ?? []).includes(v.id);
                    const desbloqueado = desbloqueadoPorNivel(v.nivelMinimo, level);
                    const orden = (datos.showcases ?? []).indexOf(v.id);
                    return (
                      <div
                        key={v.id}
                        draggable={activa && desbloqueado}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/vitrina', v.id);
                        }}
                        onDragOver={(e) => {
                          if (activa) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const origen = e.dataTransfer.getData('text/vitrina') as TipoVitrina;
                          const actual = datos.showcases ?? [];
                          if (!origen || !actual.includes(origen) || origen === v.id) return;
                          const sinOrigen = actual.filter((x) => x !== origen);
                          const destino = sinOrigen.indexOf(v.id);
                          sinOrigen.splice(destino + 1, 0, origen);
                          cambiar('showcases', sinOrigen);
                        }}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                          activa
                            ? 'border-violet-500/40 bg-violet-500/5'
                            : 'border-white/[0.06] bg-[#080810] opacity-70'
                        } ${!desbloqueado ? 'opacity-50' : ''}`}
                      >
                        <button
                          type="button"
                          disabled={!desbloqueado}
                          onClick={() => alternarVitrina(v.id)}
                          aria-pressed={activa}
                          title={desbloqueado ? v.nombre : `${v.nombre} (nivel ${v.nivelMinimo})`}
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border text-[11px] ${
                            activa
                              ? 'border-violet-500 bg-violet-600 font-mono font-bold text-white'
                              : 'border-white/[0.1] text-transparent'
                          }`}
                        >
                          {activa ? orden + 1 : '✓'}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                            {v.nombre}
                            {!desbloqueado && <Lock size={10} className="text-zinc-500" />}
                          </span>
                          <span className="block truncate text-[10px] text-zinc-500">
                            {desbloqueado ? v.descripcion : `Nivel ${v.nivelMinimo}`}
                          </span>
                        </span>
                        {activa && (
                          <span className="flex flex-shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => moverVitrina(v.id, -1)}
                              aria-label={`Subir ${v.nombre}`}
                              className="rounded-lg border border-white/[0.06] px-1.5 py-0.5 text-[11px] text-zinc-300 hover:border-white/[0.15]"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moverVitrina(v.id, 1)}
                              aria-label={`Bajar ${v.nombre}`}
                              className="rounded-lg border border-white/[0.06] px-1.5 py-0.5 text-[11px] text-zinc-300 hover:border-white/[0.15]"
                            >
                              ↓
                            </button>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errores.showcases && (
                  <p className="mt-1 text-[10px] text-red-400">{errores.showcases}</p>
                )}
              </div>
            )}

            {pestana === 'info' && (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    value={`@${currentUser.username || 'usuario'}`}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-white/[0.04] bg-black/40 px-3.5 py-2.5 font-mono text-xs text-zinc-400"
                  />
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Es tu identificador único y permanente. No se puede cambiar.
                    Sirve para menciones, búsquedas y enlaces al perfil.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre visible
                  </label>
                  <input
                    type="text"
                    value={datos.displayName}
                    onChange={(e) => cambiar('displayName', e.target.value)}
                    maxLength={DISPLAY_NAME_MAX}
                    disabled={!puedeCambiarNombre && currentUser.role !== 'admin'}
                    className={`w-full rounded-xl border bg-[#080810] px-3.5 py-2.5 text-xs text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      errores.displayName ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                    }`}
                  />
                  {errores.displayName ? (
                    <p className="mt-1 text-[10px] text-red-400">{errores.displayName}</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Es lo que ven los demás. Puede repetirse con otras personas.
                      {fechaSiguienteNombre
                        ? ` Podrás cambiarlo de nuevo el ${fechaSiguienteNombre}.`
                        : ' Podrás cambiarlo cuando quieras (con un máximo de un cambio cada 7 días).'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Biografía</span>
                    <span
                      className={`font-mono normal-case ${
                        datos.bio.length > 280 ? 'text-amber-400' : 'text-zinc-600'
                      }`}
                    >
                      {datos.bio.length}/300
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={datos.bio}
                    onChange={(e) => cambiar('bio', e.target.value)}
                    placeholder="Manga, anime y cyberpunk."
                    className={`w-full rounded-xl border bg-[#080810] p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                      errores.bio ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                    }`}
                  />
                  {errores.bio && <p className="mt-1 text-[10px] text-red-400">{errores.bio}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Anime o serie favorita
                  </label>
                  <input
                    type="text"
                    value={datos.favoriteAnime}
                    onChange={(e) => cambiar('favoriteAnime', e.target.value)}
                    placeholder="Kaguya-sama: Love is War"
                    className={`w-full rounded-xl border bg-[#080810] px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                      errores.favoriteAnime ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                    }`}
                  />
                  {errores.favoriteAnime && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.favoriteAnime}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Personaje favorito
                  </label>
                  <div className="flex items-center gap-3">
                    {datos.favoriteCharacterImage ? (
                      <img
                        src={datos.favoriteCharacterImage}
                        alt=""
                        aria-hidden="true"
                        className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover ring-2 ring-zinc-800"
                      />
                    ) : (
                      <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/[0.06] text-[10px] text-zinc-600">
                        Sin imagen
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="text"
                        value={datos.favoriteCharacterName}
                        onChange={(e) => cambiar('favoriteCharacterName', e.target.value)}
                        placeholder="Nombre del personaje"
                        className={`w-full rounded-xl border bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                          errores.favoriteCharacterName ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                        }`}
                      />
                      <div className="flex gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#080810] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-white">
                          <ImagePlus size={13} />
                          Subir
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const elegido = e.target.files?.[0];
                              e.target.value = '';
                              if (!elegido) return;
                              // El GIF se sube tal cual, sin recorte.
                              if (esGif(elegido)) {
                                void alSubirPersonajeDirecto(elegido, -1);
                                return;
                              }
                              setSubidaPj(-1);
                              setPjSinRecortar(elegido);
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          value={datos.favoriteCharacterImage}
                          onChange={(e) => cambiar('favoriteCharacterImage', e.target.value)}
                          placeholder="https://..."
                          className={`min-w-0 flex-1 rounded-xl border bg-[#080810] px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                            errores.favoriteCharacterImage ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  {errores.favoriteCharacterName && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.favoriteCharacterName}</p>
                  )}
                  {errores.favoriteCharacterImage && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.favoriteCharacterImage}</p>
                  )}
                  <label className="mb-1 mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Por qué es tu favorito</span>
                    <span className="font-mono normal-case text-zinc-600">
                      {datos.favoriteCharacterDesc.length}/{MAX_DESC_PERSONAJE}
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={datos.favoriteCharacterDesc}
                    onChange={(e) => cambiar('favoriteCharacterDesc', e.target.value)}
                    placeholder="Lo que le hace especial para ti."
                    className={`w-full rounded-xl border bg-[#080810] p-3 text-xs text-white placeholder-zinc-600 focus:outline-none ${
                      errores.favoriteCharacterDesc ? 'border-red-500/50' : 'border-white/[0.06] focus:border-violet-500'
                    }`}
                  />
                  {errores.favoriteCharacterDesc && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.favoriteCharacterDesc}</p>
                  )}
                </div>

                {/* VITRINA DE PERSONAJES */}
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Personajes de la vitrina</span>
                    <span className="font-mono normal-case text-zinc-500">
                      {(datos.favoriteCharacters ?? []).length}/{MAX_PERSONAJES}
                    </span>
                  </label>
                  <div className="space-y-2">
                    {(datos.favoriteCharacters ?? []).map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#080810]/95 p-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSubidaPj(i);
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = () => {
                              const f = input.files?.[0];
                              if (!f) return;
                              // El GIF se sube tal cual, sin recorte.
                              if (esGif(f)) {
                                void alSubirPersonajeDirecto(f, i);
                                return;
                              }
                              setPjSinRecortar(f);
                            };
                            input.click();
                          }}
                          title="Subir imagen"
                          className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c14]"
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-zinc-600">
                              <ImagePlus size={14} />
                            </span>
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) =>
                              setDatos((prev) => ({
                                ...prev,
                                favoriteCharacters: (prev.favoriteCharacters ?? []).map((x, j) =>
                                  j === i ? { ...x, name: e.target.value } : x,
                                ),
                              }))
                            }
                            placeholder="Nombre"
                            aria-label={`Nombre del personaje ${i + 1}`}
                            className="w-full rounded-lg border border-white/[0.06] bg-[#080810] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                          />
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={p.serie}
                              onChange={(e) =>
                                setDatos((prev) => ({
                                  ...prev,
                                  favoriteCharacters: (prev.favoriteCharacters ?? []).map((x, j) =>
                                    j === i ? { ...x, serie: e.target.value } : x,
                                  ),
                                }))
                              }
                              placeholder="Serie (opcional)"
                              aria-label={`Serie del personaje ${i + 1}`}
                              className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#080810] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                            />
                            <input
                              type="url"
                              value={p.imageUrl}
                              onChange={(e) =>
                                setDatos((prev) => ({
                                  ...prev,
                                  favoriteCharacters: (prev.favoriteCharacters ?? []).map((x, j) =>
                                    j === i ? { ...x, imageUrl: e.target.value } : x,
                                  ),
                                }))
                              }
                              placeholder="https://..."
                              aria-label={`Imagen del personaje ${i + 1}`}
                              className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#080810] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDatos((prev) => ({
                              ...prev,
                              favoriteCharacters: (prev.favoriteCharacters ?? []).filter((_, j) => j !== i),
                            }))
                          }
                          aria-label={`Quitar personaje ${i + 1}`}
                          className="flex-shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(datos.favoriteCharacters ?? []).length < MAX_PERSONAJES && (
                    <button
                      type="button"
                      onClick={() =>
                        setDatos((prev) => ({
                          ...prev,
                          favoriteCharacters: [
                            ...(prev.favoriteCharacters ?? []),
                            { name: '', imageUrl: '', serie: '' },
                          ],
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-dashed border-white/[0.1] px-3 py-2 text-xs font-bold text-zinc-400 transition-colors hover:border-violet-500/50 hover:text-white"
                    >
                      + Añadir personaje
                    </button>
                  )}
                  {errores.favoriteCharacters && (
                    <p className="mt-1 text-[10px] text-red-400">{errores.favoriteCharacters}</p>
                  )}
                </div>
              </>
            )}

            {pestana === 'titulos' && (
              <div>
                {desbloqueadas.some((m) => m.titulo) ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => cambiar('equippedTitle', null)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        datos.equippedTitle === null
                          ? 'border-violet-500/60 bg-violet-500/10 text-white'
                          : 'border-white/[0.06] bg-[#080810] text-zinc-400 hover:border-white/[0.1]'
                      }`}
                    >
                      <span className="text-base">✕</span>
                      Sin título
                    </button>
                    {desbloqueadas
                      .filter((m) => m.titulo)
                      .map((m) => {
                        const estilo = ESTILO_RAREZA[m.rareza];
                        const elegido = datos.equippedTitle === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => cambiar('equippedTitle', m.id)}
                            className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                              elegido
                                ? `${estilo.borde} ${estilo.fondo}`
                                : 'border-white/[0.06] bg-[#080810] hover:border-white/[0.1]'
                            }`}
                          >
                            <span className="text-lg">{m.icono}</span>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-xs font-bold ${elegido ? 'text-white' : 'text-zinc-300'}`}>
                                {m.titulo ?? m.nombre}
                              </span>
                              <span className="block truncate text-[10px] text-zinc-500">
                                {m.descripcion}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/[0.06] bg-[#080810]/85 px-4 py-8 text-center text-xs text-zinc-500">
                    Todavía no tienes ningún título. Consigue medallas con título
                    participando en la comunidad.
                  </p>
                )}
              </div>
            )}

            {pestana === 'insignias' && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-zinc-500">
                    Elige cuáles ven los visitantes
                    {(() => {
                      const efectivas =
                        datos.visibleBadgeIds ?? desbloqueadas.map((m) => m.id);
                      return (
                        <span
                          className={`ml-1 font-mono ${
                            efectivas.length > MAX_INSIGNIAS_VISIBLES
                              ? 'font-bold text-red-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          ({efectivas.length}/{MAX_INSIGNIAS_VISIBLES})
                        </span>
                      );
                    })()}
                  </p>
                  <button
                    type="button"
                    onClick={() => cambiar('visibleBadgeIds', null)}
                    disabled={desbloqueadas.length > MAX_INSIGNIAS_VISIBLES}
                    title={
                      desbloqueadas.length > MAX_INSIGNIAS_VISIBLES
                        ? `Tienes ${desbloqueadas.length} desbloqueadas: elige cuáles ${MAX_INSIGNIAS_VISIBLES} mostrar`
                        : 'Mostrar todas'
                    }
                    className={`flex-shrink-0 text-[11px] font-bold transition-colors ${
                      desbloqueadas.length > MAX_INSIGNIAS_VISIBLES
                        ? 'cursor-not-allowed text-zinc-600'
                        : 'text-violet-400 hover:text-violet-300'
                    }`}
                  >
                    Mostrar todas
                  </button>
                </div>
                {(() => {
                  const efectivas =
                    datos.visibleBadgeIds ?? desbloqueadas.map((m) => m.id);
                  return efectivas.length > MAX_INSIGNIAS_VISIBLES ? (
                    <p className="mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-400">
                      Tienes {efectivas.length} marcadas. Quita hasta quedarte con{' '}
                      {MAX_INSIGNIAS_VISIBLES} para poder guardar.
                    </p>
                  ) : null;
                })()}
                {desbloqueadas.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/[0.06] bg-[#080810]/85 px-4 py-8 text-center text-xs text-zinc-500">
                    Todavía no tienes medallas. Publica, comenta y participa para
                    conseguirlas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {desbloqueadas.map((m) => {
                      const estilo = ESTILO_RAREZA[m.rareza];
                      const marcada =
                        datos.visibleBadgeIds === null || datos.visibleBadgeIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => alternarInsignia(m.id)}
                          aria-pressed={marcada}
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                            marcada
                              ? `${estilo.borde} ${estilo.fondo}`
                              : 'border-white/[0.06] bg-[#080810] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <span className="text-lg">{m.icono}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-zinc-200">
                              {m.nombre}
                            </span>
                            <span className="block truncate text-[10px] text-zinc-500">
                              {m.descripcion}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-[11px] ${
                              marcada
                                ? 'border-violet-500 bg-violet-600 text-white'
                                : 'border-white/[0.1] text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errores.visibleBadgeIds && (
                  <p className="mt-1 text-[10px] text-red-400">{errores.visibleBadgeIds}</p>
                )}
              </div>
            )}

            {pestana === 'publicaciones' && (
              <div>
                <p className="mb-2 text-[11px] text-zinc-500">
                  Fija hasta {MAX_DESTACADAS} hilos tuyos en tu perfil
                  <span className="ml-1 font-mono text-zinc-400">
                    ({(datos.featuredPostIds ?? []).length}/{MAX_DESTACADAS})
                  </span>
                </p>
                {hilosPropios.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/[0.06] bg-[#080810]/85 px-4 py-8 text-center text-xs text-zinc-500">
                    Todavía no has publicado ningún hilo.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {hilosPropios.map((h) => {
                      const fijado = (datos.featuredPostIds ?? []).includes(h.id);
                      const orden = (datos.featuredPostIds ?? []).indexOf(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => alternarDestacada(h.id)}
                          aria-pressed={fijado}
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                            fijado
                              ? 'border-violet-500/60 bg-violet-500/10'
                              : 'border-white/[0.06] bg-[#080810] hover:border-white/[0.1]'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold ${
                              fijado ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-500'
                            }`}
                          >
                            {fijado ? orden + 1 : <Pin size={11} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-zinc-200">
                              {h.title}
                            </span>
                            <span className="block truncate text-[10px] text-zinc-500">
                              {h.body}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errores.featuredPostIds && (
                  <p className="mt-1 text-[10px] text-red-400">{errores.featuredPostIds}</p>
                )}
              </div>
            )}

            {aviso && (
              <p className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-[11px] text-sky-300">
                {aviso}
              </p>
            )}

            {errorGeneral && (
              <p className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-400">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                {errorGeneral}
              </p>
            )}
          </div>

          {/* ── Pie ──────────────────────────────────────────── */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3.5">
            <button
              type="button"
              onClick={alRestablecer}
              disabled={guardando || subiendo}
              title="Volver al banner, color y marco por defecto"
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] px-3 py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
            >
              <RotateCcw size={13} />
              Restablecer
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando || subiendo}
                className="rounded-xl border border-white/[0.1] px-3.5 py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alGuardar}
                disabled={guardando || subiendo}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {guardando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : guardado ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <Save size={14} />
                )}
                {guardado ? '¡Guardado!' : guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
