import React, { useEffect, useState } from "react";
import {
  ChefHat,
  Bell,
  CircleCheckBig,
  Sparkles,
  Play,
  Check,
  X,
  Clock,
  MapPin,
  User,
  Hash,
} from "lucide-react";
import { Order } from "../../../types";

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onBump: (name: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onBump,
}) => {
  const rawStatus = order.status?.toLowerCase() || "new";
  const status =
    rawStatus === "pending"
      ? "new"
      : rawStatus === "preparing"
      ? "cooking"
      : rawStatus;

  const getStatusConfig = () => {
    switch (status) {
      case "cooking":
        return {
          label: "Cooking",
          icon: ChefHat,
          colors: "bg-orange-100 !text-orange-700",
        };
      case "ready":
        return {
          label: "Ready to serve",
          icon: Bell,
          colors: "bg-blue-100 !text-blue-700",
        };
      case "completed":
        return {
          label: "Completed",
          icon: CircleCheckBig,
          colors: "bg-green-100 !text-green-700",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          icon: CircleCheckBig,
          colors: "bg-red-100 !text-red-600",
        };
      default:
        return {
          label: "New Order",
          icon: Sparkles,
          colors: "bg-purple-100 !text-purple-700",
        };
    }
  };

  const getActionConfig = () => {
    switch (status) {
      case "new":
        return {
          label: "Start Cooking",
          icon: Play,
          colors: "bg-purple-100 !text-purple-600 hover:bg-purple-200 border-0",
        };
      case "cooking":
        return {
          label: "Mark Ready",
          icon: Bell,
          colors: "bg-blue-100 !text-blue-600 hover:bg-blue-200 border-0",
        };
      case "ready":
        return {
          label: "Complete",
          icon: Check,
          colors: "bg-green-100 !text-green-600 hover:bg-green-200 border-0",
        };
      case "completed":
        return {
          label: "Archived",
          icon: CircleCheckBig,
          colors: "bg-slate-100 !text-slate-400 border-0 cursor-not-allowed",
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const actionConfig = getActionConfig();
  const StatusIcon = statusConfig.icon;
  const [completedItems, setCompletedItems] = useState(new Set());
  const canMarkItemsDone = status === "cooking";
  const notedItems = (order.items || [])
    .map((item, index) => ({
      index,
      itemCode: item.item_code,
      qty: item.qty,
      note: item.notes
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((item) => item.note);

  const orderDate = new Date(order.created_ts);
  const orderTimeStr = orderDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const orderDateStr = orderDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  const totalAmount = order.total_amount ?? null;

  useEffect(() => {
    setCompletedItems(new Set());
  }, [order.name]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const toggleItemDone = (itemIndex) => {
    if (!canMarkItemsDone) return;

    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemIndex)) {
        next.delete(itemIndex);
      } else {
        next.add(itemIndex);
      }
      return next;
    });
  };

  const allItemsDone =
    order.items?.length > 0 && completedItems.size === order.items.length;

  const isCooking = status === "cooking";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Order details"
    >
      <button
        type="button"
        aria-label="Close order details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-olive-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-olive-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-olive-50 flex items-center justify-center text-olive-500">
              <Hash className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-olive-900 font-black text-base sm:text-lg">
                {order.customer || "Guest User"}
              </div>
              <div className="text-olive-400 text-xs sm:text-sm">
                #{order.name.split("-").pop()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusConfig.colors}`}
            >
              <StatusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              {statusConfig.label}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-olive-50 text-olive-400 hover:text-olive-700 transition-colors"
              aria-label="Close detail modal"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-84px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
            <div className="px-5 sm:px-7 py-5 sm:py-6 border-b lg:border-b-0 lg:border-r border-olive-100">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-olive-800 uppercase tracking-wide">
                      List Item ({order.items?.length || 0})
                    </div>
                    <div className="text-olive-400 text-xs sm:text-sm mt-1">
                      {canMarkItemsDone
                        ? "Tap each row to mark it done for the chef."
                        : "Item checklist unlocks only while the order is cooking."}
                    </div>
                  </div>
                  {canMarkItemsDone && order.items?.length > 0 && (
                    <div className="text-right">
                      <div className="text-olive-900 text-sm font-black">
                        {completedItems.size}/{order.items.length}
                      </div>
                      <div className="text-olive-400 text-xs">done</div>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-2 ">
                  {order.items?.map((item, i) => (
                    <li
                      key={i}
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        completedItems.has(i)
                          ? "border border-green-200 bg-green-50/80 shadow-sm"
                          : "border border-olive-100 bg-white hover:border-olive-200 hover:shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItemDone(i)}
                        disabled={!canMarkItemsDone}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-left ${
                          canMarkItemsDone
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-80"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            completedItems.has(i)
                              ? "border-green-500 bg-green-500 text-white scale-110"
                              : canMarkItemsDone
                              ? "border-olive-300 bg-white text-transparent"
                              : "border-olive-200 bg-olive-50 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm sm:text-base font-semibold leading-tight transition-all duration-300 ${
                              completedItems.has(i)
                                ? "text-olive-500 line-through"
                                : "text-olive-900"
                            }`}
                          >
                            {item.item_code}
                          </div>
                          {item.notes && (
                            <div
                              className={`text-xs sm:text-sm mt-1 line-clamp-2 transition-all duration-300 ${
                                completedItems.has(i)
                                  ? "text-olive-300"
                                  : "text-olive-400"
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: item.notes
                                  .replace(/<[^>]+>/g, " ")
                                  .trim(),
                              }}
                            />
                          )}
                        </div>

                        <span
                          className={`text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full transition-all duration-300 ${
                            completedItems.has(i)
                              ? "bg-green-100 text-green-700"
                              : "bg-olive-50 text-olive-500"
                          }`}
                        >
                          ×{item.qty}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {actionConfig &&
                (() => {
                  const ActionIcon = actionConfig.icon;
                  return (
                    <button
                      onClick={() => {
                        if (
                          status !== "completed" &&
                          (!isCooking || allItemsDone)
                        ) {
                          onBump(order.name);
                        }
                      }}
                      disabled={
                        status === "completed" || (isCooking && !allItemsDone)
                      }
                      className={`w-full sm:w-auto !rounded-3xl flex items-center justify-center gap-2.5 px-4 sm:px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 shadow-sm
                        ${
                          status === "completed" || (isCooking && !allItemsDone)
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : `${actionConfig.colors} hover:shadow-md active:scale-95`
                        }`}
                    >
                      <ActionIcon className="w-5 h-5" strokeWidth={2.5} />
                      <span>{actionConfig.label}</span>
                    </button>
                  );
                })()}
            </div>

            <div className="px-5 sm:px-7 py-5 sm:py-6 bg-olive-50/35">
              <div className="text-xs sm:text-sm font-black text-olive-800 uppercase tracking-wide mb-4">
                Order Summary
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Name</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-semibold text-right break-all">
                    {order.customer || "Guest User"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Order time</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-semibold text-right">
                    {orderDateStr}, {orderTimeStr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Order Type</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-semibold text-right">
                    {order.table_no
                      ? `Dine in | ${order.table_no}`
                      : order.order_type || "Takeaway"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Items</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-semibold">
                    {order.items?.length || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-olive-100 bg-white px-4 py-4">
                <div className="text-xs sm:text-sm font-black text-olive-800 uppercase tracking-wide mb-3">
                  Customer Notes
                </div>

                {notedItems.length > 0 ? (
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {notedItems.map((item) => (
                      <div
                        key={`${item.itemCode}-${item.index}`}
                        className="rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-olive-900 text-xs sm:text-sm font-bold">
                            {item.itemCode}
                          </span>
                          <span className="text-amber-700 text-[11px] font-black uppercase tracking-wide">
                            x{item.qty}
                          </span>
                        </div>
                        <p className="text-olive-500 text-xs sm:text-sm leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-olive-400 text-xs sm:text-sm leading-relaxed">
                    No special customer notes were added for this KOT.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
