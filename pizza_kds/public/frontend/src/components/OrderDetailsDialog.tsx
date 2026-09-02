import { Play, Printer, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// import { Label } from '@/components/ui/label'
// import { Separator } from '@/components/ui/separator'
// import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatOrderTime, formatOrderDate,
  nextAction,
  orderIdSuffix,
  canAdvanceStatus,
} from '@/lib/order-ui'
import { triggerPrintJob } from '@/lib/orders-api'
import { useOrdersStore } from '@/stores/orders-store'
import type { Order } from '@/types/order'

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  const updateStatus = useOrdersStore((s) => s.updateStatus)
  const toggleItemChecked = useOrdersStore((s) => s.toggleItemChecked)
  // const setPaymentStatus = useOrdersStore((s) => s.setPaymentStatus)

  if (!order) return null

  const action = nextAction(order.status)
  const checklistUnlocked = order.status === 'cooking'
  const canAdvance = canAdvanceStatus(order)

  const onPrint = async () => {
    try {
      await triggerPrintJob(order.id)
      toast.success('Print job sent')
    } catch (err) {
      console.error('Failed to trigger print job:', err)
      toast.error('Failed to send print job')
    }
  }

  return (
    <Dialog open={open}  onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl rounded-2xl border-0">
       <DialogHeader className="">
        <DialogTitle className="flex items-center gap-3 m-0 pr-8 ">
          <span className='text-xl font-normal'>{order.phone}</span>
          <span className="text-muted-foreground text-sm font-normal">
            #{orderIdSuffix(order.id)}
          </span>
          
          {/* Push everything after this point to the right side */}
          <span className="flex-1" />

          <Badge className={cn('gap-1', STATUS_BADGE_CLASSES[order.status])}>
            {order.status === 'new' && <Sparkles className="size-3" />}
            {STATUS_LABELS[order.status]}
          </Badge>
          <Button className="rounded-full p-4"
            variant="outline"
            size="icon"
            onClick={onPrint}
            aria-label="Print order"
          >
            <Printer className="size-4" />
          </Button>
        </DialogTitle>
        <DialogDescription className="sr-only">
          Order details for {order.orderNumber}
        </DialogDescription>
    </DialogHeader>


        <div className="grid gap-6 md:grid-cols-2">
          {/* Left column: item checklist */}
          <div className="flex  flex-col gap-3">
            <h3 className="text-lg m-0 font-medium">
              List Items
              {!checklistUnlocked && (
                <span className="ml-2 text-xs m-0">
                  (checklist unlocks while cooking)
                </span>
              )}
            </h3>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[32vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {order.items.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 rounded-full border p-4',
                    checklistUnlocked
                      ? 'cursor-pointer hover:bg-muted/50'
                      : 'opacity-60',
                    item.checked && 'bg-muted/50',
                  )}
                >
                  <Checkbox
                    className="size-5 rounded-full"
                    checked={item.checked}
                    disabled={!checklistUnlocked}
                    onCheckedChange={() => toggleItemChecked(order.id, item.id)}
                  />
                  <span
                    className={cn(
                      'flex-1',
                      item.checked && 'line-through',
                    )}
                  >
                    {item.qty} x {item.name}
                  </span>
                  <Badge variant="outline">{item.prepTime}M</Badge>
                </label>
              ))}
            </div>
            {action && (
              <Button
                size="lg"
                className="mt-auto w-full rounded-full"
                disabled={!canAdvance}
                onClick={() => updateStatus(order.id, action.next)}
              >
                <Play className="size-4" />
                {canAdvance ? action.label : 'Check off all items first'}
              </Button>
            )}
          </div>

          {/* Right column: order summary */}
          <div className="flex flex-col">
            <h3 className="text-lg m-0">
              Order Summary
            </h3>
            <dl className="">
              <div className="flex items-center justify-between">
                <dt className="">Customer Name</dt>
                <dd className="">{order.customerName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="">Order time</dt>
                <dd className="">{formatOrderDate(order.time)}, {formatOrderTime(order.time)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="">Order Type</dt>
                <dd className="">{order.type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="">Payment</dt>
                <dd
                  className={cn(
                    '',
                    order.paymentStatus === 'Unpaid' && 'text-destructive',
                  )}
                >
                  {order.paymentStatus}
                </dd>
              </div>
            </dl>
            {/* <Separator />
            <div className="flex items-center justify-between rounded-full border p-2">
              <Label htmlFor="settle-cash" className="text-sm">
                Settle Cash Payment
              </Label>
              <Switch
                id="settle-cash"
                checked={order.paymentStatus === 'Paid'}
                onCheckedChange={(paid) => setPaymentStatus(order.id, paid)}
              />
            </div> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
