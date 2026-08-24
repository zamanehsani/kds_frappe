import { useEffect, useMemo, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
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
  const { orders, bump, enableAudio, hasBackendConnection } = useKDS();
  const [, setNow] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("[KDS] Fullscreen request was blocked:", error);
    }
  };

  const requestPermissions = async () => {
    await enableAudio();

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    const suppressFrappeOfflineAlert = (event) => {
      markOffline();
      event.stopImmediatePropagation();
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    window.addEventListener("offline", suppressFrappeOfflineAlert, true);

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("offline", suppressFrappeOfflineAlert, true);
    };
  }, []);

  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("[KDS] Screen Wake Lock activated");

          wakeLock.addEventListener("release", () => {
            console.log("[KDS] Screen Wake Lock released");
          });
        } else {
          console.warn("[KDS] Screen Wake Lock API not supported in this browser");
        }
      } catch (err) {
        console.error(`[KDS] Wake Lock Error: ${err.name}, ${err.message}`);
      }
    };

    // Request lock when page mounts
    requestWakeLock();

    // Re-request lock if kitchen staff tab-switches or minimizes and returns
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup when component unmounts (leaving KDS screen)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, []);

  
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


  return (
    <div className="relative min-h-screen bg-white p-4 sm:p-6">

      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <SettingsMenu
          onLogout={() => logoutFrappe("/kds/login")}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onRequestPermissions={requestPermissions}
        />
      </div>
      <div className="max-w-5xl mx-auto">
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

      {(!isOnline || !hasBackendConnection) && (
        <div
          className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-lg border border-red-700 bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-xl sm:w-auto"
          role="alert"
        >
          <CloudOff className="h-5 w-5 shrink-0" />
          <span className="flex-1">
            {!isOnline
              ? "You are offline. Orders will refresh when the network returns."
              : "Cannot reach the KDS backend. Check the server connection."}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/15 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Refresh KDS page"
            title="Refresh KDS page"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
