import { startTransition, useEffect, useState } from "react";
import { checkFrappeSession, goToWebRoute } from "./api/session";

function AuthLoadingScreen() {
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

export default function ProtectedRoute({ children, redirectTo = "/kds/login" }) {
  const [authState, setAuthState] = useState("loading");

  useEffect(() => {
    const frappeUser = globalThis.frappe?.session?.user;
    if (frappeUser && frappeUser !== "Guest") {
      startTransition(() => setAuthState("user"));
      return;
    }

    checkFrappeSession().then((ok) => {
      if (ok) {
        startTransition(() => setAuthState("user"));
      } else {
        goToWebRoute(redirectTo);
      }
    });
  }, [redirectTo]);

  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  return children;
}
