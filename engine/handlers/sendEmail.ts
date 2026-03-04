import nodemailer from 'nodemailer'
import type { HandlerInput } from '../types.js'

export default async function sendEmail({ config }: HandlerInput) {
  const {
    to,
    subject,
    text,
    from,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
  } = config as {
    to?: string; subject?: string; text?: string; from?: string
    smtpHost?: string; smtpPort?: string; smtpUser?: string; smtpPass?: string
  }

  if (!to || !subject) {
    throw new Error('SendEmail: config must include "to" and "subject"')
  }

  const host = smtpHost ?? process.env.SMTP_HOST
  const port = Number(smtpPort ?? process.env.SMTP_PORT ?? '587')
  const user = smtpUser ?? process.env.SMTP_USER
  const pass = smtpPass ?? process.env.SMTP_PASS

  if (!host) {
    // No SMTP configured — process locally, no network required
    const transport = nodemailer.createTransport({ jsonTransport: true })
    const info = await transport.sendMail({ from, to, subject, text }) as any
    return {
      messageId: info.messageId ?? `<dev-${Date.now()}@localhost>`,
      accepted: [to],
      rejected: [],
      previewUrl: null,
      devMode: true,
    }
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    auth: user ? { user, pass } : undefined,
  })

  let info: any
  try {
    info = await transport.sendMail({ from, to, subject, text })
  } catch (e: any) {
    const msg: string = e.message ?? String(e)
    if (msg.includes('535') || msg.includes('Invalid credentials') || msg.includes('Authentication')) {
      throw new Error(`SendEmail: SMTP authentication failed — check smtpUser/smtpPass (${msg})`)
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      throw new Error(`SendEmail: could not connect to SMTP server "${host}" — check smtpHost/smtpPort (${msg})`)
    }
    throw e
  }

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    previewUrl: null,
    devMode: false,
  }
}
