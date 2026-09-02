import React from "react";
import {
  ChefHat,
  Bell,
  CircleCheckBig,
  Sparkles,
  Play,
  CheckCircle2,
  Check,
  XCircle
} from "lucide-react";
import { Order } from "../../../types";

interface OrderCardProps {
  order: Order;
  onBump: (name: string) => void;
  onOpenDetail?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onBump,
  onOpenDetail,
}) => {

  const maxPrepMins =
    order.items?.reduce((max, item) => Math.max(max, item.prep_time ?? 0), 0) || 20;
  const COOKING_DURATION_MS = maxPrepMins * 60 * 1000;
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
  const isCooking = status === "cooking";
  const cookingStartedAt = order.cooking_started_ts ?? null;
  const elapsedMs =
    isCooking && cookingStartedAt
      ? Math.max(0, Date.now() - cookingStartedAt)
      : 0;
  const elapsedRatio = isCooking
    ? Math.min(elapsedMs / COOKING_DURATION_MS, 1)
    : 0;
  const remainingRatio = 1 - elapsedRatio;
  const timerColor =
    remainingRatio > 0.5
      ? "#22c55e"
      : remainingRatio > 0.2
      ? "#f59e0b"
      : "#ef4444";
  const progressAngle = `${Math.max(remainingRatio * 360, 6)}deg`;
  const cookingBorderStyle = isCooking
    ? {
        background: `conic-gradient(from -90deg, ${timerColor} 0deg, ${timerColor} ${progressAngle}, #e7ece8 ${progressAngle}, #e7ece8 360deg)`,
        boxShadow: `0 0 0 1px ${timerColor}12, 0 10px 24px ${timerColor}18`,
      }
    : undefined;
  const cookingLabel =
    elapsedRatio < 1
      ? `${Math.max(
          0,
          Math.ceil((COOKING_DURATION_MS - elapsedMs) / 60000)
        )}m left`
      : "Over time";


 // Normalise payment tracking status attributes safely
  const paymentStatus = order.custom_payment_status || "Unpaid";
  const isPaid = paymentStatus.toLowerCase() === "paid";

  return (
    <div
      onClick={onOpenDetail}
      className="group !rounded-4xl p-[1.5px] transition-all duration-300 cursor-pointer"
      style={cookingBorderStyle}
    >
      <div className="bg-white border border-olive-200 !rounded-4xl p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-olive-200 transition-all duration-300 h-full flex flex-col">
        <div className="mb-4">
          {/* Row 1: Customer + Order ID */}
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 flex-1 min-w-0 text-olive-900 !text-xl sm:text-xl md:text-1xl leading-tight truncate">
              {order.customer || "Guest User"}
            </p>

            <span className="flex-shrink-0 text-olive-600 font-normal text-xs sm:text-sm lg:text-base tracking-wider whitespace-nowrap">
              #{order.name.split("-").pop()}
            </span>
          </div>

          {/* Row 2: Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span  onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal uppercase tracking-wide ${statusConfig.colors}`} >
              <StatusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              {statusConfig.label}
            </span>

            {/* Payment Status Badge */}
             <span onClick={(e) => e.stopPropagation()}
               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium tracking-wide ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-600"}`}>
               {isPaid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
               ) : (
                 <XCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} />
               )}
              {paymentStatus}
            </span>

            {isCooking && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-normal uppercase tracking-wide"
                style={{backgroundColor: `${timerColor}14`, color: timerColor}}>
                <ChefHat className="w-3 h-3" strokeWidth={2.5}/>
                {cookingLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2 pb-3 border-b border-olive-100 border-dashed-sm">
          <div className="flex items-center gap-2 text-olive-400 text-sm sm:text-base lg:text-lg font-normal">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-olive-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="">
              {new Date(order.created_ts).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-olive-400 text-sm sm:text-base lg:text-lg font-normal">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-olive-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="">
              {order.table_no || order.order_type || "Takeaway"}
            </span>
          </div>
        </div>

        <div className="flex-1 mb-5">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <span className="text-sm sm:text-base md:text-lg text-olive-800 uppercase tracking-wide">
              Orders ({order.items?.length || 0})
            </span>
            {order.total_amount != null && (
              <span className="text-brand-green text-lg sm:text-xl md:text-2xl">
                ${order.total_amount.toFixed(2)}
              </span>
            )}
          </div>
          <ul className="space-y-2.5 sm:space-y-3">
            {order.items?.slice(0, 3).map((item, i) => (
              <li
                key={i}
                className="flex justify-between items-start gap-3 text-ms sm:text-base"
              >
                <span className="!text-olive-400 text-xl  flex-1">
                  <span className="!text-olive-400 mr-2">
                    {item.qty} <span className="lowercase">x</span>
                  </span>
                  <span className="text-sm sm:text-base lg:text-xl tracking-tight">
                    {item.item_name || item.item_code}
                  </span>
                </span>
                {item.price != null && (
                  <span className="text-olive-900 text-sm sm:text-base whitespace-nowrap">
                    ${(item.price * (item.qty ?? 1)).toFixed(2)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {order.items?.length > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.();
              }}
              className="text-brand-green text-sm sm:text-base font-normal mt-3 sm:mt-4 flex items-center gap-1.5 hover:gap-2.5 transition-all hover:underline group/more"
            >
              <span>+{order.items.length - 3} more items</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover/more:tranolive-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {actionConfig &&
          (() => {
            const ActionIcon = actionConfig.icon;
            return (
              <button onClick={(e) => {
                  e.stopPropagation();
                  if (status === "cooking") {
                    onOpenDetail?.();
                  } else if (status !== "completed") {
                    onBump(order.name);
                  }
                }}
                disabled={status === "completed"}
                className={`w-full !rounded-full sm:w-auto sm:self-start flex items-center justify-center gap-2.5 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-3 text-sm sm:text-base md:text-lg font-normal transition-all duration-200 active:scale-95 hover:shadow-md ${actionConfig.colors}`}>
                <ActionIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1} />
                <span>{actionConfig.label}</span>
              </button>
            );
          })()}
      </div>
    </div>
  );
};

export default OrderCard;
