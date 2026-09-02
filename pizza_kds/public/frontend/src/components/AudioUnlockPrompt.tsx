import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioUnlocked } from '@/hooks/use-audio-unlocked'
import { unlockAudioNow } from '@/lib/sound'

/**
 * A persisted login can land straight on the dashboard after a reload with
 * no prior click, so the browser blocks notification audio. This prompts
 * for the one tap needed to unlock it, then disappears.
 */
export default function AudioUnlockPrompt() {
  const unlocked = useAudioUnlocked()
  if (unlocked) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <Button
        size="sm"
        className="gap-2 shadow-lg"
        onClick={() => unlockAudioNow()}
      >
        <Volume2 className="size-4" />
        Tap to enable order alerts
      </Button>
    </div>
  )
}
