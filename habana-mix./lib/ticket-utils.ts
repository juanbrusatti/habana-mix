import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

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
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Tu entrada para ${eventTitle}`,
      html: `<p>Hola ${name}, tu entrada está confirmada.</p><p>Tu código de acceso es <strong>${ticketCode}</strong>.</p><p><a href="${ticketUrl}">Abrir y descargar tu entrada con QR</a></p>`,
    }),
  })

  return response.ok
}
