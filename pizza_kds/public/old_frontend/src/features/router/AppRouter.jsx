import { startTransition, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../auth/ProtectedRoute";
import LoginPage from "../auth/components/LoginPage";
import KDSPage from "../kds/KDSPage";
import KDSAdminPage from "../kds/KDSAdminPage";
import POSPage from "../pos/POSPage";
import { checkFrappeSession, getCurrentAppRoute, goToWebRoute } from "../auth/api/session";

function RouteRedirect({ to }) {
  useEffect(() => {
    globalThis.location.replace(to);
  }, [to]);

  return null;
}

export default function AppRouter() {
  const route = useMemo(() => getCurrentAppRoute(), []);

  if (route === "kds_login") {
    return <RouteRedirect to="/kds/login" />;
  }

  if (route === "kds_view") {
    return <RouteRedirect to="/kds/staff" />;
  }

  if (route === "kds_web_login") {
    return <KDSLoginRoute />;
  }

  if (route === "kds_web_staff") {
    return (
      <ProtectedRoute redirectTo="/kds/login">
        <KDSPage />
      </ProtectedRoute>
    );
  }

  if (route === "kds_admin_view") {
    return <RouteRedirect to="/kds/admin" />;
  }

  if (route === "kds_web_admin") {
    return (
      <ProtectedRoute redirectTo="/kds/login">
        <KDSAdminPage />
      </ProtectedRoute>
    );
  }

  if (route === "pos_view") {
    return <RouteRedirect to="/kds/pos" />;
  }

  if (route === "pos_web") {
    return (
      <ProtectedRoute redirectTo="/kds/login">
        <POSPage />
      </ProtectedRoute>
    );
  }

  return <RouteRedirect to="/kds/login" />;
}

function KDSLoginRoute() {
  const [authState, setAuthState] = useState("loading");

  useEffect(() => {
    const frappeUser = globalThis.frappe?.session?.user;
    if (frappeUser && frappeUser !== "Guest") {
      startTransition(() => setAuthState("user"));
      return;
    }

    checkFrappeSession().then((ok) => {
      startTransition(() => setAuthState(ok ? "user" : "guest"));
    });
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-brand-green"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" className="opacity-30" />
          <path strokeLinecap="round" d="M12 2a10 10 0 0 0-10 10" />
        </svg>
      </div>
    );
  }

  if (authState === "guest") {
    return <LoginPage onLogin={(role) => goToWebRoute(role === "admin" ? "/kds/admin" : "/kds/staff")} />;
  }

  // Already logged in — check URL param for intended role, default to staff
  const params = new URLSearchParams(globalThis.location.search);
  const intendedRole = params.get("role");
  return <RouteRedirect to={intendedRole === "admin" ? "/kds/admin" : "/kds/staff"} />;
}
