import { Plus, ShoppingCart } from "lucide-react";

export default function MenuGrid({ items, onAddToCart }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-olive-400">
        <p className="text-lg font-medium">No items found</p>
        <p className="text-sm">Try adjusting your search or category filter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
      {items.map((item) => (
        <MenuItem key={item.item_code} item={item} onAdd={onAddToCart} />
      ))}
    </div>
  );
}

function MenuItem({ item, onAdd }) {
  // Fix image URL handling - Frappe stores images with /files/ prefix or full URLs
  const imageUrl = item.image
    ? item.image.startsWith("http")
      ? item.image
      : item.image.startsWith("/files/")
      ? item.image
      : `/files/${item.image}`
    : null;

  return (
    <div
      onClick={() => onAdd(item)}
      className="group bg-white border border-olive-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-brand-green transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.98]"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-olive-50 to-olive-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.item_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              // Fallback to emoji if image fails to load
              e.target.style.display = "none";
              e.target.parentElement.querySelector(".fallback-icon").style.display = "flex";
            }}
          />
        ) : null}
        
        {/* Fallback Icon - shown when no image or image fails */}
        <div 
          className="fallback-icon absolute inset-0 flex items-center justify-center"
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <span className="text-6xl opacity-40">🍕</span>
        </div>
        
        {/* Add Button Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <div className="bg-brand-green text-white rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </div>

        {/* Category Badge */}
        {item.item_group && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-white/95 backdrop-blur-sm text-olive-600 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">
              {item.item_group}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-olive-900 text-base mb-2 line-clamp-2 leading-tight group-hover:text-brand-green transition-colors">
          {item.item_name}
        </h3>
        
        {item.description && (
          <p className="text-xs text-olive-500 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        )}
        
        {/* Price */}
        <div className="mt-auto pt-2 border-t border-olive-100">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-brand-green">
              AED {item.standard_rate.toFixed(2)}
            </span>
            <div className="bg-brand-green/10 text-brand-green rounded-full p-2 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
              <Plus className="w-4 h-4" strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
