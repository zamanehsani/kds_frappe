import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL, SITE_NAMESPACE } from '@/lib/frappe'

let socket: Socket | null = null

/**
 * Initializes the socket connection. Call only after a successful login —
 * Frappe's socket.io server authenticates via the sid session cookie.
 * Connects to the site's namespace (e.g. "/localhost"), matching how the
 * print agent and Frappe itself scope realtime events per-site.
 *
 */
export function initSocket(): Socket {
  if (socket) return socket

  const base = import.meta.env.DEV ? window.location.origin : SOCKET_URL.replace(/\/+$/, '')
  const url = `${base}${SITE_NAMESPACE}`
  console.log(`base: ${base}, site namespace: ${SITE_NAMESPACE}, full socket URL: ${url}`)
  console.log(`[socket] connecting to ${url}`)

  socket = io(url, {
    withCredentials: true,
    reconnectionDelayMax: 10_000,
  })

  socket.on('connect', () => {
    console.log('[socket] connected:', socket)
    console.log('[socket] details:', {
      id: socket?.id,
      endpoint: url,
      namespace: SITE_NAMESPACE,
      negotiatedNamespaces: Object.keys(
        (socket?.io as unknown as { nsps?: Record<string, unknown> } | undefined)?.nsps ?? {},
      ),
      connected: socket?.connected,
      recovered: socket?.recovered,
      auth: socket?.auth,
      handshake: socket?.io.engine.transport,
      transport: socket?.io.engine.transport.name,
      manager: socket?.io,
    })
  })
  socket.on('connect_error', (err) => {
    console.error('[socket] connect_error:', err.message)
    console.error('[socket] failed socket:', socket)
    console.error('[socket] error details:', err)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function sendSocketTestEvent(): boolean {
  if (!socket?.connected) return false

  const payload = {
    source: 'kds-dashboard',
    socketId: socket.id,
    site: SITE_NAMESPACE,
    sentAt: new Date().toISOString(),
  }
  socket.emit('kitchen_dashboard_test', payload)
  console.log('[socket] emitted kitchen_dashboard_test:', payload)
  return true
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
  console.log('Socket disconnected')
}
