import 'server-only'

import nodemailer from 'nodemailer'

/**
 * Email con el link de fotos.
 *
 * Va separado de lib/ticket-utils.ts a propósito: aquel archivo es parte del
 * flujo de pago (manda la entrada con el QR adjunto) y no se toca. Este mail no
 * lleva QR y también les llega a los asistentes de eventos gratuitos, que no
 * tienen entrada.
 */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function createPhotosTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const from = process.env.GMAIL_FROM || user
  if (!user || !pass || !from) return null

  return {
    from,
    // Pool: reutiliza las conexiones SMTP en vez de abrir una por mail.
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
    }),
  }
}

export async function sendPhotosEmail(
  transport: NonNullable<ReturnType<typeof createPhotosTransport>>,
  {
    email,
    name,
    eventTitle,
    photosUrl,
  }: { email: string; name: string; eventTitle: string; photosUrl: string },
) {
  const safeName = escapeHtml(name || '')
  const safeTitle = escapeHtml(eventTitle)
  const safeUrl = escapeHtml(photosUrl)

  await transport.transporter.sendMail({
    from: transport.from,
    to: email,
    subject: `Las fotos de ${eventTitle} ya están`,
    html: `<p>Hola ${safeName}, ¡gracias por venir a <strong>${safeTitle}</strong>!</p><p>Ya subimos las fotos del evento. Podés verlas y descargarlas acá:</p><p><a href="${safeUrl}">Ver y descargar las fotos</a></p><p>Nos vemos en el próximo 💃🕺</p><p>— Habana Mix</p>`,
  })
}
