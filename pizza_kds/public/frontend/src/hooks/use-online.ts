import { useEffect } from 'react'
import { toast } from 'sonner'

/** Shows bottom-center toasts when the internet connection is lost/restored. */
export function useOnline(): void {
  useEffect(() => {
    const onOffline = () => toast.error('Internet connection lost')
    const onOnline = () => toast.success('Internet connection restored')
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])
}
