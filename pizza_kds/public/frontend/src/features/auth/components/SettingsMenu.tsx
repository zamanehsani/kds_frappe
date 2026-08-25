import { useState, useRef, useEffect } from "react";
import { BellRing, CalendarRange, LogOut, Maximize, Minimize, Settings } from "lucide-react";

type SettingsMenuProps = {
  onLogout: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void | Promise<void>;
  onRequestPermissions: () => void | Promise<void>;
  onOpenDateFilter: () => void;
  isDateFilterActive?: boolean;
};

export default function SettingsMenu({
  onLogout,
  isFullscreen,
  onToggleFullscreen,
  onRequestPermissions,
  onOpenDateFilter,
  isDateFilterActive,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        aria-label="KDS settings"
      >
        <Settings className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-olive-100 bg-white z-50 overflow-hidden">
          <button
            onClick={onToggleFullscreen}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-olive-700 hover:bg-olive-50"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          </button>

          <button
            onClick={onRequestPermissions}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-olive-700 hover:bg-olive-50"
          >
            <BellRing className="w-4 h-4" />
            Enable alerts
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onOpenDateFilter();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-olive-700 hover:bg-olive-50"
          >
            <CalendarRange className="w-4 h-4" />
            Filter by date
            {isDateFilterActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-green" />
            )}
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
