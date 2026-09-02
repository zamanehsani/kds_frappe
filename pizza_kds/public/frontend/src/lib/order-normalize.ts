import type { Order, OrderItem, OrderStatus, OrderType, PaymentStatus } from '@/types/order'

const ORDER_TYPES: OrderType[] = ['Dine In', 'Takeaway', 'Delivery']
const ORDER_STATUSES: OrderStatus[] = ['new', 'cooking', 'ready', 'completed', 'cancelled']

function text(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  const str = String(value).trim()
  return str || fallback
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function first(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return undefined
}

function toIso(value: unknown): string {
  if (typeof value === 'string' && value) {
    // Frappe timestamps look like "2026-08-31 12:39:08.826480" — make them ISO-parseable.
    const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date().toISOString()
}

function orderNumberFrom(raw: Record<string, unknown>): string {
  const ticket = text(first(raw, 'custom_kitchen_order_ticket'))
  const name = text(first(raw, 'name'))
  const source = ticket || name
  const suffix = source.split('-').pop() || source
  return suffix ? `#${suffix}` : '#--'
}

function orderTypeFrom(raw: Record<string, unknown>): OrderType {
  const candidate = text(
    first(raw, 'custom_order_type', 'order_type_display', 'delivery_type'),
  )
  const match = ORDER_TYPES.find((t) => t.toLowerCase() === candidate.toLowerCase())
  if (match) return match
  if (text(first(raw, 'shipping_address_name', 'shipping_address'))) return 'Delivery'
  return 'Takeaway'
}

function paymentStatusFrom(raw: Record<string, unknown>): PaymentStatus {
  const schedule = Array.isArray(raw.payment_schedule) ? raw.payment_schedule : []
  const outstanding = schedule.length
    ? num((schedule[0] as Record<string, unknown>)?.outstanding)
    : num(raw.grand_total) - num(raw.advance_paid)
  return outstanding > 0 ? 'Unpaid' : 'Paid'
}

function cookingStatusFrom(raw: Record<string, unknown>): OrderStatus {
  const candidate = text(first(raw, 'status')).toLowerCase()
  return (ORDER_STATUSES as string[]).includes(candidate) ? (candidate as OrderStatus) : 'new'
}

function normalizeItems(raw: Record<string, unknown>): OrderItem[] {
  const items = Array.isArray(raw.items) ? raw.items : []
  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => ({
      id: text(first(item, 'name', 'item_code'), `item-${index}`),
      name: text(first(item, 'item_name', 'item_code'), 'Item'),
      qty: num(first(item, 'qty'), 1),
      prepTime: num(first(item, 'prep_time', 'custom_prep_time'), 5),
      checked: false,
    }))
}

/**
 * Flattens whatever shape the backend's "new order" event sends (a raw Frappe
 * Sales Order doc, or an already-shaped Order) into the `Order` type the UI needs.
 */
export function normalizeOrder(raw: unknown): Order {
  const doc = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const id = text(first(doc, 'id', 'name'))
  if (!id) throw new Error('Order payload is missing an id/name')

  return {
    id,
    orderNumber: text(first(doc, 'orderNumber')) || orderNumberFrom(doc),
    customerName: text(first(doc, 'customerName', 'customer_name', 'customer'), 'Walk-in'),
    phone: text(first(doc, 'phone', 'contact_mobile', 'contact_phone', 'customer')),
    time: typeof doc.time === 'string' ? doc.time : toIso(first(doc, 'creation', 'transaction_date')),
    type: (ORDER_TYPES as string[]).includes(text(doc.type))
      ? (doc.type as OrderType)
      : orderTypeFrom(doc),
    paymentStatus: (['Paid', 'Unpaid'] as string[]).includes(text(doc.paymentStatus))
      ? (doc.paymentStatus as PaymentStatus)
      : paymentStatusFrom(doc),
    status: (ORDER_STATUSES as string[]).includes(text(doc.status))
      ? (doc.status as OrderStatus)
      : cookingStatusFrom(doc),
    items: Array.isArray(doc.items) && doc.items.length && 'id' in (doc.items[0] as object)
      ? (doc.items as OrderItem[])
      : normalizeItems(doc),
  }
}
