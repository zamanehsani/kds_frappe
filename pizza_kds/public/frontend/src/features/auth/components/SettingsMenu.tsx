import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, User } from "lucide-react";

export default function SettingsMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Icon Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2  bg-white text-olive-700  transition"
      >
        <Settings className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-olive-100 bg-white z-50 overflow-hidden">
          <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-olive-700 hover:bg-olive-50">
            <User className="w-4 h-4" />
            Profile
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
