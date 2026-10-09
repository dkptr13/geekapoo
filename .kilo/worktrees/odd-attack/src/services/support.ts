import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../lib/firebase';

// ======================================================
// TICKETS DE SOPORTE
// ======================================================
// Antes el formulario de SupportView.tsx:fingía guardar:
// generaba un código local y lo echaba a la basura al recargar.
// Ahora el ticket se guarda de verdad y un admin puede leerlo.
// ======================================================

export const SUPPORT_TICKETS = 'support_tickets';

export type TicketCategory = 'bug' | 'suggestion' | 'account' | 'report';

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  bug: 'Error técnico',
  suggestion: 'Sugerencia',
  account: 'Problema de cuenta',
  report: 'Denuncia',
};

export interface NewTicketInput {
  userId: string;
  userName: string;
  contactEmail: string;
  category: TicketCategory;
  subject: string;
  message: string;
}

const LIMITS = { subject: 200, message: 5000 };

/** Código legible para el usuario, distinto del id interno de Firestore. */
function generateTrackingId(): string {
  return `GK-TK-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Guarda el ticket y devuelve el código de seguimiento.
 *
 * Requiere sesión iniciada: las reglas de seguridad solo permiten crear
 * tickets a usuarios autenticados y no baneados, para que nadie pueda
 * inundar la colección desde la web abierta.
 */
export async function createSupportTicket(input: NewTicketInput): Promise<string> {
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!subject) throw new Error('Escribe un asunto para el ticket.');
  if (!message) throw new Error('Describe el problema para que podamos ayudarte.');
  if (subject.length > LIMITS.subject) {
    throw new Error(`El asunto no puede superar los ${LIMITS.subject} caracteres.`);
  }
  if (message.length > LIMITS.message) {
    throw new Error(`El mensaje no puede superar los ${LIMITS.message} caracteres.`);
  }
  if (!input.contactEmail.trim()) {
    throw new Error('Necesitamos un correo de contacto para responderte.');
  }

  const ref = doc(collection(db, SUPPORT_TICKETS));
  const trackingId = generateTrackingId();

  await setDoc(ref, {
    trackingId,
    userId: input.userId,
    userName: input.userName,
    contactEmail: input.contactEmail.trim(),
    category: input.category,
    subject,
    message,
    status: 'open',
    createdAt: serverTimestamp(),
  });

  return trackingId;
}
