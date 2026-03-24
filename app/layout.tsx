"use client";
import NotificationRegister from "@/components/push notif/Notifications";
import { subscribeUser } from "@/lib/Notification/notif_permission";


//notif permission tester

export default function RootLayout() {
  return (
    <html>
      <body>  
        <NotificationRegister />
        
        <button onClick={subscribeUser}>
            Enable Notification
            </button>
      </body>
    </html>
  );
}