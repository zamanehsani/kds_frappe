import { LogOut } from "lucide-react";

export default function LogoutButton({ onLogout, className = "" }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={`inline-flex items-center gap-2 rounded-2xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-olive-700 shadow-sm transition-all duration-200 hover:border-olive-300 hover:bg-olive-50 hover:shadow-md ${className}`}
    >
      <LogOut className="h-4 w-4" strokeWidth={2.5} />
      Logout
    </button>
  );
}
