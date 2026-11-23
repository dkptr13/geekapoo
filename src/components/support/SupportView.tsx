import React, { useState } from 'react';
import { LifeBuoy, Send, CheckCircle2, AlertCircle, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { createSupportTicket, type TicketCategory } from '../../services/support';
import { useAnnouncer } from '../common/LiveAnnouncer';

export const SupportView: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSiteContent();
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [ticketResult, setTicketResult] = useState<{ id: string; category: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const announce = useAnnouncer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !contactEmail.trim()) return;

    if (!currentUser) {
      setErrorMsg('Inicia sesión para poder enviar un ticket.');
      announce('Inicia sesión para poder enviar un ticket.', 'assertive');
      return;
    }

    setSending(true);
    setErrorMsg('');

    try {
      const trackingId = await createSupportTicket({
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.username,
        contactEmail,
        category,
        subject,
        message,
      });

      setTicketResult({ id: trackingId, category });
      setSubject('');
      setMessage('');
      announce(`Ticket enviado. Tu código de seguimiento es ${trackingId}.`);
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo enviar el ticket.';
      setErrorMsg(mensaje);
      announce(mensaje, 'assertive');
    } finally {
      setSending(false);
    }
  };

  return (
    // Las dos columnas de las ilustraciones solo salen si hay
    // imagen puesta. En móvil no caben, y una página normal tiene
    // que verse igual de limpia sin ellas.
    <div
      className={`mx-auto grid gap-6 ${
        settings.supportArtLeftUrl || settings.supportArtRightUrl
          ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,48rem)_minmax(0,1fr)]'
          : ''
      }`}
    >
      {settings.supportArtLeftUrl && (
        <aside className="hidden justify-end lg:flex" aria-hidden="true">
          <img
            src={settings.supportArtLeftUrl}
            alt=""
            className="max-h-[70vh] w-full object-contain object-bottom"
          />
        </aside>
      )}

      <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#10101a] via-[#0c0c14] to-[#12102a] p-6 sm:p-8 text-center space-y-3 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600/25 to-sky-500/15 text-violet-300 shadow-inner">
          <LifeBuoy size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Soporte Técnico y Ayuda Geekapoo</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          ¿Has detectado un error técnico, tienes una duda sobre las normas de respeto mutuo o quieres sugerir una mejora para la plataforma? Nuestro equipo técnico te responderá con la mayor brevedad.
        </p>
      </div>

      {/* Success Ticket Confirmation */}
      {ticketResult ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-3xl border border-emerald-400/25 bg-white/[0.03] p-8 text-center space-y-4 animate-in fade-in duration-200 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={36} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">¡Ticket Generado con Éxito!</h2>
            <p className="mt-1 text-xs text-zinc-300">
              Hemos registrado tu mensaje en la base de datos de soporte técnico de Geekapoo.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 max-w-sm mx-auto font-mono text-xs">
            <span className="text-zinc-500 block text-[10px]">CÓDIGO DE SEGUIMIENTO:</span>
            <strong className="text-lg text-emerald-400 font-bold">{ticketResult.id}</strong>
          </div>

          <p className="text-xs text-zinc-500">
            Te hemos enviado una copia de confirmación al correo <strong>{contactEmail}</strong>.
          </p>

          <button
            type="button"
            onClick={() => setTicketResult(null)}
            className="chat-boton rounded-xl bg-white/[0.04] px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/[0.08] transition-all"
          >
            Enviar otra consulta
          </button>
        </div>
      ) : (
        /* Form */
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-8 space-y-5 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]"
        >
          <p className="sr-only">
            Los campos marcados con asterisco son obligatorios.
          </p>

          {/* Category selection */}
          <fieldset>
            <legend className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Tipo de Consulta o Reporte
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                aria-pressed={category === 'bug'}
                onClick={() => setCategory('bug')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  category === 'bug'
                    ? 'border-violet-400/25 bg-violet-500/15 text-violet-200'
                    : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <AlertCircle size={18} aria-hidden="true" className="mb-1 text-red-400" />
                <span>Error / Bug</span>
              </button>

              <button
                type="button"
                aria-pressed={category === 'suggestion'}
                onClick={() => setCategory('suggestion')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  category === 'suggestion'
                    ? 'border-violet-400/25 bg-violet-500/15 text-violet-200'
                    : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Sparkles size={18} aria-hidden="true" className="mb-1 text-amber-400" />
                <span>Sugerencia</span>
              </button>

              <button
                type="button"
                aria-pressed={category === 'account'}
                onClick={() => setCategory('account')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  category === 'account'
                    ? 'border-violet-400/25 bg-violet-500/15 text-violet-200'
                    : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <HelpCircle size={18} aria-hidden="true" className="mb-1 text-sky-400" />
                <span>Mi Cuenta</span>
              </button>

              <button
                type="button"
                aria-pressed={category === 'report'}
                onClick={() => setCategory('report')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                  category === 'report'
                    ? 'border-violet-400/25 bg-violet-500/15 text-violet-200'
                    : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <ShieldAlert size={18} aria-hidden="true" className="mb-1 text-fuchsia-400" />
                <span>Moderación</span>
              </button>
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="support-email"
              className="block text-xs font-medium text-zinc-300 mb-1"
            >
              Tu Correo Electrónico de Contacto{' '}
              <span aria-hidden="true" className="text-red-300">*</span>
            </label>
            <input
              id="support-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="tu_email@ejemplo.com"
              autoComplete="email"
              aria-describedby={errorMsg ? 'support-error' : undefined}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="support-subject"
              className="block text-xs font-medium text-zinc-300 mb-1"
            >
              Asunto{' '}
              <span aria-hidden="true" className="text-red-300">*</span>
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Fallo al cargar comentarios del capítulo 3 de Kaguya-sama"
              aria-describedby={errorMsg ? 'support-error' : undefined}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="support-message"
              className="block text-xs font-medium text-zinc-300 mb-1"
            >
              Descripción Detallada{' '}
              <span aria-hidden="true" className="text-red-300">*</span>
            </label>
            <textarea
              id="support-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe lo ocurrido con el mayor detalle posible (dispositivo, pasos para reproducir el problema)..."
              aria-describedby={errorMsg ? 'support-error' : undefined}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs text-white placeholder-zinc-600 focus:border-violet-400 focus:outline-none leading-relaxed"
              required
            />
          </div>

          {errorMsg && (
            <div
              id="support-error"
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
            >
              <AlertCircle size={14} aria-hidden="true" className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} aria-hidden="true" />
              <span>
                {sending ? 'Enviando...' : 'Enviar Reporte al Equipo Técnico'}
              </span>
            </button>
          </div>
        </form>
      )}
      </div>

      {settings.supportArtRightUrl && (
        <aside className="hidden lg:flex" aria-hidden="true">
          <img
            src={settings.supportArtRightUrl}
            alt=""
            className="max-h-[70vh] w-full object-contain object-bottom"
          />
        </aside>
      )}
    </div>
  );
};
