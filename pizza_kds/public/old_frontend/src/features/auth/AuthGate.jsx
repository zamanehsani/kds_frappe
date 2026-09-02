import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import { checkFrappeSession } from "./api/session";

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

export default function AuthGate({ children }) {
  const [authState, setAuthState] = useState(() => {
    const frappeUser = globalThis.frappe?.session?.user;
    return frappeUser && frappeUser !== "Guest" ? "user" : "loading";
  });
  const shouldCheckSession = authState === "loading";

  useEffect(() => {
    if (shouldCheckSession) {
      checkFrappeSession().then((ok) => setAuthState(ok ? "user" : "guest"));
    }
  }, [shouldCheckSession]);

  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authState === "guest") {
    return <LoginPage onLogin={() => setAuthState("user")} />;
  }

  return children;
}
