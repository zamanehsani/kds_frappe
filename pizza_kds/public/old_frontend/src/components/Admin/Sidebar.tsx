import {
  ChefHat,
  CreditCard,
  History,
  Home,
  LogOut,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

type NavItemId = "home" | "orders" | "menu" | "history" | "pos";

const NAV_ITEMS: { id: NavItemId; label: string; icon: any; isExternal?: boolean }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  // { id: "menu", label: "Menu", icon: UtensilsCrossed },
  // { id: "pos", label: "POS", icon: CreditCard, isExternal: true },
  // { id: "history", label: "History", icon: History },
];
interface SidebarProps {
  activePage: NavItemId;
  onNavigate: (id: NavItemId) => void;
  onLogout: () => void;
}

function Sidebar({ activePage, onNavigate, onLogout }: Readonly<SidebarProps>) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] bg-white border-r border-olive-100 flex flex-col items-center py-5 z-20 shadow-sm">
      {/* Logo */}
      <div className="w-11 h-11 bg-brand-green rounded-2xl flex items-center justify-center mb-8 shadow-md flex-shrink-0">
        <ChefHat className="w-6 h-6 text-white" strokeWidth={2} />
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, isExternal }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (isExternal && id === "pos") {
                  window.location.href = "/kds/pos";
                } else {
                  onNavigate(id);
                }
              }}
              title={label}
              className={`flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-olive-400 hover:bg-olive-50 hover:text-olive-700"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[9px] font-normal uppercase tracking-wide leading-none">
                {label}
              </span>
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
          <span className="text-[9px] font-normal uppercase tracking-wide leading-none">
            Settings
          </span>
        </button>
        <button
          onClick={onLogout}
          title="Logout"
          className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-2xl text-olive-300 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="text-[9px] font-normal uppercase tracking-wide leading-none">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
