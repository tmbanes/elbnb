import { Resend } from 'resend'
import { render } from '@react-email/render'
import NotificationEmail, {templates} from './email_templates'

//can only use email domain @resend.dev or rplaqui@up.edu.ph
//put in .env EMAIL_FROM= ElBnB@resend.dev and RESEND_API_KEY=re_PkvGvFkC_H6mdAuNTQJPvjbRkF31gzkJu

export async function sendEmail({
    to,
  template,
  name,
}: {
  to: string
  template: 'applicationApproved' | 'applicationRejected' | 'billingReminder'|'billingOverdue' | 'applicationCancelled'
  name: string
}){
  const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")
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

