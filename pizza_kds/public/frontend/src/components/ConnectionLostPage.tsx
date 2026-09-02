import { WifiOff } from 'lucide-react'
import { useConnectionStore } from '@/stores/connection-store'

/**
 * Replaces the whole screen with a status page while the socket is down —
 * not a dismissible popup, just a themed full-page state. Disappears
 * automatically the instant the connection store flips back to connected.
 */
export default function ConnectionLostPage() {
  const connected = useConnectionStore((s) => s.connected)
  if (connected) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background text-foreground">
      <WifiOff className="size-16 text-destructive" />
      <p className="text-3xl font-semibold tracking-wide sm:text-4xl">
        NOT CONNECTED TO SERVER
      </p>
      <p className="text-muted-foreground">Live order updates are paused. Reconnecting…</p>
    </div>
  )
}

