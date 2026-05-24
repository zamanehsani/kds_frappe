import { useEffect, useMemo, useState } from "react";
import { useKDS } from "../../hooks/useKDS";
import FilterBar from "./components/FilterBar";
import OrderCard from "./components/OrderCard";
import OrderDetailModal from "./components/OrderDetailModal";
import { logoutFrappe } from "../auth/api/session";
import SettingsMenu from "../auth/components/SettingsMenu";

const normaliseStatus = (raw) => {
  const status = raw?.toLowerCase() || "new";
  if (status === "pending") return "new";
  if (status === "preparing") return "cooking";
  return status;
};

const toDateString = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function KDSPage() {
  const { orders, bump } = useKDS();
  const [, setNow] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);


  const counts = useMemo(() => {
    const result = {
      all: orders.length,
      new: 0,
      cooking: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      const status = normaliseStatus(order.status);
      if (result[status] !== undefined) result[status] += 1;
    });
    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (isDateFilterActive) {
        const creationDateStr =
          order.creation?.substring(0, 10) ||
          (order.created_ts ? toDateString(new Date(order.created_ts)) : null);

        if (creationDateStr && creationDateStr !== toDateString(selectedDate)) {
          return false;
        }
      }

      if (activeFilter === "All") return true;
      return normaliseStatus(order.status) === activeFilter.toLowerCase();
    });
  }, [orders, activeFilter, selectedDate, isDateFilterActive]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsDateFilterActive(true);
  };

  const handleDateClear = () => {
    setSelectedDate(new Date());
    setIsDateFilterActive(false);
  };

  const expandedOrder = expandedOrderId
    ? orders.find((order) => order.name === expandedOrderId) ?? null
    : null;

  useEffect(() => {
    if (
      expandedOrderId &&
      !orders.find((order) => order.name === expandedOrderId)
    ) {
      setExpandedOrderId(null);
    }
  }, [orders, expandedOrderId]);

  return (
    <div className="min-h-screen bg-white p-6 sm:p-8">
         <div className="flex justify-end mb-2">
     <SettingsMenu onLogout={() => logoutFrappe("/kds/login")} />
    </div>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 mt-0">
          Order List
        </h2>
        <FilterBar
          activeFilter={activeFilter}
          counts={counts}
          onFilterChange={setActiveFilter}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isDateFilterActive={isDateFilterActive}
          onDateClear={handleDateClear}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.name}
            order={order}
            onBump={bump}
            onOpenDetail={() => setExpandedOrderId(order.name)}
          />
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 opacity-20">
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
