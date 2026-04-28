import { useEffect, useMemo, useState } from "react";
import {
  Home,
  ShoppingBag,
  UtensilsCrossed,
  History,
  Settings,
  LogOut,
  Activity,
  ChefHat,
  Clock3,
  CheckCheck,
} from "lucide-react";
import { useKDS } from "../../hooks/useKDS";
import FilterBar from "./components/FilterBar";
import OrderCard from "./components/OrderCard";
import OrderDetailModal from "./components/OrderDetailModal";
import { logoutFrappe } from "../auth/api/session";

// ─── helpers ──────────────────────────────────────────────────────────────────

const normaliseStatus = (raw) => {
  const s = raw?.toLowerCase() || "new";
  if (s === "pending") return "new";
  if (s === "preparing") return "cooking";
  return s;
};

const toDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "history", label: "History", icon: History },
];

function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] bg-white border-r border-olive-100 flex flex-col items-center py-5 z-20 shadow-sm">
      {/* Logo */}
      <div className="w-11 h-11 bg-brand-green rounded-2xl flex items-center justify-center mb-8 shadow-md flex-shrink-0">
        <ChefHat className="w-6 h-6 text-white" strokeWidth={2} />
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-olive-400 hover:bg-olive-50 hover:text-olive-700"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        <button
          title="Settings"
          className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl text-olive-300 hover:bg-olive-50 hover:text-olive-600 transition-all duration-200"
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
          <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Settings</span>
        </button>
        <button
          onClick={onLogout}
          title="Logout"
          className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl text-olive-300 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="text-[9px] font-bold uppercase tracking-wide leading-none">Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

function HomePage({ orders }) {
  const summary = useMemo(() => {
    const base = { all: orders.length, new: 0, cooking: 0, ready: 0, completed: 0, overdue: 0 };
    orders.forEach((o) => {
      const s = normaliseStatus(o.status);
      if (base[s] !== undefined) base[s] += 1;
      if (s === "cooking" && o.cooking_started_ts && Date.now() - o.cooking_started_ts > 20 * 60 * 1000)
        base.overdue += 1;
    });
    return base;
  }, [orders]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => (b.created_ts || 0) - (a.created_ts || 0)).slice(0, 8),
    [orders]
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusBadge = (status) => {
    const map = {
      cooking: "bg-orange-100 text-orange-700",
      ready: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-600",
    };
    return map[status] || "bg-purple-100 text-purple-700";
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-olive-400 text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-olive-900">
          {greeting()}, Admin! Here's today's kitchen.
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-8">
        {[
          { label: "All Orders", value: summary.all, tone: "border-olive-100", icon: Activity },
          { label: "Cooking Now", value: summary.cooking, tone: "border-orange-200 bg-orange-50/40", icon: ChefHat },
          { label: "Ready", value: summary.ready, tone: "border-blue-200 bg-blue-50/40", icon: CheckCheck },
          { label: "Overdue", value: summary.overdue, tone: "border-red-200 bg-red-50/40", icon: Clock3 },
        ].map(({ label, value, tone, icon: Icon }) => (
          <div key={label} className={`rounded-[1.75rem] border bg-white p-5 shadow-sm ${tone}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-olive-400">{label}</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-olive-900">{value}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm flex-shrink-0">
                <Icon className="h-6 w-6 text-olive-600" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: recent orders + status mix */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[2rem] border border-olive-100 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-olive-400">Live Order Feed</div>
          <h2 className="mt-1 text-xl font-black text-olive-900 mb-5">Recent KOT activity</h2>
          <div className="space-y-2.5">
            {recent.length === 0 && (
              <p className="text-center text-olive-300 text-sm py-8">No orders yet today.</p>
            )}
            {recent.map((o) => (
              <div
                key={o.name}
                className="rounded-2xl border border-olive-100 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-black text-olive-900">#{o.name.split("-").pop()}</div>
                  <div className="text-xs text-olive-400 mt-0.5">{o.customer || "Guest User"}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${statusBadge(
                      normaliseStatus(o.status)
                    )}`}
                  >
                    {normaliseStatus(o.status)}
                  </span>
                  <div className="text-xs text-olive-400 mt-1 whitespace-nowrap">
                    {new Date(o.created_ts).toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-olive-100 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-olive-400">Status Mix</div>
          <h2 className="mt-1 text-xl font-black text-olive-900 mb-5">Kitchen state</h2>
          <div className="space-y-4">
            {[
              ["New", summary.new, "bg-purple-500"],
              ["Cooking", summary.cooking, "bg-orange-500"],
              ["Ready", summary.ready, "bg-blue-500"],
              ["Completed", summary.completed, "bg-green-500"],
            ].map(([label, value, tone]) => {
              const pct = summary.all > 0 ? Math.round((value / summary.all) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-bold text-olive-700">{label}</span>
                    <span className="text-olive-400">
                      {value} • {pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-olive-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tone} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Orders page (identical experience to staff KDS) ──────────────────────────

function OrdersPage({ orders, bump }) {
  const [, setNow] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (expandedOrderId && !orders.some((o) => o.name === expandedOrderId)) {
      setExpandedOrderId(null);
    }
  }, [orders, expandedOrderId]);

  const counts = useMemo(() => {
    const r = { all: orders.length, new: 0, cooking: 0, ready: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      const s = normaliseStatus(o.status);
      if (r[s] !== undefined) r[s] += 1;
    });
    return r;
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (isDateFilterActive) {
          const ds =
            o.creation?.substring(0, 10) ||
            (o.created_ts ? toDateString(new Date(o.created_ts)) : null);
          if (ds && ds !== toDateString(selectedDate)) return false;
        }
        return activeFilter === "All" || normaliseStatus(o.status) === activeFilter.toLowerCase();
      }),
    [orders, activeFilter, selectedDate, isDateFilterActive]
  );

  const expandedOrder = expandedOrderId
    ? orders.find((o) => o.name === expandedOrderId) ?? null
    : null;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-olive-400">Admin View</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-olive-900">Order List</h1>
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
            <h2 className="text-4xl font-black text-slate-900">KITCHEN CLEAR</h2>
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

// ─── Menu page ────────────────────────────────────────────────────────────────

function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    globalThis.frappe.call({
      method: "pizza_app.api.get_menu_items",
      callback: (r) => {
        setItems(r.message || []);
        setLoading(false);
      },
    });
  }, []);

  const groups = useMemo(() => {
    const g = [...new Set(items.map((i) => i.item_group).filter(Boolean))].sort();
    return ["All", ...g];
  }, [items]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) => {
      if (activeGroup !== "All" && i.item_group !== activeGroup) return false;
      if (q && !i.item_name?.toLowerCase().includes(q) && !i.item_code?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, activeGroup, search]);

  const formatPrice = (val) =>
    val != null ? `$${Number(val).toFixed(2)}` : "—";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-olive-400">Admin View</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-olive-900">Menu</h1>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-olive-200 bg-white text-sm text-olive-900 placeholder-olive-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wide transition-all duration-200 ${
              activeGroup === g
                ? "bg-brand-green text-white shadow-sm"
                : "bg-white border border-olive-200 text-olive-500 hover:border-olive-300 hover:text-olive-800"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-olive-200 border-t-brand-green animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <UtensilsCrossed className="w-12 h-12 text-olive-200 mb-3" strokeWidth={1.5} />
          <p className="text-olive-400 font-bold">No items found.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map((item) => (
            <div
              key={item.item_code}
              className="bg-white rounded-[1.5rem] border border-olive-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image / placeholder */}
              <div className="w-full aspect-square bg-olive-50 flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="w-10 h-10 text-olive-200" strokeWidth={1.5} />
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[10px] font-black uppercase tracking-wide text-olive-300 mb-0.5 truncate">
                  {item.item_group || "Uncategorised"}
                </div>
                <div className="text-sm font-black text-olive-900 leading-snug line-clamp-2 flex-1">
                  {item.item_name}
                </div>
                <div className="mt-2 text-base font-black text-brand-green">
                  {formatPrice(item.standard_rate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History page ─────────────────────────────────────────────────────────────

function HistoryPage({ orders }) {
  const completed = useMemo(
    () =>
      [...orders]
        .filter((o) => normaliseStatus(o.status) === "completed")
        .sort((a, b) => (b.created_ts || 0) - (a.created_ts || 0)),
    [orders]
  );

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-olive-400">Admin View</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-olive-900">Order History</h1>
      </div>

      <div className="rounded-[2rem] border border-olive-100 bg-white overflow-hidden shadow-sm">
        {completed.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-olive-300">
            <p className="text-sm font-bold">No completed orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-olive-100 bg-olive-50/50">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-olive-400">KOT #</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-olive-400">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-olive-400">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-olive-400">Items</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wide text-olive-400">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wide text-olive-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-100">
                {completed.map((o) => (
                  <tr key={o.name} className="hover:bg-olive-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-olive-900">#{o.name.split("-").pop()}</td>
                    <td className="px-6 py-4 text-olive-600">{o.customer || "Guest User"}</td>
                    <td className="px-6 py-4 text-olive-500">
                      {o.table_no ? `Dine In · ${o.table_no}` : o.order_type || "Takeaway"}
                    </td>
                    <td className="px-6 py-4 text-olive-500">{o.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-right font-bold text-brand-green">
                      {o.total_amount != null ? `$${o.total_amount.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-olive-400 whitespace-nowrap">
                      {new Date(o.created_ts).toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function KDSAdminPage() {
  const { orders, bump } = useKDS();
  const [activePage, setActivePage] = useState("home");

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={() => logoutFrappe("/kds/login")}
      />
      <main className="flex-1 ml-[72px] min-h-screen p-6 sm:p-8 overflow-auto">
        {activePage === "home" && <HomePage orders={orders} />}
        {activePage === "orders" && <OrdersPage orders={orders} bump={bump} />}
        {activePage === "menu" && <MenuPage />}
        {activePage === "history" && <HistoryPage orders={orders} />}
      </main>
    </div>
  );
}
