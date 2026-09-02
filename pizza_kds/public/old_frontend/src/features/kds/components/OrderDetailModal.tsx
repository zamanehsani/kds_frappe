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
  FileText,
  CreditCard,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { Order } from "../../../types";
import { toast } from "react-toastify";

// Detect if running locally or in production
const backendOrigin = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : window.location.origin;

const printKotAPI = async (kotName: string): Promise<any> => {
  // Sending as GET query parameter bypasses Frappe's POST CSRF check entirely
  console.log(`Sending print request for KOT: ${kotName}`);
  console.log("base url:", backendOrigin);

  const response = await fetch(
    `${backendOrigin}/api/method/pizza_app.api.enqueue_print_job?kot_name=${encodeURIComponent(kotName)}`,
    {method: "GET", headers: {"Accept": "application/json"}}
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.exception || "Failed to submit print job.");
  }

  const data = await response.json();
  return data.message;
};

const settleDoorstepPaymentAPI = async (salesOrderName: string): Promise<any> => {
  const response = await fetch(`${backendOrigin}/api/method/pizza_app.api.settle_doorstep_payment`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Accept": "application/json"},
    credentials: "omit",
    body: JSON.stringify({sales_order_name: salesOrderName}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Server payment settlement error:", errorData);
    throw new Error(errorData.exception || "Failed to settle payment on server.");
  }

  const data = await response.json();
  return data.message;
};



interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onBump: (name: string) => void;
  onToggleItemDone: (itemId: string, currentStatus: boolean) => Promise<void>;
}

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatAddonValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const addon = value as Record<string, unknown>;
  const baseValue =
    addon.name ??
    addon.item_name ??
    addon.item_code ??
    addon.addon_name ??
    addon.label ??
    addon.title;

  const base = typeof baseValue === "string" ? baseValue.trim() : "";
  if (!base) return "";

  const qtyValue = addon.qty;
  const parsedQty =
    typeof qtyValue === "number"
      ? qtyValue
      : typeof qtyValue === "string" && qtyValue.trim()
        ? Number(qtyValue)
        : null;

  if (parsedQty && Number.isFinite(parsedQty) && parsedQty > 1) {
    return `${base} x${parsedQty}`;
  }

  return base;
};

const parseSelectedAddons = (rawAddons: unknown): string[] => {
  if (rawAddons == null) return [];

  if (Array.isArray(rawAddons)) {
    return Array.from(
      new Set(rawAddons.flatMap((addon) => parseSelectedAddons(addon)))
    );
  }

  if (typeof rawAddons === "object") {
    const value = formatAddonValue(rawAddons);
    if (value) return [value];

    return Array.from(
      new Set(
        Object.values(rawAddons as Record<string, unknown>).flatMap((item) =>
          parseSelectedAddons(item)
        )
      )
    );
  }

  if (typeof rawAddons !== "string") return [];

  const text = rawAddons.trim();
  if (!text) return [];

  const lower = text.toLowerCase();
  if (
    lower === "null" ||
    lower === "none" ||
    lower === "undefined" ||
    lower === "[]"
  ) {
    return [];
  }

  const parseAsJson = (value: string): string[] | null => {
    try {
      return parseSelectedAddons(JSON.parse(value));
    } catch {
      return null;
    }
  };

  const parsedJson = parseAsJson(text);
  if (parsedJson) return parsedJson;

  if ((text.startsWith("[") || text.startsWith("{")) && text.includes("'")) {
    const relaxedJson = parseAsJson(text.replace(/'/g, '"'));
    if (relaxedJson) return relaxedJson;
  }

  return Array.from(
    new Set(
      text
        .split(/\r?\n|,|\|/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onBump,
  onToggleItemDone,
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
          label: "Completed",
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
  // const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`kds_completed_items_${order.name}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error("Failed to parse saved KDS items context:", error);
      return new Set();
    }
  });

  const canMarkItemsDone = status === "cooking";



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
  const [isSettling, setIsSettling] = useState(false);


  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintKot = async () => {
    setIsPrinting(true);
    try {
      const result = await printKotAPI(order.name);
      toast.success("Kitchen ticket sent to printer!");
    } catch (err: any) {
      console.error("Caught print error:", err);
      toast.error(err.message || "Failed to print. Check printer connection.");
    } finally {
      setIsPrinting(false);
    }
  };


  const handleSettlePayment = async () => {
    if (!order.sales_order) return;
    setIsSettling(true);

    try {
      const result = await settleDoorstepPaymentAPI(order.sales_order);
      toast.success('Payment settled successfully via backend core channels!');

    } catch (err: any) {
      console.error("Caught component error:", err);
      toast.error(err.message || 'Settlement failed. Please verify ledger balance.');
    } finally {
      setIsSettling(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kds_completed_items_${order.name}`);
      setCompletedItems(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch (error) {
      setCompletedItems(new Set());
    }
  }, [order.name]);

  useEffect(() => {
    if (order.name) {
      localStorage.setItem(
        `kds_completed_items_${order.name}`,
        JSON.stringify(Array.from(completedItems))
      );
    }
  }, [completedItems, order.name]);

  const toggleItemDone = (itemIndex: number) => {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);


  const isCooking = status === "cooking";
  const localCompletedCount = completedItems.size;
  const allItemsDone = order.items?.length > 0 && localCompletedCount === order.items.length;

  const isPaid = (order.custom_payment_status || "Unpaid").toLowerCase() === "paid";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Order details" >
      <button type="button" aria-label="Close order details" onClick={onClose} className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] border border-red-600" />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-olive-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-olive-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-olive-50 flex items-center justify-center text-olive-500">
              <Hash className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-olive-900 font-normal text-base sm:text-lg lg:text-xl">
                {order.customer || "Guest User"}
              </div>
              <div className="text-olive-400 text-xs sm:text-sm">
                #{order.name.split("-").pop()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mr-2 sm:mr-4"> {/* Changed to mr-2 sm:mr-4 to clear the 2rem corner boundary curve */}

            <button onClick={handlePrintKot} disabled={isPrinting} aria-label={isPrinting ? "Printing" : "Print"} title={isPrinting ? "Printing" : "Print"}
              className="group flex h-8 w-8 items-center justify-center !rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-olive-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" >
              {isPrinting ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-olive-700 border-t-transparent" />
              ) : (
                <Printer
                  className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={2.3}
                />
              )}
            </button>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.colors}`} >
              <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
              {statusConfig.label}
            </span>
            <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center !rounded-full p-2 border border-red-600 hover:bg-red-600 text-red-600 hover:text-white transition-colors" aria-label="Close detail modal" >
              <X className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-84px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
            <div className="px-5 sm:px-7 py-5 sm:py-6 border-b lg:border-b-0 lg:border-r border-olive-100">
              <div className="mb-4 sm:mb-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xl sm:text-xl font-normal text-olive-800">
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
                      <div className="text-olive-900 text-sm font-normal">
                        {localCompletedCount}/{order.items.length}
                      </div>
                      <div className="text-olive-400 text-xs">done</div>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-2 ">
                  {order.items?.map((item, i) => {
                    const addonLabels = parseSelectedAddons(
                      item.custom_selected_addons
                    );

                    // Determine completion directly from local state
                    const isItemDone = completedItems.has(i);

                    return (
                      <li
                        key={i}
                        className={`!rounded-full overflow-hidden transition-all duration-300 ${isItemDone
                          ? "border border-green-200 bg-green-50/80 shadow-sm"
                          : "border border-olive-100 bg-white hover:border-olive-200 hover:shadow-sm"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItemDone(i)}
                          disabled={!canMarkItemsDone}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-left ${canMarkItemsDone
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-80"
                            }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${isItemDone
                              ? "border-green-500 bg-green-500 text-white scale-110"
                              : canMarkItemsDone
                                ? "border-olive-300 bg-white text-transparent"
                                : "border-olive-200 bg-olive-50 text-transparent"
                              }`}
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>

                          <div className="flex-1 min-w-0">
                            {/* Flex row layout to keep title and prep time badge together */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <div
                                className={`text-sm sm:text-base font-normal leading-tight transition-all tracking-wide duration-300 ${isItemDone
                                  ? "text-olive-500 line-through"
                                  : "text-olive-900"
                                  }`}
                              >
                                {item.item_name || item.item_code}
                              </div>

                              {/* Prep time badge brought up directly next to the title text */}
                              {item.prep_time != null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600 uppercase tracking-wide h-fit">
                                  <ChefHat className="w-3 h-3" strokeWidth={2.5} />
                                  {item.prep_time}m
                                </span>
                              )}
                            </div>

                            {/* Addon Labels Section */}
                            {addonLabels.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {addonLabels.map((addonLabel, addonIndex) => (
                                  <span
                                    key={`${item.item_code}-addon-${addonIndex}`}
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-normal uppercase tracking-wide transition-all duration-300 ${isItemDone
                                      ? "border-green-200 bg-green-100 text-green-700"
                                      : "border-cyan-200 bg-cyan-50 text-cyan-700"
                                      }`}
                                  >
                                    {addonLabel}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Description Section */}
                            {item.description && (
                              <div
                                className={`text-xs sm:text-sm mt-1 line-clamp-2 transition-all duration-300 ${isItemDone ? "text-olive-300" : "text-olive-400"
                                  }`}
                              >
                                {stripHtml(item.description)}
                              </div>
                            )}
                          </div>

                          <span
                            className={`text-base font-normal whitespace-nowrap px-2.5 py-1 rounded-full transition-all duration-300 ${isItemDone
                              ? "bg-green-100 text-green-700"
                              : "bg-olive-50 text-olive-500"
                              }`}
                          >
                            ×{item.qty}
                          </span>
                        </button>
                      </li>
                    );
                  })}
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
                      className={`w-full sm:w-auto !rounded-3xl flex items-center justify-center gap-2.5 px-4 sm:px-6 py-3 text-sm sm:text-base font-normal uppercase tracking-wider transition-all duration-200 shadow-sm
                        ${status === "completed" || (isCooking && !allItemsDone)
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
              <div className="text-xl sm:text-xl font-normal text-olive-800 uppercase tracking-wide mb-4">
                Order Summary
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Name</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-normal text-right break-all">
                    {order.customer || "Guest User"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Order time</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-normal text-right">
                    {orderDateStr}, {orderTimeStr}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-olive-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Order Type</span>
                  </div>
                  <span className="text-olive-900 text-xs sm:text-sm font-normal text-right">
                    {order.table_no
                      ? `Dine in | ${order.table_no}`
                      : order.order_type || "Takeaway"}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-olive-400">
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Payment</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="text-olive-900 font-medium capitalize">
                        {order.custom_payment_method || "N/A"}
                      </span>

                      <span
                        className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border tracking-wide transition-colors ${isPaid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          }`}
                      >
                        {isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>


                  {!isPaid && order.sales_order && (
                    <button
                      onClick={handleSettlePayment}
                      disabled={isSettling}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-olive-700 transition-colors hover:text-olive-800 hover:underline disabled:pointer-events-none disabled:text-slate-400"
                    >
                      {isSettling ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-olive-700 border-t-transparent" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                      )}

                      <span>Settle Cash Payment</span>
                    </button>
                  )}
                </div>

                {/* Elegant Customer Notes Component Box */}
                {order.custom_customer_note && (
                  <div className="mt-4 pt-4 ">
                    <div className="flex items-center gap-2 text-olive-500 mb-1.5">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="">
                        Customer Notes
                      </span>
                    </div>
                    <div className="w-full rounded-2xl border border-slate-100 bg-amber-50/40 p-3">
                      {order.custom_customer_note}
                    </div>
                  </div>
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
