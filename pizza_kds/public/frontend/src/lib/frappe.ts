import type { FrappeUser } from '@/stores/auth-store'

export const FRAPPE_URL = import.meta.env.VITE_FRAPPE_URL as string
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string
// Frappe's socket.io server scopes realtime events per-site under a "/{site}" namespace.
export const SITE_NAME = ((import.meta.env.VITE_SITE_NAME as string) || 'localhost')
  .replace(/^\/+|\/+$/g, '')
export const SITE_NAMESPACE = `/${SITE_NAME}`
export const API_BASE = import.meta.env.DEV ? '' : FRAPPE_URL
// Used to compute "today" in the restaurant's local day, not the browser's.
export const TIMEZONE =
  (import.meta.env.VITE_TIMEZONE as string) || Intl.DateTimeFormat().resolvedOptions().timeZone
// Optional Frappe API key:secret. Using token auth instead of the session
// cookie sidesteps CSRF, which only applies to cookie-authenticated requests.
export const FRAPPE_API_TOKEN = import.meta.env.VITE_FRAPPE_API_TOKEN as string | undefined

export interface LoginResult {
  user: FrappeUser
  sessionToken: string | null
  company: string | null
}
export async function frappeCall<T>(path: string, init?: RequestInit): Promise<T> {
  console.log('FRAPPE URL ', FRAPPE_URL)
  console.log('FRAPPE API TOKEN ', FRAPPE_API_TOKEN)
  console.log('SOCKET URL ', SOCKET_URL)
  
  // 1. Helper function to safely read the CSRF cookie value in the browser
  const getCsrfTokenFromCookie = (): string => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^| )X-Frappe-CSRF-Token=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  };

  // 2. Build headers conditionally
  const headers = new Headers(init?.headers) // Persist any user-passed headers
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')

  if (FRAPPE_API_TOKEN) {
    headers.set('Authorization', `token ${FRAPPE_API_TOKEN}`)
  } else {
    // If relying on cookies/session, grab the token and append it to the header
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers.set('X-Frappe-CSRF-Token', csrfToken)
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // Default behavior for cookie authentication
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.exc_type || message;
    } catch {
      // non-JSON error body — keep the status message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}


export async function login(usr: string, pwd: string): Promise<LoginResult> {
  const data = await frappeCall<{ message: string; full_name?: string }>(
    '/api/method/login',
    { method: 'POST', body: JSON.stringify({ usr, pwd }) },
  )

  const [loggedUser, company] = await Promise.all([
    frappeCall<{ message: string }>('/api/method/frappe.auth.get_logged_user')
      .then((r) => r.message)
      .catch(() => usr),
    frappeCall<{ message?: { defaults?: { company?: string } } }>(
      '/api/method/frappe.client.get_list?doctype=Company&limit_page_length=1',
    )
      .then((r: any) => r.message?.[0]?.name ?? null)
      .catch(() => null),
  ])

  return {
    user: { name: loggedUser, fullName: data.full_name ?? loggedUser, email: loggedUser },
    // Frappe session auth is cookie-based; the sid cookie is set by the server.
    sessionToken: null,
    company,
  }
}

export async function logout(): Promise<void> {
  await frappeCall('/api/method/logout', { method: 'POST' }).catch(() => undefined)
}
