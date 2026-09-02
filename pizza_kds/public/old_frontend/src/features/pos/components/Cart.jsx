import { useState } from "react";
import { ShoppingCart, Trash2, Plus, Minus, X, StickyNote } from "lucide-react";

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onClearCart,
  subtotal,
  tax,
  total,
  onCheckout,
}) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-olive-400 p-6">
        <div className="bg-olive-50 rounded-full p-6 mb-4">
          <ShoppingCart className="w-16 h-16 text-olive-300" />
        </div>
        <p className="text-lg font-bold text-olive-600">Cart is empty</p>
        <p className="text-sm text-center mt-2 text-olive-500">
          Add items from the menu to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-olive-200 flex items-center justify-between bg-gradient-to-b from-olive-50/50 to-white">
        <div className="flex items-center gap-2">
          <div className="bg-brand-green/10 rounded-full p-2">
            <ShoppingCart className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h2 className="font-black text-olive-900 text-lg">Current Order</h2>
            <p className="text-xs text-olive-500">
              {cart.reduce((sum, item) => sum + item.qty, 0)} items
            </p>
          </div>
        </div>
        <button
          onClick={onClearCart}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-bold">Clear</span>
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-olive-50/20">
        {cart.map((item) => (
          <CartItem
            key={item.item_code}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
            onUpdateNotes={onUpdateNotes}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-olive-200 p-4 space-y-3 bg-white shadow-lg">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-olive-600 font-medium">Subtotal</span>
            <span className="font-bold text-olive-900">AED {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-olive-600 font-medium">Tax (5%)</span>
            <span className="font-bold text-olive-900">AED {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-black border-t border-olive-200 pt-3">
            <span className="text-olive-900">Total</span>
            <span className="text-brand-green">AED {total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-brand-green hover:bg-green-600 active:scale-[0.98] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-brand-green/30 hover:shadow-xl hover:shadow-brand-green/40"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove, onUpdateNotes }) {
  const [showNotes, setShowNotes] = useState(false);

  // Fix image URL
  const imageUrl = item.image
    ? item.image.startsWith("http")
      ? item.image
      : item.image.startsWith("/files/")
      ? item.image
      : `/files/${item.image}`
    : null;

  return (
    <div className="bg-white rounded-2xl p-3 border border-olive-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-olive-50 to-olive-100 rounded-xl overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.item_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.querySelector(".fallback-icon").style.display = "flex";
              }}
            />
          ) : null}
          <div 
            className="fallback-icon w-full h-full flex items-center justify-center text-2xl"
            style={{ display: imageUrl ? "none" : "flex" }}
          >
            🍕
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-bold text-sm text-olive-900 line-clamp-2 leading-tight">
              {item.item_name}
            </h4>
            <button
              onClick={() => onRemove(item.item_code)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1 bg-olive-50 border border-olive-200 rounded-lg">
              <button
                onClick={() => onUpdateQuantity(item.item_code, item.qty - 1)}
                className="p-1.5 hover:bg-olive-100 text-olive-600 rounded-l-lg transition-colors"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
              <span className="w-8 text-center font-black text-olive-900">{item.qty}</span>
              <button
                onClick={() => onUpdateQuantity(item.item_code, item.qty + 1)}
                className="p-1.5 hover:bg-olive-100 text-olive-600 rounded-r-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>

            {/* Price */}
            <span className="font-black text-brand-green text-base">
              AED {(item.standard_rate * item.qty).toFixed(2)}
            </span>
          </div>

          {/* Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-brand-green hover:text-green-600 font-bold flex items-center gap-1"
          >
            <StickyNote className="w-3 h-3" />
            {showNotes ? "Hide notes" : "Add notes"}
          </button>

          {showNotes && (
            <textarea
              value={item.notes || ""}
              onChange={(e) => onUpdateNotes(item.item_code, e.target.value)}
              placeholder="Add special instructions..."
              className="w-full mt-2 p-2 text-xs border border-olive-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-olive-50/50 text-olive-900 placeholder:text-olive-400"
              rows={2}
            />
          )}
        </div>
      </div>
    </div>
  );
}
