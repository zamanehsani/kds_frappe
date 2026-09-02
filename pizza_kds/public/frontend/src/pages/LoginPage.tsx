import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/frappe'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [usr, setUsr] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login(usr, pwd)
      setSession(result.user, result.sessionToken, result.company)
      navigate('/kds/staff', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4 pb-14">
      <Card className="w-full max-w-sm ring-0 shadow-0 ">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
            <ChefHat className="size-6" />
          </div>
          <CardTitle className="text-2xl">Order Display</CardTitle>
          <CardDescription>Sign in to show the orders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="usr" className="ml-4">Email or username</Label>
              <Input
                id="usr" className='text-xl rounded-full p-5'
                type="text"
                autoComplete="username"
                placeholder="kitchen@example.com"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pwd" className="ml-4">Password</Label>
              <Input
                id="pwd"
                className="text-xl rounded-full p-5"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full p-5 rounded-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="absolute bottom-4 left-4 right-4 text-center text-sm text-muted-foreground">
        &copy; 2026 Kabab Rayhan. All rights reserved. made by coderhq.co 
      </p>
    </div>
  )
}
