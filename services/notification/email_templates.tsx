import { Html, Body, Container, Heading, Text, Button, Preview } from '@react-email/components'
import { title } from 'process';


export const templates = {//type of email notif and its content
  
  applicationApproved: (name: string) => ({
    title: "Application Approved ",
    message: `Hi ${name}, your application has been approved.`,
    actionUrl: "http://localhost:3000/dashboard",//actual link to dashboard
  }),

  applicationRejected: (name: string) => ({
    title: "Application Rejected",
    message: `Hi ${name}, unfortunately, your application was not approved.`,
    actionUrl: "http://localhost:3000/dashboard",//actual link to dashboard
  }),

  applicationCancelled: (name : string) => ({
    title: "mApplication Cancelled",
    message: `Hi ${name}, your application was cancelled.`,
    actionUrl: "http://localhost:3000/dashboard",//actual link to dashboard

  }),

  billingReminder: (name: string) => ({
    title: "Payment Due ",
    message: `Hi ${name},your payment is due soon.`,
    actionUrl: "http://localhost:3000/billing",//actual link to billing
  }),

  billingOverdue: ( name: string)=> ({
    title: "Payment Overdue",
    message: `Hi ${name},your payment is overdue. Please pay your dues`,
    actionUrl: "http://localhost:3000/billing",//actual link to billing
  }),

  managerAccountCreated: (name: string, tempPass: string) => ({
    title: "Manager Account Created",
    message: `Hi ${name}, your manager account has been created. Your temporary password is: ${tempPass}. Please change it upon logging in.`,
    actionUrl: "http://localhost:3000/login",
  }),
};
//the actual body of email
//TODO: fix format to match elbnb theme
export default function NotificationEmail({
  title,
  message,
  actionUrl,
}: {
  title: string
  message?: string
  actionUrl?: string
}) {
  return (
    <Html>
      <Preview>{message ?? title}</Preview>
      <Body style={{ background: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{
          background: '#fff',
          margin: '40px auto',
          padding: '32px',
          borderRadius: '8px',
          maxWidth: '560px'
        }}>
          <Heading style={{ color: '#111' }}>{title}</Heading>
          {message && <Text style={{ color: '#555' }}>{message}</Text>}
          {actionUrl && (
            <Button
              href={actionUrl}
              style={{
                background: '#111',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px'
              }}
            >
              View
            </Button>
          )}
        </Container>
      </Body>
    </Html>
  )
}