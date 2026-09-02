import type { Order, OrderStatus, OrderType } from '@/types/order'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'NEW ORDER',
  cooking: 'COOKING',
  ready: 'READY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

/** Tailwind classes for the colored status badge per order state. */
export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  cooking: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ready: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

/** The action shown on a card/dialog for the given status, or null if terminal. */
export function nextAction(
  status: OrderStatus,
): { label: string; next: OrderStatus } | null {
  switch (status) {
    case 'new':
      return { label: 'Start Cooking', next: 'cooking' }
    case 'cooking':
      return { label: 'Mark Ready', next: 'ready' }
    case 'ready':
      return { label: 'Complete Order', next: 'completed' }
    default:
      return null
  }
}

/** While cooking, every item must be checked off before it can be marked ready. */
export function canAdvanceStatus(order: Order): boolean {
  if (order.status !== 'cooking') return true
  return order.items.every((item) => item.checked)
}

export function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short' })
}

/** Derives the display suffix from a Sales Order id, e.g. "SAL-ORD-2026-08-00014" -> "00014". */
export function orderIdSuffix(id: string): string {
  return id.split('-').pop() || id
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  'Dine In': 'Dine In',
  Takeaway: 'Takeaway',
  Delivery: 'Delivery',
}
