'use client'

import { useEffect, useRef } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function PushInitClient({ userId }: { userId: string }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!userId) return
    if (initialized.current) return
    initialized.current = true

    const initPush = async () => {
      try {
        if (!('serviceWorker' in navigator)) return
        if (!('PushManager' in window)) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // DO NOT auto-unsubscribe unless debugging
        const existing = await reg.pushManager.getSubscription()
        if (existing) return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) throw new Error('Missing VAPID key')

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const res = await fetch('/api/push_notifications/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            subscription,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text)
        }

      } catch (err) {
        console.error('Push init failed:', err)
      }
    }

    initPush()
  }, [userId])

  return null
}