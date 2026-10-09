import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Power,
  Trash2,
} from 'lucide-react';

import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { claveDia, gestionTrivia } from '../../services/trivia';
import { CATEGORIAS_TRIVIA, type TriviaDificultad } from '../../types/trivia';

// ======================================================
// ADMINISTRACIÓN DE LA TRIVIA DIARIA
// ======================================================
//
// Programar una trivia es escribir en cuatro sitios:
//
//   dailyQuizzes/{fecha}                    los metadatos
//   dailyQuizzes/{fecha}/questions/{q1..q3}  lo público
//   dailyQuizzes/{fecha}/answers/{q1..q3}    lo privado
//
// Y el tercero es el que no se puede escribir desde el navegador,
// a propósito: las reglas de Firestore no dan ninguna rama de
// escritura ahí, para que nadie (ni el propio admin desde la
// consola) pueda cambiar cuál es la respuesta buena con la que ya
// han jugado los usuarios.
//
// Eso deja este panel incompleto a propósito: puede preparar y
// modificar el texto público de las preguntas, y borrar la trivia
// entera (que sí lo hace la Cloud Function `gestionarTriviaDiaria`,
// que sí va con Admin SDK). Es la misma división de poderes que
// hay en el resto de la web.

interface PreguntaEnEdicion {
  /** `q1`, `q2`... Es el id del documento. */
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: TriviaDificultad;
  /** Solo para pintar; no se escribe desde aquí. */
  correctIndex: number;
  explanation: string;
}

const DIFICULTADES: { id: TriviaDificultad; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
];

const PREGUNTA_VACIA: PreguntaEnEdicion = {
  id: 'q1',
  question: '',
  options: ['', '', '', ''],
  category: CATEGORIAS_TRIVIA[0],
  difficulty: 'media',
  correctIndex: 0,
  explanation: '',
};

/** Cuántas preguntas tiene la trivia (son tres por diseño). */
const NUM_PREGUNTAS = 3;

export const DailyTriviaSection: FC = () => {
  // Moderadores también pueden. `canManage` es exactamente
  // "admin o moderador" (AuthContext lo calcula desde el rol del
  // documento), que es el mismo criterio con el que se abre el
  // panel entero, así que la comprobación no puede quedar
  // desfasada respecto a quién ve la sección.
  const { canManage } = useAuth();

  const [fecha, setFecha] = useState(() => claveDia());
  const [preguntas, setPreguntas] = useState<PreguntaEnEdicion[]>([]);
  const [activa, setActiva] = useState(true);
  const [etiqueta, setEtiqueta] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [borrados, setBorrados] = useState<number | null>(null);

  // ── Cargar la trivia de la fecha elegida ──────────────
  const cargar = useMemo(
    () => async (dia: string) => {
      setCargando(true);
      setMensaje(null);
      setBorrados(null);

      try {
        const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
        const { db: bd } = await import('../../lib/firebase');

        // OJO: aquí NO se leen las respuestas correctas. El bloque
        // `answers/` está cerrado a lectura en las reglas (a
        // propósito, para que la trivia no sea falseable), así que
        // pedirlas siempre acababa en "permission denied".
        //
        // Y como estaba dentro de un Promise.all junto a lo otro,
        // ese fallo tumbaba la carga entera: `preguntas` se quedaba
        // vacía y no se pintaba ni un editor, que es exactamente
        // que no se podía escribir nada.
        const [meta, pub] = await Promise.all([
          getDoc(doc(bd, 'dailyQuizzes', dia)),
          getDocs(collection(bd, 'dailyQuizzes', dia, 'questions')),
        ]);

        setActiva(meta.exists() ? meta.data().active !== false : true);
        setEtiqueta(meta.exists() ? String(meta.data().label ?? '') : '');

        const cargadas = pub.docs.map((d) => {
          const data = d.data() as {
            question?: string;
            options?: string[];
            category?: string;
            difficulty?: TriviaDificultad;
          };
          return {
            id: d.id,
            question: data.question ?? '',
            options: Array.isArray(data.options) ? [...data.options] : ['', '', '', ''],
            category: data.category ?? CATEGORIAS_TRIVIA[0],
            difficulty: data.difficulty ?? 'media',
            // Las respuestas no se pueden leer, así que aquí no se
            // sabe cuáles eran. Se vacían y se vuelven a escribir
            // al guardar; por eso el aviso de la interfaz.
            correctIndex: 0,
            explanation: '',
          } as PreguntaEnEdicion;
        });

        // Las que faltan se crean vacías, para poder escribirlas
        // desde cero sin tener que añadir un botón aparte.
        while (cargadas.length < NUM_PREGUNTAS) {
          cargadas.push({ ...PREGUNTA_VACIA, id: `q${cargadas.length + 1}` });
        }

        setPreguntas(cargadas);
      } catch (e) {
        // Ni siquiera esto puede dejar la pantalla vacía: sin
        // preguntas donde escribir no se puede arreglar nada.
        console.error('[Admin trivia] No se pudo cargar:', e);
        setPreguntas(
          Array.from({ length: NUM_PREGUNTAS }, (_, i) => ({
            ...PREGUNTA_VACIA,
            id: `q${i + 1}`,
          })),
        );
        setMensaje({
          ok: false,
          texto: 'No se pudo leer esa trivia. Se muestran las preguntas en blanco para que puedas escribirlas.',
        });
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void cargar(fecha);
  }, [fecha, cargar]);

  // ── Guardar ───────────────────────────────────────────
  const guardar = async () => {
    if (!canManage) return;

    // Se valida antes de escribir para no dejar la trivia a medias
    // guardada. Las reglas ya impiden guardar el `correctAnswer`
    // en el documento público; esto es solo el mensaje amable.
    const incompleta = preguntas.find(
      (p) =>
        !p.question.trim() ||
        p.options.filter((o) => o.trim()).length < 2 ||
        !p.explanation.trim(),
    );

    if (incompleta) {
      setMensaje({
        ok: false,
        texto: `La pregunta "${incompleta.id}" necesita enunciado, 2 opciones y una explicación.`,
      });
      return;
    }

    const vacias = preguntas.filter((p) => !p.question.trim());
    const aGuardar = vacias.length > 0 ? preguntas.filter((p) => p.question.trim()) : preguntas;

    if (aGuardar.length < NUM_PREGUNTAS) {
      setMensaje({
        ok: false,
        texto: `La trivia tiene que tener ${NUM_PREGUNTAS} preguntas (hay ${aGuardar.length}).`,
      });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const { doc, setDoc, writeBatch } = await import('firebase/firestore');

      // Metadatos y preguntas públicas van en un lote; las
      // respuestas correctas en otro, porque las reglas no
      // dejan escribirlas desde el cliente.
      const lote = writeBatch(db);

      // La etiqueta solo se manda si hay texto. Con `undefined`
      // el SDK LANZA ("Unsupported field value: undefined"), porque
      // `ignoreUndefinedProperties` está en false por defecto:
      // guardar una trivia sin etiqueta fallaba siempre, y el
      // error que llegaba era el de "las reglas no están
      // desplegadas", que apunta a una causa completamente
      // distinta.
      const etiquetaLimpia = etiqueta.trim();

      lote.set(
        doc(db, 'dailyQuizzes', fecha),
        {
          date: fecha,
          totalQuestions: aGuardar.length,
          active: activa,
          ...(etiquetaLimpia ? { label: etiquetaLimpia } : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      aGuardar.forEach((p) => {
        lote.set(
          doc(db, 'dailyQuizzes', fecha, 'questions', p.id),
          {
            question: p.question.trim(),
            options: p.options.map((o) => o.trim()).filter(Boolean),
            category: p.category,
            difficulty: p.difficulty,
          },
          { merge: false },
        );
      });

      await lote.commit();

      // Las respuestas correctas van por la Cloud Function, que
      // es lo único que puede escribirlas: el bloque `answers/` no
      // tiene ninguna rama de escritura para el cliente.
      //
      // Antes se intentaba con un setDoc suelto que siempre
      // rebotaba con "permission denied", y como el lote ya se
      // había confirmado, el guardado daba la impresión de haber
      // fallado entero cuando las preguntas sí se habían escrito.
      await gestionTrivia(
        fecha,
        'respuestas',
        Object.fromEntries(
          aGuardar.map((p) => [
            p.id,
            { correctIndex: p.correctIndex, explanation: p.explanation.trim() },
          ]),
        ),
      );

      setMensaje({ ok: true, texto: `Trivia del ${fecha} guardada.` });
      void cargar(fecha);
    } catch (e) {
      console.error('[Admin trivia] No se pudo guardar:', e);

      // Se distingue si el fallo fue al escribir las respuestas
      // (que significa que ya se ha jugado) de si fue al
      // guardar las preguntas, porque el arreglo es distinto.
      const texto = String((e as { message?: string })?.message ?? '');
      setMensaje({
        ok: false,
        texto: texto.includes('ya ha jugado') || texto.includes('already played')
          ? texto
          : 'No se pudo guardar. Si las reglas y las funciones están desplegadas, mira la consola.',
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Abrir / cerrar ────────────────────────────────────
  const alternarActiva = async () => {
    const siguiente = !activa;
    setGuardando(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'dailyQuizzes', fecha), { active: siguiente }, { merge: true });
      setActiva(siguiente);
      setMensaje({ ok: true, texto: `Trivia ${siguiente ? 'abierta' : 'cerrada'}.` });
    } catch (e) {
      console.error('[Admin trivia] No se pudo cambiar el estado:', e);
      setMensaje({ ok: false, texto: 'No se pudo cambiar el estado de la trivia.' });
    } finally {
      setGuardando(false);
    }
  };

  // ── Borrar ────────────────────────────────────────────
  const borrar = async () => {
    setGuardando(true);
    try {
      const res = await gestionTrivia(fecha, 'eliminar');
      setBorrados(res.borrados);
      setMensaje({ ok: true, texto: `Trivia eliminada (${res.borrados} documentos).` });
      void cargar(fecha);
    } catch (e) {
      console.error('[Admin trivia] No se pudo eliminar:', e);
      setMensaje({
        ok: false,
        texto: 'No se pudo eliminar. Las Cloud Functions tienen que estar desplegadas.',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <AlertCircle size={22} className="mx-auto mb-2 text-amber-500" />
        <p className="text-xs text-zinc-400">
          Los administradores y moderadores pueden gestionar las trivias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Fecha y estado ─────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <div>
          <label
            htmlFor="trivia-fecha"
            className="mb-1 block text-[11px] font-semibold text-zinc-400"
          >
            Fecha de la trivia
          </label>
          <input
            id="trivia-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="trivia-etiqueta"
            className="mb-1 block text-[11px] font-semibold text-zinc-400"
          >
            Etiqueta (opcional)
          </label>
          <input
            id="trivia-etiqueta"
            type="text"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Semana shonen"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
            activa
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
          }`}
        >
          {activa ? 'Activa' : 'Cerrada'}
        </span>

        <button
          type="button"
          onClick={alternarActiva}
          disabled={guardando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          <Power size={12} />
          {activa ? 'Cerrar' : 'Abrir'}
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-300/90">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            Las <strong>preguntas y las opciones</strong> se guardan directamente. La{' '}
            <strong>respuesta correcta y la explicación</strong> van a la Cloud Function,
            porque están bloqueadas para el navegador a propósito: así nadie puede mirar las
            respuestas ni cambiarlas desde la consola.
          </span>
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-300/70">
          Por eso no se pueden leer de vuelta: al abrir una trivia ya preparada hay que volver a
          marcar cuál es la buena, y solo se podrá hacer si <strong>nadie la ha jugado</strong>.
          Si alguien ya ha jugado, cambia la pregunta en vez de la respuesta.
        </p>
      </div>

      {cargando ? (
        <p className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
          <Loader2 size={14} className="animate-spin" />
          Cargando la trivia del {fecha}...
        </p>
      ) : (
        <>
          {/* ── Preguntas ─────────────────────────────── */}
          {preguntas.map((p, idx) => (
            <EditorPregunta
              key={p.id}
              pregunta={p}
              indice={idx}
              onChange={(nueva) =>
                setPreguntas((ps) => ps.map((x) => (x.id === p.id ? nueva : x)))
              }
            />
          ))}

          {mensaje && (
            <p
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] ${
                mensaje.ok
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/25 bg-red-500/10 text-red-300'
              }`}
            >
              {mensaje.ok ? <Check size={12} /> : <AlertCircle size={12} />}
              {mensaje.texto}
            </p>
          )}

          {borrados !== null && (
            <p className="text-[11px] text-zinc-500">
              Última operación de borrado: {borrados} documentos.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />}
              Guardar trivia del {fecha}
            </button>

            <button
              type="button"
              onClick={borrar}
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Eliminar trivia
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/** Editor de una pregunta. */
const EditorPregunta: FC<{
  pregunta: PreguntaEnEdicion;
  indice: number;
  onChange: (p: PreguntaEnEdicion) => void;
}> = ({ pregunta, indice, onChange }) => {
  const cambiar = (parcial: Partial<PreguntaEnEdicion>) =>
    onChange({ ...pregunta, ...parcial });

  const cambiarOpcion = (i: number, texto: string) => {
    const options = [...pregunta.options];
    options[i] = texto;
    cambiar({ options });
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <BookOpen size={13} />
          Pregunta {indice + 1}
          <span className="font-mono text-[10px] text-zinc-500">({pregunta.id})</span>
        </span>

        <select
          value={pregunta.category}
          onChange={(e) => cambiar({ category: e.target.value })}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 focus:border-amber-500 focus:outline-none"
        >
          {CATEGORIAS_TRIVIA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={pregunta.difficulty}
          onChange={(e) => cambiar({ difficulty: e.target.value as TriviaDificultad })}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 focus:border-amber-500 focus:outline-none"
        >
          {DIFICULTADES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </header>

      <input
        type="text"
        value={pregunta.question}
        onChange={(e) => cambiar({ question: e.target.value })}
        placeholder="¿Cómo se llama el protagonista de Solo Leveling?"
        className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
      />

      <div className="grid gap-1.5 sm:grid-cols-2">
        {pregunta.options.map((opcion, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correcta-${pregunta.id}`}
              checked={pregunta.correctIndex === i}
              onChange={() => cambiar({ correctIndex: i })}
              title="Marcar como la correcta"
              className="h-4 w-4 flex-shrink-0 accent-emerald-500"
            />
            <input
              type="text"
              value={opcion}
              onChange={(e) => cambiarOpcion(i, e.target.value)}
              placeholder={`Opción ${i + 1}`}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <input
        type="text"
        value={pregunta.explanation}
        onChange={(e) => cambiar({ explanation: e.target.value })}
        placeholder="Explicación de por qué es esa (se ve al responder)"
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
      />

      {pregunta.options.length < 6 && (
        <button
          type="button"
          onClick={() => cambiar({ options: [...pregunta.options, ''] })}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
        >
          <Plus size={11} />
          Añadir opción
        </button>
      )}
    </section>
  );
};
