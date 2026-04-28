export async function checkFrappeSession() {
  try {
    const res = await fetch("/api/method/frappe.auth.get_logged_user", {
      credentials: "same-origin",
    });

    if (!res.ok) return false;

    const data = await res.json();
    const user = data.message;
    return typeof user === "string" && user !== "Guest" && user !== "";
  } catch {
    return false;
  }
}

export function getCurrentAppRoute() {
  const pathname = globalThis.location.pathname.replace(/\/$/, "") || "/";

  if (pathname === "/kds/login") return "kds_web_login";
  if (pathname === "/kds/staff") return "kds_web_staff";
  if (pathname === "/kds/admin") return "kds_web_admin";

  const segments = pathname.split("/").filter(Boolean);
  return segments.at(-1) || "kds_view";
}

export function goToDeskRoute(routeName) {
  globalThis.location.assign(`/desk/${routeName}`);
}

export function goToWebRoute(routePath) {
  globalThis.location.assign(routePath);
}

export async function logoutFrappe(target = "/kds/login") {
  try {
    const csrfToken = globalThis.frappe?.csrf_token ?? "";
    await fetch("/api/method/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-Frappe-CSRF-Token": csrfToken,
      },
    });
  } finally {
    goToWebRoute(target);
  }
}
