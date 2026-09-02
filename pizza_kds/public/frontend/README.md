# Kabab Rayhan — Kitchen Display System (KDS)

A touch-friendly Kitchen Display System SPA for a Frappe/ERPNext backend.

**Stack:** React + TypeScript (Vite), Zustand, Tailwind CSS + shadcn/ui, socket.io-client, React Router, next-themes, sonner.

## Getting started

```sh
npm install
npm run dev
```

Open http://localhost:5173.

## Configuration (`.env`)

| Variable | Description |
| --- | --- |
| `VITE_FRAPPE_URL` | Frappe/ERPNext base URL (used for login + API calls) |
| `VITE_SOCKET_URL` | Frappe socket.io endpoint (usually port 9000) |
| `VITE_MOCK` | `true` = demo mode: mock login, seeded orders, a simulated "new order" every 30s (no backend needed) |

Demo mode is enabled by default in `.env`. Any email/password signs in. To connect a real backend, set `VITE_MOCK=false` and point the URLs at your Frappe site.

## Features

- Frappe session login; user/company stored in a persisted Zustand store
- Socket.io connects only after login; `"new order"` events append to the board and play a notification chime
- Filter pills (All / New / Cooking / Ready / Completed / Cancelled) with live counts; "KITCHEN CLEAR" empty state
- Order cards with status badges, order meta, and item list; status flow New → Cooking → Ready → Completed
- Wide order-details dialog: item checklist (unlocks while cooking, prep-time badges), order summary, print, settle-cash toggle
- Light/dark mode, fullscreen toggle, and logout in the settings menu
- Bottom-center toasts for connectivity, socket status, and action confirmations
- Responsive grid layout for phones, tablets, and large displays

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — serve the production build
