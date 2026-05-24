import { Activity, CheckCheck, ChefHat, Clock3 } from "lucide-react";
import { useMemo } from "react";

type Order = {
  name: string;
  status?: string | null;
  cooking_started_ts?: number | null;
  created_ts?: number | null;
  customer?: string | null;
};

type HomePageProps = {
  orders: Order[];
};

function HomePage({ orders }: HomePageProps) {
  const normaliseStatus = (raw?: string | null) => {
    const s = raw?.toLowerCase() || "new";
    if (s === "pending") return "new";
    if (s === "preparing") return "cooking";
    return s;
  };

  const summary = useMemo(() => {
    const base: Record<string, number> = {
      all: orders.length,
      new: 0,
      cooking: 0,
      ready: 0,
      completed: 0,
      overdue: 0,
    };
    orders.forEach((o) => {
      const s = normaliseStatus(o.status);
      if (base[s] !== undefined) base[s] += 1;
      if (
        s === "cooking" &&
        o.cooking_started_ts &&
        Date.now() - o.cooking_started_ts > 20 * 60 * 1000
      )
        base.overdue += 1;
    });
    return base;
  }, [orders]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (b.created_ts || 0) - (a.created_ts || 0))
        .slice(0, 8),
    [orders]
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
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
        <p className="mt-1 text-3xl sm:text-5xl font-normal tracking-wide text-olive-900">
          {greeting()}, Admin! Here's today's kitchen.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-8">
        {[
          {
            label: "All Orders",
            value: summary.all,
            tone: "border-olive-100",
            icon: Activity,
          },
          {
            label: "Cooking Now",
            value: summary.cooking,
            tone: "border-orange-200 bg-orange-50/40",
            icon: ChefHat,
          },
          {
            label: "Ready",
            value: summary.ready,
            tone: "border-blue-200 bg-blue-50/40",
            icon: CheckCheck,
          },
          {
            label: "Overdue",
            value: summary.overdue,
            tone: "border-red-200 bg-red-50/40",
            icon: Clock3,
          },
        ].map(({ label, value, tone, icon: Icon }) => (
          <div
            key={label}
            className={`rounded-[1.75rem] border bg-white p-5 shadow-sm ${tone}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-normal uppercase tracking-wide text-olive-400">
                  {label}
                </div>
                <div className="mt-2 text-3xl font-normal tracking-wide text-olive-900">
                  {value}
                </div>
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
          <div className="text-base font-normal uppercase tracking-wide text-olive-400">
            Live Order Feed
          </div>
          <p className="mt-1 text-3xl font-normal text-olive-900 mb-5">
            Recent KOT activity
          </p>
          <div className="space-y-2.5">
            {recent.length === 0 && (
              <p className="text-center text-olive-300 text-sm py-8">
                No orders yet today.
              </p>
            )}
            {recent.map((o) => (
              <div
                key={o.name}
                className="rounded-2xl border border-olive-100 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-normal text-olive-900">
                    #{o.name.split("-").pop()}
                  </div>
                  <div className="text-base text-olive-400 mt-0.5">
                    {o.customer || "Guest User"}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-base font-normal uppercase tracking-wide px-2.5 py-1 rounded-full ${statusBadge(
                      normaliseStatus(o.status)
                    )}`}
                  >
                    {normaliseStatus(o.status)}
                  </span>
                  <div className="text-xs text-olive-400 mt-1 whitespace-nowrap">
                    {o.created_ts != null
                      ? new Date(o.created_ts).toLocaleString("en-US", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-olive-100 bg-white p-6 shadow-sm">
          <div className="text-base font-normal uppercase tracking-wide text-olive-400">
            Status Mix
          </div>
          <p className="mt-1 text-3xl font-normal text-olive-900 mb-5">
            Kitchen state
          </p>
          <div className="space-y-4">
            {[
              ["New", summary.new, "bg-purple-500"],
              ["Cooking", summary.cooking, "bg-orange-500"],
              ["Ready", summary.ready, "bg-blue-500"],
              ["Completed", summary.completed, "bg-green-500"],
            ].map(([label, value, tone]) => {
              const pct =
                summary.all > 0
                  ? Math.round((Number(value) / summary.all) * 100)
                  : 0;
              return (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-base">
                    <span className="font-normal text-olive-700">{label}</span>
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

export default HomePage;
