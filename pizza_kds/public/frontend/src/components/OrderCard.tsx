import { Bike, Clock, Play, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderTime,
  nextAction,
  canAdvanceStatus,
} from '@/lib/order-ui'
import { useOrdersStore } from '@/stores/orders-store'
import type { Order, OrderType } from '@/types/order'

const TYPE_ICONS: Record<OrderType, typeof Bike> = {
  'Dine In': UtensilsCrossed,
  Takeaway: ShoppingBag,
  Delivery: Bike,
}

const MAX_VISIBLE_ITEMS = 3

interface OrderCardProps {
  order: Order
  onOpenDetails: () => void
}

export default function OrderCard({ order, onOpenDetails }: OrderCardProps) {
  const updateStatus = useOrdersStore((s) => s.updateStatus)
  const action = nextAction(order.status)
  const canAdvance = canAdvanceStatus(order)
  const TypeIcon = TYPE_ICONS[order.type]

  return (
    <Card
      className="flex h-full cursor-pointer flex-col rounded-4xl transition-shadow hover:shadow-md"
      onClick={onOpenDetails}
      role="button"
      aria-label={`Order ${order.orderNumber} details`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col">
          <span className="text-lg">{order.phone}</span>
          <span className="text-xs text-muted-foreground">{order.id}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge className={cn('gap-1', STATUS_BADGE_CLASSES[order.status])}>
            {order.status === 'new' && <Sparkles className="size-3" />}
            {STATUS_LABELS[order.status]}
          </Badge>
          <Badge
            variant={order.paymentStatus === 'Unpaid' ? 'outline' : 'secondary'}
            className={order.paymentStatus === 'Unpaid' ? 'text-destructive border-destructive/40' : ''}
          >
            {order.paymentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 ">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatOrderDate(order.time)}, {formatOrderTime(order.time)}
          </span>
          <span className="flex items-center gap-1">
            <TypeIcon className="size-3.5" />
            {order.type}
          </span>
        </div>
        <Separator className='' />

        <ul className="space-y-1 text-sm text-muted-foreground">
          {order.items.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
            <li key={item.id}>
              {item.qty} x {item.name}
            </li>
          ))}
        </ul>
        {order.items.length > MAX_VISIBLE_ITEMS && (
          <p className="text-xs text-muted-foreground">
            +{order.items.length - MAX_VISIBLE_ITEMS} more item
            {order.items.length - MAX_VISIBLE_ITEMS > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>

      {action && (
        <CardFooter className="border-0 bg-transparent pt-0">
          <Button
            variant="secondary"
            className="w-full rounded-full m-0"
            size="lg"
            disabled={!canAdvance}
            onClick={(e) => {
              e.stopPropagation()
              updateStatus(order.id, action.next)
            }}
          >
            <Play className="size-4" />
            {canAdvance ? action.label : 'Check off all items first'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
