"use client";

import { useEffect } from "react";
import { subscribeUser } from "@/lib/Notification/notif_permission";
1
export default function EnableNotifications() {
  return <button onClick={subscribeUser}>Enable Notifications</button>;
}