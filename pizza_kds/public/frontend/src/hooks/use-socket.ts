import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useOrdersStore } from '@/stores/orders-store'
import { useConnectionStore } from '@/stores/connection-store'
import { initSocket, disconnectSocket } from '@/lib/socket'
import { playNotificationSound } from '@/lib/sound'
import { normalizeOrder } from '@/lib/order-normalize'
import { fetchTodaysOrders } from '@/lib/orders-api'
import type { Order } from '@/types/order'

interface PrintJobStatus {
  job_id: string
  order_id: string
  status: 'printed' | 'failed'
  attempts: number
  error?: string | null
  agent?: string
  printer?: string
  timestamp?: string
  cmd?: string
}

/**
 * Connects to the Frappe socket.io server after login and listens for
 * "new order" events in the background.
 */
export function useSocket(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const mergeOrders = useOrdersStore((s) => s.mergeOrders)
  const setConnected = useConnectionStore((s) => s.setConnected)

  useEffect(() => {
    if (!isAuthenticated) return

    const handleNewOrder = (order: Order) => {
      addOrder(order)
      playNotificationSound()
      toast(`New order ${order.orderNumber} received`)
    }
    const handlePrintJobStatus = (status: PrintJobStatus) => {
      console.log('[socket] print_job_status received....', status)
      if (status.status === 'printed') {
        toast.success(`Order ${status.order_id} printed`, {
          description: status.printer ? `Printer ${status.printer}` : undefined,
        })
      } else {
        toast.error(`Print failed for order ${status.order_id}`, {
          description: status.error ?? undefined,
        })
      }
    }

    const handleAnyEvent = (event: string, ...args: unknown[]) => {
      console.log('[socket] event:', event, ...args)
    }

    // The backend emits the raw Sales Order doc, not the app's Order shape.
    const handleRawNewOrder = (raw: unknown) => {
      try {
        handleNewOrder(normalizeOrder(raw))
      } catch (err) {
        console.error('[socket] failed to normalize "new order" payload:', err, raw)
      }
    }

    const socket = initSocket()
    socket.on('new order', handleRawNewOrder)
    socket.on('print_job_status', handlePrintJobStatus)
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))
    socket.io.on('reconnect', () => setConnected(true))
    socket.onAny(handleAnyEvent)

    // Listeners are attached first so any "new order" that arrives while this
    // request is in flight isn't lost — mergeOrders dedupes against it.
    let cancelled = false
    fetchTodaysOrders()
      .then((orders) => {
        if (!cancelled) mergeOrders(orders)
      })
      .catch((err) => {
        console.error("[orders] failed to load today's orders:", err)
        toast.error("Couldn't load today's orders")
      })

    return () => {
      cancelled = true
      socket.off('new order', handleRawNewOrder)
      socket.off('print_job_status', handlePrintJobStatus)
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.offAny(handleAnyEvent)
      disconnectSocket()
    }
  }, [isAuthenticated, addOrder, mergeOrders, setConnected])
}
