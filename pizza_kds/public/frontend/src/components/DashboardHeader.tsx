import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  LogOut,
  Maximize,
  Minimize,
  Moon,
  Settings,
  Sun
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/frappe'
import { STATUS_LABELS } from '@/lib/order-ui'
import { useAuthStore } from '@/stores/auth-store'
import { orderCounts, useOrdersStore } from '@/stores/orders-store'
import type { OrderFilter } from '@/types/order'

const FILTERS: Array<{ key: OrderFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'cooking', label: 'Cooking' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function DashboardHeader() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const orders = useOrdersStore((s) => s.orders)
  const activeFilter = useOrdersStore((s) => s.activeFilter)
  const setFilter = useOrdersStore((s) => s.setFilter)

  const counts = orderCounts(orders)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  }, [])

  const onLogout = async () => {
    await logout()
    clearSession()
    navigate('/login', { replace: true })
  }



  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 py-3 pr-14 sm:pr-16">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant={activeFilter === key ? 'default' : 'outline'}
            className="rounded-full  text-sm font-medium"
            size="lg"
            onClick={() => setFilter(key)}
            aria-label={`Filter: ${key === 'all' ? 'All' : STATUS_LABELS[key]}`}
          >
            {label}
            <Badge
              variant={activeFilter === key ? 'secondary' : 'outline'}
              className="rounded-full px-1.5"
            >
              {counts[key]}
            </Badge>
          </Button>
        ))}

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-lg font-normal">
                {user?.fullName ?? 'Kitchen'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleFullscreen} className="gap-2 text-lg font-normal">
                {isFullscreen ? (
                  <Minimize className="size-4" />
                ) : (
                  <Maximize className="size-4" />
                )}
                {isFullscreen ? 'Exit full screen' : 'Full screen'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2 text-lg font-normal"
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
            
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout} className="gap-2 text-lg font-normal">
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
