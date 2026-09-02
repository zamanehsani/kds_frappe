import { useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import OrderCard from '@/components/OrderCard'
import OrderDetailsDialog from '@/components/OrderDetailsDialog'
import { useSocket } from '@/hooks/use-socket'
import { filterOrders, useOrdersStore } from '@/stores/orders-store'

export default function DashboardPage() {
  useSocket()

  const orders = useOrdersStore((s) => s.orders)
  const activeFilter = useOrdersStore((s) => s.activeFilter)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const visible = filterOrders(orders, activeFilter)
  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 p-4">
        {visible.length === 0 ? (
          <div className="flex h-full min-h-[60svh] items-center justify-center">
            <p className="text-4xl font-semibold tracking-widest text-muted-foreground sm:text-5xl">
              KITCHEN CLEAR
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onOpenDetails={() => {
                  setSelectedId(order.id)
                  setDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </main>

      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
