import nodemailer from 'nodemailer'
import type { HandlerInput } from '../types.js'

export default async function sendEmail({ config }: HandlerInput) {
  const {
    to,
    subject,
    text,
    from,
    smtpHost = process.env.SMTP_HOST,
    smtpPort = process.env.SMTP_PORT ?? '587',
    smtpUser = process.env.SMTP_USER,
    smtpPass = process.env.SMTP_PASS,
  } = config as {
    to?: string
    subject?: string
    text?: string
    from?: string
    smtpHost?: string
    smtpPort?: string
    smtpUser?: string
    smtpPass?: string
  }

  if (!to || !subject) {
    throw new Error('SendEmail: config must include "to" and "subject"')
  }

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  })

  const info = await transport.sendMail({ from, to, subject, text })
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  }
}
