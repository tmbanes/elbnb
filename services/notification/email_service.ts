import { Resend } from 'resend'
import { render } from '@react-email/render'
import NotificationEmail, {templates} from './email_templates'

//can only use email domain @resend.dev or rplaqui@up.edu.ph
//put in .env EMAIL_FROM= ElBnB@resend.dev and RESEND_API_KEY=re_PkvGvFkC_H6mdAuNTQJPvjbRkF31gzkJu

const resend = new Resend(process.env.RESEND_API_KEY)

function getEmailFrom(): string {
  // Resend requires a valid "from". Use env when available; otherwise fall back
  // to the default resend.dev sender used elsewhere in this project.
  return process.env.EMAIL_FROM?.trim() || 'ElBnB@resend.dev'
}

export async function sendEmail({
    to,
  template,
  name,
}: {
  to: string
  template: 'applicationApproved' | 'applicationRejected' | 'billingReminder'|'billingOverdue' | 'applicationCancelled'
  name: string
}){
  //get template data 
  const emailData = templates[template](name ?? '')

  const html = await render(
    NotificationEmail({
      title: emailData.title,
      message: emailData.message,
      actionUrl: emailData.actionUrl,
    })
  )

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: emailData.title,
    html,  // send as html string instead of react component
  })
  
  if (error) throw new Error(`Email failed: ${error.message}`)
}

function getAppBaseUrl(): string {
  // Prefer an explicit public URL for email links (works in dev + prod).
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL

  if (explicit) return explicit.replace(/\/+$/, '')

  // Vercel provides the host without scheme.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return 'http://localhost:3000'
}

export async function sendManagerAccountCreatedEmail({
  to,
  name,
  temporaryPassword,
}: {
  to: string
  name: string
  temporaryPassword: string
}) {
  const baseUrl = getAppBaseUrl()
  const actionUrl = `${baseUrl}/login`

  const title = 'Your ElBnB manager account is ready'
  const message =
    `Hi ${name}, your manager account has been created.\n\n` +
    `Temporary password: ${temporaryPassword}\n\n` +
    `After logging in, you will be asked to set a new password.`

  const html = await render(
    NotificationEmail({
      title,
      message,
      actionUrl,
    })
  )

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: title,
    html,
  })

  if (error) throw new Error(`Email failed: ${error.message}`)
}

