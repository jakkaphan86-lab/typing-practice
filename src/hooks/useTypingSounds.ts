import { useCallback } from 'react'
import { audioPlayer } from '../lib/audio'
import type { KeystrokeFeedback } from '../lib/typingEngine'
import { useSettingsStore } from '../store/useSettingsStore'

/**
 * Keystroke feedback → sound effects. Reads `soundEnabled` at call time
 * (`getState()`), so toggling sound doesn't re-render the typing screen and
 * the returned callback stays stable.
 */
export function useTypingSounds(): (feedback: KeystrokeFeedback) => void {
  return useCallback((feedback: KeystrokeFeedback) => {
    if (!useSettingsStore.getState().soundEnabled) return
    if (feedback.incorrect > 0) audioPlayer.play('incorrect')
    else if (feedback.correct > 0) audioPlayer.play('correct')
    if (feedback.blockCompleted) audioPlayer.play('blockComplete')
  }, [])
}

/** Sound on/off. Turning it on plays a tap — confirming the volume and unlocking audio within the click. */
export function useSoundToggle(): { soundEnabled: boolean; toggleSound: () => void } {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const toggle = useSettingsStore((s) => s.toggleSound)

  const toggleSound = useCallback(() => {
    if (!soundEnabled) audioPlayer.play('correct')
    toggle()
  }, [soundEnabled, toggle])

  return { soundEnabled, toggleSound }
}
