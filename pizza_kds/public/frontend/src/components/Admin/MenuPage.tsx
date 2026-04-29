import { UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  item_code: string;
  item_name?: string;
  item_group?: string;
  image?: string;
  standard_rate?: number | string | null;
};

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
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
    const g = [
      ...new Set(items.map((i) => i.item_group).filter(Boolean)),
    ].sort();
    return ["All", ...g];
  }, [items]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) => {
      if (activeGroup !== "All" && i.item_group !== activeGroup) return false;
      if (
        q &&
        !i.item_name?.toLowerCase().includes(q) &&
        !i.item_code?.toLowerCase().includes(q)
      )
        return false;
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
          <p className="text-xs font-black uppercase tracking-wide text-olive-400">
            Admin View
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-olive-900">
            Menu
          </h1>
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
          <UtensilsCrossed
            className="w-12 h-12 text-olive-200 mb-3"
            strokeWidth={1.5}
          />
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
                  <UtensilsCrossed
                    className="w-10 h-10 text-olive-200"
                    strokeWidth={1.5}
                  />
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
