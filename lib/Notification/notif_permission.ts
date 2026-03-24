export async function subscribeUser() {
  const permission = await Notification.requestPermission();//ask user permission 

  if (permission !== "granted") {
    alert("Permission denied");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_KEY!
    ),
  });

  await fetch("/api/notification/route", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: { "Content-Type": "application/json" },
  });

  alert("Subscribed!");
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}