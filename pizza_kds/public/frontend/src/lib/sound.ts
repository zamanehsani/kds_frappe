let ctx: AudioContext | null = null
let unlocked = false

function getContext(): AudioContext {
  ctx ??= new AudioContext()
  return ctx
}

function markUnlocked(context: AudioContext) {
  if (context.state === 'suspended') void context.resume()
  if (!unlocked) {
    unlocked = true
    window.dispatchEvent(new Event('audio-unlocked'))
  }
}

/** Whether the AudioContext has been unlocked by a user gesture yet. */
export function isAudioUnlocked(): boolean {
  return unlocked
}

/** Unlocks the AudioContext immediately — call from a click/tap handler. */
export function unlockAudioNow(): void {
  try {
    markUnlocked(getContext())
  } catch {
    // ignore — will retry on the next gesture via initAudioUnlock
  }
}

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Creates/resumes the shared AudioContext on the page's first user gesture.
 * Call once at app startup — browsers block audio until this happens. Note
 * that persisted logins skip the login page's click, so a reload can land
 * straight on the dashboard with no gesture yet; pair this with a UI prompt
 * (see AudioUnlockPrompt) to guarantee one happens.
 */
export function initAudioUnlock(): void {
  const handler = () => {
    markUnlocked(getContext())
    UNLOCK_EVENTS.forEach((e) => document.removeEventListener(e, handler))
  }
  UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, handler, { once: true }))
}

/**
 * Plays a loud, attention-grabbing notification chime using the Web Audio
 * API, so no audio asset is required.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') void ctx.resume()

    // A compressor keeps the louder, overlapping tones below clipping.
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -12
    compressor.ratio.value = 12
    compressor.connect(ctx.destination)

    const tone = (freq: number, start: number, duration: number, peak = 0.9) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
      osc.connect(gain)
      gain.connect(compressor)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    // Two rounds of an ascending two-note chime for a longer, louder alert.
    tone(880, 0, 0.35)
    tone(1174.66, 0.2, 0.45)
    tone(880, 0.65, 0.35)
    tone(1174.66, 0.85, 0.5)
  } catch {
    // Audio may be blocked before any user gesture — ignore.
  }
}
