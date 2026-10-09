import { useState } from 'react';
import type { FC } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';

import { TICKET_CATEGORIES } from '../../services/support';
import type { SupportTicket } from '../../types';

// ======================================================
// GESTIÓN DE TICKETS DE SOPORTE
// ======================================================
// Los tickets los crea cualquiera con sesión desde la vista de
// Soporte y se guardan en la colección "support_tickets". Aquí
// solo se leen y se les cambia el estado; el texto de la
// respuesta se manda por el correo de contacto que dejó quien
// lo abrió.
//
// El estado es de tres pasos porque "resuelto" no siempre es lo
// último que pasa: se marca "en curso" mientras se mira y
// "resuelto" cuando la persona confirma que está arreglado.
// ======================================================

const STATUS_META: Record<
  SupportTicket['status'],
  { label: string; className: string; icon: typeof Clock }
> = {
  open: {
    label: 'Abierto',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Inbox,
  },
  in_progress: {
    label: 'En curso',
    className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: Clock,
  },
  resolved: {
    label: 'Resuelto',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
};

const STATUSES: SupportTicket['status'][] = ['open', 'in_progress', 'resolved'];

const CATEGORY_ICONS: Record<SupportTicket['category'], typeof AlertCircle> = {
  bug: AlertCircle,
  suggestion: Sparkles,
  account: LifeBuoy,
  report: MessageSquare,
};

const FILTERS: { id: SupportTicket['status'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Abiertos' },
  { id: 'in_progress', label: 'En curso' },
  { id: 'resolved', label: 'Resueltos' },
];

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SupportTicketsSectionProps {
  tickets: (SupportTicket & { id: string })[];
  setTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
}

export const SupportTicketsSection: FC<SupportTicketsSectionProps> = ({
  tickets,
  setTicketStatus,
}) => {
  const [filter, setFilter] = useState<SupportTicket['status'] | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Los tickets que siguen sin resolverse van primero, y dentro de
  // cada grupo del más nuevo al más viejo: es el orden en el que
  // hay que atacarlos.
  const sorted = [...tickets].sort((a, b) => {
    const rank = (s: SupportTicket['status']) => (s === 'resolved' ? 1 : 0);
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const visible = filter === 'all' ? sorted : sorted.filter((t) => t.status === filter);

  const counts = STATUSES.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s] = tickets.filter((t) => t.status === s).length;
      return acc;
    },
    {},
  );

  const changeStatus = async (ticketId: string, status: SupportTicket['status']) => {
    setBusyId(ticketId);
    setError('');
    try {
      await setTicketStatus(ticketId, status);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo cambiar el estado del ticket. Revisa que las reglas estén desplegadas.',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <LifeBuoy size={28} className="mx-auto text-zinc-700" />
        <p className="mt-3 text-sm text-zinc-500">No hay ningún ticket de soporte.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Aparecerán aquí en cuanto alguien envíe uno desde la página de Soporte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.id === 'all' ? tickets.length : counts[f.id] ?? 0;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {/* LISTA */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-xs text-zinc-500">
          No hay tickets con ese estado.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.open;
            const StatusIcon = meta.icon;
            const CategoryIcon = CATEGORY_ICONS[t.category] ?? AlertCircle;
            const isOpen = expanded === t.id;
            const busy = busyId === t.id;

            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                {/* CABECERA CLICABLE */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900"
                >
                  <CategoryIcon size={16} className="shrink-0 text-zinc-500" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-500">
                        {t.trackingId || t.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
                      >
                        <StatusIcon size={10} />
                        {meta.label}
                      </span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {TICKET_CATEGORIES[t.category] || t.category}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-white">
                      {t.subject || '(sin asunto)'}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">
                      @{t.userName} · {formatDate(t.createdAt)}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-zinc-600">
                    {isOpen ? 'Ocultar' : 'Ver'}
                  </span>
                </button>

                {/* DETALLE */}
                {isOpen && (
                  <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/40 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Mensaje
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                        {t.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={12} className="text-zinc-600" />
                        {t.contactEmail || '—'}
                      </span>
                      <span className="text-zinc-600">uid: {t.userId}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {STATUSES.map((s) => {
                        const m = STATUS_META[s];
                        const Icon = m.icon;
                        const active = t.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={busy || active}
                            onClick={() => changeStatus(t.id, s)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                              active ? m.className : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white'
                            }`}
                          >
                            {busy && !active ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Icon size={12} />
                            )}
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Cambiar el estado no envía ningún correo: la respuesta se manda a mano al correo de
        contacto que dejó quien abrió el ticket.
      </p>
    </div>
  );
};
