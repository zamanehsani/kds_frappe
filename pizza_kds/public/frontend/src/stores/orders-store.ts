import { create } from 'zustand'
import { toast } from 'sonner'
import { updateCookingStatus } from '@/lib/orders-api'
import type { Order, OrderFilter, OrderStatus } from '@/types/order'

interface OrdersState {
  orders: Order[]
  activeFilter: OrderFilter
  setOrders: (orders: Order[]) => void
  mergeOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  setFilter: (filter: OrderFilter) => void
  updateStatus: (orderId: string, status: OrderStatus) => void
  toggleItemChecked: (orderId: string, itemId: string) => void
  setPaymentStatus: (orderId: string, paid: boolean) => void
}

export const useOrdersStore = create<OrdersState>()((set) => ({
  orders: [],
  activeFilter: 'all',
  setOrders: (orders) => set({ orders }),
  mergeOrders: (incoming) =>
    set((state) => {
      const existingIds = new Set(state.orders.map((o) => o.id))
      const merged = [...state.orders, ...incoming.filter((o) => !existingIds.has(o.id))]
      merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      return { orders: merged }
    }),
  addOrder: (order) =>
    set((state) =>
      state.orders.some((o) => o.id === order.id)
        ? state
        : { orders: [order, ...state.orders] },
    ),
  setFilter: (filter) => set({ activeFilter: filter }),
  updateStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }))
    // custom_cooking_status on the Sales Order drives the dashboard filters,
    // so every local status change must be mirrored to the backend.
    updateCookingStatus(orderId, status).catch((err) => {
      console.error('Failed to sync cooking status to Frappe:', err)
      toast.error("Couldn't update order status on the server")
    })
  },
  toggleItemChecked: (orderId, itemId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((it) =>
                it.id === itemId ? { ...it, checked: !it.checked } : it,
              ),
            }
          : o,
      ),
    })),
  setPaymentStatus: (orderId, paid) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, paymentStatus: paid ? 'Paid' : 'Unpaid' } : o,
      ),
    })),
}))

export function filterOrders(orders: Order[], filter: OrderFilter): Order[] {
  return filter === 'all' ? orders : orders.filter((o) => o.status === filter)
}

export function orderCounts(orders: Order[]): Record<OrderFilter, number> {
  const counts: Record<OrderFilter, number> = {
    all: orders.length,
    new: 0,
    cooking: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const o of orders) counts[o.status]++
  return counts
}
