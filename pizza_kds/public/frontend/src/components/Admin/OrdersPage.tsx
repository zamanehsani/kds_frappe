import { useEffect, useMemo, useState } from "react";
import OrderDetailModal from "../../features/kds/components/OrderDetailModal";
import OrderCard from "../../features/kds/components/OrderCard";
import FilterBar from "../../features/kds/components/FilterBar";
import type { Order } from "../../types";

interface OrdersPageProps {
  orders: Order[];
  bump: (name: string) => void;
}

function OrdersPage({ orders, bump }: Readonly<OrdersPageProps>) {
  const [, setNow] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (expandedOrderId && !orders.some((o) => o.name === expandedOrderId)) {
      setExpandedOrderId(null);
    }
  }, [orders, expandedOrderId]);

  const toDateString = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const normaliseStatus = (raw?: string | null): string => {
    const s = raw?.toLowerCase() || "new";
    if (s === "pending") return "new";
    if (s === "preparing") return "cooking";
    return s;
  };
  type Counts = {
    all: number;
    new: number;
    cooking: number;
    ready: number;
    completed: number;
    cancelled: number;
  };

  const counts = useMemo<Counts>(() => {
    const r: Counts = {
      all: orders.length,
      new: 0,
      cooking: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      const s = normaliseStatus(o.status) as keyof Counts | string;
      if (Object.prototype.hasOwnProperty.call(r, s)) r[s as keyof Counts] += 1;
    });
    return r;
  }, [orders]);

  const filtered = useMemo<Order[]>(
    () =>
      orders.filter((o) => {
        if (isDateFilterActive) {
          const ds =
            o.creation?.substring(0, 10) ||
            (o.created_ts ? toDateString(new Date(o.created_ts)) : null);
          if (ds && ds !== toDateString(selectedDate)) return false;
        }
        return (
          activeFilter === "All" ||
          normaliseStatus(o.status) === activeFilter.toLowerCase()
        );
      }),
    [orders, activeFilter, selectedDate, isDateFilterActive]
  );

  const expandedOrder: Order | null = expandedOrderId
    ? (orders.find((o) => o.name === expandedOrderId) ?? null)
    : null;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-olive-400">
          Admin View
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-olive-900">
          Order List
        </h1>
      </div>

      <FilterBar
        activeFilter={activeFilter}
        counts={counts}
        onFilterChange={setActiveFilter}
        selectedDate={selectedDate}
        onDateChange={(d) => {
          setSelectedDate(d);
          setIsDateFilterActive(true);
        }}
        isDateFilterActive={isDateFilterActive}
        onDateClear={() => {
          setSelectedDate(new Date());
          setIsDateFilterActive(false);
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filtered.map((o) => (
          <OrderCard
            key={o.name}
            order={o}
            onBump={bump}
            onOpenDetail={() => setExpandedOrderId(o.name)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 opacity-20">
            <h2 className="text-4xl font-black text-slate-900">
              KITCHEN CLEAR
            </h2>
          </div>
        )}
      </div>

      {expandedOrder && (
        <OrderDetailModal
          order={expandedOrder}
          onClose={() => setExpandedOrderId(null)}
          onBump={bump}
        />
      )}
    </div>
  );
}
export default OrdersPage;
export { OrdersPage };
