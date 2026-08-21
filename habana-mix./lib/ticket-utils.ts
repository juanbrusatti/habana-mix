import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import QRCode from 'qrcode'

export const ticketAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function createTicketCode() {
  const bytes = randomBytes(5)
  return Array.from(bytes, (byte) => ticketAlphabet[byte % ticketAlphabet.length]).join('')
}

export function createTicketToken() {
  return randomBytes(32).toString('base64url')
}

export function hashTicketToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function sendTicketEmail({
  email,
  name,
  eventTitle,
  ticketCode,
  ticketUrl,
}: {
  email: string
  name: string
  eventTitle: string
  ticketCode: string
  ticketUrl: string
}) {
  return sendGmail({
    to: email,
    subject: `Tu entrada para ${eventTitle}`,
    html: `<p>Hola ${name}, tu entrada está confirmada.</p><p>Tu código de acceso es <strong>${ticketCode}</strong>.</p><p>También adjuntamos tu QR. <a href="${ticketUrl}">Abrir y descargar tu entrada</a></p>`,
    ticketCode,
  })
}

export async function sendEventReminderEmail({
  email,
  name,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCode,
  ticketUrl,
}: {
  email: string
  name: string
  eventTitle: string
  eventDate?: string | null
  eventLocation?: string | null
  ticketCode: string
  ticketUrl: string
}) {
  const dateText = eventDate
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(eventDate))
    : 'Consultar fecha del evento'

  return sendGmail({
    to: email,
    subject: `Recordatorio: ${eventTitle}`,
    html: `<p>Hola ${name}, te recordamos tu entrada para <strong>${eventTitle}</strong>.</p><p><strong>Fecha:</strong> ${dateText}</p><p><strong>Ubicación:</strong> ${eventLocation || 'Consultar ubicación del evento'}</p><p>Tu código de acceso es <strong>${ticketCode}</strong>. También adjuntamos tu QR.</p><p><a href="${ticketUrl}">Abrir y descargar tu entrada</a></p>`,
    ticketCode,
  })
}

async function sendGmail({
  to,
  subject,
  html,
  ticketCode,
}: {
  to: string
  subject: string
  html: string
  ticketCode: string
}) {
  const user = process.env.GMAIL_USER
  const appPassword = process.env.GMAIL_APP_PASSWORD
  const from = process.env.GMAIL_FROM || user
  if (!user || !appPassword || !from) return false

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: appPassword },
  })
  const qr = await QRCode.toBuffer(`HM:${ticketCode}`, { width: 500, margin: 2 })

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments: [{ filename: `qr-${ticketCode}.png`, content: qr, cid: `ticket-${ticketCode}` }],
  })
  return true
}
