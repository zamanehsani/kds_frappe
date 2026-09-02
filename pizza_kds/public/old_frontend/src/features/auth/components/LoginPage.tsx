import React, { useState } from "react";
import {
  ChefHat,
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import logoImg from "../../../assets/logo.png";

interface LoginPageProps {
  onLogin: (role: "staff" | "admin") => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"staff" | "admin">("staff");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/method/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ usr: email.trim(), pwd: password }),
        credentials: "same-origin",
      });

      const data = await res.json();

      if (res.ok && data.message === "Logged In") {
        onLogin(role);
      } else {
        const msg =
          data.message || data._server_messages || "Invalid email or password.";
        const clean =
          typeof msg === "string"
            ? msg
              .replace(/<[^>]+>/g, "")
              .replace(/\\n/g, " ")
              .trim()
            : "Invalid email or password.";
        setError(clean || "Invalid email or password.");
      }
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(34,197,94,0.04)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-36 relative flex items-center justify-center mb-2">
            <img
              src={logoImg}
              alt="Kabab Alrayhan Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {/* <p className="text-sm text-olive-400 mt-1">
            Sign in to your KDS account
          </p> */}
        </div>

        {/* <div className="flex rounded-xl border border-olive-200 overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setRole("staff")}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${role === "staff"
              ? "bg-red-600 text-white"
              : "bg-white text-olive-400 hover:bg-olive-50"
              }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${role === "admin"
              ? "bg-red-600 text-white"
              : "bg-white text-olive-400 hover:bg-olive-50"
              }`}
          >
            Admin
          </button>
        </div> */}

        <div className="bg-white p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 !rounded-full px-3.5 py-3 text-sm">
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0"
                  strokeWidth={2}
                />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              {/* <label
                htmlFor="kds-email"
                className="text-xs font-bold text-olive-700 uppercase tracking-wide"
              >
                Email
              </label> */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 pointer-events-none" />
                <input id="kds-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email or username here"
                  disabled={loading}
                  className="w-full pl-9 pr-4 py-3 rounded-full border border-olive-200 bg-white text-olive-900 text-sm placeholder-olive-300 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {/* <label
                htmlFor="kds-password"
                className="text-xs font-bold text-olive-700 uppercase tracking-wide"
              >
                Password
              </label> */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 pointer-events-none" />
                <input id="kds-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password here"
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-3 rounded-full border border-olive-200 bg-white text-olive-900 text-sm placeholder-olive-300 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 !rounded-full text-olive-300 hover:text-olive-500 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 !rounded-full shadow hover:shadow-md transition-all duration-200 active:scale-[0.98] mt-2">
              {loading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    d="M12 2a10 10 0 0 1 10 10"
                    className="opacity-40"
                  />
                  <path strokeLinecap="round" d="M12 2a10 10 0 0 0-10 10" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4" strokeWidth={2.5} />
              )}
              <span>{loading ? "Signing in…" : "Sign In"}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-olive-300 mt-6">
          Kitchen Display System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
