import { useEffect, useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { logoutFrappe } from "../auth/api/session";
import SettingsMenu from "../auth/components/SettingsMenu";
import MenuGrid from "./components/MenuGrid";
import Cart from "./components/Cart";
import CheckoutModal from "./components/CheckoutModal";
import { usePOS } from "../../hooks/usePOS";

export default function POSPage() {
  const { menuItems, loading, loadMenu } = usePOS();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    if (!menuItems.length) return ["All"];
    const cats = ["All", ...new Set(menuItems.map((item) => item.item_group))];
    return cats.filter(Boolean);
  }, [menuItems]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.item_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || item.item_group === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, activeCategory]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.item_code === item.item_code
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.item_code === item.item_code
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, qty: 1, notes: "" }];
    });
  };

  // Update cart item quantity
  const updateQuantity = (itemCode, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemCode);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.item_code === itemCode ? { ...item, qty: newQty } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemCode) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.item_code !== itemCode)
    );
  };

  // Update item notes
  const updateNotes = (itemCode, notes) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.item_code === itemCode ? { ...item, notes } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.standard_rate * item.qty,
    0
  );
  const tax = subtotal * 0.05; // 5% tax (adjust as needed)
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-olive-50/30 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-olive-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-olive-900 whitespace-nowrap">
              POS
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-olive-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all text-olive-900 placeholder:text-olive-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-olive-400 hover:text-olive-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-xs text-olive-500 uppercase tracking-wide">Current Order</p>
              <p className="text-lg font-black text-brand-green">
                {cart.reduce((sum, item) => sum + item.qty, 0)} items
              </p>
            </div>
            <SettingsMenu onLogout={() => logoutFrappe("/kds/login")} />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-olive-100">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                activeCategory === category
                  ? "bg-brand-green text-white shadow-md shadow-brand-green/30"
                  : "bg-white border border-olive-200 text-olive-600 hover:border-brand-green hover:text-brand-green"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg
                  className="w-12 h-12 animate-spin text-brand-green mx-auto mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" className="opacity-30" />
                  <path strokeLinecap="round" d="M12 2a10 10 0 0 0-10 10" />
                </svg>
                <p className="text-olive-600 font-medium">Loading menu...</p>
              </div>
            </div>
          ) : (
            <MenuGrid items={filteredItems} onAddToCart={addToCart} />
          )}
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white border-l border-olive-200 flex flex-col shadow-xl">
          <Cart
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onUpdateNotes={updateNotes}
            onClearCart={clearCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            clearCart();
            setShowCheckout(false);
          }}
        />
      )}
    </div>
  );
}
