import { TIMEZONE, frappeCall } from '@/lib/frappe'
import { normalizeOrder } from '@/lib/order-normalize'
import type { Order, OrderStatus } from '@/types/order'

function todayDateString(): string {
  // en-CA formats as YYYY-MM-DD, which is what Frappe's date filters expect.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date())
}

/** Lists doc names matching filters via Frappe's REST resource list endpoint. */
async function listResource(doctype: string, filters: unknown[]): Promise<string[]> {
  const params = new URLSearchParams({
    filters: JSON.stringify(filters),
    fields: JSON.stringify(['name']),
    limit_page_length: '0',
    order_by: 'creation asc',
  })
  const { data } = await frappeCall<{ data: Array<{ name: string }> }>(
    `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`,
  )
  return (data ?? []).map((row) => row.name)
}

/** Fetches a single full doc (with child tables) via the REST resource endpoint. */
async function getResource(doctype: string, name: string): Promise<Record<string, unknown>> {
  const { data } = await frappeCall<{ data: Record<string, unknown> }>(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
  )
  return data
}

/** Loads today's submitted Sales Orders (with items), in the restaurant's timezone. */
export async function fetchTodaysOrders(): Promise<Order[]> {
  const names = await listResource('Sales Order', [
    ['transaction_date', '=', todayDateString()],
    ['docstatus', '=', 1],
  ])
  if (!names.length) return []

  const docs = await Promise.all(names.map((name) => getResource('Sales Order', name)))
  return docs.map((doc) => normalizeOrder(doc))
}

/** Asks the print agent to (re)print the kitchen ticket for a Sales Order. */
export async function triggerPrintJob(orderName: string): Promise<void> {
  const params = new URLSearchParams({ order_name: orderName })
  await frappeCall(`/api/method/pizza_app.api.trigger_print_job?${params.toString()}`)
}

/** Persists the kitchen workflow status (New/Cooking/Ready/Completed/Cancelled) on the Sales Order. */
export async function updateCookingStatus(orderName: string, status: OrderStatus): Promise<void> {
  const cookingStatus = status.charAt(0).toUpperCase() + status.slice(1)
  await frappeCall(`/api/resource/Sales Order/${encodeURIComponent(orderName)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: cookingStatus }),
  })
}
