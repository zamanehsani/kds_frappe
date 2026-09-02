import { useEffect, useState } from 'react'
import { isAudioUnlocked } from '@/lib/sound'

/** Tracks whether the shared AudioContext has been unlocked by a user gesture. */
export function useAudioUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(isAudioUnlocked)

  useEffect(() => {
    if (unlocked) return
    const handler = () => setUnlocked(true)
    window.addEventListener('audio-unlocked', handler)
    return () => window.removeEventListener('audio-unlocked', handler)
  }, [unlocked])

  return unlocked
}
