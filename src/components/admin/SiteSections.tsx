import { useState } from 'react';
import type { FC } from 'react';
import {
  Plus,
  X,
  Loader2,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
ChevronUp,
  ChevronDown,
  Tv,
} from 'lucide-react';

import { useSiteContent } from '../../context/SiteContentContext';
import { useCommunity } from '../../context/CommunityContext';
import { DEFAULT_SETTINGS } from '../../services/siteContent';
import { createCategory, deleteItem } from '../../services/catalogAdmin';
import type { UploadProvider } from '../../services/imageUpload';

import { ImagePicker } from './ImagePicker';
import { categoriasDe } from './CatalogSections';
import { TextField, TextArea, NumberField } from './fields';

// ======================================================
// AJUSTES DE LA WEB: LOGO Y BIENVENIDA
// ======================================================
// Antes el logo y el texto de bienvenida estaban escritos en
// el código (Navbar.tsx y HomeFeed.tsx), así que cambiarlos
// obligaba a tocar ficheros y recompilar. Ahora se editan
// aquí y se guardan en Firestore.
// ======================================================

export const SettingsSection: FC<{ provider: UploadProvider }> = ({ provider }) => {
  const { settings, saveSettings } = useSiteContent();

  const [title, setTitle] = useState(settings.welcomeTitle);
  const [highlight, setHighlight] = useState(settings.welcomeHighlight);
  const [text, setText] = useState(settings.welcomeText);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [artLeft, setArtLeft] = useState(settings.supportArtLeftUrl);
  const [artRight, setArtRight] = useState(settings.supportArtRightUrl);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);

  // Los ajustes llegan de Firestore después del primer render.
  // Mientras tanto los campos están vacíos, y si se guardara
  // sin esperar, se escribiría texto en blanco sobre lo que
  // hubiera. Se sincronizan con lo que llega, pero solo si el
  // usuario no está escribiendo.
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false);

  if (!loaded && settings.welcomeTitle) {
    setTitle(settings.welcomeTitle);
    setHighlight(settings.welcomeHighlight);
    setText(settings.welcomeText);
    setLogoUrl(settings.logoUrl);
    setArtLeft(settings.supportArtLeftUrl);
    setArtRight(settings.supportArtRightUrl);
    setLoaded(true);
  }

  const dirty =
    title !== settings.welcomeTitle ||
    highlight !== settings.welcomeHighlight ||
    text !== settings.welcomeText ||
    logoUrl !== settings.logoUrl ||
    artLeft !== settings.supportArtLeftUrl ||
    artRight !== settings.supportArtRightUrl;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    const result = await saveSettings({
      welcomeTitle: title.trim() || DEFAULT_SETTINGS.welcomeTitle,
      welcomeHighlight: highlight.trim() || DEFAULT_SETTINGS.welcomeHighlight,
      welcomeText: text.trim() || DEFAULT_SETTINGS.welcomeText,
      logoUrl,
      supportArtLeftUrl: artLeft.trim(),
      supportArtRightUrl: artRight.trim(),
    });

    setSaving(false);
    if (result.ok) {
      setFeedback({ success: 'Ajustes guardados. Se actualiza al momento.' });
      setTouched(false);
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ error: result.error });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-zinc-500">
        Estos textos salen en la portada y en el logo. Se aplican en toda la web al instante.
      </p>

      {/* Vista previa */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Así se verá
        </p>

        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-9 w-9 rounded-xl border border-zinc-700 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500">
              <span className="font-mono text-base font-black text-white">G</span>
            </div>
          )}
          <span className="text-xl font-black tracking-tight text-white">
            geekapoo<span className="text-violet-400">.com</span>
          </span>
        </div>

        <h3 className="mt-3 text-lg font-black tracking-tight text-white">
          {title || DEFAULT_SETTINGS.welcomeTitle}{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            {highlight || DEFAULT_SETTINGS.welcomeHighlight}
          </span>
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
          {text || DEFAULT_SETTINGS.welcomeText}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Título (texto normal)"
          value={title}
          onChange={(v) => {
            setTouched(true);
            setTitle(v);
          }}
        />
        <TextField
          label="Título (parte con color)"
          value={highlight}
          onChange={(v) => {
            setTouched(true);
            setHighlight(v);
          }}
        />
      </div>

      <TextArea
        label="Texto de bienvenida"
        value={text}
        onChange={(v) => {
          setTouched(true);
          setText(v);
        }}
        rows={4}
      />

      <ImagePicker
        label="Logo de la web"
        value={logoUrl}
        onChange={(v) => {
          setTouched(true);
          setLogoUrl(v);
        }}
        provider={provider}
        collectionName="branding"
        placeholderId="logo"
        field="logo"
        hint="Si lo vacías, vuelve a salir la G con el degradado."
      />

      <p className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Ilustraciones de la página de Soporte
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker
          label="Columna izquierda (adolescente)"
          value={artLeft}
          onChange={(v) => {
            setTouched(true);
            setArtLeft(v);
          }}
          provider={provider}
          collectionName="branding"
          placeholderId="support-left"
          field="artLeft"
          hint="PNG con fondo transparente, mejor. Si lo vacías, no se pinta columna."
        />

        <ImagePicker
          label="Columna derecha (mayor)"
          value={artRight}
          onChange={(v) => {
            setTouched(true);
            setArtRight(v);
          }}
          provider={provider}
          collectionName="branding"
          placeholderId="support-right"
          field="artRight"
          hint="Mismo formato que la izquierda."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!dirty && !touched)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>

        {dirty && !touched && (
          <span className="text-[11px] text-amber-400">
            Hay cambios sin guardar.
          </span>
        )}

        {feedback?.success && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 size={12} />
            {feedback.success}
          </span>
        )}
        {feedback?.error && (
          <span className="flex items-center gap-1 text-[11px] text-red-400">
            <AlertCircle size={12} />
            {feedback.error}
          </span>
        )}
      </div>
    </div>
  );
};

// ======================================================
// CATEGORÍAS DE HILOS
// ======================================================

export const CategoriesSection: FC = () => {
  const { categories, animes, threads, createCategory, deleteCategory } = useAdminCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('from-violet-500/20 to-pink-500/20 text-violet-400 border-violet-500/30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setError('La categoría necesita un nombre.');
      return;
    }

    setSaving(true);
    const result = await createCategory(name.trim(), description.trim(), color);
    setSaving(false);

    if (result.ok) {
      setName('');
      setDescription('');
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-zinc-500">
        Las categorías son los filtros del foro. Al añadir una, aparece sola en la barra lateral y
        en el desplegable de los hilos nuevos.
      </p>

      {/* Añadir */}
      <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
        <h3 className="text-sm font-bold text-white">Nueva categoría</h3>

        <TextField label="Nombre" value={name} onChange={setName} placeholder="Ej: Terror Psicológico" />
        <TextArea
          label="Descripción"
          value={description}
          onChange={setDescription}
          rows={2}
        />

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-zinc-300">Color</span>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px] text-white focus:border-violet-500 focus:outline-none"
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {saving ? 'Creando...' : 'Crear categoría'}
        </button>
      </div>

      {/* Listado */}
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
          No hay categorías.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => {
            // Los animes guardan el NOMBRE de la categoría y los
            // hilos su id. Hay que contar los dos para poder
            // avisar de lo que se quedaría sin sitio.
            //
            // El conteo va por `categoriasDe` y no por el campo suelto
            // porque un anime puede tener varias: Takopi's Original
            // Sin es Thriller & Misterio y Ciencia Ficción & Cyberpunk,
            // y con el campo suelto solo contaba en la primera.
            const animeCount = animes.filter((a) => categoriasDe(a).includes(cat.name)).length;
            const threadCount = threads.filter((t) => t.categoryId === cat.id).length;
            const isDeleting = pendingDelete === cat.id;

            return (
              <li key={cat.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg border bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold ${cat.color}`}
                  >
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {animeCount} anime{animeCount === 1 ? '' : 's'} · {threadCount} hilo
                    {threadCount === 1 ? '' : 's'}
                  </span>

                  <span className="ml-auto flex items-center gap-1">
                    {isDeleting ? (
                      <>
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500"
                        >
                          {animeCount + threadCount > 0 ? 'Borrar igualmente' : 'Sí, borrar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(cat.id)}
                        className="rounded-md p-1 text-zinc-500 hover:text-red-400"
                        aria-label={`Eliminar ${cat.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </span>
                </div>

                {cat.description && (
                  <p className="mt-1.5 text-[11px] text-zinc-500">{cat.description}</p>
                )}

                {isDeleting && animeCount + threadCount > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-300">
                    <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                    <span>
                      No se puede deshacer. Los {animeCount} anime(s) y {threadCount} hilo(s)
                      que usan esta categoría NO se borran, pero se quedan sin filtro: los animes
                      dejarán de aparecer en su categoría y los hilos seguirán visibles, pero
                      filtrando por categoría ya no saldrán.
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const COLOR_OPTIONS = [
  { value: 'from-violet-500/20 to-pink-500/20 text-violet-400 border-violet-500/30', label: 'Violeta' },
  { value: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30', label: 'Rosa' },
  { value: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30', label: 'Naranja' },
  { value: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30', label: 'Cian' },
  { value: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30', label: 'Verde' },
  { value: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30', label: 'Púrpura' },
];

// =====================================================═
// OBRAS DE LA SEMANA
// ======================================================

export const WorksSection: FC<{ provider: UploadProvider }> = ({ provider }) => {
  const { weeklyWorks, addWeeklyWork, editWeeklyWork, removeWeeklyWork, moveWork } =
    useSiteContent();

  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">
          Se muestran en la barra lateral, en la sección "Obras de la Semana".
        </p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-orange-500"
        >
          <Plus size={13} />
          Añadir obra
        </button>
      </div>

      {showNew && (
        <WorkForm
          provider={provider}
          onSubmit={async (input) => {
            const r = await addWeeklyWork(input);
            if (r.ok) setShowNew(false);
            return r;
          }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {weeklyWorks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
          No hay obras. La sección no se muestra en la web hasta que añadas la primera.
        </p>
      ) : (
        <ul className="space-y-2">
          {weeklyWorks.map((work, index) => (
            <li key={work.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-start gap-3">
                {work.imageUrl && (
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="h-14 w-20 flex-shrink-0 rounded-lg border border-zinc-700 object-cover"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-200">{work.title}</p>
                  <p className="truncate text-[10px] text-zinc-500">{work.author}</p>
                  {work.score > 0 && (
                    <span className="mt-1 inline-block rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-orange-300">
                      {work.score}
                    </span>
                  )}
                </div>

                <span className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWork(work.id, 'up')}
                    disabled={index === 0}
                    className="rounded-md p-1 text-zinc-500 hover:text-white disabled:opacity-25"
                    aria-label="Subir"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWork(work.id, 'down')}
                    disabled={index === weeklyWorks.length - 1}
                    className="rounded-md p-1 text-zinc-500 hover:text-white disabled:opacity-25"
                    aria-label="Bajar"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId((prev) => (prev === work.id ? null : work.id))
                    }
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    {editingId === work.id ? 'Cerrar' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWeeklyWork(work.id)}
                    className="rounded-md p-1 text-zinc-500 hover:text-red-400"
                    aria-label="Eliminar obra"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>

              {editingId === work.id && (
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <WorkForm
                    provider={provider}
                    initial={work}
                    onSubmit={async (input) => {
                      const r = await editWeeklyWork(work.id, input);
                      if (r.ok) setEditingId(null);
                      return r;
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface WorkValues {
  title: string;
  author: string;
  synopsis: string;
  imageUrl: string;
  badge: string;
  score: number;
}

const WorkForm: FC<{
  provider: UploadProvider;
  initial?: WorkValues;
  onSubmit: (values: WorkValues) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}> = ({ provider, initial, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [badge, setBadge] = useState(initial?.badge ?? '');
  const [score, setScore] = useState(String(initial?.score ?? 8));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Selector del catálogo. Ver la nota de "rellenarDesdeAnime".
  const { animes } = useCommunity();
  const [buscador, setBuscador] = useState('');
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);

  /**
   * Rellena el formulario con los datos de una serie del catálogo.
   *
   * Una obra y un anime son documentos distintos y no están
   * enlazados: la obra es lo que sale en "Obras de la Semana" y
   * puede ser cualquier cosa (una película, un libro), no
   * necesariamente una serie del catálogo. Por eso esto rellena el
   * formulario en vez de guardar el id del anime: quien decide si
   * la obra es esa serie o solo se apoya en ella es el admin, y
   * guardar el id haría que al cambiar la portada del anime
   * cambiase sola la de la obra sin que nadie lo pidiera.
   *
   * La etiqueta NO se toca: es editorial ("Nº1", "Nuevo", "Top") y
   * no sale de ningún anime.
   */
  const rellenarDesdeAnime = (a: (typeof animes)[number]) => {
    setTitle(a.title);
    if (a.studio) setAuthor(a.studio);
    if (a.synopsis) setSynopsis(a.synopsis);
    if (a.coverUrl) setImageUrl(a.coverUrl);
    if (a.rating > 0) setScore(String(a.rating));
    setCatalogoAbierto(false);
  };

  const filtrados = animes.filter((a) => {
    const q = buscador.trim().toLowerCase();
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      (a.studio ?? '').toLowerCase().includes(q) ||
      (a.japaneseTitle ?? '').toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (saving) return;
    setError('');

    if (!title.trim()) {
      setError('El título no puede estar vacío.');
      return;
    }

    setSaving(true);
    const result = await onSubmit({
      title,
      author,
      synopsis,
      imageUrl,
      badge,
      score: Number(score) || 0,
    });
    setSaving(false);

    if (!result.ok && result.error) setError(result.error);
  };

  return (
    <div className="space-y-3 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
      {initial && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Editar obra</h3>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Elegir del catálogo.

          Va antes de los campos a propósito: si se rellenan desde
          una serie, el título y la carátula casi nunca se tocan
          después, y tener el selector debajo significaba tener que
          bajar hasta él y luego volver arriba a comprobar qué se
          había rellenado. */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
        <button
          type="button"
          onClick={() => setCatalogoAbierto((v) => !v)}
          aria-expanded={catalogoAbierto}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-semibold text-zinc-300 transition-colors hover:text-white"
        >
          <span className="flex items-center gap-1.5">
            <Tv size={13} />
            Elegir una serie del catálogo
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform ${catalogoAbierto ? 'rotate-180' : ''}`}
          />
        </button>

        {catalogoAbierto && (
          <div className="border-t border-zinc-800 p-3">
            {animes.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-zinc-500">
                Todavía no hay ninguna serie en el catálogo.
              </p>
            ) : (
              <>
                <input
                  value={buscador}
                  onChange={(e) => setBuscador(e.target.value)}
                  placeholder="Buscar por título, estudio o título japonés..."
                  className="mb-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-orange-500"
                />

                <ul className="max-h-60 space-y-1 overflow-y-auto">
                  {filtrados.length === 0 ? (
                    <li className="py-4 text-center text-[11px] text-zinc-500">
                      Ninguna serie coincide con «{buscador}».
                    </li>
                  ) : (
                    filtrados.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => rellenarDesdeAnime(a)}
                          className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-orange-500/40 hover:bg-orange-500/10"
                        >
                          {a.coverUrl ? (
                            <img
                              src={a.coverUrl}
                              alt=""
                              className="w-7 h-10 flex-shrink-0 rounded border border-zinc-700 object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-7 flex-shrink-0 items-center justify-center rounded border border-zinc-800 text-[9px] text-zinc-600">
                              sin
                            </span>
                          )}

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-zinc-200">
                              {a.title}
                            </span>
                            <span className="block truncate text-[10px] text-zinc-500">
                              {[a.studio, a.year || null].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                  Se rellenan el título, el autor, la sinopsis y la carátula. La nota se
                  copia si la serie tiene, y la etiqueta no se toca porque es cosa del
                  editor.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <TextField label="Título" value={title} onChange={setTitle} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Autor o estudio" value={author} onChange={setAuthor} />
        <TextField label="Etiqueta" value={badge} onChange={setBadge} placeholder="Nº1, Nuevo, Top..." />
      </div>
      <TextArea label="Sinopsis" value={synopsis} onChange={setSynopsis} rows={3} />
      <NumberField label="Nota (0-10, 0 para no mostrar)" value={score} onChange={setScore} />

      <ImagePicker
        label="Carátula"
        value={imageUrl}
        onChange={setImageUrl}
        provider={provider}
        collectionName="weekly_works"
        placeholderId="obra"
        field="cover"
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Añadir obra'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────
// ACCESO A CATEGORÍAS DESDE EL PANEL
// ────────────────────────────────────────────────────────
// El contexto de comunidad aporta los datos para poder
// contar animes e hilos por categoría, pero las escrituras
// viven en el servicio. Se envuelven aquí para que el editor
// tenga un único sitio con el que hablar.

function useAdminCategories() {
  const { categories, animes, threads } = useCommunity();

  const create = async (name: string, description: string, color: string) => {
    try {
      await createCategory(name, description, color);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'No se pudo crear.' };
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteItem('categories', id);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'No se pudo eliminar.' };
    }
  };

  return { categories, animes, threads, createCategory: create, deleteCategory: remove };
}
