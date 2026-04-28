import { ShieldCheck, ChefHat, ArrowRight } from "lucide-react";
import LogoutButton from "./LogoutButton";

function RoleCard({ title, description, icon: Icon, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[1.75rem] border bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${tone}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <Icon className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-olive-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-olive-500">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-olive-300 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </button>
  );
}

export default function RoleSelectPage({ onChooseStaff, onChooseAdmin, onLogout }) {
  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-end">
          <LogoutButton onLogout={onLogout} />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-olive-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-olive-500">
            Choose Workspace
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-olive-900 sm:text-4xl">
            Open the KDS role you need
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-olive-500 sm:text-base">
            Staff gets the live kitchen workflow. Admin gets the monitoring dashboard and management overview.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <RoleCard
            title="Staff View"
            description="Open the live kitchen board for cooks and floor staff. This is the fast operational KDS screen."
            icon={ChefHat}
            tone="border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-white"
            onClick={onChooseStaff}
          />
          <RoleCard
            title="Admin Dashboard"
            description="Open the management view to monitor kitchen load, order status mix, and overall KDS activity."
            icon={ShieldCheck}
            tone="border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white"
            onClick={onChooseAdmin}
          />
        </div>
      </div>
    </div>
  );
}
